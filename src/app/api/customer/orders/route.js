import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customerAuth";

export async function GET() {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  const customerId = verifyCustomerToken(token);
  if (!customerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { orders: { include: { items: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!customer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json({
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    loyaltyCoins: customer.loyaltyCoins,
    district: customer.district,
    thana: customer.thana,
    orders: customer.orders,
  });
}
