import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL = "gemini-2.5-flash";
const GRAPH_API_VERSION = "v21.0";

// ======================================================
// Facebook Webhook Verification
// ======================================================

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    console.log("🔐 Facebook webhook verification request");

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Facebook webhook verified successfully");

      return new NextResponse(challenge, {
        status: 200,
      });
    }

    console.error("❌ Facebook webhook verification failed");

    return new NextResponse("Forbidden", {
      status: 403,
    });
  } catch (error) {
    console.error("❌ Webhook GET error:", error);

    return new NextResponse("Internal Server Error", {
      status: 500,
    });
  }
}

// ======================================================
// Gemini AI Reply
// ======================================================

async function getGeminiReply(message, settings, products) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is missing from Vercel Environment Variables."
    );
  }

  const productLines =
    products.length > 0
      ? products
          .map(
            (p, index) =>
              `${index + 1}. ${p.name} | Category: ${
                p.category || "N/A"
              } | Price: ${money(p.price)} | Stock: ${
                p.stock > 0 ? `${p.stock} available` : "Out of stock"
              }`
          )
          .join("\n")
      : "বর্তমানে কোনো পণ্য নেই।";

  const prompt = `
তুমি "${settings?.shopName || "Besati"}" অনলাইন শপের একজন বন্ধুত্বপূর্ণ AI দোকানি।

তোমার কাজ হলো Facebook Messenger-এর কাস্টমারদের সাথে মানুষের মতো স্বাভাবিকভাবে কথা বলা।

ভাষার নিয়ম:
- কাস্টমার বাংলা লিখলে বাংলায় উত্তর দেবে।
- কাস্টমার ইংরেজি লিখলে ইংরেজিতে উত্তর দেবে।
- কাস্টমার Banglish লিখলে সহজ বাংলায় উত্তর দিতে পারো।
- স্বাভাবিক, ছোট এবং বন্ধুত্বপূর্ণ ভাষা ব্যবহার করবে।
- একই উত্তর বারবার কপি করবে না।
- অপ্রয়োজনীয়ভাবে "ডেলিভারি, পেমেন্ট, রিটার্ন লিখুন" বলবে না।
- প্রশ্ন বুঝে সরাসরি উত্তর দেবে।
- প্রয়োজন হলে ১-২টি emoji ব্যবহার করতে পারো।

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
${products.length}টি

পণ্যের তালিকা:
${productLines}

গুরুত্বপূর্ণ নিয়ম:

1. কাস্টমার যদি জিজ্ঞেস করে "কয়টি পণ্য আছে", "কতটি product আছে", "how many products", তাহলে মোট ${products.length}টি পণ্য আছে বলবে।

2. কাস্টমার যদি জিজ্ঞেস করে "কি কি পণ্য আছে", "কী কী বিক্রি করেন", "products দেখাও", "product list", তাহলে উপরের তালিকা থেকে পণ্যের নামগুলো দেখাবে।

3. কোনো পণ্যের দাম জানতে চাইলে তালিকা থেকে সঠিক দাম বলবে।

4. কোনো পণ্য stock-এ না থাকলে সেটিকে available বলবে না।

5. তালিকার বাইরে কোনো পণ্য, দাম, discount, offer বা stock বানিয়ে বলবে না।

6. সাধারণ কথাবার্তায় মানুষের মতো উত্তর দেবে।

উদাহরণ:
"হ্যালো" → "হ্যালো! 😊 Besati-তে স্বাগতম। কীভাবে সাহায্য করতে পারি?"

"কেমন আছো?" → স্বাভাবিক বন্ধুত্বপূর্ণ উত্তর।

"ধন্যবাদ" → স্বাভাবিকভাবে ধন্যবাদ জানাবে।

"তোমাদের দোকান সম্পর্কে বলো" → Besati সম্পর্কে সংক্ষেপে বলবে।

7. সাধারণ প্রশ্নের উত্তর 1-5টি ছোট বাক্যে দেবে।

8. কাস্টমার কোনো পণ্যের নাম লিখলে সেই পণ্য তালিকায় আছে কিনা দেখে উত্তর দেবে।

9. কাস্টমারের প্রশ্নের উত্তর জানা না থাকলে সেটা পরিষ্কারভাবে বলবে। ভুল তথ্য বানাবে না।

10. কাস্টমার অর্ডার করতে চাইলে পণ্যের নাম, quantity এবং প্রয়োজনীয় তথ্য জানতে চাইতে পারো।

কাস্টমারের প্রশ্ন:
${message}
`;

  console.log("====================================");
  console.log("🤖 GEMINI REQUEST");
  console.log("Question:", message);
  console.log("API key exists:", Boolean(GEMINI_API_KEY));
  console.log("API key length:", GEMINI_API_KEY?.length || 0);
  console.log("Products:", products.length);
  console.log("Model:", GEMINI_MODEL);
  console.log("====================================");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
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
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  const rawText = await response.text();

  console.log("🔵 Gemini HTTP status:", response.status);
  console.log("🔵 Gemini raw response:", rawText);

  let data;

  try {
    data = JSON.parse(rawText);
  } catch (error) {
    throw new Error(
      `Gemini returned invalid JSON. HTTP ${response.status}`
    );
  }

  if (!response.ok) {
    console.error("❌ GEMINI API ERROR");
    console.error(JSON.stringify(data, null, 2));

    const apiMessage =
      data?.error?.message ||
      data?.error?.status ||
      "Unknown Gemini API error";

    throw new Error(
      `Gemini API failed (${response.status}): ${apiMessage}`
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part?.text || "")
      .join("")
      ?.trim();

  if (!text) {
    console.error("❌ Gemini returned no text.");
    console.error(JSON.stringify(data, null, 2));

    throw new Error("Gemini returned an empty response.");
  }

  console.log("✅ GEMINI RESPONSE:");
  console.log(text);

  return text;
}

// ======================================================
// Fallback Reply
// ======================================================

function fallbackReply(message, settings, products) {
  const m = message.toLowerCase().trim();

  // Product count / product list
  if (
    /কয়টি|কয়টি|কতটি|কতগুলো|কত গুলো|কি কি|কী কী|কীকি|products|product list|how many product/.test(
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

  // Delivery
  if (/ডেলিভারি|delivery|কতদিন|কয়দিন|কয়দিন/.test(m)) {
    return `ঢাকার মধ্যে ডেলিভারি সময় ${
      settings?.deliveryTimeDhaka || "তথ্য পাওয়া যায়নি"
    } এবং ঢাকার বাইরে ${
      settings?.deliveryTimeOutside || "তথ্য পাওয়া যায়নি"
    }। ডেলিভারি চার্জ ${money(
      settings?.deliveryCharge || 0
    )}।`;
  }

  // Payment
  if (/বিকাশ|পেমেন্ট|payment|টাকা.*দিব/.test(m)) {
    return "বর্তমানে শুধু Cash on Delivery চালু আছে। পণ্য হাতে পাওয়ার পর টাকা দিতে পারবেন। 😊";
  }

  // Return
  if (/রিটার্ন|ফেরত|return/.test(m)) {
    return (
      settings?.returnPolicy ||
      "রিটার্ন পলিসির তথ্য বর্তমানে পাওয়া যাচ্ছে না।"
    );
  }

  // Price
  if (/দাম|price|কত টাকা/.test(m)) {
    const sample = products
      .slice(0, 5)
      .map((p) => `${p.name} — ${money(p.price)}`)
      .join("\n");

    if (!sample) {
      return "বর্তমানে কোনো পণ্যের তথ্য পাওয়া যাচ্ছে না।";
    }

    return `কিছু পণ্যের দাম:\n${sample}\n\nনির্দিষ্ট কোনো পণ্যের নাম লিখলে তার দাম জানিয়ে দিতে পারি। 😊`;
  }

  // Greeting
  if (/হ্যালো|হাই|hello|hi|আসসালামু|সালাম/.test(m)) {
    return `আসসালামু আলাইকুম! 😊 ${
      settings?.shopName || "Besati"
    }-তে স্বাগতম। কীভাবে সাহায্য করতে পারি?`;
  }

  return `দুঃখিত, এই মুহূর্তে AI উত্তর দিতে পারছে না। 😊 আপনি চাইলে আপনার প্রশ্নটি আবার লিখতে পারেন।`;
}

// ======================================================
// Send Messenger Reply
// ======================================================

async function sendMessengerReply(senderId, text) {
  if (!PAGE_ACCESS_TOKEN) {
    throw new Error(
      "PAGE_ACCESS_TOKEN is missing from Vercel Environment Variables."
    );
  }

  if (!senderId) {
    throw new Error("Messenger sender ID is missing.");
  }

  if (!text) {
    throw new Error("Reply text is empty.");
  }

  console.log("📤 Sending Messenger reply...");
  console.log("Sender ID exists:", Boolean(senderId));
  console.log("Reply:", text);

  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
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
          text,
        },
      }),
    }
  );

  const rawText = await response.text();

  console.log("🔵 Facebook Send API status:", response.status);
  console.log("🔵 Facebook Send API response:", rawText);

  let data;

  try {
    data = JSON.parse(rawText);
  } catch (error) {
    data = {
      raw: rawText,
    };
  }

  if (!response.ok) {
    console.error("❌ FACEBOOK SEND API ERROR");
    console.error(JSON.stringify(data, null, 2));

    const message =
      data?.error?.message ||
      data?.error?.error_user_msg ||
      "Unknown Facebook API error";

    throw new Error(
      `Facebook Messenger API failed (${response.status}): ${message}`
    );
  }

  console.log("✅ Messenger reply sent successfully.");

  return data;
}

// ======================================================
// Receive Messenger Messages
// ======================================================

export async function POST(req) {
  try {
    console.log("====================================");
    console.log("📩 MESSENGER WEBHOOK RECEIVED");
    console.log("====================================");

    const body = await req.json();

    console.log("Facebook object:", body?.object);
    console.log("Entries:", body?.entry?.length || 0);

    if (body.object !== "page") {
      console.log("⚠️ Request is not a Facebook Page event.");

      return NextResponse.json(
        {
          status: "not_page",
        },
        {
          status: 404,
        }
      );
    }

    // Check required environment variables
    console.log("Environment check:");
    console.log("VERIFY_TOKEN exists:", Boolean(VERIFY_TOKEN));
    console.log("PAGE_ACCESS_TOKEN exists:", Boolean(PAGE_ACCESS_TOKEN));
    console.log("GEMINI_API_KEY exists:", Boolean(GEMINI_API_KEY));

    if (!PAGE_ACCESS_TOKEN) {
      console.error("❌ PAGE_ACCESS_TOKEN is missing.");

      return NextResponse.json(
        {
          status: "error",
          message: "PAGE_ACCESS_TOKEN is missing.",
        },
        {
          status: 500,
        }
      );
    }

    if (!GEMINI_API_KEY) {
      console.error("❌ GEMINI_API_KEY is missing.");

      return NextResponse.json(
        {
          status: "error",
          message: "GEMINI_API_KEY is missing.",
        },
        {
          status: 500,
        }
      );
    }

    // Load shop settings
    const settings = await prisma.settings.findFirst();

    if (!settings) {
      console.error("❌ Shop settings not found.");

      return NextResponse.json(
        {
          status: "error",
          message: "Shop settings not found.",
        },
        {
          status: 500,
        }
      );
    }

    // Load products
    const products = await prisma.product.findMany({
      take: 40,
    });

    console.log(`📦 Loaded ${products.length} products.`);

    let processedMessages = 0;

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        const messageText = event.message?.text;

        // Ignore non-text events
        if (!senderId || !messageText) {
          console.log("⚠️ Ignoring non-text Messenger event.");
          continue;
        }

        processedMessages++;

        console.log("====================================");
        console.log("👤 CUSTOMER MESSAGE");
        console.log(messageText);
        console.log("====================================");

        let reply;

        // ==================================================
        // Try Gemini
        // ==================================================

        try {
          reply = await getGeminiReply(
            messageText,
            settings,
            products
          );

          console.log("🤖 Gemini generated the reply.");
        } catch (error) {
          console.error("❌ Gemini failed:");
          console.error(error);

          console.log("⚠️ Using fallback reply.");

          reply = fallbackReply(
            messageText,
            settings,
            products
          );
        }

        // ==================================================
        // Send reply to Facebook
        // ==================================================

        console.log("💬 Final reply:");
        console.log(reply);

        await sendMessengerReply(
          senderId,
          reply
        );
      }
    }

    console.log(
      `✅ Webhook completed. Processed messages: ${processedMessages}`
    );

    return NextResponse.json({
      status: "ok",
      processedMessages,
    });
  } catch (error) {
    console.error("====================================");
    console.error("❌ MESSENGER WEBHOOK ERROR");
    console.error(error);
    console.error("====================================");

    return NextResponse.json(
      {
        status: "error",
        message: "Webhook processing failed.",
      },
      {
        status: 500,
      }
    );
  }
    }
