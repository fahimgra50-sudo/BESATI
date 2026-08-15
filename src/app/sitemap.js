import { prisma } from "@/lib/db";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default async function sitemap() {
  let products = [];
  try {
    products = await prisma.product.findMany({ select: { id: true, updatedAt: true } });
  } catch (e) {
    products = [];
  }

  const productUrls = products.map((p) => ({
    url: `${SITE_URL}/product/${p.id}`,
    lastModified: p.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/track`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    ...productUrls,
  ];
}
