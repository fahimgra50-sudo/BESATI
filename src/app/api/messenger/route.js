import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GRAPH_API_VERSION = "v21.0";

// ======================================================
// FACEBOOK WEBHOOK VERIFICATION
// ======================================================

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    console.log("Facebook webhook verification request");

    if (
      mode === "subscribe" &&
      token &&
      VERIFY_TOKEN &&
      token === VERIFY_TOKEN
    ) {
      console.log("Webhook verification successful");

      return new NextResponse(challenge, {
        status: 200,
      });
    }

    console.error("Webhook verification failed");

    return new NextResponse("Forbidden", {
      status: 403,
    });
  } catch (error) {
    console.error("Webhook GET error:", error);

    return new NextResponse("Server Error", {
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
                Number(p.stock) > 0
                  ? `${p.stock} available`
                  : "Out of stock"
              }`
          )
          .join("\n")
      : "বর্তমানে কোনো পণ্য নেই।";

  const shopName = settings?.shopName || "Besati";

  const deliveryDhaka =
    settings?.deliveryTimeDhaka || "তথ্য পাওয়া যায়নি";

  const deliveryOutside =
    settings?.deliveryTimeOutside || "তথ্য পাওয়া যায়নি";

  const deliveryCharge = money(
    settings?.deliveryCharge || 0
  );

  const freeDeliveryOver = money(
    settings?.freeDeliveryOver || 0
  );

  const returnPolicy =
    settings?.returnPolicy ||
    "রিটার্ন পলিসির তথ্য বর্তমানে পাওয়া যাচ্ছে না।";

  const prompt = `
তুমি "${shopName}" অনলাইন শপের Messenger customer support assistant।

তোমার সবচেয়ে গুরুত্বপূর্ণ কাজ হলো একজন আসল দোকানের মানুষ যেভাবে কাস্টমারের সাথে স্বাভাবিকভাবে কথা বলে, সেভাবে কথা বলা।

========================
ভাষা বোঝার নিয়ম
========================

কাস্টমার যেকোনোভাবে লিখতে পারে:

বাংলা:
"তুমি কেমন আছো"

Banglish:
"Tumi kemon aso"
"tumi kmn aso"
"vai dam koto"
"delivery koto din"
"ki ki product ase"
"product gula dekhao"
"eta koto"
"eta available?"

English:
"How are you?"
"What is the price?"
"Do you deliver?"
"How long does delivery take?"

বাংলা + Banglish মিশিয়েও লিখতে পারে।

তুমি এসবের অর্থ বুঝবে।

কাস্টমার Banglish-এ লিখলেও সাধারণত উত্তর বাংলায় দেবে।

উদাহরণ:

Customer:
"Tumi kemon aso"

Natural reply:
"আলহামদুলিল্লাহ, ভালো আছি 😊 তুমি কেমন আছো?"

Customer:
"vai dam koto"

যদি নির্দিষ্ট পণ্য বোঝা যায়, সেই পণ্যের সঠিক দাম বলবে।

Customer:
"Why"

প্রশ্নের context বুঝে উত্তর দেবে।
Context না থাকলে স্বাভাবিকভাবে জিজ্ঞেস করবে:
"কোন বিষয়টা জানতে চাচ্ছেন? 😊"

========================
কথাবার্তার ধরন
========================

রোবটের মতো কথা বলবে না।

এই ধরনের উত্তর দেবে না:

"দুঃখিত, আপনার প্রশ্নটি বুঝতে সমস্যা হয়েছে।"

"পণ্যের নাম, দাম, ডেলিভারি, পেমেন্ট বা রিটার্ন সম্পর্কে জানতে পারেন।"

"আপনি একটি সঠিক প্রশ্ন করুন।"

এর পরিবর্তে মানুষের মতো স্বাভাবিকভাবে কথা বলবে।

যদি কোনো প্রশ্ন সত্যিই বুঝতে না পারো, context অনুযায়ী ছোট করে বলবে।

উদাহরণ:

"একটু বুঝিয়ে বলবেন? 😊"

"আপনি কোন পণ্যটার কথা বলছেন?"

"কোন বিষয়টা জানতে চাচ্ছেন?"

"হুম, একটু পরিষ্কার করে বলবেন? 😊"

একই বাক্য বারবার ব্যবহার করবে না।

========================
সাধারণ কথাবার্তা
========================

Customer:
"হ্যালো"

Reply:
"হ্যালো! 😊 কেমন আছেন?"

Customer:
"Hi"

Reply:
"হ্যালো! 😊 কেমন আছেন?"

Customer:
"Tumi kemon aso"

Reply:
"আলহামদুলিল্লাহ, ভালো আছি 😊 তুমি কেমন আছো?"

Customer:
"ভালো"

Reply:
"আলহামদুলিল্লাহ 😊 কীভাবে সাহায্য করতে পারি?"

Customer:
"thanks"

Reply:
"স্বাগতম 😊"

Customer:
"ভাই"

Reply:
"জি ভাই 😊 বলুন।"

========================
দোকানের তথ্য
========================

Shop:
${shopName}

Payment:
শুধু Cash on Delivery চালু আছে।

Delivery Dhaka:
${deliveryDhaka}

Delivery outside Dhaka:
${deliveryOutside}

Delivery charge:
${deliveryCharge}

Free delivery:
${freeDeliveryOver} টাকার বেশি অর্ডারে ফ্রি ডেলিভারি।

Return policy:
${returnPolicy}

========================
PRODUCT LIST
========================

${productLines}

মোট পণ্য:
${products.length}

========================
PRODUCT RULES
========================

1. শুধু উপরের product list ব্যবহার করবে।

2. তালিকায় নেই এমন পণ্য বানিয়ে বলবে না।

3. কোনো পণ্যের দাম নিজে থেকে অনুমান করবে না।

4. Stock 0 হলে available বলবে না।

5. Customer যদি "কি কি product আছে", "ki ki product ase", "products dekhao", "what do you sell" ইত্যাদি জিজ্ঞেস করে, product list থেকে পণ্যের নামগুলো দেখাবে।

6. Customer কোনো নির্দিষ্ট পণ্যের দাম জিজ্ঞেস করলে সেই পণ্যের সঠিক দাম বলবে।

7. Customer কোনো পণ্যের নাম একটু ভুল লিখলে বা Banglish-এ লিখলে context অনুযায়ী কাছাকাছি পণ্য খুঁজে বোঝার চেষ্টা করবে।

8. Customer যদি সাধারণ কথাবার্তা বলে, তাকে product list দেখিয়ে বিরক্ত করবে না।

9. Customer যদি শুধু "হাই", "হ্যালো", "ভাই", "কেমন আছো", "Tumi kemon aso" ইত্যাদি বলে, স্বাভাবিক কথোপকথন করবে।

10. উত্তর সাধারণত ছোট রাখবে। প্রয়োজন না হলে বড় paragraph লিখবে না।

11. সাধারণত 1-5টি ছোট বাক্য যথেষ্ট।

12. প্রয়োজনে অল্প emoji ব্যবহার করতে পারো।

13. Customer-এর ভাষা বুঝবে, কিন্তু উত্তর সাধারণত পরিষ্কার বাংলায় দেবে।

14. Customer Banglish লিখেছে বলে Banglish-এ উত্তর দেওয়া বাধ্যতামূলক নয়।

========================
IMPORTANT
========================

তুমি একটি AI robot হিসেবে নিজের পরিচয় দিয়ে কথা বলবে না।

"আমি একটি AI"

"আমি একটি chatbot"

"আমি আপনার virtual assistant"

এই ধরনের কথা বলবে না, যদি না customer সরাসরি জিজ্ঞেস করে।

নিজেকে দোকানের customer support হিসেবে স্বাভাবিকভাবে উপস্থাপন করবে।

========================
CUSTOMER MESSAGE
========================

${message}
`;

  console.log("Sending message to Gemini:", message);

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
          maxOutputTokens: 300,
        },
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Gemini API ERROR:", {
      status: response.status,
      statusText: response.statusText,
      data,
    });

    throw new Error(
      `Gemini API failed: ${response.status}`
    );
  }

  const text =
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

  if (!text) {
    console.error("Gemini returned empty response:", data);

    throw new Error("Gemini returned empty response.");
  }

  console.log("Gemini reply received.");

  return text;
}

// ======================================================
// NATURAL FALLBACK
// ======================================================

function fallbackReply(message, settings, products) {
  const text = String(message || "").toLowerCase().trim();

  // Greeting
  if (
    /^(hi|hello|hey|হাই|হ্যালো|সালাম|আসসালামু আলাইকুম|assalamu alaikum)$/.test(
      text
    )
  ) {
    return "হ্যালো! 😊 কেমন আছেন?";
  }

  // How are you - Bengali / Banglish
  if (
    /কেমন আছ|কেমন আছেন|tumi kemon aso|tumi kmn aso|kmn aso|kemon aso|how are you/.test(
      text
    )
  ) {
    return "আলহামদুলিল্লাহ, ভালো আছি 😊 আপনি কেমন আছেন?";
  }

  // Thanks
  if (
    /ধন্যবাদ|thanks|thank you|thx|ty/.test(text)
  ) {
    return "স্বাগতম ভাই 😊";
  }

  // Delivery
  if (
    /ডেলিভারি|delivery|deliver|কতদিন|কয়দিন|কয়দিন|how long/.test(
      text
    )
  ) {
    return `ঢাকার মধ্যে ডেলিভারি ${settings?.deliveryTimeDhaka || "তথ্য পাওয়া যায়নি"} এবং ঢাকার বাইরে ${settings?.deliveryTimeOutside || "তথ্য পাওয়া যায়নি"}। ডেলিভারি চার্জ ${money(settings?.deliveryCharge || 0)}। 😊`;
  }

  // Payment
  if (
    /বিকাশ|নগদ|পেমেন্ট|payment|pay|টাকা.*দিব|cash on delivery|cod/.test(
      text
    )
  ) {
    return "বর্তমানে Cash on Delivery চালু আছে। পণ্য হাতে পাওয়ার পর টাকা দিতে পারবেন। 😊";
  }

  // Return
  if (
    /রিটার্ন|ফেরত|return|replace|exchange/.test(text)
  ) {
    return (
      settings?.returnPolicy ||
      "রিটার্ন পলিসির তথ্য বর্তমানে পাওয়া যাচ্ছে না।"
    );
  }

  // Product count / list
  if (
    /কয়টি|কয়টি|কতটি|কতগুলো|কত গুলো|কি কি|কী কী|কি কি আছে|কী কী আছে|products|product list|product gula|ki ki product|ki ki ase|what do you sell/.test(
      text
    )
  ) {
    if (products.length === 0) {
      return "এই মুহূর্তে কোনো পণ্য তালিকায় নেই।";
    }

    const names = products
      .slice(0, 20)
      .map((p, index) => `${index + 1}. ${p.name}`)
      .join("\n");

    return `আমাদের এখন ${products.length}টি পণ্য আছে 😊\n\n${names}`;
  }

  // Price
  if (
    /দাম|price|কত টাকা|koto taka|dam koto|দাম কত|how much/.test(
      text
    )
  ) {
    if (products.length === 0) {
      return "এই মুহূর্তে পণ্যের তথ্য পাওয়া যাচ্ছে না।";
    }

    const sample = products
      .slice(0, 5)
      .map(
        (p) => `${p.name} — ${money(p.price)}`
      )
      .join("\n");

    return `কিছু পণ্যের দাম দিচ্ছি 😊\n\n${sample}\n\nকোনো নির্দিষ্ট পণ্যের দাম জানতে চাইলে নামটা লিখে দিন।`;
  }

  // Natural unknown fallback
  return "হুম 😊 একটু বুঝিয়ে বলবেন? আপনি কী জানতে চাচ্ছেন?";
}

// ======================================================
// SEND MESSAGE TO FACEBOOK MESSENGER
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
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/messages` +
    `?access_token=${encodeURIComponent(PAGE_ACCESS_TOKEN)}`;

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
        text: String(text).slice(0, 2000),
      },
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    // IMPORTANT:
    // Facebook's real error will now appear in Vercel logs.
    console.error("FACEBOOK MESSENGER API ERROR:", {
      status: response.status,
      statusText: response.statusText,
      response: data,
    });

    throw new Error(
      `Facebook Messenger API failed: ${response.status}`
    );
  }

  console.log("Facebook message sent successfully:", data);

  return data;
}

// ======================================================
// RECEIVE FACEBOOK MESSENGER WEBHOOK
// ======================================================

export async function POST(req) {
  try {
    const body = await req.json();

    console.log("====================================");
    console.log("Messenger webhook received");
    console.log("====================================");

    if (body?.object !== "page") {
      console.log("Not a Facebook page event.");

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

    console.log("Products loaded:", products.length);

    for (const entry of body.entry || []) {
      for (const event of entry.messaging || []) {
        // Ignore Facebook delivery/read events
        if (
          event.delivery ||
          event.read ||
          event.reaction
        ) {
          continue;
        }

        // Ignore messages sent by the page itself
        if (event.message?.is_echo === true) {
          console.log("Ignoring echo message.");
          continue;
        }

        const senderId = event.sender?.id;
        const messageText = event.message?.text;

        if (!senderId || !messageText) {
          console.log("No sender ID or text. Skipping.");
          continue;
        }

        console.log("Customer:", senderId);
        console.log("Message:", messageText);

        let reply = null;

        // Try Gemini
        try {
          if (GEMINI_API_KEY) {
            reply = await getGeminiReply(
              messageText,
              settings,
              products
            );
          }
        } catch (error) {
          console.error("Gemini failed:", error);
        }

        // Fallback only if Gemini failed
        if (!reply) {
          console.log("Using natural fallback.");
          reply = fallbackReply(
            messageText,
            settings,
            products
          );
        }

        console.log("Reply:", reply);

        // Send reply
        try {
          await sendMessengerReply(
            senderId,
            reply
          );
        } catch (error) {
          console.error(
            "Could not send Messenger reply:",
            error
          );

          // Do not hide the Facebook error.
          throw error;
        }
      }
    }

    console.log("Messenger webhook completed.");

    return NextResponse.json({
      status: "ok",
    });
  } catch (error) {
    console.error("====================================");
    console.error("MESSENGER WEBHOOK ERROR");
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
