import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// বাইরের কোনো ইমেজ লিংক থেকে ছবি ডাউনলোড করে, আমাদের নিজের Blob storage-এ স্থায়ীভাবে সেভ করে
// এতে বাইরের লিংক পরে নষ্ট/মেয়াদোত্তীর্ণ হলেও আমাদের সাইটে ছবি ঠিকই থেকে যাবে
async function saveImagePermanently(url) {
  if (!url || !url.trim()) return url;
  // যদি ইতিমধ্যে আমাদের নিজের blob স্টোরেজের লিংক হয়, তাহলে আবার ডাউনলোড করার দরকার নেই
  if (url.includes("blob.vercel-storage.com")) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return url; // ডাউনলোড ব্যর্থ হলে, আগের লিংকটাই ফেরত দাও (একদম বন্ধ না করে)
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : contentType.includes("gif") ? "gif" : "jpg";
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(filename, buffer, { access: "public", contentType });
    return blob.url;
  } catch (e) {
    return url; // কোনো সমস্যা হলে, আগের লিংকটাই ফেরত দাও
  }
}

export async function GET(req) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  const isAdmin = verifyAdminToken(token);
  const products = isAdmin
    ? await prisma.product.findMany({ orderBy: { createdAt: "desc" } })
    : await prisma.product.findMany({
        where: { active: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, category: true, price: true, mrp: true, stock: true,
          emoji: true, imageUrl: true, videoUrl: true, color: true, description: true, specifications: true,
          variants: true, rating: true, reviewCount: true, sold: true, createdAt: true, updatedAt: true
        }
      });
  return NextResponse.json(products);
}

export async function POST(req) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.name || !body.category || body.price === undefined) {
    return NextResponse.json({ error: "নাম, ক্যাটাগরি ও দাম আবশ্যক" }, { status: 400 });
  }

  let baseSlug = slugify(body.name);
  if (!baseSlug) baseSlug = "product";
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  // ছবি ও ভিডিও লিংক নিজের storage-এ সেভ করা (ব্যর্থ হলে আগের লিংক থেকে যাবে)
  const savedImageUrl = body.imageUrl && body.imageUrl.trim() ? await saveImagePermanently(body.imageUrl.trim()) : null;

  const product = await prisma.product.create({
    data: {
      name: String(body.name).trim(),
      slug,
      category: String(body.category).trim(),
      price: Number(body.price),
      mrp: Number(body.mrp) || Number(body.price),
      stock: Number(body.stock) || 0,
      emoji: body.emoji || "🛍️",
      imageUrl: savedImageUrl,
      videoUrl: body.videoUrl && body.videoUrl.trim() ? body.videoUrl.trim() : null,
      costPrice: body.costPrice !== undefined && body.costPrice !== "" ? Number(body.costPrice) : null,
      supplierCode: body.supplierCode && body.supplierCode.trim() ? body.supplierCode.trim() : null,
      supplierUrl: body.supplierUrl && body.supplierUrl.trim() ? body.supplierUrl.trim() : null,
      supplierPrice: body.supplierPrice !== undefined && body.supplierPrice !== "" ? Number(body.supplierPrice) : null,
      specifications: body.specifications || "",
      variants: body.variants || "",
      active: body.active !== false,
      color: body.color || "#EFE8D6",
      description: body.description || "",
    },
  });
  return NextResponse.json(product, { status: 201 });
}
