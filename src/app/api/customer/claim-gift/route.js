import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/auth";

const COINS_REQUIRED = 500;
const MAX_PRICE = 1000;

// ১০০০ টাকার মধ্যের প্রোডাক্ট লিস্ট দেখানো
export async function GET(req) {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  const customerId = verifyCustomerToken(token);
  if (!customerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { active: true, price: { lte: MAX_PRICE }, stock: { gt: 0 } },
    select: { id: true, name: true, price: true, imageUrl: true, emoji: true, color: true },
    orderBy: { price: "desc" },
  });
  return NextResponse.json(products);
}

// প্রোডাক্ট বেছে গিফট দাবি করা
export async function POST(req) {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  const customerId = verifyCustomerToken(token);
  if (!customerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "প্রোডাক্ট বেছে নিন" }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer || (customer.loyaltyCoins || 0) < COINS_REQUIRED) {
    return NextResponse.json({ error: "পর্যাপ্ত কয়েন নেই (৫০০ কয়েন প্রয়োজন)" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || product.price > MAX_PRICE || product.stock <= 0) {
    return NextResponse.json({ error: "এই প্রোডাক্টটি এখন দাবি করার উপযোগী নয়" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.customer.update({
      where: { id: customerId },
      data: { loyaltyCoins: { decrement: COINS_REQUIRED } },
    }),
    prisma.giftClaim.create({
      data: { customerId, productId, coinsUsed: COINS_REQUIRED, status: "CLAIMED" },
    }),
  ]);

  return NextResponse.json({ success: true, message: `🎉 ${product.name} সফলভাবে দাবি করা হয়েছে!` });
}
