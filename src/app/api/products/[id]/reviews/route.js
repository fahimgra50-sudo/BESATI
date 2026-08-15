import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// একটি প্রোডাক্টের সব রিভিউ পাবলিকভাবে দেখানোর জন্য — কারো লগইন লাগে না
export async function GET(_req, { params }) {
  const reviews = await prisma.review.findMany({
    where: { productId: params.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, customerName: true, rating: true, comment: true, verified: true, createdAt: true },
  });
  return NextResponse.json(reviews);
}
