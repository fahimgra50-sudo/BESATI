export const maxDuration = 30;

const SUPPLIER_BASE = "https://mohasagor.com.bd";
const SUPPLIER_ENDPOINT = `${SUPPLIER_BASE}/api/reseller/product`;

function buildImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (path.includes("/")) return `${SUPPLIER_BASE}/${path}`;
  return `${SUPPLIER_BASE}/images/products/${path}`;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminKey = searchParams.get("key");
  const page = parseInt(searchParams.get("page") || "1", 10);

  if (!process.env.SYNC_ADMIN_KEY || adminKey !== process.env.SYNC_ADMIN_KEY) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.SUPPLIER_API_KEY;
  const secretKey = process.env.SUPPLIER_SECRET_KEY;

  const res = await fetch(`${SUPPLIER_ENDPOINT}?page=${page}`, {
    headers: { "api-key": apiKey, "secret-key": secretKey },
    cache: "no-store",
  });

  if (!res.ok) {
    return Response.json({ error: `Supplier API error: ${res.status}` }, { status: 502 });
  }

  const data = await res.json();
  const products = (data?.products ?? []).map((sp) => ({
    supplierCode: String(sp.product_code ?? sp.id),
    name: sp.name,
    thumbnail: buildImageUrl(sp.thumbnail_img),
    // দাম দেখানোর জন্য (শুধু তথ্যের জন্য, ম্যাপিং নিচে ঠিকভাবে সেভ হবে)
    costPrice: Number(sp.price ?? 0),        // সাপ্লায়ার/পাইকারি দাম
    salePrice: Number(sp.sale_price ?? sp.price ?? 0), // বিক্রয় মূল্য
    mrp: Number(sp.reselling_price ?? sp.price ?? 0),  // MRP/আসল দাম
  }));

  return Response.json({
    page,
    lastPage: data?.last_page ?? data?.meta?.last_page ?? page,
    products,
  });
}
