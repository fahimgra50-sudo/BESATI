import { PrismaClient } from "@prisma/client";

export const maxDuration = 60;
const prisma = new PrismaClient();

const SUPPLIER_BASE = "https://mohasagor.com.bd";
const SUPPLIER_ENDPOINT = `${SUPPLIER_BASE}/api/reseller/product`;

function resolveCategoryName(sp) {
  return (
    sp.category_name ??
    sp.category?.name ??
    (typeof sp.category === "string" ? sp.category : null) ??
    `ক্যাটাগরি-${sp.category_id}`
  );
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get("key");
  if (!process.env.SYNC_ADMIN_KEY || adminKey !== process.env.SYNC_ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SUPPLIER_API_KEY;
  const secretKey = process.env.SUPPLIER_SECRET_KEY;

  const importedProducts = await prisma.product.findMany({
    where: { supplierCode: { not: null } },
    select: { id: true, supplierCode: true },
  });
  const codeToId = new Map(importedProducts.map((p) => [p.supplierCode, p.id]));

  let updated = 0;
  let page = 1, lastPage = 1;

  do {
    const res = await fetch(`${SUPPLIER_ENDPOINT}?page=${page}`, {
      headers: { "api-key": apiKey, "secret-key": secretKey },
      cache: "no-store",
    });
    const data = await res.json();
    lastPage = data?.last_page ?? data?.meta?.last_page ?? page;

    for (const sp of data?.products ?? []) {
      const code = String(sp.product_code ?? sp.id);
      const productId = codeToId.get(code);
      if (!productId) continue;

      await prisma.product.update({
        where: { id: productId },
        data: { category: resolveCategoryName(sp) },
      });
      updated++;
    }
    page++;
  } while (page <= lastPage);

  return Response.json({ updated, totalImported: importedProducts.length });
}
