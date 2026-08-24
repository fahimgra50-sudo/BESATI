import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL = "gemini-3.6-flash";

// ======================================================
// HELPERS
// ======================================================

function safeMoney(value) {
  try {
    return money(Number(value || 0));
  } catch {
    return `${Number(value || 0)} টাকা`;
  }
}

function cleanText(value) {
  return String(value || "").trim();
}

function productPrice(product) {
  const flashValid =
    product.flashSalePrice &&
    Number(product.flashSalePrice) > 0 &&
    (!product.flashSaleEndsAt ||
      new Date(product.flashSaleEndsAt).getTime() > Date.now());

  return flashValid
    ? Number(product.flashSalePrice)
    : Number(product.price || 0);
}

function productInfo(product) {
  const price = productPrice(product);

  const flashValid =
    product.flashSalePrice &&
    Number(product.flashSalePrice) > 0 &&
    (!product.flashSaleEndsAt ||
      new Date(product.flashSaleEndsAt).getTime() > Date.now());

  return {
    id: product.id,
    name: product.name,
    category: product.category || "",
    price,
    regularPrice: Number(product.price || 0),
    mrp: Number(product.mrp || 0),
    stock: Number(product.stock || 0),
    active: Boolean(product.active),
    description: product.description || "",
    specifications: product.specifications || "",
    variants: product.variants || "",
    tags: product.tags || "",
    rating: Number(product.rating || 0),
    reviewCount: Number(product.reviewCount || 0),
    sold: Number(product.sold || 0),
    views: Number(product.views || 0),
    flashSale: Boolean(flashValid),
  };
}

// ======================================================
// STORE DATA
// ======================================================

function buildStoreData(settings, products) {
  const activeProducts = products
    .filter((p) => p.active !== false)
    .map(productInfo);

  const categories = [
    ...new Set(
      activeProducts
        .map((p) => p.category)
        .filter(Boolean)
    ),
  ];

  const productText =
    activeProducts.length > 0
      ? activeProducts
          .map((p, i) => {
            const priceText = p.flashSale
              ? `${safeMoney(p.price)} (অফার মূল্য, নিয়মিত ${safeMoney(
                  p.regularPrice
                )})`
              : safeMoney(p.price);

            const stockText =
              p.stock > 0
                ? `স্টকে ${p.stock}টি`
                : "স্টক শেষ";

            return `
PRODUCT ${i + 1}
নাম: ${p.name}
Category: ${p.category || "নির্দিষ্ট নয়"}
দাম: ${priceText}
MRP: ${safeMoney(p.mrp)}
Stock: ${stockText}
Rating: ${p.rating}
Reviews: ${p.reviewCount}
Sold: ${p.sold}
Tags: ${p.tags || "নেই"}
Variants: ${p.variants || "নেই"}
Specifications: ${p.specifications || "নেই"}
Description: ${p.description || "নেই"}
`;
          })
          .join("\n")
      : "এই মুহূর্তে কোনো active product নেই।";

  return {
    shopName: settings?.shopName || "Besati",

    deliveryCharge: Number(
      settings?.deliveryCharge || 0
    ),

    freeDeliveryOver: Number(
      settings?.freeDeliveryOver || 0
    ),

    deliveryTimeDhaka:
      settings?.deliveryTimeDhaka ||
      "২৪-৪৮ ঘণ্টা",

    deliveryTimeOutside:
      settings?.deliveryTimeOutside ||
      "৩-৫ দিন",

    returnPolicy:
      settings?.returnPolicy ||
      "রিটার্ন পলিসির তথ্য পাওয়া যাচ্ছে না।",

    bkashNumber:
      settings?.bkashNumber || "",

    nagadNumber:
      settings?.nagadNumber || "",

    coinsPer100:
      Number(settings?.coinsPer100 || 0),

    giftCoinsRequired:
      Number(settings?.giftCoinsRequired || 0),

    totalProducts:
      activeProducts.length,

    categories,

    productText,
  };
}

// ======================================================
// AI SYSTEM PROMPT
// ======================================================

function buildSystemPrompt(store) {
  return `
তুমি "${store.shopName}"-এর Facebook Messenger customer support assistant।

তোমাকে এমনভাবে কথা বলতে হবে যেন তুমি একজন বাস্তব মানুষ,
যে Besati দোকানের customer-এর সাথে Messenger-এ কথা বলছে।

সবচেয়ে গুরুত্বপূর্ণ:
তোমার উত্তর যেন ROBOT-এর মতো না হয়।

==================================================
ভাষা বোঝা
==================================================

তুমি বুঝতে পারবে:

বাংলা
Banglish
English
ভুল বানান
অসম্পূর্ণ বাক্য
সংক্ষিপ্ত লেখা
মিশ্র ভাষা

উদাহরণ:

"Tumi kemon aso"
"ki ki ase"
"apnader kase ki type product ase"
"dam koto"
"eta ase?"
"watch ase?"
"vai kom hobe?"
"bkash niben?"
"delivery koto"
"ami eta nibo"

এসব context দেখে বুঝবে।

Customer Banglish লিখলেও সাধারণত বাংলায় উত্তর দেবে।

Customer English-এ লিখলে English-এ উত্তর দিতে পারো।

==================================================
মানুষের মতো কথা
==================================================

খুব formal হবে না।

অপ্রয়োজনীয় বড় উত্তর দেবে না।

একই বাক্য বারবার ব্যবহার করবে না।

Customer যদি শুধু "ভাই" বলে:
"জি ভাই 😊 বলুন।"

Customer যদি বলে:
"Tumi kemon aso"

উত্তর:
"আলহামদুলিল্লাহ ভালো আছি 😊 আপনি কেমন আছেন?"

Customer যদি বলে:
"thanks"

উত্তর:
"অবশ্যই 😊"

Customer যদি বলে:
"Assalamualaikum"

উত্তর:
"ওয়ালাইকুম আসসালাম 😊 বলুন, কীভাবে সাহায্য করতে পারি?"

Customer যদি ভুল বানান করে,
তাকে ভুল ধরিয়ে হাসাহাসি করবে না।

Customer-এর কথার অর্থ context থেকে বোঝার চেষ্টা করবে।

==================================================
অস্পষ্ট কথা
==================================================

Customer-এর কথা কিছুটা অস্পষ্ট হলেও context থেকে অর্থ বোঝার চেষ্টা করবে।

যেমন:

"watch typ"

তখন সরাসরি:
"বুঝতে পারিনি"

বলবে না।

বরং:
"জি 😊 ঘড়ির কথা বলছেন? আমাদের available watchগুলো চাইলে দেখিয়ে দিচ্ছি।"

সত্যিই কিছু বোঝা না গেলে:
"হুম 😊 কথাটা একটু বুঝিয়ে বলবেন? নিজের মতো করেই লিখতে পারেন, আমি বুঝে নেওয়ার চেষ্টা করছি।"

এই ধরনের স্বাভাবিক উত্তর দেবে।

কখনো fixed robotic sentence ব্যবহার করবে না।

==================================================
SHOP INFORMATION
==================================================

Shop:
${store.shopName}

Delivery charge:
${safeMoney(store.deliveryCharge)}

Free delivery:
${safeMoney(store.freeDeliveryOver)} বা তার বেশি অর্ডারে।

Dhaka:
${store.deliveryTimeDhaka}

Outside Dhaka:
${store.deliveryTimeOutside}

Return:
${store.returnPolicy}

bKash:
${store.bkashNumber || "তথ্য নেই"}

Nagad:
${store.nagadNumber || "তথ্য নেই"}

Coins:
প্রতি ১০০ টাকা কেনাকাটায় ${store.coinsPer100} coins প্রযোজ্য হলে জানাবে।

Gift:
${store.giftCoinsRequired} coins প্রয়োজন।

বর্তমানে Cash on Delivery চালু আছে।

==================================================
PRODUCT DATA
==================================================

মোট active product:
${store.totalProducts}

Categories:
${
  store.categories.length
    ? store.categories.join(", ")
    : "কোনো category নেই"
}

CURRENT PRODUCT DATABASE:

${store.productText}

==================================================
PRODUCT RULES
==================================================

Product-এর নাম, দাম, stock, offer, specification,
variant বা description জানতে চাইলে database ব্যবহার করবে।

নিজে থেকে কোনো product বানাবে না।

নিজে থেকে কোনো দাম বানাবে না।

নিজে থেকে কোনো discount বানাবে না।

Stock 0 হলে available বলবে না।

Flash sale valid থাকলে offer price বলবে।

Customer নির্দিষ্ট product-এর দাম চাইলে সেই product-এর দাম বলবে।

Customer product-এর নাম ভুল লিখলেও কাছাকাছি product বুঝে নেওয়ার চেষ্টা করবে।

==================================================
PRODUCT LIST
==================================================

Customer যদি বলে:

"কি কি product ase"
"ki ki ase"
"ki type product ase"
"what products do you have"
"apnader kase ki type product ase"
"apnara ki sell koren"
"কি বিক্রি করেন"

তাহলে category + relevant product দেখাবে।

Product অনেক হলে সব একসাথে বিশাল list দেবে না।

প্রথমে category বলবে।

যেমন:

"অবশ্যই 😊 আমাদের কাছে বর্তমানে ঘড়ি, গ্যাজেটসহ বিভিন্ন ধরনের পণ্য আছে। কোন categoryটা দেখতে চান?"

Customer যদি বলে "সব দেখাও",
তখন product list দেখাবে।

==================================================
PRICE
==================================================

Customer:
"দাম কত"
"dam koto"
"price"
"how much"
"কত টাকা"

Product context থেকে বুঝবে।

Product পরিষ্কার না হলে:
"কোন productটার দাম জানতে চাচ্ছেন? নামটা বললেই দামটা বলে দিচ্ছি 😊"

==================================================
DELIVERY
==================================================

Dhaka:
${store.deliveryTimeDhaka}

Outside Dhaka:
${store.deliveryTimeOutside}

Charge:
${safeMoney(store.deliveryCharge)}

Free delivery:
${safeMoney(store.freeDeliveryOver)} বা তার বেশি।

==================================================
PAYMENT
==================================================

Cash on Delivery available।

bKash/Nagad-এর নম্বর database/settings-এ থাকলে শুধু সেটাই বলবে।

নিজে থেকে কোনো নম্বর বানাবে না।

==================================================
RETURN
==================================================

Return policy:

${store.returnPolicy}

সহজ ভাষায় বুঝিয়ে বলবে।

==================================================
IMPORTANT
==================================================

Customer যদি সাধারণ কথা বলে,
তখন product list দিয়ে বিরক্ত করবে না।

Customer যদি product সম্পর্কে জিজ্ঞেস করে,
database থেকে সাহায্য করবে।

Customer যদি দাম জিজ্ঞেস করে,
সঠিক database price ব্যবহার করবে।

Customer যদি ভুলভাবে লিখে,
context বুঝবে।

Customer যদি Banglish লেখে,
অর্থ বুঝে বাংলায় উত্তর দেবে।

Customer যদি বলে:
"ভাই একটু কম হবে?"

তখন:
"কোন productটার কথা বলছেন ভাই? নামটা বললে দেখি কী করা যায় 😊"

এরকম মানুষের মতো কথা বলবে।

উত্তর সাধারণত ১-৫টি ছোট বাক্যে রাখবে।

অতিরিক্ত emoji ব্যবহার করবে না।

কখনো বলবে না:
"আমি একটি AI"
"আমি একটি bot"
যদি না customer সরাসরি জিজ্ঞেস করে।

==================================================
FINAL RULE
==================================================

তুমি Besati-এর customer-এর সাথে বন্ধুর মতো,
ভদ্রভাবে এবং স্বাভাবিকভাবে কথা বলবে।

Customer-এর প্রশ্নের উত্তর দেওয়ার সময়
CURRENT PRODUCT DATABASE-কে source of truth হিসেবে ব্যবহার করবে।
`;
}

// ======================================================
// GEMINI
// ======================================================

async function getGeminiReply(message, store) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

  const systemPrompt =
    buildSystemPrompt(store);

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": GEMINI_API_KEY,
    },

    body: JSON.stringify({
      system_instruction: {
        parts: [
          {
            text: systemPrompt,
          },
        ],
      },

      contents: [
        {
          role: "user",
          parts: [
            {
              text: cleanText(message),
            },
          ],
        },
      ],

      generationConfig: {
        maxOutputTokens: 700,
      },
    }),
  });

  const data =
    await response.json();

  if (!response.ok) {
    console.error(
      "Gemini API ERROR:",
      response.status,
      JSON.stringify(data)
    );

    throw new Error(
      `Gemini API failed: ${response.status} - ${
        data?.error?.message ||
        "Unknown Gemini error"
      }`
    );
  }

  const reply =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      .trim();

  if (!reply) {
    console.error(
      "Gemini empty response:",
      JSON.stringify(data)
    );

    throw new Error(
      "Gemini returned an empty response."
    );
  }

  return reply;
}

// ======================================================
// SMART FALLBACK
// ======================================================

function fallbackReply(
  message,
  settings,
  products
) {
  const text =
    cleanText(message).toLowerCase();

  const activeProducts =
    products.filter(
      (p) => p.active !== false
    );

  // Greeting
  if (
    /^(hi|hello|hey|হাই|হ্যালো|হেলো|salam|assalamualaikum|আসসালামু)/i.test(
      text
    )
  ) {
    return "হ্যালো 😊 বলুন, কীভাবে সাহায্য করতে পারি?";
  }

  // How are you
  if (
    /tumi kemon|tmi kemon|কেমন আছ|কেমন আছেন|how are you/i.test(
      text
    )
  ) {
    return "আলহামদুলিল্লাহ ভালো আছি 😊 আপনি কেমন আছেন?";
  }

  // Thanks
  if (
    /thanks|thank you|thnx|tnx|ধন্যবাদ/i.test(
      text
    )
  ) {
    return "অবশ্যই 😊 আর কিছু জানতে চাইলে বলুন।";
  }

  // Product category
  if (
    /কি কি|কী কী|কি আছে|কী আছে|ki ki|ki ase|ki type|type product|what product|products|product ase|sell koren|কি বিক্রি|কী বিক্রি/i.test(
      text
    )
  ) {
    if (!activeProducts.length) {
      return "এই মুহূর্তে available product দেখাতে পারছি না।";
    }

    const categories = [
      ...new Set(
        activeProducts
          .map((p) => p.category)
          .filter(Boolean)
      ),
    ];

    const list =
      activeProducts
        .slice(0, 10)
        .map(
          (p) =>
            `• ${p.name} — ${safeMoney(
              productPrice(p)
            )}`
        )
        .join("\n");

    return `অবশ্যই 😊 আমাদের কাছে ${
      categories.join(", ") ||
      "বিভিন্ন ধরনের পণ্য"
    } রয়েছে।\n\nকিছু available product:\n${list}`;
  }

  // Delivery
  if (
    /delivery|ডেলিভারি|কতদিন|কয়দিন|কয়দিন|কবে পাব/i.test(
      text
    )
  ) {
    return `জি 😊 ঢাকার মধ্যে সাধারণত ${
      settings?.deliveryTimeDhaka ||
      "২৪-৪৮ ঘণ্টা"
    } আর ঢাকার বাইরে ${
      settings?.deliveryTimeOutside ||
      "৩-৫ দিন"
    } লাগে। ডেলিভারি চার্জ ${safeMoney(
      settings?.deliveryCharge
    )}।`;
  }

  // Payment
  if (
    /payment|পেমেন্ট|bkash|বিকাশ|nagad|নগদ|cash on delivery|cod/i.test(
      text
    )
  ) {
    return "জি 😊 বর্তমানে Cash on Delivery চালু আছে।";
  }

  // Return
  if (
    /return|রিটার্ন|ফেরত|বদল/i.test(
      text
    )
  ) {
    return (
      settings?.returnPolicy ||
      "রিটার্ন পলিসির তথ্য বর্তমানে পাওয়া যাচ্ছে না।"
    );
  }

  // Price
  if (
    /দাম|price|how much|কত টাকা|কতো টাকা|dam koto|price koto/i.test(
      text
    )
  ) {
    if (!activeProducts.length) {
      return "এই মুহূর্তে product-এর তথ্য পাওয়া যাচ্ছে না।";
    }

    const list =
      activeProducts
        .slice(0, 5)
        .map(
          (p) =>
            `${p.name} — ${safeMoney(
              productPrice(p)
            )}`
        )
        .join("\n");

    return `কিছু product-এর দাম দিচ্ছি 😊\n\n${list}\n\nনির্দিষ্ট product-এর দাম চাইলে নামটা বলুন।`;
  }

  return "হুম 😊 কথাটা পুরোপুরি ধরতে পারলাম না। নিজের মতো করেই আরেকবার বলুন, আমি বুঝে নেওয়ার চেষ্টা করছি।";
}

// ======================================================
// FACEBOOK MESSENGER SEND
// ======================================================

async function sendMessengerReply(
  senderId,
  text
) {
  if (!PAGE_ACCESS_TOKEN) {
    throw new Error(
      "PAGE_ACCESS_TOKEN is missing."
    );
  }

  if (!senderId) {
    throw new Error(
      "Messenger sender ID is missing."
    );
  }

  const messageText =
    cleanText(text).slice(0, 2000);

  if (!messageText) {
    throw new Error(
      "Messenger message is empty."
    );
  }

  const url =
    `https://graph.facebook.com/v21.0/me/messages` +
    `?access_token=${encodeURIComponent(
      PAGE_ACCESS_TOKEN
    )}`;

  const response = await fetch(url, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      recipient: {
        id: senderId,
      },

      message: {
        text: messageText,
      },
    }),
  });

  const data =
    await response.json();

  if (!response.ok) {
    console.error(
      "FACEBOOK MESSENGER API ERROR:",
      {
        status: response.status,
        data,
      }
    );

    throw new Error(
      `Facebook Messenger API failed: ${response.status} - ${
        data?.error?.message ||
        "Unknown Facebook API error"
      }`
    );
  }

  console.log(
    "Facebook message sent:",
    data
  );

  return data;
}

// ======================================================
// WEBHOOK VERIFY
// ======================================================

export async function GET(req) {
  try {
    const { searchParams } =
      new URL(req.url);

    const mode =
      searchParams.get("hub.mode");

    const token =
      searchParams.get(
        "hub.verify_token"
      );

    const challenge =
      searchParams.get(
        "hub.challenge"
      );

    console.log(
      "Facebook webhook verification request"
    );

    if (
      mode === "subscribe" &&
      token &&
      VERIFY_TOKEN &&
      token === VERIFY_TOKEN
    ) {
      console.log(
        "Facebook webhook verified successfully"
      );

      return new NextResponse(
        challenge,
        {
          status: 200,
        }
      );
    }

    console.error(
      "Facebook webhook verification failed"
    );

    return new NextResponse(
      "Forbidden",
      {
        status: 403,
      }
    );
  } catch (error) {
    console.error(
      "Webhook verification error:",
      error
    );

    return new NextResponse(
      "Forbidden",
      {
        status: 403,
      }
    );
  }
}

// ======================================================
// POST WEBHOOK
// ======================================================

export async function POST(req) {
  try {
    const body =
      await req.json();

    console.log(
      "===================================="
    );

    console.log(
      "Messenger webhook received"
    );

    console.log(
      "===================================="
    );

    if (
      !body ||
      body.object !== "page"
    ) {
      return NextResponse.json(
        {
          status: "not_page",
        },
        {
          status: 404,
        }
      );
    }

    // ==================================================
    // DATABASE
    // ==================================================

    const settings =
      await prisma.settings.findFirst();

    if (!settings) {
      console.error(
        "Settings not found."
      );

      return NextResponse.json(
        {
          status: "error",
          message:
            "Shop settings not found",
        },
        {
          status: 500,
        }
      );
    }

    const products =
      await prisma.product.findMany({
        where: {
          active: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 100,
      });

    console.log(
      `Loaded ${products.length} products`
    );

    const store =
      buildStoreData(
        settings,
        products
      );

    // ==================================================
    // EVENTS
    // ==================================================

    for (
      const entry of body.entry || []
    ) {
      for (
        const event of
          entry.messaging || []
      ) {
        const senderId =
          event.sender?.id;

        const messageText =
          event.message?.text;

        // Ignore events without sender
        if (!senderId) {
          continue;
        }

        // Ignore echo
        if (
          event.message?.is_echo
        ) {
          console.log(
            "Ignoring echo message."
          );

          continue;
        }

        // Ignore non-text
        if (!messageText) {
          console.log(
            "Ignoring non-text event."
          );

          continue;
        }

        console.log(
          "Customer message:",
          messageText
        );

        let reply = null;

        // ==================================================
        // GEMINI
        // ==================================================

        if (GEMINI_API_KEY) {
          try {
            reply =
              await getGeminiReply(
                messageText,
                store
              );

            console.log(
              "Gemini reply:",
              reply
            );
          } catch (error) {
            console.error(
              "Gemini failed:",
              error
            );
          }
        } else {
          console.error(
            "GEMINI_API_KEY missing."
          );
        }

        // ==================================================
        // FALLBACK
        // ==================================================

        if (!reply) {
          console.log(
            "Using fallback reply."
          );

          reply =
            fallbackReply(
              messageText,
              settings,
              products
            );
        }

        // ==================================================
        // FACEBOOK SEND
        // ==================================================

        try {
          await sendMessengerReply(
            senderId,
            reply
          );
        } catch (error) {
          /*
           * IMPORTANT:
           * Log the real Facebook error.
           * Do not hide it.
           */

          console.error(
            "Messenger send failed:",
            error
          );
        }
      }
    }

    return NextResponse.json(
      {
        status: "ok",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "Messenger webhook fatal error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message:
          "Webhook processing failed",
      },
      {
        status: 500,
      }
    );
  }
}
