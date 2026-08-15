import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductDetailClient from "./ProductDetailClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

async function getProduct(id) {
  try {
    // কাস্টমার-facing পেজ, তাই সাপ্লায়ার/খরচের গোপন তথ্য (costPrice, supplierPrice, supplierUrl, supplierCode) বাদ দিয়ে আনা হচ্ছে
    return await prisma.product.findUnique({
      where: { id },
      select: {
        id: true, name: true, category: true, price: true, mrp: true, stock: true,
        emoji: true, imageUrl: true, videoUrl: true, color: true, description: true, specifications: true,
        variants: true, rating: true, reviewCount: true, sold: true, createdAt: true, updatedAt: true,
      },
    });
  } catch (e) {
    return null;
  }
}

// Google/Facebook যখন এই পেজ পড়ে, তখন এই তথ্যগুলোই সার্চ রেজাল্ট বা লিংক প্রিভিউতে দেখায়।
// প্রতিটা প্রোডাক্টের নাম-দাম অনুযায়ী আলাদা আলাদা title/description তৈরি হয় — এটাই আসল SEO।
export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);
  if (!product) return { title: "পণ্য পাওয়া যায়নি — বেসাতি" };

  const title = `${product.name} — মাত্র ৳${product.price} | বেসাতি`;
  const description =
    (product.description && product.description.slice(0, 155)) ||
    `${product.name} কিনুন বেসাতি-তে, ক্যাশ অন ডেলিভারিতে। দাম ৳${product.price}।`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/product/${product.id}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/product/${product.id}`,
      type: "website",
      images: product.imageUrl ? [{ url: product.imageUrl }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : [],
    },
  };
}

export default async function ProductDetailPage({ params }) {
  const product = await getProduct(params.id);
  if (!product) notFound();

  // Google Rich Snippet — এটা থাকলে সার্চ রেজাল্টে সরাসরি দাম ও স্টক অবস্থা দেখাতে পারে
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: product.imageUrl ? [product.imageUrl] : undefined,
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${product.id}`,
      priceCurrency: "BDT",
      price: product.price,
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetailClient product={product} />
    </>
  );
}
