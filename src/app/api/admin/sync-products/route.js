// src/app/api/admin/sync-products/route.js
//
// এই ফাইলটা GitHub-এ এই পাথে তৈরি করুন:
//   src/app/api/admin/sync-products/route.js
//
// এটা সাপ্লায়ারের (dropshipping.com.bd) সব প্রোডাক্ট এনে আপনার
// ডাটাবেজে বসিয়ে দেবে। যেগুলো আগে থেকেই আছে (supplierCode দিয়ে চেনা যায়)
// সেগুলো আপডেট হবে, নতুনগুলো তৈরি হবে।

import { PrismaClient } from "@prisma/client";

// Vercel-কে বলে দেয় এই ফাংশনটাকে বেশি সময় (৬০ সেকেন্ড) চলতে দিতে
export const maxDuration = 60;

const prisma = new PrismaClient();

const SUPPLIER_BASE = "https://mohasagor.com.bd";
const SUPPLIER_ENDPOINT = `${SUPPLIER_BASE}/api/reseller/product`;

// থাম্বনেইল/গ্যালারি ছবির path থেকে সম্পূর্ণ URL বানায়
function buildImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.includes("/")) {
    return `${SUPPLIER_BASE}/${path}`;
  }
  // থাম্বনেইল অনেক সময় শুধু ফাইলের নাম দেয়, ফোল্ডার ছাড়া
  return `${SUPPLIER_BASE}/images/products/${path}`;
}

// সব পেজ ঘুরে ঘুরে সব প্রোডাক্ট নিয়ে আসে
async function fetchAllSupplierProducts(apiKey, secretKey) {
  let page = 1;
  let lastPage = 1;
  const all = [];

  do {
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
    const products = data?.products ?? [];
    all.push(...products);

    lastPage = data?.last_page ?? data?.meta?.last_page ?? page;
    page += 1;
  } while (page <= lastPage);

  return all;
}

// GET দিয়ে ব্রাউজারে লিংক পেস্ট করেও টেস্ট/সিঙ্ক করা যাবে:
// https://besati.vercel.app/api/admin/sync-products?key=আপনার_SYNC_ADMIN_KEY
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get("key");
  return runSync(adminKey);
}

export async function POST(request) {
  const adminKey = request.headers.get("x-admin-key");
  return runSync(adminKey);
}

async function runSync(adminKey) {
  // সুরক্ষা: শুধু সঠিক admin key দিয়ে কল করলেই কাজ করবে
  if (!process.env.SYNC_ADMIN_KEY || adminKey !== process.env.SYNC_ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SUPPLIER_API_KEY;
  const secretKey = process.env.SUPPLIER_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return Response.json(
      { error: "SUPPLIER_API_KEY / SUPPLIER_SECRET_KEY সেট করা নেই (Vercel env vars চেক করুন)" },
      { status: 500 }
    );
  }

  let supplierProducts;
  try {
    supplierProducts = await fetchAllSupplierProducts(apiKey, secretKey);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  // একসাথে ২০টা করে প্রোডাক্ট প্রসেস করা হচ্ছে, একটার পর একটা না করে —
  // এতে অনেক প্রোডাক্ট থাকলেও দ্রুত শেষ হবে
  const BATCH_SIZE = 20;

  async function processProduct(sp) {
    const supplierCode = String(sp.product_code ?? sp.id);

    const images = (sp.product_image ?? [])
      .map((img) => buildImageUrl(img.product_image))
      .filter(Boolean);

    const thumbnail = buildImageUrl(sp.thumbnail_img) || images[0] || null;

    const payload = {
      name: sp.name,
      category: String(sp.category_id ?? "সাপ্লায়ার"),
      // sale_price = কাস্টমারের কাছে বিক্রির দাম
      price: Number(sp.sale_price ?? sp.price ?? 0),
      // reselling_price = কাটাকাটা দেখানোর দাম (higher, strikethrough)
      mrp: Number(sp.reselling_price ?? sp.price ?? 0),
      // সাপ্লায়ারের নিজের দাম (cost)
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

  for (let i = 0; i < supplierProducts.length; i += BATCH_SIZE) {
    const batch = supplierProducts.slice(i, i + BATCH_SIZE);
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
    total: supplierProducts.length,
    created,
    updated,
    skipped,
    errors,
  });
}
