import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET(req) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: { OR: [{ slug: null }, { slug: "" }] },
  });

  const updated = [];
  for (const p of products) {
    let baseSlug = slugify(p.name) || "product";
    let slug = baseSlug;
    let counter = 1;
    while (
      await prisma.product.findFirst({
        where: { slug, NOT: { id: p.id } },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    await prisma.product.update({ where: { id: p.id }, data: { slug } });
    updated.push({ id: p.id, name: p.name, slug });
  }

  return NextResponse.json({
    message: `${updated.length} টা প্রোডাক্টে slug বসানো হয়েছে`,
    updated,
  });
}