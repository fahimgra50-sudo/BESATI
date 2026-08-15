import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { computeCouponDiscount } from "@/lib/coupon";

// চেকআউটে কুপন কোড লেখার সাথে সাথে যাচাই করে ছাড়ের পরিমাণ দেখানোর জন্য — চূড়ান্ত হিসাব অর্ডার বসানোর সময় সার্ভারে আবার হয়
export async function POST(req) {
  const { code, subtotal } = await req.json();
  const clean = String(code || "").trim().toUpperCase();
  if (!clean) return NextResponse.json({ error: "কুপন কোড দিন" }, { status: 400 });
  const coupon = await prisma.coupon.findUnique({ where: { code: clean } });
  const result = computeCouponDiscount(coupon, Number(subtotal) || 0);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ code: clean, discount: result.discount, type: coupon.type, value: coupon.value });
}
