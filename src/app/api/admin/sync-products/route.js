// src/app/api/admin/sync-products/route.js
//
// এই ফাইলটা GitHub-এ এই পাথে বসান (পুরনোটা বদলে দিন):
//   src/app/api/admin/sync-products/route.js
//
// আগের ভার্সন একবারে সব পেজ আনতে গিয়ে টাইমআউট হয়ে যাচ্ছিল।
// এই ভার্সন একবারে শুধু ১ পেজ (২০০টা প্রোডাক্ট) প্রসেস করে,
// আর জানিয়ে দেয় পরের পেজ আছে কিনা। "sync-products" পেজ থেকে
// এটা বারবার কল হয়ে সবগুলো পেজ শেষ করে।

import { PrismaClient } from "@prisma/client";

export const maxDuration = 60;

const prisma = new PrismaClient();

const SUPPLIER_BASE = "https://mohasagor.com.bd";
const SUPPLIER_ENDPOINT = `${SUPPLIER_BASE}/api/reseller/product`;

function buildImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.includes("/")) {
    return `${SUPPLIER_BASE}/${path}`;
  }
  return `${SUPPLIER_BASE}/images/products/${path}`;
}

async function fetchSupplierPage(apiKey, secretKey, page) {
  const res = await fetch(`${SUPPLIER_ENDPOINT}?page=${page}`, {
    headers: {
      "api-key": apiKey,
      "secret-key": secretKey,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Supplier API error on page ${page}: ${res.status}`);
  }

  const data = await res.json();
  return {
    products: data?.products ?? [],
    lastPage: data?.last_page ?? data?.meta?.last_page ?? page,
  };
}

async function processProduct(sp) {
  const supplierCode = String(sp.product_code ?? sp.id);

  const images = (sp.product_image ?? [])
    .map((img) => buildImageUrl(img.product_image))
    .filter(Boolean);

  const thumbnail = buildImageUrl(sp.thumbnail_img) || images[0] || null;

  const payload = {
    name: sp.name,
    category: String(sp.category_id ?? "সাপ্লায়ার"),
    price: Number(sp.sale_price ?? sp.price ?? 0),
    mrp: Number(sp.reselling_price ?? sp.price ?? 0),
    costPrice: Number(sp.price ?? 0),
    supplierPrice: Number(sp.price ?? 0),
    supplierCode,
    supplierUrl: `${SUPPLIER_BASE}/product/${sp.slug ?? sp.id}`,
    description: sp.details ?? "",
    imageUrl: thumbnail,
    images: images.join(","),
    variants: JSON.stringify(sp.product_variant ?? []),
  };

  const existing = await prisma.product.findFirst({
    where: { supplierCode },
  });

  if (existing) {
    await prisma.product.update({
      where: { id: existing.id },
      data: payload,
    });
    return "updated";
  } else {
    await prisma.product.create({
      data: {
        ...payload,
        slug: sp.slug || undefined,
      },
    });
    return "created";
  }
}

// GET/POST দুটোই একই কাজ করে — ?page=1 (ডিফল্ট) দিয়ে শুধু ওই এক পেজ সিঙ্ক হয়
async function runSyncPage(adminKey, page) {
  if (!process.env.SYNC_ADMIN_KEY || adminKey !== process.env.SYNC_ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SUPPLIER_API_KEY;
  const secretKey = process.env.SUPPLIER_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return Response.json(
      { error: "SUPPLIER_API_KEY / SUPPLIER_SECRET_KEY সেট করা নেই" },
      { status: 500 }
    );
  }

  let products, lastPage;
  try {
    const pageData = await fetchSupplierPage(apiKey, secretKey, page);
    products = pageData.products;
    lastPage = pageData.lastPage;
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  const BATCH_SIZE = 20;
  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((sp) =>
        processProduct(sp)
          .then((result) => ({ result }))
          .catch((err) => ({
            result: "skipped",
            error: { id: sp?.id, name: sp?.name, error: err.message },
          }))
      )
    );

    for (const r of results) {
      if (r.result === "created") created += 1;
      else if (r.result === "updated") updated += 1;
      else {
        skipped += 1;
        if (r.error) errors.push(r.error);
      }
    }
  }

  return Response.json({
    page,
    lastPage,
    doneThisPage: products.length,
    created,
    updated,
    skipped,
    errors,
    hasMore: page < lastPage,
    nextPage: page < lastPage ? page + 1 : null,
  });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get("key");
  const page = parseInt(searchParams.get("page") || "1", 10);
  return runSyncPage(adminKey, page);
}

export async function POST(request) {
  const adminKey = request.headers.get("x-admin-key");
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  return runSyncPage(adminKey, page);
}