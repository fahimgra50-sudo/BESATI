"use client";
import { useEffect, useState } from "react";
import { Filter, Sparkles, Search as SearchIcon, ArrowUpDown, X, Facebook } from "lucide-react";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import ChatWidget from "@/components/ChatWidget";
import HeroSlider from "@/components/HeroSlider";
import { CATEGORY_LIST, money } from "@/lib/money";

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [ads, setAds] = useState([]);
  const [category, setCategory] = useState("সব");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    (async () => {
      const [pRes, sRes, aRes] = await Promise.all([fetch("/api/products"), fetch("/api/settings"), fetch("/api/ads")]);
      setProducts(await pRes.json());
      setSettings(await sRes.json());
      setAds(aRes.ok ? await aRes.json() : []);
      setLoading(false);
    })();
  }, []);

  const filtered = products
    .filter(
      (p) =>
        (category === "সব" || p.category === category) &&
        p.name.toLowerCase().includes(query.toLowerCase()) &&
        (minPrice === "" || p.price >= Number(minPrice)) &&
        (maxPrice === "" || p.price <= Number(maxPrice))
    )
    .sort((a, b) => {
      if (sortBy === "price_low") return a.price - b.price;
      if (sortBy === "price_high") return b.price - a.price;
      if (sortBy === "popular") return (b.sold || 0) - (a.sold || 0);
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
      return new Date(b.createdAt) - new Date(a.createdAt); // newest
    });

  const hasActiveFilters = minPrice !== "" || maxPrice !== "" || sortBy !== "newest";
  const clearFilters = () => { setMinPrice(""); setMaxPrice(""); setSortBy("newest"); };

  return (
    <div className="min-h-screen bg-[#f2f0e9]">
      <Header shopName={settings?.shopName} query={query} setQuery={setQuery} />

      {ads.length > 0 && <HeroSlider ads={ads} />}

      <div className="relative overflow-hidden bg-gradient-to-br from-[#A9862D] via-[#EAE1C6] to-[#CBBE96] text-[#4A3405]">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ background: "radial-gradient(circle at 82% 20%, rgba(227,178,60,0.35), transparent 55%)" }}
        />
        <div className="pointer-events-none absolute -right-10 -top-10 w-56 h-56 rounded-full border border-[#F2A93B]/20" />
        <div className="pointer-events-none absolute right-16 top-20 w-24 h-24 rounded-full border border-[#F2A93B]/15" />
        <div className="relative max-w-6xl mx-auto px-4 py-9 sm:py-12 flex flex-col sm:flex-row sm:items-end gap-5 justify-between">
          <div>
            <p className="eyebrow text-[#F2C775] font-semibold flex items-center gap-2">
              <Sparkles size={13} /> প্রিমিয়াম কালেকশন
            </p>
            <h1 className="font-luxe italic font-semibold text-3xl sm:text-[2.75rem] leading-[1.15] mt-2">
              যা লাগবে, ঘরে বসেই<br className="hidden sm:block" /> — {settings?.shopName || "বেসাতি"}
            </h1>
            <p className="text-white/80 text-sm mt-3 max-w-md">ক্যাশ অন ডেলিভারিতে অর্ডার করুন — পণ্য হাতে পেয়ে টাকা দিন।</p>
          </div>
          {settings && (
            <div className="flex gap-3 shrink-0">
              <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3.5 text-center">
                <p className="font-num font-bold text-xl text-[#F2C775]">{settings.deliveryTimeDhaka}</p>
                <p className="text-[11px] text-white/60 mt-0.5">ঢাকায় ডেলিভারি</p>
              </div>
              <div className="bg-white/[0.08] backdrop-blur-sm border border-white/10 rounded-2xl px-5 py-3.5 text-center">
                <p className="font-num font-bold text-xl text-[#F2C775]">{money(settings.freeDeliveryOver)}+</p>
                <p className="text-[11px] text-white/60 mt-0.5">ফ্রি ডেলিভারি</p>
              </div>
            </div>
          )}
        </div>
        <div className="gold-hairline" />
      </div>

      {settings?.featuredVideoUrl && (
        <div className="max-w-6xl mx-auto px-4 pt-5">
          <div className="card-premium rounded-2xl overflow-hidden border border-[#E7E4DA] shadow-premium bg-black">
            <iframe
              src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
                settings.featuredVideoUrl
              )}&show_text=false`}
              className="w-full aspect-video"
              style={{ border: "none", overflow: "hidden" }}
              scrolling="no"
              frameBorder="0"
              allowFullScreen
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              title="প্রোডাক্ট ভিডিও"
            />
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 pt-5 flex items-center gap-2 overflow-x-auto pb-1">
        <Filter size={15} className="text-[#8A8A78] shrink-0" />
        {CATEGORY_LIST.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`focus-ring shrink-0 text-sm font-semibold px-3.5 py-1.5 rounded-full border transition-all ${
              category === c ? "btn-premium text-[#4A3405] border-transparent" : "border-[#DCD8CC] text-[#4B5850] hover:border-[#A9862D]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-2 flex items-center gap-2">
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`focus-ring shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${
            showFilters || hasActiveFilters ? "bg-[#16202A] text-white border-[#16202A]" : "border-[#DCD8CC] text-[#4B5850]"
          }`}
        >
          <ArrowUpDown size={13} /> দাম ও সাজানো {hasActiveFilters && "•"}
        </button>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="focus-ring flex items-center gap-1 text-xs font-semibold text-[#C24D57]">
            <X size={13} /> মুছুন
          </button>
        )}
      </div>

      {showFilters && (
        <div className="max-w-6xl mx-auto px-4 pt-2">
          <div className="bg-white border border-[#E7E4DA] rounded-2xl p-3.5 flex flex-wrap items-end gap-3">
            <div>
              <label className="text-xs font-semibold text-[#4B5850] block mb-1">সর্বনিম্ন দাম (৳)</label>
              <input
                type="number"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0"
                className="focus-ring w-24 border border-[#DCD8CC] rounded-lg px-2.5 py-1.5 text-sm font-num"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4B5850] block mb-1">সর্বোচ্চ দাম (৳)</label>
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                placeholder="যেকোনো"
                className="focus-ring w-24 border border-[#DCD8CC] rounded-lg px-2.5 py-1.5 text-sm font-num"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#4B5850] block mb-1">সাজান</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="focus-ring border border-[#DCD8CC] rounded-lg px-2.5 py-1.5 text-sm bg-white"
              >
                <option value="newest">নতুন আগে</option>
                <option value="price_low">দাম: কম থেকে বেশি</option>
                <option value="price_high">দাম: বেশি থেকে কম</option>
                <option value="popular">জনপ্রিয়তা (বিক্রি অনুযায়ী)</option>
                <option value="rating">সর্বোচ্চ রেটিং</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-5">
        {loading ? (
          <div className="text-center py-16 text-[#8A8A78]">লোড হচ্ছে…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[#8A8A78]">
            <SearchIcon size={36} className="mx-auto mb-3 opacity-40" />
            কোনো পণ্য পাওয়া যায়নি।
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-[#E7E4DA] py-6 mt-6 text-center text-xs text-[#A6A297] space-y-2">
        {settings?.facebookUrl && (
          <a
            href={settings.facebookUrl}
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex items-center gap-1.5 text-sm font-semibold text-[#A9862D] hover:underline"
          >
            <Facebook size={16} /> আমাদের ফেসবুক পেজ
          </a>
        )}
        <p>© {new Date().getFullYear()} {settings?.shopName || "বেসাতি"}</p>
      </footer>

      <ChatWidget shopName={settings?.shopName} />
    </div>
  );
}
