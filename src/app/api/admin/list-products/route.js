import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PAGE_SIZE = 200;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get("key");
  const page = parseInt(searchParams.get("page") || "1", 10);

  if (!process.env.SYNC_ADMIN_KEY || adminKey !== process.env.SYNC_ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const totalCount = await prisma.product.count();
  const lastPage = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const products = await prisma.product.findMany({
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      name: true,
      category: true,
      supplierCode: true,
    },
    orderBy: { id: "asc" },
  });

  return Response.json({
    page,
    lastPage,
    totalCount,
    products,
    hasMore: page < lastPage,
    nextPage: page < lastPage ? page + 1 : null,
  });
}
