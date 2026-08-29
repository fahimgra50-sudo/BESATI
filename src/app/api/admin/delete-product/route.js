import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
  const body = await request.json();
  const { key, id } = body;

  if (!process.env.SYNC_ADMIN_KEY || key !== process.env.SYNC_ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!id) {
    return Response.json({ error: "id প্রয়োজন" }, { status: 400 });
  }

  try {
    const deleted = await prisma.product.delete({
      where: { id: Number(id) },
    });
    return Response.json({ success: true, deleted: { id: deleted.id, name: deleted.name } });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 404 });
  }
}
