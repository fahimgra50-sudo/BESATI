import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money";

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Facebook webhook verification
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

function fallbackReply(message, settings, products) {
  const m = message.toLowerCase();
  if (/ডেলিভারি|delivery|কতদিন|কয়দিন/.test(m)) {
    return `ঢাকার মধ্যে ডেলিভারি সময় ${settings.deliveryTimeDhaka}, ঢাকার বাইরে ${settings.deliveryTimeOutside}। ডেলিভারি চার্জ ${money(settings.deliveryCharge)}, ${money(settings.freeDeliveryOver)} টাকার বেশি অর্ডারে ফ্রি ডেলিভারি।`;
  }
  if (/বিকাশ|পেমেন্ট|টাকা.*দিব|payment/.test(m)) {
    return `এখন শুধু ক্যাশ অন ডেলিভারি চালু আছে — পণ্য হাতে পেয়ে টাকা দেবেন, আগে থেকে কিছু পাঠাতে হবে না।`;
  }
  if (/রিটার্ন|ফেরত|return/.test(m)) {
    return settings.returnPolicy;
  }
  if (/দাম|price|কত টাকা/.test(m)) {
    const sample = products.slice(0, 3).map((p) => `${p.name} — ${money(p.price)}`).join(", ");
    return `কিছু পণ্যের দাম: ${sample}। নির্দিষ্ট পণ্যের নাম বললে সঠিক দাম বলে দিতে পারব।`;
  }
  return `আসসালামু আলাইকুম! "ডেলিভারি", "পেমেন্ট", "রিটার্ন" বা কোনো পণ্যের নাম লিখে জিজ্ঞেস করুন।`;
}

async function getGeminiReply(message, settings, products) {
  const productLines = products
    .map((p) => `- ${p.name} | ${p.category} | ${money(p.price)} | স্টক: ${p.stock > 0 ? p.stock + " আছে" : "নেই"}`)
    .join("\n");

  const prompt = `তুমি "${settings.shopName}" অনলাইন শপের স্মার্ট দোকানি। বাংলায়, ছোট ও বন্ধুত্বপূর্ণ ভাবে উত্তর দাও।
পেমেন্ট: শুধু ক্যাশ অন ডেলিভারি। ডেলিভারি: ঢাকায় ${settings.deliveryTimeDhaka}, বাইরে ${settings.deliveryTimeOutside}, চার্জ ${money(settings.deliveryCharge)} (${money(settings.freeDeliveryOver)}+ ফ্রি)। রিটার্ন: ${settings.returnPolicy}
নিচের তালিকার বাইরে কোনো পণ্য/অফার সম্পর্কে বানিয়ে বলবে না।
পণ্য তালিকা:
${productLines}

কাস্টমারের প্রশ্ন: ${message}`;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text?.trim();
}

async function sendMessengerReply(senderId, text) {
  await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: senderId },
      message: { text },
    }),
  });
}

// Receiving messages from Messenger
export async function POST(req) {
  const body = await req.json();

  if (body.object !== "page") {
    return NextResponse.json({ status: "not_page" }, { status: 404 });
  }

  const settings = await prisma.settings.findFirst();
  const products = await prisma.product.findMany({ take: 40 });

  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      const senderId = event.sender?.id;
      const messageText = event.message?.text;
      if (!senderId || !messageText) continue;

      let reply;
      try {
        reply = GEMINI_API_KEY
          ? await getGeminiReply(messageText, settings, products)
          : null;
      } catch (e) {
        reply = null;
      }
      if (!reply) reply = fallbackReply(messageText, settings, products);

      await sendMessengerReply(senderId, reply);
    }
  }

  return NextResponse.json({ status: "ok" });
                         }
