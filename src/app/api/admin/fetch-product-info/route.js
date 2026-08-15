import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import * as cheerio from "cheerio";
import { verifyAdminToken, ADMIN_COOKIE } from "@/lib/auth";

const ALLOWED_HOSTS = [
  "dropshipping.com.bd", "www.dropshipping.com.bd",
  "dropgonj.com", "www.dropgonj.com",
];

function clean(s) {
  return (s || "").replace(/\s+/g, " ").trim();
}
function firstText($, selectors) {
  for (const sel of selectors) {
    const v = clean($(sel).first().text());
    if (v) return v;
  }
  return "";
}
function firstAttr($, selectors, attr) {
  for (const sel of selectors) {
    const v = $(sel).first().attr(attr);
    if (v) return clean(v);
  }
  return "";
}
function jsonLd($) {
  const out = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const v = JSON.parse($(el).contents().text());
      if (Array.isArray(v)) out.push(...v); else out.push(v);
    } catch {}
  });
  return out.flatMap(v => v?.["@graph"] ? v["@graph"] : [v]);
}

export async function POST(req) {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "লিংক দিন" }, { status: 400 });

  let parsed;
  try { parsed = new URL(url); } catch { return NextResponse.json({ error: "সঠিক লিংক দিন" }, { status: 400 }); }
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return NextResponse.json({ error: "শুধু অনুমোদিত supplier link ব্যবহার করুন" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "Accept-Language": "bn-BD,bn;q=0.9,en;q=0.8",
      },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    const ld = jsonLd($);
    const productLd = ld.find(x => x && (x["@type"] === "Product" || (Array.isArray(x["@type"]) && x["@type"].includes("Product")))) || {};
    const offers = Array.isArray(productLd.offers) ? productLd.offers[0] : productLd.offers || {};

    const name = clean(productLd.name) ||
      firstAttr($, ['meta[property="og:title"]', 'meta[name="twitter:title"]'], "content") ||
      clean($("h1").first().text()) ||
      clean($("title").text().split("||")[0]);

    const imageUrl = (Array.isArray(productLd.image) ? productLd.image[0] : productLd.image) ||
      firstAttr($, ['meta[property="og:image"]', 'meta[name="twitter:image"]'], "content") || null;

    let price = Number(offers.price || firstAttr($, ['meta[property="product:price:amount"]'], "content")) || null;
    if (!price) {
      const priceText = firstText($, [".price", ".product-price", "[class*='price']"]);
      const m = priceText.match(/(?:৳|Tk|TK|BDT)?\s*([\d,]+)/);
      if (m) price = Number(m[1].replace(/,/g, ""));
    }

    const supplierCode =
      clean(productLd.sku) ||
      firstAttr($, ['meta[property="product:id"]'], "content") ||
      (parsed.pathname.match(/-(\d+)\/?$/) || [])[1] || null;

    let description = clean(productLd.description) ||
      firstText($, ["#description", ".product-description", "[class*='description']", ".woocommerce-Tabs-panel--description"]);
    if (description.length > 2500) description = description.slice(0, 2500).trim() + "…";

    let specifications = "";
    const specSelectors = ["table.shop_attributes", ".product-attributes", ".specifications", "[class*='specification']", ".product-details"];
    for (const sel of specSelectors) {
      const text = clean($(sel).first().text());
      if (text) { specifications = text.slice(0, 3000); break; }
    }
    if (!specifications) {
      const list = [];
      $("h1,h2,h3,h4,p,li").each((_, el) => {
        const t = clean($(el).text());
        if (/battery|output|channel|impedance|strap|water|package|size|model|fabric|capacity/i.test(t)) list.push(t);
      });
      specifications = [...new Set(list)].slice(0, 30).join("\n");
    }

    const variants = [...new Set($("select option, .variation-option, [class*='variation'] option").map((_, el) => clean($(el).text())).get().filter(Boolean))].slice(0, 50).join(", ");

    if (!name) return NextResponse.json({ error: "এই লিংক থেকে product তথ্য বোঝা যায়নি" }, { status: 422 });

    return NextResponse.json({
      name,
      imageUrl,
      price,
      supplierPrice: price,
      supplierCode,
      supplierUrl: url,
      description: description || null,
      specifications: specifications || null,
      variants: variants || null,
      category: clean(productLd.category) || "",
      brand: clean(productLd.brand?.name || productLd.brand) || "",
      sourceHost: parsed.hostname,
    });
  } catch (e) {
    return NextResponse.json({ error: "লিংক থেকে তথ্য আনা যায়নি। Supplier page login/anti-bot হলে তথ্য হাতে দিতে হতে পারে।" }, { status: 502 });
  }
}
