import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customerAuth";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";
import { isValidBangladeshLocation } from "@/lib/validateLocation";
import { computeCouponDiscount } from "@/lib/coupon";

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { items: { include: { product: { select: { supplierUrl: true, supplierCode: true, supplierPrice: true, costPrice: true } } } } } }));
}

export async function POST(req) {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  const customerId = verifyCustomerToken(token);
  if (!customerId) return NextResponse.json({ error: "অর্ডার করার আগে Customer Account-এ লগইন করুন" }, { status: 401 });

  const body = await req.json();
  const { items, customerName, phone, address, district, thana, orderNotes, couponCode, payment, paymentTrxId } = body;
  if (!Array.isArray(items) || !items.length) return NextResponse.json({ error: "কার্ট খালি" }, { status: 400 });
  if (!customerName?.trim() || !phone?.trim() || !address?.trim() || !district || !thana) return NextResponse.json({ error: "Checkout-এর সব প্রয়োজনীয় তথ্য দিন" }, { status: 400 });
  if (!isValidBangladeshLocation(district, thana)) return NextResponse.json({ error: "সঠিক District ও Thana/Upazila তালিকা থেকে নির্বাচন করুন" }, { status: 400 });

  const paymentMethod = ["cod", "bkash", "nagad"].includes(payment) ? payment : "cod";
  if (paymentMethod !== "cod" && !paymentTrxId?.trim()) {
    return NextResponse.json({ error: "বিকাশ/নগদ পেমেন্টের Transaction ID দিন" }, { status: 400 });
  }

  const ids = items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: ids }, active: true } });
  const byId = Object.fromEntries(products.map(p => [p.id, p]));
  let subtotal = 0;
  const normalized = [];
  for (const it of items) {
    const p = byId[it.productId];
    const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
    if (!p) return NextResponse.json({ error: "একটি product আর available নেই" }, { status: 400 });
    if (p.stock < qty) return NextResponse.json({ error: `${p.name} এর পর্যাপ্ত stock নেই` }, { status: 400 });
    subtotal += p.price * qty;
    normalized.push({ productId: p.id, name: p.name, price: p.price, qty });
  }

  const settings = await prisma.settings.findFirst();
  const deliveryFee = settings ? (subtotal >= settings.freeDeliveryOver ? 0 : settings.deliveryCharge) : 0;

  // কুপন থাকলে সার্ভারে আবার যাচাই করে ছাড় হিসাব করা হয় — ক্লায়েন্ট থেকে পাঠানো ছাড় কখনো বিশ্বাস করা হয় না
  let discount = 0;
  let appliedCouponCode = null;
  let couponRecord = null;
  const cleanCoupon = String(couponCode || "").trim().toUpperCase();
  if (cleanCoupon) {
    couponRecord = await prisma.coupon.findUnique({ where: { code: cleanCoupon } });
    const result = computeCouponDiscount(couponRecord, subtotal);
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    discount = result.discount;
    appliedCouponCode = cleanCoupon;
  }
  const total = subtotal + deliveryFee - discount;

  const order = await prisma.$transaction(async tx => {
    const created = await tx.order.create({
      data: {
        customerId, customerName: customerName.trim(), phone: phone.trim(), address: address.trim(),
        district, thana, payment: paymentMethod, paymentTrxId: paymentMethod !== "cod" ? paymentTrxId.trim() : null, status: "pending", subtotal, deliveryFee, total,
        couponCode: appliedCouponCode, discount,
        trackingNote: orderNotes?.trim() || null,
        items: { create: normalized },
      },
      include: { items: true },
    });
    for (const it of normalized) {
      await tx.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.qty }, sold: { increment: it.qty } } });
    }
    if (couponRecord) {
      await tx.coupon.update({ where: { id: couponRecord.id }, data: { usedCount: { increment: 1 } } });
    }
    await tx.customer.update({ where: { id: customerId }, data: { address: address.trim(), district, thana } });
    return created;
  });
  return NextResponse.json(order, { status: 201 });
}
