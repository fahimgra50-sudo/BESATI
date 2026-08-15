import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req) {
  const { phone } = await req.json();
  if (!phone || !/^0\d{9,10}$/.test(phone.trim())) {
    return NextResponse.json({ error: "সঠিক মোবাইল নম্বর দিন" }, { status: 400 });
  }
  const existing = await prisma.customer.findUnique({ where: { phone: phone.trim() } });
  return NextResponse.json({ exists: !!existing, name: existing?.name || null });
}
