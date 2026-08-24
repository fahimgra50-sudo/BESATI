import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ======================================================
// Facebook Webhook Verification
// ======================================================

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Facebook webhook verified");
      return new NextResponse(challenge, { status: 200 });
    }

    console.error("❌ Facebook webhook verification failed");

    return new NextResponse("Forbidden", {
      status: 403,
    });
  } catch (error) {
    console.error("❌ Webhook GET error:", error);

    return new NextResponse("Server Error", {
      status: 500,
    });
  }
}

// ======================================================
// Helpers
// ======================================================

function safeMoney(value) {
  try {
    return money(Number(value || 0));
  } catch {
    return `${Number(value || 0)} টাকা`;
  }
}

function cleanText(value) {
  if (!value) return "";

  return String(value)
    .replace(/\s+/g, " ")
    .trim();
}

function parseJsonArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value)
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
}

// ======================================================
// Product Information
// ======================================================

function buildProductContext(products) {
  if (!products || products.length === 0) {
    return "বর্তমানে কোনো active product পাওয়া যায়নি।";
  }

  return products
    .map((p, index) => {
      const images = parseJsonArray(p.images);
      const tags = parseJsonArray(p.tags);
      const variants = parseJsonArray(p.variants);

      const flashSale =
        p.flashSalePrice && Number(p.flashSalePrice) > 0
          ? `Flash Sale Price: ${safeMoney(p.flashSalePrice)}`
          : "Flash Sale: নেই";

      const stock =
        Number(p.stock || 0) > 0
          ? `${p.stock}টি available`
          : "Out of stock";

      return `
PRODUCT ${index + 1}
Name: ${p.name}
Category: ${p.category || "N/A"}
Regular Price: ${safeMoney(p.price)}
MRP: ${safeMoney(p.mrp)}
${flashSale}
Stock: ${stock}
Description: ${p.description || "N/A"}
Specifications: ${p.specifications || "N/A"}
Variants: ${variants.length ? variants.join(", ") : "N/A"}
Tags: ${tags.length ? tags.join(", ") : "N/A"}
Rating: ${p.rating || 0}
Reviews: ${p.reviewCount || 0}
Sold: ${p.sold || 0}
Active: ${p.active ? "Yes" : "No"}
Image: ${p.imageUrl || "N/A"}
Video: ${p.videoUrl || "N/A"}
`;
    })
    .join("\n-----------------------------\n");
}

// ======================================================
// Website / Shop Context
// ======================================================

function buildShopContext(settings, products, coupons) {
  const activeProducts = products.filter((p) => p.active);

  const productContext = buildProductContext(activeProducts);

  const couponContext =
    coupons.length > 0
      ? coupons
          .map(
            (c) =>
              `Code: ${c.code} | Type: ${c.type} | Value: ${c.value} | Minimum Order: ${safeMoney(
                c.minOrder
              )} | Max Discount: ${
                c.maxDiscount ? safeMoney(c.maxDiscount) : "No limit"
              } | Active: ${c.active ? "Yes" : "No"}`
          )
          .join("\n")
      : "বর্তমানে কোনো active coupon নেই।";

  return `
==================================================
BESATI SHOP INFORMATION
==================================================

Shop name:
${settings?.shopName || "Besati"}

Website:
https://besati.vercel.app

Payment:
বর্তমানে Cash on Delivery চালু আছে।

bKash:
${settings?.bkashNumber || "তথ্য দেওয়া নেই"}

Nagad:
${settings?.nagadNumber || "তথ্য দেওয়া নেই"}

Delivery charge:
${safeMoney(settings?.deliveryCharge)}

Free delivery:
${safeMoney(settings?.freeDeliveryOver)} বা তার বেশি অর্ডারে free delivery।

Delivery time inside Dhaka:
${settings?.deliveryTimeDhaka || "তথ্য দেওয়া নেই"}

Delivery time outside Dhaka:
${settings?.deliveryTimeOutside || "তথ্য দেওয়া নেই"}

Return policy:
${settings?.returnPolicy || "তথ্য দেওয়া নেই"}

Loyalty coins:
প্রতি ${safeMoney(100)} কেনাকাটায় ${
    settings?.coinsPer100 || 0
  } coins পাওয়া যায়।

Gift coins required:
${settings?.giftCoinsRequired || 0} coins।

Gift product ID:
${settings?.giftProductId || "N/A"}

Facebook:
${settings?.facebookUrl || "তথ্য দেওয়া নেই"}

Featured video:
${settings?.featuredVideoUrl || "তথ্য দেওয়া নেই"}

==================================================
ACTIVE PRODUCTS
==================================================

${productContext}

==================================================
ACTIVE COUPONS
==================================================

${couponContext}

==================================================
TOTAL ACTIVE PRODUCTS
==================================================

${activeProducts.length}
`;
}

// ======================================================
// Gemini AI
// ======================================================

async function getGeminiReply(message, settings, products, coupons) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const shopContext = buildShopContext(
    settings,
    products,
    coupons
  );

  const prompt = `
তুমি Besati অনলাইন শপের AI customer assistant।

তোমার আচরণ একজন বাস্তব, ভদ্র, বুদ্ধিমান দোকানের মানুষের মতো হবে।

সবচেয়ে গুরুত্বপূর্ণ বিষয়:

কাস্টমার সবসময় পরিষ্কার ভাষায় কথা বলবে না।

কাস্টমার:
- বাংলা লিখতে পারে
- Banglish লিখতে পারে
- English লিখতে পারে
- বাংলা + English মিশিয়ে লিখতে পারে
- ভুল বানান করতে পারে
- শব্দ বাদ দিতে পারে
- অসম্পূর্ণ sentence লিখতে পারে
- keyboard mistake করতে পারে
- একই কথা অন্যভাবে বলতে পারে
- খুব ছোট করে প্রশ্ন করতে পারে

উদাহরণ:

"Tumi kemon aso"
"tumi kmn aso"
"vai dam koto"
"vai eta koto"
"price?"
"কত"
"এইটার দাম"
"delivery koi"
"ঢাকার বাইরে?"
"stock ase?"
"ase naki"
"ভাই এটা ভালো?"
"কি কি আছে"
"tomader ki ki product ase"

এসব দেখে exact spelling নিয়ে আটকে থাকবে না।

কাস্টমার কী বোঝাতে চেয়েছে সেটা context থেকে বোঝার চেষ্টা করবে।

--------------------------------------------------

ভাষার নিয়ম:

1. কাস্টমার Banglish লিখলেও তুমি সাধারণত বাংলায় উত্তর দেবে।

2. কাস্টমার English-এ প্রশ্ন করলে English-এ উত্তর দিতে পারো।

3. কাস্টমার বাংলা + English মিশিয়ে লিখলে স্বাভাবিক বাংলা ভাষায় উত্তর দাও।

4. খুব formal বা robotic ভাষা ব্যবহার করবে না।

5. এমনভাবে কথা বলবে যেন একজন ভালো দোকানের কর্মী Messenger-এ customer-এর সাথে কথা বলছে।

6. অপ্রয়োজনীয়ভাবে "আসসালামু আলাইকুম" দিয়ে প্রতিটি উত্তর শুরু করবে না।

7. প্রতিটি উত্তরে emoji দেওয়ার দরকার নেই।

8. কাস্টমার friendly হলে তুমিও friendly হবে।

9. কাস্টমার "ভাই", "আপু", "bro" ইত্যাদি বললে context অনুযায়ী স্বাভাবিকভাবে উত্তর দিতে পারো।

--------------------------------------------------

CONVERSATION STYLE:

তোমার উত্তর হবে:

স্বাভাবিক
ছোট
পরিষ্কার
বন্ধুত্বপূর্ণ
মানুষের মতো

একজন customer যদি বলে:

"ভাই দাম কত"

তাহলে context অনুযায়ী product শনাক্ত করতে পারলে সরাসরি দাম বলবে।

যদি product কোনটি বোঝা না যায়, তাহলে খুব স্বাভাবিকভাবে জিজ্ঞেস করবে:

"অবশ্যই 😊 কোন পণ্যটার দাম জানতে চাচ্ছেন? নামটা বললে আমি দেখে দিচ্ছি।"

এ ধরনের natural clarification ব্যবহার করবে।

কখনো বলবে না:

"আপনার প্রশ্নটি বুঝতে সমস্যা হয়েছে।"

"অনুগ্রহ করে পুনরায় চেষ্টা করুন।"

"শুধুমাত্র নির্দিষ্ট command ব্যবহার করুন।"

"ডেলিভারি, পেমেন্ট, রিটার্ন লিখুন।"

এগুলো robotic।

--------------------------------------------------

PRODUCT RULES:

শুধুমাত্র database-এর product information ব্যবহার করবে।

নিজে থেকে product, price, stock, discount বা offer বানাবে না।

কোনো product-এর stock 0 হলে available বলবে না।

কোনো product-এর flash sale price থাকলে customer price জানতে চাইলে current sale price উল্লেখ করতে পারো।

Regular price এবং MRP-এর পার্থক্য থাকলে সেটা বুঝিয়ে বলতে পারো।

Customer যদি জিজ্ঞেস করে:

"কি কি আছে"
"কি কি product"
"products দেখাও"
"কি বিক্রি করেন"
"tomader ki ki ase"

তাহলে database-এর active products-এর নাম সুন্দরভাবে দেখাবে।

Customer যদি জিজ্ঞেস করে:

"কয়টা product আছে"

তাহলে active product-এর সংখ্যা বলবে।

Customer যদি কোনো product-এর নামের ভুল spelling করে, কাছাকাছি product name থাকলে সেটি বুঝে নেওয়ার চেষ্টা করবে।

--------------------------------------------------

PRODUCT RECOMMENDATION:

Customer যদি বলে:

"ভালো একটা earbuds দেখাও"
"1000 টাকার মধ্যে কিছু আছে?"
"কম দামের speaker আছে?"
"best product কোনটা?"

তাহলে database-এর product থেকে relevant product suggest করবে।

নিজে থেকে product তৈরি করবে না।

--------------------------------------------------

DELIVERY:

Customer delivery সম্পর্কে জানতে চাইলে shop information ব্যবহার করবে।

ঢাকা এবং ঢাকার বাইরে আলাদা সময় বলবে।

Free delivery-এর threshold থাকলে সেটা বলবে।

--------------------------------------------------

PAYMENT:

Database-এ যা আছে সেটাই বলবে।

বর্তমানে Cash on Delivery available।

bKash/Nagad number database-এ থাকলে customer specifically payment number চাইলে দিতে পারো।

কোনো payment method নিজের থেকে বানাবে না।

--------------------------------------------------

RETURN:

Customer return/refund/exchange সম্পর্কে জিজ্ঞেস করলে database-এর return policy ব্যবহার করবে।

নিজে থেকে policy তৈরি করবে না।

--------------------------------------------------

COUPON:

Active coupon থাকলে customer জানতে চাইলে code এবং applicable condition জানাবে।

Inactive বা expired coupon active বলে বলবে না।

--------------------------------------------------

LOYALTY COINS:

Customer coins সম্পর্কে জানতে চাইলে settings-এর coinsPer100 এবং giftCoinsRequired ব্যবহার করবে।

--------------------------------------------------

GENERAL CONVERSATION:

Customer যদি বলে:

"হ্যালো"
"hi"
"hello"
"assalamualaikum"
"কেমন আছো"
"কি খবর"
"ধন্যবাদ"
"thanks"
"ভাই"

তাহলে সাধারণ মানুষের মতো উত্তর দেবে।

Customer যদি বলে:

"Tumi kemon aso"

তাহলে:

"আলহামদুলিল্লাহ, ভালো আছি 😊 তুমি কেমন আছো?"

এরকম natural উত্তর দিতে পারো।

কিন্তু প্রতিবার একই উত্তর ব্যবহার করবে না।

--------------------------------------------------

UNCLEAR MESSAGE:

যদি customer-এর কথা একদম পরিষ্কার না হয়, তবুও robotic fallback ব্যবহার করবে না।

প্রথমে context থেকে বোঝার চেষ্টা করবে।

না পারলে খুব স্বাভাবিকভাবে clarification চাইবে।

উদাহরণ:

"হুম, একটু বুঝিয়ে বলবেন? 😊"

অথবা

"কোন জিনিসটার কথা বলছেন একটু বলবেন?"

কিন্তু প্রতিবার একই sentence ব্যবহার করবে না।

--------------------------------------------------

IMPORTANT:

কাস্টমারের প্রশ্নের উত্তর database-এর তথ্যের ভিত্তিতে দেবে।

Database-এ তথ্য না থাকলে সেটা সত্যি করে বলবে।

কোনো তথ্য বানিয়ে বলবে না।

নিজেকে AI বলে পরিচয় দেওয়ার দরকার নেই, যদি না customer সরাসরি জিজ্ঞেস করে।

--------------------------------------------------

SHOP DATA:

${shopContext}

--------------------------------------------------

CURRENT CUSTOMER MESSAGE:

${message}

এখন customer-এর কথার অর্থ বুঝে সবচেয়ে natural এবং helpful উত্তর দাও।
`;

  console.log("====================================");
  console.log("🤖 GEMINI REQUEST");
  console.log("Question:", message);
  console.log("API key exists:", Boolean(GEMINI_API_KEY));
  console.log("Products:", products.length);
  console.log("Coupons:", coupons.length);
  console.log("====================================");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
      GEMINI_API_KEY
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 600,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ GEMINI API ERROR");
    console.error("Status:", response.status);
    console.error("Response:", JSON.stringify(data));

    throw new Error(
      `Gemini API failed: ${response.status} - ${
        data?.error?.message || "Unknown Gemini error"
      }`
    );
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || "")
    .join("")
    .trim();

  if (!text) {
    console.error(
      "❌ Gemini returned empty response:",
      JSON.stringify(data)
    );

    throw new Error("Gemini returned empty response.");
  }

  console.log("✅ Gemini reply:", text);

  return text;
}

// ======================================================
// Natural fallback
// ======================================================

function naturalFallback(message, settings, products) {
  const text = cleanText(message).toLowerCase();

  if (
    /দাম|কত টাকা|price|how much|dam|koto|koto taka/.test(
      text
    )
  ) {
    return "অবশ্যই 😊 কোন পণ্যটার দাম জানতে চাচ্ছেন? পণ্যের নামটা বললে আমি দেখে দিচ্ছি।";
  }

  if (
    /delivery|ডেলিভারি|কয়দিন|কয়দিন|কতদিন|koydin|koidin/.test(
      text
    )
  ) {
    return `অবশ্যই। ঢাকার মধ্যে সাধারণত ${
      settings?.deliveryTimeDhaka || "তথ্য পাওয়া যায়নি"
    }, আর ঢাকার বাইরে ${
      settings?.deliveryTimeOutside || "তথ্য পাওয়া যায়নি"
    } সময় লাগে।`;
  }

  if (
    /hello|hi|হ্যালো|হাই|আসসালাম|assalam|salam/.test(
      text
    )
  ) {
    return "ওয়ালাইকুম আসসালাম 😊 কীভাবে সাহায্য করতে পারি?";
  }

  if (
    /ধন্যবাদ|thanks|thank you|tnx|thnx/.test(text)
  ) {
    return "অবশ্যই 😊";
  }

  if (
    /কেমন আছ|kmn aso|kemon aso|how are you/.test(text)
  ) {
    return "আলহামদুলিল্লাহ, ভালো আছি 😊 তুমি কেমন আছো?";
  }

  if (
    /কি আছে|কী আছে|কি কি|কী কী|products|product|কি বিক্রি|কি বিক্রি করেন|ki ki|ki ase/.test(
      text
    )
  ) {
    const activeProducts = products.filter((p) => p.active);

    if (!activeProducts.length) {
      return "এই মুহূর্তে product list থেকে কিছু দেখাতে পারছি না।";
    }

    return `আমাদের কয়েকটা product আছে 😊 কোন ধরনের পণ্য খুঁজছেন বললে আমি সাজেস্ট করতে পারি।`;
  }

  return "হুম 😊 একটু বিস্তারিত বলবেন? তাহলে ঠিকভাবে সাহায্য করতে পারব।";
}

// ======================================================
// Send Messenger Reply
// ======================================================

async function sendMessengerReply(senderId, text) {
  if (!PAGE_ACCESS_TOKEN) {
    throw new Error("PAGE_ACCESS_TOKEN is missing.");
  }

  if (!senderId) {
    throw new Error("Messenger sender ID is missing.");
  }

  const cleanReply =
    cleanText(text) ||
    "একটু সময় দিন, আপনার কথাটা বুঝে উত্তর দিচ্ছি। 😊";

  console.log("====================================");
  console.log("📤 FACEBOOK SEND MESSAGE");
  console.log("Sender ID exists:", Boolean(senderId));
  console.log(
    "PAGE_ACCESS_TOKEN exists:",
    Boolean(PAGE_ACCESS_TOKEN)
  );
  console.log("Message:", cleanReply);
  console.log("====================================");

  const response = await fetch(
    `https://graph.facebook.com/v21.0/me/messages?access_token=${encodeURIComponent(
      PAGE_ACCESS_TOKEN
    )}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient: {
          id: senderId,
        },
        message: {
          text: cleanReply,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("====================================");
    console.error("❌ FACEBOOK GRAPH API ERROR");
    console.error("HTTP Status:", response.status);
    console.error("Response:", JSON.stringify(data));
    console.error("====================================");

    throw new Error(
      `Facebook Messenger API failed: ${response.status} - ${
        data?.error?.message || "Unknown Facebook error"
      }`
    );
  }

  console.log("✅ Facebook message sent:", JSON.stringify(data));

  return data;
}

// ======================================================
// Receive Messenger Messages
// ======================================================

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("====================================");
    console.log("📩 FACEBOOK WEBHOOK RECEIVED");
    console.log("Object:", body?.object);
    console.log("====================================");

    if (body?.object !== "page") {
      return NextResponse.json(
        {
          status: "not_page",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------
    // Database
    // --------------------------------------------------

    const settings = await prisma.settings.findFirst();

    if (!settings) {
      console.error("❌ Settings not found.");

      return NextResponse.json(
        {
          status: "error",
          message: "Shop settings not found",
        },
        {
          status: 500,
        }
      );
    }

    const products = await prisma.product.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    const coupons = await prisma.coupon.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    console.log("📦 Products loaded:", products.length);
    console.log("🎟️ Coupons loaded:", coupons.length);

    // --------------------------------------------------
    // Messenger Events
    // --------------------------------------------------

    for (const entry of body?.entry || []) {
      for (const event of entry?.messaging || []) {
        const senderId = event?.sender?.id;
        const messageText = event?.message?.text;

        // Ignore events without text
        if (!senderId || !messageText) {
          continue;
        }

        // Ignore Facebook echo messages
        if (event?.message?.is_echo) {
          console.log("↩️ Ignoring echo message.");
          continue;
        }

        const customerMessage = cleanText(messageText);

        if (!customerMessage) {
          continue;
        }

        console.log("====================================");
        console.log("👤 CUSTOMER:", customerMessage);
        console.log("SENDER ID:", senderId);
        console.log("====================================");

        let reply;

        // ------------------------------------------------
        // Gemini
        // ------------------------------------------------

        try {
          reply = await getGeminiReply(
            customerMessage,
            settings,
            products,
            coupons
          );
        } catch (geminiError) {
          console.error("❌ GEMINI FAILED:");
          console.error(geminiError);

          reply = naturalFallback(
            customerMessage,
            settings,
            products
          );
        }

        // ------------------------------------------------
        // Send Facebook reply
        // ------------------------------------------------

        try {
          await sendMessengerReply(
            senderId,
            reply
          );
        } catch (facebookError) {
          console.error("❌ FACEBOOK SEND FAILED:");
          console.error(facebookError);

          // Do not crash silently.
          // Return 200 to Facebook so webhook delivery
          // does not repeatedly retry the same event.
          continue;
        }
      }
    }

    console.log("✅ Webhook processing completed.");

    return NextResponse.json({
      status: "ok",
    });
  } catch (error) {
    console.error("====================================");
    console.error("❌ MESSENGER WEBHOOK ERROR");
    console.error(error);
    console.error("====================================");

    return NextResponse.json(
      {
        status: "error",
        message: "Webhook processing failed",
      },
      {
        status: 500,
      }
    );
  }
                                            }
