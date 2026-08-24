import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL = "gemini-3.6-flash";

// ======================================================
// Facebook Webhook Verification
// ======================================================
export async function GET(req) {
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
}

// ======================================================
// Gemini AI Reply
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
              `${index + 1}. ${p.name} | ক্যাটাগরি: ${
                p.category || "নেই"
              } | দাম: ${money(p.price)} | স্টক: ${
                p.stock > 0 ? `${p.stock}টি আছে` : "স্টকে নেই"
              } | বিবরণ: ${p.description || "নেই"}`
          )
          .join("\n")
      : "বর্তমানে কোনো পণ্য নেই।";

  const prompt = `
তুমি "${settings?.shopName || "Besati"}" অনলাইন শপের একজন বাস্তব মানুষের মতো বন্ধুত্বপূর্ণ দোকানি।

তোমার সাথে Facebook Messenger-এ কাস্টমার কথা বলছে।

সবচেয়ে গুরুত্বপূর্ণ নিয়ম:

১. কাস্টমার যেভাবেই লিখুক—বাংলা, Banglish, English, ভুল বানান, ছোট করে, অসম্পূর্ণ বাক্যে বা ভুলভাবে—তার কথার আসল অর্থ বোঝার চেষ্টা করবে।

উদাহরণ:
"Tumi kemon aso"
"Apnader kase ki type product ase"
"ki ki ase"
"dam koto"
"delivery kobe"
"vai eta ase?"
"eta koto"
"gori"
"watch typ product ase?"

এ ধরনের কথাকে রোবটের মতো "বুঝতে পারিনি" বলবে না যদি অর্থ অনুমান করা সম্ভব হয়।

২. কাস্টমার Banglish লিখলেও উত্তর সাধারণত সহজ স্বাভাবিক বাংলায় দেবে।

৩. কাস্টমার English-এ পরিষ্কারভাবে কথা বললে English-এ উত্তর দিতে পারো।

৪. কথাবার্তা মানুষের মতো হবে।
অতিরিক্ত formal, robotic বা scripted ভাষা ব্যবহার করবে না।

৫. কাস্টমার শুধু "হুম", "আচ্ছা", "ওকে", "ঠিক আছে", "হ্যাঁ" ইত্যাদি বললে আগের কথার context অনুযায়ী স্বাভাবিক উত্তর দেবে।

৬. কোনো প্রশ্ন পুরোপুরি বুঝতে না পারলে:
"হুম, আপনি কি একটু বুঝিয়ে বলবেন?" 
এরকম স্বাভাবিকভাবে জিজ্ঞেস করবে।

কখনোই সব প্রশ্নের জন্য একই:
"দুঃখিত, আপনার প্রশ্নটি বুঝতে সমস্যা হয়েছে..."
এই ধরনের উত্তর বারবার দেবে না।

৭. কাস্টমার যদি ভুল বানান করে, বানান নিয়ে তাকে সংশোধন করবে না।

৮. কাস্টমার যদি কোনো পণ্যের ধরন জানতে চায়, database-এর category, name, tags, description দেখে matching products সাজেস্ট করবে।

৯. কাস্টমার যদি "কি কি product আছে", "কী কী আছে", "কি বিক্রি করেন", "products দেখাও" বা Banglish-এ একই কথা বলে, তাহলে database-এর পণ্যগুলোর নাম সুন্দরভাবে দেখাবে।

১০. কাস্টমার নির্দিষ্ট কোনো পণ্যের দাম জানতে চাইলে database থেকে সঠিক দাম বলবে।

১১. flash sale price থাকলে এবং flash sale এখনও active থাকলে সেই দামকে বর্তমান অফার হিসেবে উল্লেখ করতে পারো।

১২. MRP এবং বর্তমান দাম থাকলে চাইলে discount-এর কথাও বলতে পারো।

১৩. stock 0 হলে পণ্য available বলবে না।

১৪. database-এর বাইরে কোনো পণ্যের নাম, দাম, stock, offer বা তথ্য বানিয়ে বলবে না।

১৫. কাস্টমার যদি জিজ্ঞেস করে "কতগুলো product আছে", তাহলে মোট database product count বলবে।

১৬. কাস্টমার যদি দোকান সম্পর্কে জানতে চায়, shop information ব্যবহার করবে।

১৭. Delivery:
ঢাকার মধ্যে: ${
    settings?.deliveryTimeDhaka || "তথ্য পাওয়া যায়নি"
  }
ঢাকার বাইরে: ${
    settings?.deliveryTimeOutside || "তথ্য পাওয়া যায়নি"
  }

ডেলিভারি চার্জ: ${money(settings?.deliveryCharge || 0)}

${
    settings?.freeDeliveryOver
      ? `${money(settings.freeDeliveryOver)} টাকার বেশি অর্ডারে ফ্রি ডেলিভারি।`
      : ""
  }

১৮. Payment:
বর্তমানে Cash on Delivery চালু আছে।

১৯. Return policy:
${settings?.returnPolicy || "রিটার্ন পলিসির তথ্য পাওয়া যায়নি।"}

২০. Website-এ থাকা product, offer, category বা feature সম্পর্কে database-এ তথ্য থাকলে সেটা ব্যবহার করবে।

২১. কাস্টমারকে অযথা লম্বা উত্তর দেবে না।
সাধারণত ১-৫টি ছোট বাক্যে উত্তর দেবে।

২২. দরকার হলে emoji ব্যবহার করবে, কিন্তু অতিরিক্ত নয়।

২৩. কাস্টমারের সাথে এমনভাবে কথা বলবে যেন Besati-এর একজন ভালো, স্বাভাবিক, ধৈর্যশীল মানুষ customer service করছে।

২৪. কাস্টমার ভুলভাবে কিছু লিখলেও তার সম্ভাব্য অর্থ বুঝে উত্তর দেওয়ার চেষ্টা করবে।

২৫. একই উত্তর বারবার copy-paste করবে না।

পণ্যের তথ্য:

${productLines}

মোট database product:
${products.length}

কাস্টমারের বর্তমান মেসেজ:
${message}
`;

  console.log("🤖 Gemini request");
  console.log("Model:", GEMINI_MODEL);
  console.log("Message:", message);
  console.log("Products:", products.length);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
          maxOutputTokens: 500,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Gemini API failed:", {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    throw new Error(
      `Gemini API failed: ${response.status} - ${
        data?.error?.message || response.statusText
      }`
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

  if (!text) {
    console.error("❌ Gemini returned empty response:", data);
    throw new Error("Gemini returned empty response.");
  }

  console.log("✅ Gemini reply received");

  return text;
}

// ======================================================
// Fallback
// ======================================================
function fallbackReply(message, settings, products) {
  const m = message.toLowerCase();

  if (/delivery|ডেলিভারি|কতদিন|কয়দিন|কয়দিন/.test(m)) {
    return `ঢাকার মধ্যে সাধারণত ${
      settings?.deliveryTimeDhaka || "২৪-৪৮ ঘণ্টা"
    } এবং ঢাকার বাইরে ${
      settings?.deliveryTimeOutside || "৩-৫ দিন"
    } সময় লাগে।`;
  }

  if (/payment|পেমেন্ট|বিকাশ|নগদ|cash/.test(m)) {
    return "এখন Cash on Delivery চালু আছে। 😊 পণ্য হাতে পাওয়ার পর টাকা দিতে পারবেন।";
  }

  if (/return|রিটার্ন|ফেরত/.test(m)) {
    return (
      settings?.returnPolicy ||
      "রিটার্ন পলিসির তথ্য বর্তমানে পাওয়া যাচ্ছে না।"
    );
  }

  if (
    /কি কি|কী কী|কিকি|products|product|কি আছে|কী আছে|what.*product/.test(
      m
    )
  ) {
    if (!products.length) {
      return "এই মুহূর্তে কোনো পণ্য দেখাচ্ছে না।";
    }

    const names = products
      .slice(0, 20)
      .map((p) => `• ${p.name}`)
      .join("\n");

    return `আমাদের বর্তমানে ${products.length}টি পণ্য আছে 😊\n\n${names}`;
  }

  if (/দাম|price|কত টাকা|how much/.test(m)) {
    const sample = products
      .slice(0, 5)
      .map((p) => `${p.name} — ${money(p.price)}`)
      .join("\n");

    return sample
      ? `কিছু পণ্যের দাম দেখুন 😊\n\n${sample}`
      : "এই মুহূর্তে পণ্যের দাম পাওয়া যাচ্ছে না।";
  }

  return "হুম 😊 একটু বুঝিয়ে বলবেন? তাহলে আমি ঠিকভাবে সাহায্য করতে পারব।";
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
          text: text.slice(0, 2000),
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("❌ Facebook Messenger API failed:", {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    throw new Error(
      `Facebook Messenger API failed: ${response.status} - ${
        data?.error?.message || response.statusText
      }`
    );
  }

  console.log("✅ Messenger message sent");

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
      return NextResponse.json(
        { status: "not_page" },
        { status: 404 }
      );
    }

    const settings = await prisma.settings.findFirst();

    if (!settings) {
      console.error("❌ Settings not found");

      return NextResponse.json(
        {
          status: "error",
          message: "Shop settings not found",
        },
        { status: 500 }
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

    console.log(`📦 Loaded ${products.length} active products`);

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        const messageText = event.message?.text;

        if (!senderId || !messageText) {
          continue;
        }

        console.log("👤 Customer:", messageText);

        let reply;

        try {
          reply = await getGeminiReply(
            messageText,
            settings,
            products
          );
        } catch (error) {
          console.error("❌ Gemini failed:", error);

          reply = fallbackReply(
            messageText,
            settings,
            products
          );
        }

        console.log("💬 Reply:", reply);

        try {
          await sendMessengerReply(
            senderId,
            reply
          );
        } catch (error) {
          console.error(
            "❌ Failed to send Messenger reply:",
            error
          );
        }
      }
    }

    return NextResponse.json({
      status: "ok",
    });
  } catch (error) {
    console.error(
      "❌ Messenger webhook error:",
      error
    );

    return NextResponse.json(
      {
        status: "error",
        message: "Webhook processing failed",
      },
      { status: 200 }
    );
  }
                }
