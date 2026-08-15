import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customerAuth";
import { isValidBangladeshLocation } from "@/lib/validateLocation";

async function id() { return verifyCustomerToken(cookies().get(CUSTOMER_COOKIE)?.value); }

export async function PUT(req) {
  const customerId = await id();
  if (!customerId) return NextResponse.json({ error: "Login required" }, { status: 401 });
  const b = await req.json();
  const current = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!current) return NextResponse.json({ error: "Customer account পাওয়া যায়নি" }, { status: 404 });
  const data = {};
  if (b.name?.trim()) data.name = b.name.trim();
  if (b.email !== undefined) data.email = b.email?.trim() || null;
  if (b.address !== undefined) data.address = b.address?.trim() || null;
  const nextDistrict = b.district !== undefined ? (b.district || null) : current.district;
  const nextThana = b.thana !== undefined ? (b.thana || null) : current.thana;
  if (nextDistrict && nextThana && !isValidBangladeshLocation(nextDistrict, nextThana)) return NextResponse.json({ error: "সঠিক District ও Thana/Upazila নির্বাচন করুন" }, { status: 400 });
  if (b.district !== undefined) data.district = b.district || null;
  if (b.thana !== undefined) data.thana = b.thana || null;
  if (b.newPassword) {
    if (b.newPassword.length < 4) return NextResponse.json({ error: "নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষর" }, { status: 400 });
    const c = current;
    if (!b.currentPassword || !(await bcrypt.compare(b.currentPassword, c.passwordHash))) return NextResponse.json({ error: "বর্তমান পাসওয়ার্ড ভুল" }, { status: 400 });
    data.passwordHash = await bcrypt.hash(b.newPassword, 10);
  }
  const customer = await prisma.customer.update({ where: { id: customerId }, data });
  return NextResponse.json({ success: true, name: customer.name, phone: customer.phone, email: customer.email, address: customer.address, district: customer.district, thana: customer.thana });
}
