import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customerAuth";

export async function GET() {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  const customerId = verifyCustomerToken(token);
  if (!customerId) return NextResponse.json({ authed: false });

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return NextResponse.json({ authed: false });

  return NextResponse.json({
    authed: true,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    district: customer.district,
    thana: customer.thana,
    loyaltyCoins: customer.loyaltyCoins,
  });
}
