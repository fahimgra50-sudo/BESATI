import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

export async function PUT(req, { params }) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const ad = await prisma.ad.update({
    where: { id: params.id },
    data: {
      title: body.title,
      imageUrl: body.imageUrl,
      link: body.link?.trim() || null,
      active: body.active !== false,
      sortOrder: Number(body.sortOrder) || 0,
    },
  });
  return NextResponse.json(ad);
}

export async function DELETE(_req, { params }) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  await prisma.ad.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
