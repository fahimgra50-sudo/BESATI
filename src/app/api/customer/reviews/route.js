import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customerAuth";

async function customerId() {
  return verifyCustomerToken(cookies().get(CUSTOMER_COOKIE)?.value);
}

// রিভিউ যোগ/মুছার পর প্রোডাক্টের গড় রেটিং ও সংখ্যা নতুন করে হিসাব করে সংরক্ষণ করা হয়
async function recomputeProductRating(productId) {
  const agg = await prisma.review.aggregate({
    where: { productId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.product.update({
    where: { id: productId },
    data: {
      rating: agg._count.rating > 0 ? Math.round(agg._avg.rating * 10) / 10 : 4.5,
      reviewCount: agg._count.rating,
    },
  });
}

// এই কাস্টমার আগে এই প্রোডাক্টের কোনো অর্ডার ডেলিভারি পেয়েছে কিনা যাচাই — পেলে "ভেরিফাইড ক্রেতা" ব্যাজ দেখানো হয়
async function isVerifiedBuyer(customerId, productId) {
  const count = await prisma.orderItem.count({
    where: {
      productId,
      order: { customerId, status: "delivered" },
    },
  });
  return count > 0;
}

// লগইন করা কাস্টমার তার নিজের রিভিউ (থাকলে) পাওয়ার জন্য
export async function GET(req) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
  const review = await prisma.review.findUnique({ where: { productId_customerId: { productId, customerId: id } } });
  return NextResponse.json(review);
}

export async function POST(req) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "রিভিউ দিতে আগে লগইন করুন" }, { status: 401 });
  const body = await req.json();
  const productId = body.productId;
  const rating = Math.max(1, Math.min(5, Math.round(Number(body.rating))));
  const comment = String(body.comment || "").trim().slice(0, 1000);
  if (!productId || !rating) return NextResponse.json({ error: "productId ও rating আবশ্যক" }, { status: 400 });

  const customer = await prisma.customer.findUnique({ where: { id }, select: { name: true } });
  const verified = await isVerifiedBuyer(id, productId);

  const review = await prisma.review.upsert({
    where: { productId_customerId: { productId, customerId: id } },
    update: { rating, comment, verified },
    create: { productId, customerId: id, customerName: customer?.name || "গ্রাহক", rating, comment, verified },
  });
  await recomputeProductRating(productId);
  return NextResponse.json(review, { status: 201 });
}

export async function DELETE(req) {
  const id = await customerId();
  if (!id) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const productId = new URL(req.url).searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });
  await prisma.review.delete({ where: { productId_customerId: { productId, customerId: id } } }).catch(() => {});
  await recomputeProductRating(productId);
  return NextResponse.json({ success: true });
}
