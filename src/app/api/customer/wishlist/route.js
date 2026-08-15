import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customerAuth";

async function customerId() { return verifyCustomerToken(cookies().get(CUSTOMER_COOKIE)?.value); }

export async function GET() {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "Login required" }, { status: 401 });
  return NextResponse.json(await prisma.wishlistItem.findMany({
    where: { customerId: id },
    orderBy: { createdAt: "desc" },
    include: {
      product: {
        select: { id: true, name: true, category: true, price: true, mrp: true, stock: true, emoji: true, imageUrl: true, color: true, description: true, specifications: true, variants: true, rating: true, sold: true }
      }
    }
  }));
}
export async function POST(req) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
  const item = await prisma.wishlistItem.upsert({ where: { customerId_productId: { customerId: id, productId } }, update: {}, create: { customerId: id, productId } });
  return NextResponse.json(item);
}
export async function DELETE(req) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
  await prisma.wishlistItem.delete({ where: { customerId_productId: { customerId: id, productId } } }).catch(()=>{});
  return NextResponse.json({ success: true });
}
