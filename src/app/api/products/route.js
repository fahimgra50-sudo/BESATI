import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

// সব প্রোডাক্ট দেখানো — কাস্টমার ও এডমিন দুজনেই ব্যবহার করে
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

// নতুন প্রোডাক্ট যোগ করা — শুধু এডমিন
export async function POST(req) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.name || !body.category || body.price === undefined) {
    return NextResponse.json({ error: "নাম, ক্যাটাগরি ও দাম আবশ্যক" }, { status: 400 });
  }
  const product = await prisma.product.create({
    data: {
      name: String(body.name).trim(),
      category: String(body.category).trim(),
      price: Number(body.price),
      mrp: Number(body.mrp) || Number(body.price),
      stock: Number(body.stock) || 0,
      emoji: body.emoji || "🛍️",
      imageUrl: body.imageUrl && body.imageUrl.trim() ? body.imageUrl.trim() : null,
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
