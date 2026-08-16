import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ads = await prisma.ad.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json(ads);
}

export async function POST(req) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.imageUrl?.trim()) {
    return NextResponse.json({ error: "ছবির লিংক আবশ্যক" }, { status: 400 });
  }
  const ad = await prisma.ad.create({
    data: {
      title: body.title?.trim() || "",
      imageUrl: body.imageUrl.trim(),
      link: body.link?.trim() || null,
      active: body.active !== false,
      sortOrder: Number(body.sortOrder) || 0,
    },
  });
  return NextResponse.json(ad, { status: 201 });
}
