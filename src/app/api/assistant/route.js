import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { money } from "@/lib/money";

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
  if (/অর্ডার.*কই|status|ট্র্যাক|অবস্থা/.test(m)) {
    return `আপনার অর্ডার আইডি দিয়ে "আমার অর্ডার" পেজ থেকে সরাসরি স্ট্যাটাস দেখতে পারবেন।`;
  }
  if (/দাম|price|কত টাকা/.test(m)) {
    const sample = products.slice(0, 3).map((p) => `${p.name} — ${money(p.price)}`).join(", ");
    return `কিছু পণ্যের দাম: ${sample}। নির্দিষ্ট পণ্যের নাম বললে সঠিক দাম বলে দিতে পারব।`;
  }
  return `আসসালামু আলাইকুম! আমি এখনো সীমিত উত্তর দিতে পারি — "ডেলিভারি", "পেমেন্ট", "রিটার্ন" বা কোনো পণ্যের নাম লিখে জিজ্ঞেস করুন।`;
}

export async function POST(req) {
  const { message, history = [] } = await req.json();
  if (!message?.trim()) return NextResponse.json({ error: "প্রশ্ন লিখুন" }, { status: 400 });

  const settings = await prisma.settings.findFirst();
  const products = await prisma.product.findMany({ take: 40 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ reply: fallbackReply(message, settings, products) });
  }

  try {
    const productLines = products
      .map((p) => `- ${p.name} | ${p.category} | ${money(p.price)} | স্টক: ${p.stock > 0 ? p.stock + " আছে" : "নেই"}`)
      .join("\n");

    const system = `তুমি "${settings.shopName}" অনলাইন শপের স্মার্ট দোকানি। বাংলায়, ছোট ও বন্ধুত্বপূর্ণ ভাবে উত্তর দাও।
পেমেন্ট: শুধু ক্যাশ অন ডেলিভারি। ডেলিভারি: ঢাকায় ${settings.deliveryTimeDhaka}, বাইরে ${settings.deliveryTimeOutside}, চার্জ ${money(settings.deliveryCharge)} (${money(settings.freeDeliveryOver)}+ ফ্রি)। রিটার্ন: ${settings.returnPolicy}
নিচের তালিকার বাইরে কোনো পণ্য/অফার সম্পর্কে বানিয়ে বলবে না।
পণ্য তালিকা:
${productLines}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        system,
        messages: [...history, { role: "user", content: message }],
      }),
    });
    const data = await res.json();
    const text = (data.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
    return NextResponse.json({ reply: text || fallbackReply(message, settings, products) });
  } catch (e) {
    return NextResponse.json({ reply: fallbackReply(message, settings, products) });
  }
}
