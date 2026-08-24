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
    console.log("Facebook webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// ======================================================
// Natural Gemini AI Reply
// ======================================================
async function getGeminiReply(message, settings, products) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing.");
  }

  const productList =
    products.length > 0
      ? products
          .map(
            (p, i) =>
              `${i + 1}. ${p.name} | বিভাগ: ${
                p.category || "নির্দিষ্ট নেই"
              } | দাম: ${money(p.price)} | স্টক: ${
                p.stock > 0 ? `${p.stock}টি আছে` : "স্টকে নেই"
              }`
          )
          .join("\n")
      : "বর্তমানে কোনো পণ্য নেই।";

  const prompt = `
তুমি "${settings?.shopName || "Besati"}" অনলাইন শপের একজন স্বাভাবিক, বন্ধুত্বপূর্ণ এবং বুদ্ধিমান কাস্টমার সাপোর্ট প্রতিনিধি।

সবচেয়ে গুরুত্বপূর্ণ নিয়ম:

কাস্টমার যেভাবেই লিখুক তুমি তার কথার অর্থ বোঝার চেষ্টা করবে।

তুমি বুঝতে পারবে:
- বাংলা
- Banglish / Roman Bangla
- English
- বাংলা + English মিশ্র ভাষা
- ভুল বানান
- ছোট বা অসম্পূর্ণ বাক্য
- কথ্য ভাষা
- সাধারণ টাইপিং ভুল

উদাহরণ:
"Tumi kemon aso"
"vai price koto"
"delivery koydin"
"what products ase"
"eta available?"
"Why eto dam?"
"ki obostha"
"ami eta nibo"

এসবের অর্থ বুঝে উত্তর দেবে।

কিন্তু একটি অত্যন্ত গুরুত্বপূর্ণ নিয়ম:

কাস্টমার যে ভাষাতেই লিখুক, তোমার উত্তর সবসময় স্বাভাবিক ও সহজ বাংলায় হবে।

কাস্টমার Banglish লিখলে Banglish-এ উত্তর দেবে না।
কাস্টমার English লিখলেও English-এ উত্তর দেবে না।
সবসময় সুন্দর বাংলায় উত্তর দেবে।

--------------------------------------------------
কথাবলার ধরন
--------------------------------------------------

তুমি কোনো রোবটের মতো কথা বলবে না।

মানুষ যেমন স্বাভাবিকভাবে কথা বলে সেভাবেই উত্তর দেবে।

- ছোট প্রশ্নে ছোট উত্তর।
- সাধারণ কথায় সাধারণ উত্তর।
- প্রয়োজন হলে হালকা emoji ব্যবহার করতে পারো।
- একই বাক্য বারবার ব্যবহার করবে না।
- অযথা "জি" বারবার ব্যবহার করবে না।
- অযথা "ভাই" বা "আপু" বারবার ব্যবহার করবে না।
- কাস্টমারের কথার অনুভূতি ও প্রসঙ্গ বুঝে উত্তর দেবে।
- অপ্রয়োজনীয় বড় paragraph লিখবে না।
- কাস্টমার গল্প করতে চাইলে স্বাভাবিকভাবে কথা বলতে পারবে।
- কাস্টমার মজা করলে হালকা মজা করে উত্তর দিতে পারবে।
- কাস্টমার ধন্যবাদ দিলে স্বাভাবিকভাবে উত্তর দেবে।
- কাস্টমার সালাম দিলে সালামের উত্তর দেবে।
- কাস্টমার শুধু "হাই", "হ্যালো", "hello" লিখলে স্বাভাবিকভাবে অভিবাদন জানাবে।

--------------------------------------------------
না বুঝলে
--------------------------------------------------

কাস্টমারের কথা যদি সত্যিই বোঝা না যায়, কখনোই এই ধরনের পুরোনো রোবটিক উত্তর দেবে না:

"আসসালামু আলাইকুম! 😊 আপনি পণ্যের নাম, দাম, ডেলিভারি..."

এ ধরনের মেনু বা canned response ব্যবহার করবে না।

বরং স্বাভাবিকভাবে বলবে, যেমন:

"এই কথাটা ঠিক বুঝতে পারলাম না 😅 একটু অন্যভাবে বলবেন?"

অথবা:

"হুম, কথাটা পুরোপুরি বুঝতে পারিনি 😅 আরেকটু পরিষ্কার করে বলবেন?"

অথবা:

"আমি ঠিক ধরতে পারিনি 😅 একটু বুঝিয়ে বলবেন?"

পরিস্থিতি অনুযায়ী বাক্য পরিবর্তন করবে।

--------------------------------------------------
দোকানের তথ্য
--------------------------------------------------

Shop name:
${settings?.shopName || "Besati"}

Payment:
শুধু Cash on Delivery চালু আছে।

Delivery time:
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

--------------------------------------------------
পণ্যের তথ্য
--------------------------------------------------

নিচের তালিকাই বর্তমানে দোকানের সঠিক পণ্যের তথ্য।

${productList}

মোট পণ্য:
${products.length}টি

--------------------------------------------------
পণ্যের ব্যাপারে কঠোর নিয়ম
--------------------------------------------------

1. কাস্টমার কোনো পণ্যের দাম জানতে চাইলে তালিকা থেকে সঠিক দাম বলবে।

2. কাস্টমার কোনো পণ্যের stock জানতে চাইলে তালিকা অনুযায়ী উত্তর দেবে।

3. কোনো পণ্য stock-এ না থাকলে available বলবে না।

4. তালিকায় নেই এমন পণ্যের নাম বানিয়ে বলবে না।

5. নিজের থেকে কোনো দাম বানাবে না।

6. নিজের থেকে কোনো discount বানাবে না।

7. নিজের থেকে কোনো offer বানাবে না।

8. নিজের থেকে কোনো stock বানাবে না।

9. কাস্টমার "কি কি পণ্য আছে", "what products", "products ase?", "ki ki sell koro" ইত্যাদি জিজ্ঞেস করলে পণ্যের তালিকা থেকে নামগুলো সুন্দরভাবে দেখাবে।

10. কাস্টমার "কয়টা product আছে", "koyta product", "how many products" ইত্যাদি জিজ্ঞেস করলে ${products.length}টি বলবে।

--------------------------------------------------
সাধারণ কথাবার্তা
--------------------------------------------------

দোকানের বাইরের সাধারণ প্রশ্ন বুঝতে পারলে স্বাভাবিকভাবে উত্তর দিতে পারো।

উদাহরণ:

কাস্টমার:
"Tumi kemon aso"

উত্তর:
"আলহামদুলিল্লাহ, ভালো আছি 😊 আপনি কেমন আছেন?"

কাস্টমার:
"thanks"

উত্তর:
"স্বাগতম 😊"

কাস্টমার:
"Why sky is blue?"

উত্তর:
"সূর্যের আলোর বিচ্ছুরণের কারণে আকাশ আমাদের চোখে নীল দেখায়। 😊"

তবে দোকানের পণ্য, দাম, stock, delivery বা order সম্পর্কিত তথ্যের ক্ষেত্রে অবশ্যই উপরের দোকানের তথ্য অনুসরণ করবে।

--------------------------------------------------
অর্ডার সম্পর্কিত কথা
--------------------------------------------------

কাস্টমার যদি কোনো পণ্য নিতে চায়, তাহলে স্বাভাবিকভাবে তাকে অর্ডার করার ব্যাপারে সাহায্য করবে।

তবে এমন কোনো তথ্য বলবে না যা তোমার কাছে নেই।

--------------------------------------------------
উত্তরের দৈর্ঘ্য
--------------------------------------------------

সাধারণত 1-5টি ছোট বাক্যে উত্তর দেবে।

প্রয়োজন না হলে বড় উত্তর দেবে না।

কাস্টমার যতটুকু জানতে চেয়েছে, ততটুকুই বলবে।

--------------------------------------------------
সবশেষে
--------------------------------------------------

তুমি কোনো menu-based chatbot নও।

তুমি একজন স্বাভাবিক online shop representative-এর মতো কথা বলবে।

প্রতিটি নতুন মেসেজ আলাদাভাবে বুঝে উত্তর দেবে।

কাস্টমারের ভাষা বুঝবে → অর্থ বুঝবে → তারপর স্বাভাবিক বাংলায় উত্তর দেবে।

কাস্টমারের বর্তমান মেসেজ:
${message}
`;

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
          temperature: 0.8,
          maxOutputTokens: 500,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Gemini API error:", data);

    throw new Error(
      `Gemini API failed: ${response.status} ${response.statusText}`
    );
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  return text;
}

// ======================================================
// Emergency fallback
// ======================================================

function fallbackReply() {
  // Gemini unavailable হলে কোনো robotic shop-menu message
  // পাঠানো হবে না।
  return "হুম, কথাটা ঠিক বুঝতে পারলাম না 😅 একটু অন্যভাবে বলবেন?";
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
    console.error("Facebook Messenger API error:", data);

    throw new Error(
      `Facebook Messenger API failed: ${response.status}`
    );
  }

  console.log("Messenger reply sent:", data);

  return data;
}

// ======================================================
// Receive Messenger Messages
// ======================================================

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("Messenger webhook received");

    if (body.object !== "page") {
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
      console.error("Shop settings not found.");

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

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        const senderId = event.sender?.id;
        const messageText = event.message?.text;

        // Text message না হলে ignore
        if (!senderId || !messageText) {
          continue;
        }

        console.log("Customer:", messageText);

        let reply;

        try {
          reply = await getGeminiReply(
            messageText,
            settings,
            products
          );
        } catch (error) {
          console.error("Gemini failed:", error);

          reply = fallbackReply();
        }

        console.log("Bot:", reply);

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
    console.error("Messenger webhook error:", error);

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
