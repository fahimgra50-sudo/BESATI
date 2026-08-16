import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";
export const dynamic = "force-dynamic";
// পাবলিক সেটিংস — পাসওয়ার্ড হ্যাশ বাদে সবকিছু
export async function GET() {
  const s = await prisma.settings.findFirst();
  if (!s) return NextResponse.json({ error: "সেটিংস পাওয়া যায়নি" }, { status: 500 });
  const { adminPasswordHash, ...safe } = s;
  return NextResponse.json(safe);
}

// সেটিংস আপডেট — শুধু এডমিন
export async function PUT(req) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  body.coinsPer100 = Math.max(0, Number(body.coinsPer100 ?? 10));
  body.giftCoinsRequired = Math.max(1, Number(body.giftCoinsRequired ?? 500));
  body.giftProductId = body.giftProductId || null;
  const current = await prisma.settings.findFirst();

  const data = {
    shopName: body.shopName ?? current.shopName,
    deliveryCharge: Number(body.deliveryCharge) || 0,
    freeDeliveryOver: Number(body.freeDeliveryOver) || 0,
    deliveryTimeDhaka: body.deliveryTimeDhaka ?? current.deliveryTimeDhaka,
    deliveryTimeOutside: body.deliveryTimeOutside ?? current.deliveryTimeOutside,
    returnPolicy: body.returnPolicy ?? current.returnPolicy,
    coinsPer100: body.coinsPer100,
    giftCoinsRequired: body.giftCoinsRequired,
    giftProductId: body.giftProductId,
    featuredVideoUrl: body.featuredVideoUrl?.trim() || null,
    facebookUrl: body.facebookUrl?.trim() || null,
    bkashNumber: body.bkashNumber?.trim() || null,
    nagadNumber: body.nagadNumber?.trim() || null,
  };

  if (body.newPassword && body.newPassword.trim().length >= 4) {
    data.adminPasswordHash = await bcrypt.hash(body.newPassword.trim(), 10);
  }

  const updated = await prisma.settings.update({ where: { id: current.id }, data });
  const { adminPasswordHash, ...safe } = updated;
  return NextResponse.json(safe);
}
