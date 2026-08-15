import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customerAuth";

async function authCustomer() {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  const id = verifyCustomerToken(token);
  if (!id) return null;
  return prisma.customer.findUnique({ where: { id } });
}

export async function GET() {
  const customer = await authCustomer();
  if (!customer) return NextResponse.json({ authenticated: false }, { status: 401 });
  const settings = await prisma.settings.findFirst();
  const required = settings?.giftCoinsRequired ?? 500;
  const gift = settings?.giftProductId
    ? await prisma.product.findUnique({ where: { id: settings.giftProductId }, select: { id: true, name: true, imageUrl: true } })
    : null;
  const coins = customer.loyaltyCoins ?? 0;
  return NextResponse.json({
    authenticated: true,
    coins,
    required,
    canClaim: coins >= required && !!gift,
    progress: Math.min(100, Math.round((coins / required) * 100)),
    giftProduct: gift,
  });
}

export async function POST() {
  const customer = await authCustomer();
  if (!customer) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const settings = await prisma.settings.findFirst();
  const required = settings?.giftCoinsRequired ?? 500;
  const giftProductId = settings?.giftProductId;
  if (!giftProductId) return NextResponse.json({ error: "Admin এখনো Gift Product নির্বাচন করেননি" }, { status: 400 });
  if ((customer.loyaltyCoins ?? 0) < required) return NextResponse.json({ error: `${required} Coins পূর্ণ হয়নি` }, { status: 400 });

  const updated = await prisma.$transaction(async (tx) => {
    const gift = await tx.product.findUnique({ where: { id: giftProductId }, select: { id: true, active: true, stock: true } });
    if (!gift || !gift.active) throw new Error("GIFT_PRODUCT_UNAVAILABLE");
    if (gift.stock < 1) throw new Error("GIFT_OUT_OF_STOCK");

    const customerUpdate = await tx.customer.updateMany({
      where: { id: customer.id, loyaltyCoins: { gte: required } },
      data: { loyaltyCoins: { decrement: required } },
    });
    if (customerUpdate.count !== 1) throw new Error("NOT_ENOUGH_COINS");

    await tx.product.update({ where: { id: giftProductId }, data: { stock: { decrement: 1 } } });
    await tx.giftClaim.create({
      data: { customerId: customer.id, productId: giftProductId, coinsUsed: required, status: "CLAIMED" },
    });

    return tx.customer.findUnique({ where: { id: customer.id }, select: { loyaltyCoins: true } });
  }).catch((err) => {
    if (err.message === "GIFT_PRODUCT_UNAVAILABLE") return { error: "Gift Product এখন available নয়" };
    if (err.message === "GIFT_OUT_OF_STOCK") return { error: "Gift Product-এর stock শেষ" };
    if (err.message === "NOT_ENOUGH_COINS") return { error: `${required} Coins পূর্ণ হয়নি` };
    throw err;
  });

  if (updated?.error) return NextResponse.json({ error: updated.error }, { status: 400 });
  return NextResponse.json({ success: true, message: "Gift claim সফল হয়েছে", coins: updated.loyaltyCoins });
}
