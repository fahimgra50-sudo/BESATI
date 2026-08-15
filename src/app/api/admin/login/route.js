import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createAdminToken, ADMIN_COOKIE } from "@/lib/auth";

export async function POST(req) {
  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "পাসওয়ার্ড দিন" }, { status: 400 });

  const settings = await prisma.settings.findFirst();
  if (!settings) return NextResponse.json({ error: "সেটিংস পাওয়া যায়নি, সিডিং করুন" }, { status: 500 });

  const ok = await bcrypt.compare(password, settings.adminPasswordHash);
  if (!ok) return NextResponse.json({ error: "পাসওয়ার্ড ভুল হয়েছে" }, { status: 401 });

  const token = createAdminToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
