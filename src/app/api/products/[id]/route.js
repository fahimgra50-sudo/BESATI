import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

export async function GET(_req, { params }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, category: true, price: true, mrp: true, stock: true,
      emoji: true, imageUrl: true, videoUrl: true, color: true, description: true, specifications: true,
      variants: true, rating: true, reviewCount: true, sold: true, createdAt: true, updatedAt: true
    }
  });
  if (!product) return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(req, { params }) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const product = await prisma.product.update({
    where: { id: params.id },
    data: {
      name: body.name,
      category: body.category,
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
  return NextResponse.json(product);
}

export async function DELETE(_req, { params }) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
