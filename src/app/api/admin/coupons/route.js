import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(req) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const code = String(body.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "কুপন কোড আবশ্যক" }, { status: 400 });
  if (!body.value || Number(body.value) <= 0) return NextResponse.json({ error: "সঠিক মান দিন" }, { status: 400 });
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) return NextResponse.json({ error: "এই কোড আগে থেকেই আছে" }, { status: 400 });
  const coupon = await prisma.coupon.create({
    data: {
      code,
      type: body.type === "fixed" ? "fixed" : "percent",
      value: Number(body.value),
      minOrder: Number(body.minOrder) || 0,
      maxDiscount: body.maxDiscount !== undefined && body.maxDiscount !== "" && body.maxDiscount !== null ? Number(body.maxDiscount) : null,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      usageLimit: body.usageLimit !== undefined && body.usageLimit !== "" && body.usageLimit !== null ? Number(body.usageLimit) : null,
      active: body.active !== false,
    },
  });
  return NextResponse.json(coupon, { status: 201 });
}
