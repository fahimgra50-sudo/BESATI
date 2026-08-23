import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { createCustomerToken, CUSTOMER_COOKIE } from "@/lib/customerAuth";

const resend = new Resend(process.env.RESEND_API_KEY);
const NOTIFY_EMAIL = "fahimgra50@gmail.com";

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

  // নতুন কাস্টমার জয়েন করার নোটিফিকেশন ইমেইল — ব্যর্থ হলেও সাইনআপ প্রক্রিয়া থেমে যাবে না
  try {
    await resend.emails.send({
      from: "Besati <onboarding@resend.dev>",
      to: NOTIFY_EMAIL,
      subject: "New customer joined Besati",
      html: `<p>A new customer just signed up.</p>
             <ul>
               <li><b>Name:</b> ${customer.name}</li>
               <li><b>Phone:</b> ${customer.phone}</li>
               <li><b>Email:</b> ${customer.email}</li>
             </ul>`,
    });
  } catch (e) {
    console.error("Notification email failed:", e);
  }

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
