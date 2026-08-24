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
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Facebook webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  console.error("❌ Facebook webhook verification failed");

  return new NextResponse("Forbidden", {
    status: 403,
  });
}

// ======================================================
// Gemini AI
// ======================================================
async function getGeminiReply(message, settings, products) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from environment variables.");
  }

  const productLines =
    products.length > 0
      ? products
          .map(
            (p, index) =>
              `${index + 1}. ${p.name} | Category: ${p.category || "N/A"} | Price: ${money(
                p.price
              )} | Stock: ${
                p.stock > 0 ? `${p.stock} available` : "Out of stock"
              }`
          )
          .join("\n")
      : "বর্তমানে কোনো পণ্য পাওয়া যাচ্ছে না।";

  const prompt = `
তুমি "${settings?.shopName || "Besati"}" নামের একটি অনলাইন শপের বন্ধুত্বপূর্ণ AI দোকানি।

তোমার কাজ হলো Facebook Messenger-এ কাস্টমারের সাথে মানুষের মতো স্বাভাবিকভাবে কথা বলা।

ভাষা:
- কাস্টমার বাংলা লিখলে বাংলায় উত্তর দেবে।
- কাস্টমার ইংরেজি লিখলে ইংরেজিতে উত্তর দিতে পারো।
- বাংলা কথোপকথনে সহজ, স্বাভাবিক ও বন্ধুত্বপূর্ণ ভাষা ব্যবহার করবে।
- অপ্রয়োজনীয়ভাবে একই বাক্য বারবার ব্যবহার করবে না।
- প্রতিটি প্রশ্নের অর্থ বুঝে উত্তর দেবে।
- শুধু "ডেলিভারি, পেমেন্ট, রিটার্ন লিখুন" ধরনের রোবটিক উত্তর দেবে না।

দোকানের তথ্য:

Shop name: ${settings?.shopName || "Besati"}

Payment:
শুধু Cash on Delivery চালু আছে।

Delivery:
ঢাকার মধ্যে: ${settings?.deliveryTimeDhaka || "তথ্য পাওয়া যায়নি"}
ঢাকার বাইরে: ${settings?.deliveryTimeOutside || "তথ্য পাওয়া যায়নি"}

Delivery charge:
${money(settings?.deliveryCharge || 0)}

Free delivery:
${money(settings?.freeDeliveryOver || 0)} টাকার বেশি অর্ডারে ফ্রি ডেলিভারি।

Return policy:
${settings?.returnPolicy || "রিটার্ন পলিসির তথ্য বর্তমানে পাওয়া যাচ্ছে না।"}

পণ্যের তালিকা:
${productLines}

বিশেষ নিয়ম:

1. কাস্টমার যদি জিজ্ঞেস করে "কয়টি পণ্য আছে", তাহলে তালিকায় থাকা মোট পণ্যের সংখ্যা গণনা করে বলবে।
মোট পণ্য সংখ্যা: ${products.length}

2. কাস্টমার যদি জিজ্ঞেস করে "কি কি পণ্য আছে", "কী কী বিক্রি করেন", "products দেখান" বা একই ধরনের কিছু জিজ্ঞেস করে, তাহলে উপরের পণ্যের তালিকা থেকে সুন্দরভাবে পণ্যের নামগুলো দেখাবে।

3. কোনো পণ্যের দাম জানতে চাইলে তালিকা থেকে সঠিক দাম বলবে।

4. কোনো পণ্য stock-এ না থাকলে সেটি available বলে দাবি করবে না।

5. তালিকার বাইরে কোনো পণ্যের নাম, দাম, discount, offer বা stock বানিয়ে বলবে না।

6. কাস্টমার সাধারণ কথা বললে স্বাভাবিকভাবে উত্তর দেবে।
উদাহরণ:
- "হ্যালো" → স্বাভাবিকভাবে অভিবাদন জানাবে।
- "কেমন আছো?" → বন্ধুত্বপূর্ণ উত্তর দেবে।
- "ধন্যবাদ" → স্বাভাবিকভাবে উত্তর দেবে।
- "তোমাদের দোকান সম্পর্কে বলো" → Besati সম্পর্কে সংক্ষেপে বলবে।

7. উত্তর খুব বড় করবে না। সাধারণ প্রশ্নের উত্তর সাধারণত 1-5টি ছোট বাক্যে দেবে।

8. প্রয়োজনে emoji ব্যবহার করতে পারো, তবে অতিরিক্ত নয়।

কাস্টমারের বর্তমান প্রশ্ন:
${message}
`;

  console.log("🤖 Sending request to Gemini...");
  console.log("Question:", message);
  console.log("API key exists:", Boolean(GEMINI_API_KEY));
  console.log("Products loaded:", products.length);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Gemini API error:", {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    throw new Error(
      `Gemini API request failed: ${response.status} ${response.statusText}`
    );
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!text) {
    console.error("❌ Gemini returned no text:", data);
    throw new Error("Gemini returned an empty response.");
  }

  console.log("✅ Gemini response received");

  return text;
}

// ======================================================
// Fallback reply
// ======================================================
function fallbackReply(message, settings, products) {
  const m = message.toLowerCase();

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
    }। ডেলিভারি চার্জ ${money(settings?.deliveryCharge || 0)}।`;
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

    return sample
      ? `কিছু পণ্যের দাম:\n${sample}\n\nআপনি চাইলে নির্দিষ্ট পণ্যের নাম লিখে দাম জানতে পারেন।`
      : "বর্তমানে কোনো পণ্যের তথ্য পাওয়া যাচ্ছে না।";
  }

  return "দুঃখিত, আপনার প্রশ্নটি বুঝতে একটু সমস্যা হয়েছে। 😊 আপনি পণ্যের নাম, দাম, ডেলিভারি বা অর্ডার সম্পর্কে জানতে চাইলে লিখুন।";
}

// ======================================================
// Send Messenger Reply
// ======================================================
async function sendMessengerReply(senderId, text) {
  if (!PAGE_ACCESS_TOKEN) {
    throw new Error("PAGE_ACCESS_TOKEN is missing.");
  }

  const response = await fetch(
    `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
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

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Facebook Messenger API error:", {
      status: response.status,
      data,
    });

    throw new Error(
      `Facebook Messenger API failed: ${response.status}`
    );
  }

  console.log("✅ Messenger reply sent successfully");

  return data;
}

// ======================================================
// Receive Messenger Messages
// ======================================================
export async function POST(req) {
  try {
    const body = await req.json();

    console.log("📩 Messenger webhook received");

    if (body.object !== "page") {
      console.log("⚠️ Request is not a Facebook page event");

      return NextResponse.json(
        {
          status: "not_page",
        },
        {
          status: 404,
        }
      );
    }

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

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        const messageText = event.message?.text;

        if (!senderId || !messageText) {
          continue;
        }

        console.log("👤 Customer message:", messageText);

        let reply;

        try {
          reply = await getGeminiReply(
            messageText,
            settings,
            products
          );
        } catch (error) {
          console.error("❌ Gemini failed:", error);

          console.log("⚠️ Using fallback reply...");

          reply = fallbackReply(
            messageText,
            settings,
            products
          );
        }

        console.log("💬 Reply:", reply);

        await sendMessengerReply(
          senderId,
          reply
        );
      }
    }

    return NextResponse.json({
      status: "ok",
    });
  } catch (error) {
    console.error("❌ Messenger webhook error:", error);

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
