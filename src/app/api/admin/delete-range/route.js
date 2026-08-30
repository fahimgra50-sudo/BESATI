import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  const body = await request.json();
  const { key, start, end, confirm } = body;

  if (!process.env.SYNC_ADMIN_KEY || key !== process.env.SYNC_ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startPos = parseInt(start, 10);
  const endPos = parseInt(end, 10);

  if (!startPos || !endPos || startPos < 1 || endPos < startPos) {
    return Response.json({ error: "সঠিক start ও end দিন (start >= 1, end >= start)" }, { status: 400 });
  }

  const skip = startPos - 1;
  const take = endPos - startPos + 1;

  const products = await prisma.product.findMany({
    skip,
    take,
    select: { id: true, name: true },
    orderBy: { id: "asc" },
  });

  if (!confirm) {
    // শুধু প্রিভিউ — কিছু ডিলিট হবে না
    return Response.json({
      preview: true,
      count: products.length,
      firstFew: products.slice(0, 5).map((p) => p.name),
      lastFew: products.slice(-5).map((p) => p.name),
    });
  }

  // আসল ডিলিট
  const ids = products.map((p) => p.id);
  const result = await prisma.product.deleteMany({
    where: { id: { in: ids } },
  });

  return Response.json({
    preview: false,
    deletedCount: result.count,
    deletedNames: products.map((p) => p.name),
  });
}
