const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const SEED_PRODUCTS = [
  { name: "ওয়্যারলেস ব্লুটুথ ইয়ারবাডস", category: "ইলেকট্রনিক্স", price: 1290, mrp: 1990, stock: 34, emoji: "🎧", color: "#B3122E", description: "৩০ ঘণ্টা ব্যাটারি ব্যাকআপ, টাচ কন্ট্রোল, পানি নিরোধক।" },
  { name: "স্মার্ট ওয়াচ প্রো সিরিজ", category: "ইলেকট্রনিক্স", price: 2450, mrp: 3200, stock: 18, emoji: "⌚", color: "#6E1220", description: "হার্ট রেট, স্লিপ ট্র্যাকিং, কল নোটিফিকেশন সাপোর্ট।" },
  { name: "প্রিমিয়াম কটন পাঞ্জাবি", category: "ফ্যাশন", price: 890, mrp: 1200, stock: 60, emoji: "👕", color: "#D46A73", description: "১০০% সুতি কাপড়, সব সাইজে পাওয়া যায়।" },
  { name: "লেডিস হ্যান্ডব্যাগ", category: "ফ্যাশন", price: 750, mrp: 999, stock: 40, emoji: "👜", color: "#C97B84", description: "উন্নতমানের লেদারিন, বড় কম্পার্টমেন্ট।" },
  { name: "নন-স্টিক ফ্রাইপ্যান সেট", category: "হোম ও লিভিং", price: 1150, mrp: 1500, stock: 25, emoji: "🍳", color: "#C99A4E", description: "৩ পিসের সেট, ইনডাকশন কম্প্যাটিবল।" },
  { name: "LED স্মার্ট বাল্ব", category: "হোম ও লিভিং", price: 420, mrp: 600, stock: 90, emoji: "💡", color: "#6B8F5E", description: "অ্যাপ কন্ট্রোল, ১৬ মিলিয়ন কালার অপশন।" },
  { name: "অর্গানিক ফেসওয়াশ", category: "বিউটি", price: 350, mrp: 450, stock: 70, emoji: "🧴", color: "#5EA085", description: "সব স্কিন টাইপের জন্য উপযোগী।" },
  { name: "ফাস্ট চার্জিং পাওয়ার ব্যাংক", category: "মোবাইল এক্সেসরিজ", price: 1050, mrp: 1350, stock: 47, emoji: "🔋", color: "#6E1220", description: "১০০০০mAh, ডুয়াল ইউএসবি আউটপুট।" },
];

async function main() {
  const existingSettings = await prisma.settings.findFirst();
  if (!existingSettings) {
    const adminPasswordHash = await bcrypt.hash("admin123", 10);
    await prisma.settings.create({ data: { adminPasswordHash, shopName: "বেসাতি", coinsPer100: 10, giftCoinsRequired: 500 } });
    console.log("✔ ডিফল্ট এডমিন পাসওয়ার্ড তৈরি হয়েছে: admin123 (লগইনের পর দয়া করে পরিবর্তন করুন)");
  } else if (existingSettings.coinsPer100 === 1) {
    await prisma.settings.update({ where: { id: existingSettings.id }, data: { coinsPer100: 10, giftCoinsRequired: 500 } });
    console.log("✔ Loyalty rule updated: ৳100 = 10 Coins, 500 Coins = 1 Gift Product");
  }

  const count = await prisma.product.count();
  if (count === 0) {
    await prisma.product.createMany({ data: SEED_PRODUCTS });
    console.log(`✔ ${SEED_PRODUCTS.length}টি নমুনা প্রোডাক্ট যোগ করা হয়েছে`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
