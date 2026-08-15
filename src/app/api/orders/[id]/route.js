import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";
import { isValidBangladeshLocation } from "@/lib/validateLocation";

// অর্ডার ট্র্যাক করা — কাস্টমার নিজের অর্ডার আইডি দিয়ে দেখতে পারবেন (পাবলিক)
export async function GET(_req, { params }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    select: {
      id: true, status: true, subtotal: true, deliveryFee: true, total: true, createdAt: true, updatedAt: true,
      currentLocation: true, trackingNote: true, estimatedDelivery: true, courierName: true, trackingId: true, trackingUrl: true,
      items: { select: { id: true, name: true, price: true, qty: true } }
    },
  });
  if (!order) return NextResponse.json({ error: "এই আইডিতে কোনো অর্ডার পাওয়া যায়নি" }, { status: 404 });
  return NextResponse.json(order);
}

// অর্ডার স্ট্যাটাস পরিবর্তন — শুধু এডমিন
export async function PATCH(req, { params }) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { status, currentLocation, trackingNote, estimatedDelivery, courierName, trackingId, trackingUrl } = body;
  const valid = ["pending", "processing", "shipped", "delivered", "cancelled"];
  if (!valid.includes(status)) return NextResponse.json({ error: "ভুল স্ট্যাটাস" }, { status: 400 });

  const existing = await prisma.order.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });

  // ডেলিভারি সম্পন্ন হলে, এই অর্ডারের জন্য আগে পয়েন্ট দেওয়া না হয়ে থাকলে —
  // প্রতি ১০০ টাকায় ১০ পয়েন্ট হিসেবে কাস্টমারকে পয়েন্ট দেওয়া হয়
  const shouldAwardCoins = status === "delivered" && !existing.coinsAwarded && existing.customerId;

  const order = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: params.id },
      data: {
        status,
        currentLocation: currentLocation !== undefined ? (currentLocation?.trim() || null) : existing.currentLocation,
        trackingNote: trackingNote !== undefined ? (trackingNote?.trim() || null) : existing.trackingNote,
        estimatedDelivery: estimatedDelivery !== undefined && estimatedDelivery ? new Date(estimatedDelivery) : (estimatedDelivery === null ? null : existing.estimatedDelivery),
        courierName: courierName !== undefined ? (courierName?.trim() || null) : existing.courierName,
        trackingId: trackingId !== undefined ? (trackingId?.trim() || null) : existing.trackingId,
        trackingUrl: trackingUrl !== undefined ? (trackingUrl?.trim() || null) : existing.trackingUrl,
        pointsAwarded: existing.pointsAwarded,
        coinsAwarded: shouldAwardCoins ? true : existing.coinsAwarded,
      },
      include: { items: { include: { product: { select: { supplierUrl: true, supplierCode: true, supplierPrice: true, costPrice: true } } } } },
    });
    if (shouldAwardCoins) {
      const settings = await tx.settings.findFirst();
      const per100 = settings?.coinsPer100 ?? 10;
      const earnedCoins = Math.floor(existing.subtotal / 100) * per100;
      if (earnedCoins > 0) {
        await tx.customer.update({
          where: { id: existing.customerId },
          data: { loyaltyCoins: { increment: earnedCoins } },
        });
      }
    }
    return updated;
  });

  return NextResponse.json(order);
}
