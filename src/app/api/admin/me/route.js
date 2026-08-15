import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

export async function GET() {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  return NextResponse.json({ authed: verifyAdminToken(token) });
}
