"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Star, Heart } from "lucide-react";
import { money } from "@/lib/money";
import { useCart } from "@/lib/CartContext";

export default function ProductCard({ p }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [wished, setWished] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [imgError, setImgError] = useState(false);
  const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishBusy) return;
    setWishBusy(true);
    try {
      if (wished) {
        await fetch(`/api/customer/wishlist?productId=${p.id}`, { method: "DELETE" });
        setWished(false);
      } else {
        const res = await fetch("/api/customer/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: p.id }),
        });
        if (res.ok) setWished(true);
      }
    } catch (e) {}
    setWishBusy(false);
  };

  return (
    <div className="card-premium group bg-white rounded-2xl border border-[#E7E4DA] overflow-hidden shadow-premium-hover flex flex-col">
      <Link href={`/product/${p.id}`} className="text-left focus-ring">
        <div
          className="h-36 sm:h-40 flex items-center justify-center text-6xl relative overflow-hidden bg-white"
          style={p.imageUrl && !imgError ? undefined : { background: `linear-gradient(155deg, ${p.color}1a, ${p.color}33)` }}
        >
          {p.imageUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.imageUrl} alt={p.name} onError={() => setImgError(true)} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <span>{p.emoji}</span>
          )}
          <button
            onClick={toggleWishlist}
            className="focus-ring absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow-sm hover:bg-white"
            aria-label="Wishlist"
          >
            <Heart size={13} className={wished ? "fill-[#A9862D] text-[#A9862D]" : "text-[#8A8A78]"} />
          </button>
          {discount > 0 && (
            <span className="shimmer-badge absolute top-2 left-2 text-[#5C3B00] text-[11px] font-bold px-2 py-0.5 rounded-md font-num shadow-sm">
              -{discount}%
            </span>
          )}
          {p.stock === 0 && (
            <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-sm font-bold text-[#C24D57] font-display">
              Out of Stock
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-[#1B2A22] text-sm leading-snug line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-xs text-[#8A8A78]">
            <Star size={12} className="fill-[#F2A93B] text-[#F2A93B]" />
            <span className="font-num">{p.rating}</span>
            {p.reviewCount > 0 && <span className="font-num text-[#A6A297]">({p.reviewCount})</span>}
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="font-num font-extrabold text-[#A9862D]">{money(p.price)}</span>
            {p.mrp > p.price && <span className="font-num text-xs text-[#A6A297] line-through">{money(p.mrp)}</span>}
          </div>
        </div>
      </Link>
      <div className="px-3 pb-3 mt-auto">
        <button
          disabled={p.stock === 0}
          onClick={() => {
            addToCart(p, 1);
            router.push("/checkout");
          }}
          className="btn-premium focus-ring w-full flex items-center justify-center gap-1.5 disabled:bg-[#CFCFC5] disabled:shadow-none disabled:from-transparent text-[#4A3405] text-sm font-semibold py-2 rounded-xl"
        >
          <ShoppingCart size={15} /> কার্টে যোগ করুন
        </button>
      </div>
    </div>
  );
}
