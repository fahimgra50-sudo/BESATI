"use client";
// এই ফাইলটি ক্লায়েন্ট-সাইড ইন্টারঅ্যাকশন (কার্ট, উইশলিস্ট) হ্যান্ডেল করে; SEO মেটাডেটা page.js (সার্ভার কম্পোনেন্ট) থেকে আসে
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, Star, Truck, ArrowLeft, Heart } from "lucide-react";
import Header from "@/components/Header";
import ChatWidget from "@/components/ChatWidget";
import ReviewsSection from "@/components/ReviewsSection";
import { money } from "@/lib/money";
import { useCart } from "@/lib/CartContext";

export default function ProductDetailClient({ product: initialProduct }) {
  const { id } = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [p, setP] = useState(initialProduct || null);
  const [notFound, setNotFound] = useState(false);
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);

  useEffect(() => {
    // সার্ভার থেকে প্রাথমিক ডেটা না এলে (যেমন খুব পুরনো ক্যাশ) ব্যাকআপ হিসেবে ক্লায়েন্ট থেকে আনা হচ্ছে
    if (!initialProduct) {
      (async () => {
        const res = await fetch(`/api/products/${id}`);
        if (res.ok) setP(await res.json());
        else setNotFound(true);
      })();
    }
    fetch("/api/customer/wishlist")
      .then((r) => (r.ok ? r.json() : []))
      .then((list) => setWished(list.some((x) => x.productId === id)))
      .catch(() => {});
  }, [id, initialProduct]);

  const toggleWishlist = async () => {
    setWishBusy(true);
    try {
      if (wished) {
        await fetch(`/api/customer/wishlist?productId=${id}`, { method: "DELETE" });
        setWished(false);
      } else {
        const res = await fetch("/api/customer/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: id }),
        });
        if (res.status === 401) {
          router.push("/checkout");
          setWishBusy(false);
          return;
        }
        setWished(true);
      }
    } catch (e) {}
    setWishBusy(false);
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#f2f0e9] flex items-center justify-center flex-col gap-3">
        <p className="text-[#8A8A78]">পণ্যটি পাওয়া যায়নি।</p>
        <button onClick={() => router.push("/")} className="focus-ring text-[#A9862D] font-semibold flex items-center gap-1">
          <ArrowLeft size={16} /> শপে ফিরে যান
        </button>
      </div>
    );
  }
  if (!p) return <div className="min-h-screen bg-[#f2f0e9] flex items-center justify-center text-[#8A8A78]">লোড হচ্ছে…</div>;

  const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#f2f0e9]">
      <Header showSearch={false} />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <button onClick={() => router.back()} className="focus-ring flex items-center gap-1 text-sm text-[#4B5850] mb-4">
          <ArrowLeft size={15} /> পেছনে যান
        </button>
        <div className="bg-white rounded-3xl p-5 sm:p-8 grid sm:grid-cols-2 gap-6">
          <div
            className="h-52 sm:h-72 rounded-2xl flex items-center justify-center text-8xl overflow-hidden relative"
            style={p.imageUrl ? undefined : { background: `linear-gradient(155deg, ${p.color}1a, ${p.color}33)` }}
          >
            {p.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
            ) : (
              p.emoji
            )}
            <button
              onClick={toggleWishlist}
              disabled={wishBusy}
              className="focus-ring absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-md hover:bg-white"
              aria-label="Wishlist"
            >
              <Heart size={19} className={wished ? "fill-[#A9862D] text-[#A9862D]" : "text-[#8A8A78]"} />
            </button>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#EAF3EC] text-[#A9862D] w-fit">{p.category}</span>
            <h1 className="font-display font-bold text-2xl mt-2">{p.name}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-[#8A8A78]">
              <Star size={14} className="fill-[#F2A93B] text-[#F2A93B]" />
              <span className="font-num">{p.rating}</span>
              {p.reviewCount > 0 && <span className="font-num text-[#8A8A78]">({p.reviewCount} রিভিউ)</span>}
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="font-num font-extrabold text-3xl text-[#A9862D]">{money(p.price)}</span>
              {discount > 0 && <span className="font-num text-[#A6A297] line-through">{money(p.mrp)}</span>}
              {discount > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#FBEEEF] text-[#C24D57]">{discount}% ছাড়</span>
              )}
            </div>
            <p className="text-sm mt-3 leading-relaxed text-[#4B5850]">{p.description}</p>
            <p className="text-sm mt-3 flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${p.stock > 0 ? "bg-[#EFE8D6]" : "bg-[#C24D57]"}`} />
              {p.stock > 0 ? "In Stock" : "Out of Stock"}
            </p>
            <p className="text-xs mt-3 flex items-center gap-1.5 text-[#4B5850]">
              <Truck size={14} className="text-[#A9862D]" /> ক্যাশ অন ডেলিভারি
            </p>
            <button
              disabled={p.stock === 0}
              onClick={() => {
                addToCart(p, 1);
                router.push("/checkout");
              }}
              className="focus-ring mt-6 w-full flex items-center justify-center gap-2 bg-[#EFE8D6] disabled:bg-[#CFCFC5] text-[#4A3405] font-semibold py-3 rounded-xl hover:bg-[#E5DCC3]"
            >
              <ShoppingCart size={17} /> কার্টে যোগ করুন
            </button>
          </div>
        </div>

        {p.videoUrl && (
          <div className="bg-white rounded-3xl p-5 sm:p-8 mt-4">
            <h2 className="font-display font-bold text-lg mb-3 text-[#1B2A22]">পণ্যের ভিডিও</h2>
            <div className="relative w-full rounded-2xl overflow-hidden border border-[#E7E4DA]" style={{ paddingTop: "56.25%" }}>
              <iframe
                src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(p.videoUrl)}&show_text=false`}
                className="absolute inset-0 w-full h-full"
                style={{ border: "none", overflow: "hidden" }}
                scrolling="no"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                title="পণ্যের ভিডিও"
              />
            </div>
          </div>
        )}

        <ReviewsSection productId={p.id} />
      </div>
      <ChatWidget />
    </div>
  );
}
