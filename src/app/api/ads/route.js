import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const ads = await prisma.ad.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  return NextResponse.json(ads);
}
