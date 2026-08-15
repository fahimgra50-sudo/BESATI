import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifyCustomerToken, CUSTOMER_COOKIE } from "@/lib/customerAuth";

export async function POST(_req, { params }) {
  const token = cookies().get(CUSTOMER_COOKIE)?.value;
  const customerId = verifyCustomerToken(token);
  if (!customerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order || order.customerId !== customerId) {
    return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি" }, { status: 404 });
  }
  if (order.status !== "pending") {
    return NextResponse.json(
      { error: "এই অর্ডার প্রসেসিং শুরু হয়ে গেছে, এখন ক্যানসেল করা যাবে না — সরাসরি যোগাযোগ করুন" },
      { status: 400 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.order.update({ where: { id: order.id }, data: { status: "cancelled" } });
    for (const item of await tx.orderItem.findMany({ where: { orderId: order.id } })) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.qty }, sold: { decrement: item.qty } },
      }).catch(() => {});
    }
    return cancelled;
  });

  return NextResponse.json(updated);
}
