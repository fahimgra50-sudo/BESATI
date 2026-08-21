import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

const SUPPLIER_BASE = "https://mohasagor.com.bd";

// দুইটা নাম মেলানো — ছোট হাতের অক্ষর, স্পেস/পাংচুয়েশন উপেক্ষা করে তুলনা করা হয়
function normalize(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, " ")
    .trim();
}

async function fetchAllSupplierProducts() {
  const all = [];
  let page = 1;
  while (true) {
    const res = await fetch(`${SUPPLIER_BASE}/api/reseller/product?page=${page}`, {
      headers: {
        "api-key": process.env.MOHASAGOR_API_KEY,
        "secret-key": process.env.MOHASAGOR_SECRET_KEY,
      },
      cache: "no-store",
    });
    if (!res.ok) break;
    const data = await res.json();
    const products = data.products || [];
    all.push(...products);
    if (!data.last_page || page >= data.last_page || products.length === 0) break;
    page++;
    if (page > 50) break; // নিরাপত্তার জন্য সর্বোচ্চ সীমা
  }
  return all;
}

async function saveImagePermanently(url) {
  if (!url) return { ok: false, url };
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, url };
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(filename, buffer, { access: "public", contentType });
    return { ok: true, url: blob.url };
  } catch (e) {
    return { ok: false, url };
  }
}

export async function GET(req) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // যেসব প্রোডাক্টের ছবি নেই বা এখনো নিজস্ব storage-এ সেভ হয়নি
  const localProducts = await prisma.product.findMany({
    where: {
      OR: [{ imageUrl: null }, { imageUrl: { not: { contains: "blob.vercel-storage.com" } } }],
    },
  });

  if (localProducts.length === 0) {
    return NextResponse.json({ message: "ঠিক করার মতো কোনো প্রোডাক্ট নেই" });
  }

  const supplierProducts = await fetchAllSupplierProducts();

  const results = [];
  for (const lp of localProducts) {
    const lpName = normalize(lp.name);
    const match = supplierProducts.find((sp) => normalize(sp.name) === lpName);

    if (!match) {
      results.push({ name: lp.name, status: "❌ সাপ্লায়ারে মিল পাওয়া যায়নি" });
      continue;
    }

    const imgPath = match.product_image?.[0]?.product_image;
    if (!imgPath) {
      results.push({ name: lp.name, status: "❌ মিলেছে কিন্তু ছবি নেই" });
      continue;
    }

    const fullImgUrl = imgPath.startsWith("http") ? imgPath : `${SUPPLIER_BASE}/${imgPath}`;
    const saved = await saveImagePermanently(fullImgUrl);

    if (saved.ok) {
      await prisma.product.update({ where: { id: lp.id }, data: { imageUrl: saved.url } });
      results.push({ name: lp.name, status: "✅ ছবি বসানো হয়েছে" });
    } else {
      results.push({ name: lp.name, status: "❌ ছবি ডাউনলোড ব্যর্থ" });
    }
  }

  return NextResponse.json({ message: `${results.length} টা প্রোডাক্ট চেক করা হয়েছে`, results });
}
