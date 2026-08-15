import "./globals.css";
import { CartProvider } from "@/lib/CartContext";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// "বেসাতি" — পুরনো বাংলা শব্দ, অর্থ "পণ্য বিক্রয়/মালপত্র"। সাধারণ মার্কেটপ্লেসের
// জন্য এই নামটি বেছে নেওয়া হয়েছে কারণ এটি ছোট, উচ্চারণে সহজ এবং বাংলাদেশে
// কোনো পরিচিত ই-কমার্স সাইট বা ফেসবুক পেজ এই নামে পাওয়া যায়নি (অনুসন্ধানের সময় পর্যন্ত)।
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "বেসাতি — সব পণ্য এক জায়গায় | ক্যাশ অন ডেলিভারি",
    template: "%s",
  },
  description: "বেসাতি-তে কম দামে ভালো মানের পণ্য কিনুন — ক্যাশ অন ডেলিভারিতে সারা বাংলাদেশে ডেলিভারি।",
  applicationName: "বেসাতি",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "বেসাতি — সব পণ্য এক জায়গায়",
    description: "বেসাতি-তে কম দামে ভালো মানের পণ্য কিনুন — ক্যাশ অন ডেলিভারিতে সারা বাংলাদেশে ডেলিভারি।",
    url: SITE_URL,
    siteName: "বেসাতি",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "বেসাতি" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "বেসাতি — সব পণ্য এক জায়গায়",
    description: "ক্যাশ অন ডেলিভারিতে সারা বাংলাদেশে ডেলিভারি।",
    images: ["/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "বেসাতি",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body className="font-body text-[#1B2A22]">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
