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

async function saveImagePermanently(url) {
  if (!url || !url.trim()) return url;
  if (url.includes("blob.vercel-storage.com")) return url;
  try {
    const res = await fetch(url);
    if (!res.ok) return url;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : contentType.includes("gif") ? "gif" : "jpg";
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const blob = await put(filename, buffer, { access: "public", contentType });
    return blob.url;
  } catch (e) {
    return url;
  }
}

async function sendToSheet(product) {
  try {
    await fetch("https://hook.eu1.make.com/y21dn5hw6in2swesxk4flxe6ty2ocl92", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: product.name,
        price: product.price,
        url: `https://besati.vercel.app/product/${product.slug || product.id}`,
        description: product.description,
        stock: product.stock,
      }),
    });
  } catch (e) {}
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

  await sendToSheet(product);

  return NextResponse.json(product, { status: 201 });
      }
