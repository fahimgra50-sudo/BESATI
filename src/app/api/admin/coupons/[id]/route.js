import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

export async function PUT(req, { params }) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const code = String(body.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "কুপন কোড আবশ্যক" }, { status: 400 });
  const coupon = await prisma.coupon.update({
    where: { id: params.id },
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
  return NextResponse.json(coupon);
}

export async function DELETE(_req, { params }) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await prisma.coupon.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
