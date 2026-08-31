import { PrismaClient } from "@prisma/client";

export const maxDuration = 30;
const prisma = new PrismaClient();

export async function POST(request) {
  const body = await request.json();
  const { key, productId, videoUrl } = body;

  if (!process.env.SYNC_ADMIN_KEY || key !== process.env.SYNC_ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!productId || !videoUrl) {
    return Response.json({ error: "productId ও videoUrl দিন" }, { status: 400 });
  }

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { videoUrl },
  });

  return Response.json({ success: true, product: updated });
}
