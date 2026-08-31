import { PrismaClient } from "@prisma/client";

export const maxDuration = 30;
const prisma = new PrismaClient();

export async function POST(request) {
  const body = await request.json();
  const { key, productId, productIds, videoUrl } = body;

  if (!process.env.SYNC_ADMIN_KEY || key !== process.env.SYNC_ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ids = productIds && Array.isArray(productIds) ? productIds : (productId ? [productId] : []);

  if (ids.length === 0 || !videoUrl) {
    return Response.json({ error: "productId/productIds ও videoUrl দিন" }, { status: 400 });
  }

  const updated = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { videoUrl },
  });

  return Response.json({ success: true, count: updated.count });
}