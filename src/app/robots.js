const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/secret-manage-x7k2", "/api/", "/account", "/my-orders", "/checkout", "/cart"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
