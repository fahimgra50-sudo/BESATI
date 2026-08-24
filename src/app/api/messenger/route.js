import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// ======================================================
// FACEBOOK WEBHOOK VERIFICATION
// ======================================================
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    console.log("🔎 Facebook webhook verification request");

    if (
      mode === "subscribe" &&
      token &&
      VERIFY_TOKEN &&
      token === VERIFY_TOKEN
    ) {
      console.log("✅ Facebook webhook verified successfully");

      return new NextResponse(challenge || "", {
        status: 200,
      });
    }

    console.error("❌ Facebook webhook verification failed");

    return new NextResponse("Forbidden", {
      status: 403,
    });
  } catch (error) {
    console.error("❌ Webhook verification error:", error);

    return new NextResponse("Verification error", {
      status: 500,
    });
  }
}

// ======================================================
// GEMINI AI REPLY
// ======================================================
async function getGeminiReply(message, settings, products) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const productLines =
    products.length > 0
      ? products
          .map(
            (p, index) =>
              `${index + 1}. ${p.name} | Category: ${
                p.category || "N/A"
              } | Price: ${money(p.price)} | Stock: ${
                p.stock > 0
                  ? `${p.stock} available`
                  : "Out of stock"
              }`
          )
          .join("\n")
      : "বর্তমানে কোনো পণ্য পাওয়া যাচ্ছে না।";

  const prompt = `
তুমি "${settings?.shopName || "Besati"}" নামের একটি অনলাইন শপের বন্ধুত্বপূর্ণ AI দোকানি।

Facebook Messenger-এ কাস্টমারের সাথে স্বাভাবিকভাবে কথা বলবে।

নিয়ম:
- বাংলা প্রশ্ন হলে বাংলায় উত্তর দেবে।
- ইংরেজি প্রশ্ন হলে ইংরেজিতে উত্তর দিতে পারো।
- উত্তর ছোট, পরিষ্কার এবং বন্ধুত্বপূর্ণ হবে।
- সাধারণত 1-5টি ছোট বাক্যে উত্তর দেবে।
- অতিরিক্ত emoji ব্যবহার করবে না।
- পণ্যের তালিকার বাইরে কোনো পণ্য, দাম, অফার বা stock বানিয়ে বলবে না।
- কোনো পণ্য stock না থাকলে available বলবে না।

দোকানের তথ্য:

Shop name:
${settings?.shopName || "Besati"}

Payment:
শুধু Cash on Delivery চালু আছে।

Delivery:
ঢাকার মধ্যে: ${
    settings?.deliveryTimeDhaka || "তথ্য পাওয়া যায়নি"
  }

ঢাকার বাইরে: ${
    settings?.deliveryTimeOutside || "তথ্য পাওয়া যায়নি"
  }

Delivery charge:
${money(settings?.deliveryCharge || 0)}

Free delivery:
${money(settings?.freeDeliveryOver || 0)} টাকার বেশি অর্ডারে ফ্রি ডেলিভারি।

Return policy:
${
    settings?.returnPolicy ||
    "রিটার্ন পলিসির তথ্য বর্তমানে পাওয়া যাচ্ছে না।"
  }

মোট পণ্য:
${products.length}

পণ্যের তালিকা:
${productLines}

কাস্টমারের প্রশ্ন:
${message}
`;

  console.log("🤖 Sending request to Gemini...");
  console.log("❓ Customer question:", message);
  console.log("🔑 Gemini API key exists:", Boolean(GEMINI_API_KEY));
  console.log("📦 Products loaded:", products.length);

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
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  const data = await response.json().catch(() => ({}));

  console.log("🤖 Gemini response status:", response.status);

  if (!response.ok) {
    console.error("❌ Gemini API error:", {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    throw new Error(
      `Gemini API failed: ${response.status} ${
        data?.error?.message || response.statusText
      }`
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!text) {
    console.error("❌ Gemini returned empty response:", data);

    throw new Error("Gemini returned an empty response.");
  }

  console.log("✅ Gemini response received");

  return text;
}

// ======================================================
// FALLBACK REPLY
// ======================================================
function fallbackReply(message, settings, products) {
  const m = String(message || "").toLowerCase();

  if (
    /কয়টি|কয়টি|কতটি|কতগুলো|কত গুলো|কি কি|কী কী|কীকি|products|product list/.test(
      m
    )
  ) {
    if (products.length === 0) {
      return "এই মুহূর্তে আমাদের কোনো পণ্য তালিকায় নেই।";
    }

    const names = products
      .slice(0, 20)
      .map((p, i) => `${i + 1}. ${p.name}`)
      .join("\n");

    return `আমাদের বর্তমানে ${products.length}টি পণ্য আছে। 😊\n\n${names}`;
  }

  if (/ডেলিভারি|delivery|কতদিন|কয়দিন|কয়দিন/.test(m)) {
    return `ঢাকার মধ্যে ডেলিভারি সময় ${
      settings?.deliveryTimeDhaka || "তথ্য পাওয়া যায়নি"
    }, আর ঢাকার বাইরে ${
      settings?.deliveryTimeOutside || "তথ্য পাওয়া যায়নি"
    }। ডেলিভারি চার্জ ${money(
      settings?.deliveryCharge || 0
    )}।`;
  }

  if (/বিকাশ|পেমেন্ট|payment|টাকা.*দিব/.test(m)) {
    return "বর্তমানে শুধু Cash on Delivery চালু আছে। পণ্য হাতে পাওয়ার পর টাকা দিতে পারবেন। 😊";
  }

  if (/রিটার্ন|ফেরত|return/.test(m)) {
    return (
      settings?.returnPolicy ||
      "রিটার্ন পলিসির তথ্য বর্তমানে পাওয়া যাচ্ছে না।"
    );
  }

  if (/দাম|price|কত টাকা/.test(m)) {
    const sample = products
      .slice(0, 5)
      .map((p) => `${p.name} — ${money(p.price)}`)
      .join("\n");

    if (sample) {
      return `কিছু পণ্যের দাম:\n${sample}\n\nনির্দিষ্ট পণ্যের নাম লিখে দাম জানতে পারেন।`;
    }

    return "বর্তমানে কোনো পণ্যের তথ্য পাওয়া যাচ্ছে না।";
  }

  return "আসসালামু আলাইকুম! 😊 আপনি পণ্যের নাম, দাম, ডেলিভারি, পেমেন্ট বা রিটার্ন সম্পর্কে জানতে পারেন।";
}

// ======================================================
// SEND MESSENGER REPLY
// ======================================================
async function sendMessengerReply(senderId, text) {
  if (!PAGE_ACCESS_TOKEN) {
    throw new Error("PAGE_ACCESS_TOKEN is missing.");
  }

  if (!senderId) {
    throw new Error("Messenger sender ID is missing.");
  }

  if (!text) {
    throw new Error("Messenger reply text is empty.");
  }

  const url =
    `https://graph.facebook.com/v21.0/me/messages` +
    `?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`;

  console.log("📤 Sending reply to Facebook...");
  console.log("👤 Sender ID exists:", Boolean(senderId));
  console.log("🔑 Page access token exists:", Boolean(PAGE_ACCESS_TOKEN));
  console.log("💬 Reply length:", String(text).length);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      recipient: {
        id: senderId,
      },
      messaging_type: "RESPONSE",
      message: {
        text: String(text).slice(0, 2000),
      },
    }),
  });

  const data = await response.json().catch(() => ({}));

  console.log("📡 Facebook Messenger response:", {
    status: response.status,
    ok: response.ok,
    data,
  });

  if (!response.ok) {
    console.error("❌ FACEBOOK API ERROR DETAILS:", {
      status: response.status,
      statusText: response.statusText,
      error: data?.error || data,
    });

    throw new Error(
      `Facebook Messenger API failed: ${response.status} - ${
        data?.error?.message ||
        data?.error?.error_user_msg ||
        JSON.stringify(data)
      }`
    );
  }

  console.log("✅ Messenger reply sent successfully");

  return data;
}

// ======================================================
// RECEIVE MESSENGER WEBHOOK
// ======================================================
export async function POST(req) {
  try {
    console.log("====================================");
    console.log("📩 Messenger webhook received");
    console.log("====================================");

    const body = await req.json();

    console.log("📦 Facebook object:", body?.object);

    if (body?.object !== "page") {
      console.log("⚠️ Request is not a Facebook page event.");

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
    // CHECK ENVIRONMENT VARIABLES
    // --------------------------------------------------

    if (!PAGE_ACCESS_TOKEN) {
      console.error("❌ PAGE_ACCESS_TOKEN is missing.");
      return NextResponse.json(
        {
          status: "error",
          message: "PAGE_ACCESS_TOKEN is missing",
        },
        {
          status: 500,
        }
      );
    }

    if (!VERIFY_TOKEN) {
      console.error("❌ VERIFY_TOKEN is missing.");
    }

    if (!GEMINI_API_KEY) {
      console.warn("⚠️ GEMINI_API_KEY is missing. Fallback will be used.");
    }

    // --------------------------------------------------
    // DATABASE
    // --------------------------------------------------

    const settings = await prisma.settings.findFirst();

    if (!settings) {
      console.error("❌ Shop settings not found in database.");

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
      take: 40,
    });

    console.log(`📦 Loaded ${products.length} products`);

    // --------------------------------------------------
    // PROCESS FACEBOOK EVENTS
    // --------------------------------------------------

    for (const entry of body?.entry || []) {
      for (const event of entry?.messaging || []) {
        const senderId = event?.sender?.id;
        const messageText = event?.message?.text;

        // Ignore events that are not text messages
        if (!senderId || !messageText) {
          console.log("⚠️ Ignoring non-text Facebook event.");
          continue;
        }

        console.log("====================================");
        console.log("👤 Customer:", senderId);
        console.log("💬 Message:", messageText);
        console.log("====================================");

        let reply = null;

        // ------------------------------------------------
        // GEMINI
        // ------------------------------------------------

        if (GEMINI_API_KEY) {
          try {
            reply = await getGeminiReply(
              messageText,
              settings,
              products
            );
          } catch (error) {
            console.error("❌ Gemini failed:", error);
          }
        }

        // ------------------------------------------------
        // FALLBACK
        // ------------------------------------------------

        if (!reply) {
          console.log("⚠️ Using fallback reply.");

          reply = fallbackReply(
            messageText,
            settings,
            products
          );
        }

        console.log("💬 Final reply:", reply);

        // ------------------------------------------------
        // FACEBOOK SEND
        // ------------------------------------------------

        try {
          await sendMessengerReply(senderId, reply);
        } catch (error) {
          console.error(
            "❌ Messenger send failed:",
            error
          );

          // Do not hide the real Facebook error
          throw error;
        }
      }
    }

    console.log("====================================");
    console.log("✅ Messenger webhook completed");
    console.log("====================================");

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
        message:
          error?.message ||
          "Webhook processing failed",
      },
      {
        status: 500,
      }
    );
  }
        }
