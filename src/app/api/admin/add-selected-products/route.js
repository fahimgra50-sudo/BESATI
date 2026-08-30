import { PrismaClient } from "@prisma/client";

export const maxDuration = 60;
const prisma = new PrismaClient();

const SUPPLIER_BASE = "https://mohasagor.com.bd";
const SUPPLIER_ENDPOINT = `${SUPPLIER_BASE}/api/reseller/product`;

function buildImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.includes("/")) return `${SUPPLIER_BASE}/${path}`;
  return `${SUPPLIER_BASE}/images/products/${path}`;
}

export async function POST(request) {
  const body = await request.json();
  const { key, supplierCodes } = body; // ["3266", "4875", ...]

  if (!process.env.SYNC_ADMIN_KEY || key !== process.env.SYNC_ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!Array.isArray(supplierCodes) || supplierCodes.length === 0) {
    return Response.json({ error: "supplierCodes দিন" }, { status: 400 });
  }

  const apiKey = process.env.SUPPLIER_API_KEY;
  const secretKey = process.env.SUPPLIER_SECRET_KEY;

  // একই ব্যাচে যে পেজগুলোতে বেছে নেওয়া প্রোডাক্ট আছে সেগুলো আনতে হবে —
  // সহজ রাখতে, প্রতিটা পেজ ক্রম করে খুঁজে বেছে নেওয়া কোডগুলো মেলাই
  let created = 0, skipped = 0;
  const errors = [];
  let page = 1, lastPage = 1;
  const remaining = new Set(supplierCodes.map(String));

  do {
    const res = await fetch(`${SUPPLIER_ENDPOINT}?page=${page}`, {
      headers: { "api-key": apiKey, "secret-key": secretKey },
      cache: "no-store",
    });
    const data = await res.json();
    lastPage = data?.last_page ?? data?.meta?.last_page ?? page;

    for (const sp of data?.products ?? []) {
      const code = String(sp.product_code ?? sp.id);
      if (!remaining.has(code)) continue;
      remaining.delete(code);

      try {
        const images = (sp.product_image ?? []).map((img) => buildImageUrl(img.product_image)).filter(Boolean);
        const thumbnail = buildImageUrl(sp.thumbnail_img) || images[0] || null;

        await prisma.product.create({
          data: {
            name: sp.name,
            category: String(sp.category_id ?? "সাপ্লায়ার"),
            price: Number(sp.sale_price ?? sp.price ?? 0),      // বিক্রয় মূল্য → price
            mrp: Number(sp.reselling_price ?? sp.price ?? 0),   // আসল/কাটা দাম → mrp
            costPrice: Number(sp.price ?? 0),                    // পাইকারি/কেনা দাম → costPrice
            supplierPrice: Number(sp.price ?? 0),
            supplierCode: code,
            supplierUrl: `${SUPPLIER_BASE}/product/${sp.slug ?? sp.id}`,
            description: sp.details ?? "",
            imageUrl: thumbnail,
            images: images.join(","),
            variants: JSON.stringify(sp.product_variant ?? []),
          },
        });
        created++;
      } catch (err) {
        skipped++;
        errors.push({ code, error: err.message });
      }
    }
    page++;
  } while (remaining.size > 0 && page <= lastPage);

  return Response.json({ created, skipped, errors, notFound: [...remaining] });
                             }
