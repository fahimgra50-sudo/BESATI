import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createCustomerToken, CUSTOMER_COOKIE } from "@/lib/customerAuth";
import { notifyN8n } from "@/lib/notifyN8n";

export async function POST(req) {
  const { name, phone, email, password } = await req.json();
  if (!name?.trim() || !phone?.trim() || !email?.trim() || !password?.trim()) {
    return NextResponse.json({ error: "নাম, ফোন, ইমেইল ও পাসওয়ার্ড দিন" }, { status: 400 });
  }
  if (!/^0\d{9,10}$/.test(phone.trim())) {
    return NextResponse.json({ error: "সঠিক মোবাইল নম্বর দিন" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "সঠিক ইমেইল ঠিকানা দিন" }, { status: 400 });
  }
  if (password.trim().length < 4) {
    return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে" }, { status: 400 });
  }

  const existing = await prisma.customer.findUnique({ where: { phone: phone.trim() } });
  if (existing) {
    return NextResponse.json({ error: "এই নম্বরে আগে থেকেই অ্যাকাউন্ট আছে, লগইন করুন" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password.trim(), 10);
  const customer = await prisma.customer.create({
    data: { name: name.trim(), phone: phone.trim(), email: email.trim(), passwordHash },
  });

  // নতুন অ্যাকাউন্ট তৈরি হয়েছে — n8n কে জানানো হচ্ছে গ্রাহক + কোম্পানি দুই জায়গাতেই ইমেইল পাঠানোর জন্য
  notifyN8n("signup", {
    customerName: customer.name,
    customerEmail: customer.email,
    customerPhone: customer.phone,
  });

  const token = createCustomerToken(customer.id);
  const res = NextResponse.json({ success: true, name: customer.name, phone: customer.phone });
  res.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
