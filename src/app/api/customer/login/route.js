import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createCustomerToken, CUSTOMER_COOKIE } from "@/lib/customerAuth";

export async function POST(req) {
  const { phone, password } = await req.json();
  if (!phone?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "ফোন ও পাসওয়ার্ড দিন" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({ where: { phone: phone.trim() } });
  if (!customer) {
    return NextResponse.json({ error: "এই নম্বরে কোনো অ্যাকাউন্ট নেই" }, { status: 404 });
  }
  const ok = await bcrypt.compare(password.trim(), customer.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "পাসওয়ার্ড ভুল হয়েছে" }, { status: 401 });
  }

  const token = createCustomerToken(customer.id);
  const res = NextResponse.json({ success: true, name: customer.name, phone: customer.phone, address: customer.address });
  res.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
