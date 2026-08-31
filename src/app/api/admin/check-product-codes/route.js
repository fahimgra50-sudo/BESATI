import { PrismaClient } from "@prisma/client";

export const maxDuration = 30;
const prisma = new PrismaClient();

export async function POST(request) {
  const body = await request.json();
  const { key, codes } = body; // ["5268", "5267", ...]

  if (!process.env.SYNC_ADMIN_KEY || key !== process.env.SYNC_ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!Array.isArray(codes) || codes.length === 0) {
    return Response.json({ error: "codes দিন" }, { status: 400 });
  }

  const matched = await prisma.product.findMany({
    where: { supplierCode: { in: codes.map(String) } },
    select: { id: true, supplierCode: true, name: true, videoUrl: true, imageUrl: true },

  return Response.json({ matched });
}
