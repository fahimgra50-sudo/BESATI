"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingCart, Package, User, Home, LogIn } from "lucide-react";
import { useCart } from "@/lib/CartContext";

export default function Header({ shopName, query, setQuery, showSearch = true }) {
  const { count } = useCart();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    fetch("/api/customer/me")
      .then((r) => r.json())
      .then((d) => setLoggedIn(!!d.authed))
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-[#E7E4DA]">
      <div className="gold-hairline" />
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="focus-ring flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/besati-logo.png" alt="Besati" className="h-9 w-auto" />
          <span className="font-luxe font-semibold text-2xl tracking-wide hidden sm:block text-[#1B2A22]">{shopName || "বেসাতি"}</span>
        </Link>
        {showSearch && (
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A6A297]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="পণ্য খুঁজুন…"
              className="focus-ring w-full bg-[#F2F1EB] rounded-full pl-9 pr-3 py-2 text-sm font-body"
            />
          </div>
        )}
        {!showSearch && <div className="flex-1" />}
        <Link href="/" className="focus-ring hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#4B5850] hover:text-[#A9862D] px-2"><Home size={16}/> Home</Link>
        {!loggedIn && <Link href="/checkout?login=1" className="focus-ring hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#4B5850] hover:text-[#A9862D] px-2"><LogIn size={16} /> Login</Link>}
        {loggedIn && <Link href="/account" className="focus-ring hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#4B5850] hover:text-[#A9862D] px-2"><User size={16} /> Customer Dashboard</Link>}
        {loggedIn && <Link href="/my-orders" className="focus-ring hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[#4B5850] hover:text-[#A9862D] px-2"><Package size={16} /> My Orders</Link>}
        <Link href="/cart" className="focus-ring relative p-2 rounded-full hover:bg-[#F2F1EB]">
          <ShoppingCart size={21} />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-[#FF6B5C] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center font-num">
              {count}
            </span>
          )}
        </Link>
      </div>
      <div className="sm:hidden flex px-3 pb-2 gap-2">
        <Link href="/" className="focus-ring flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-[#4B5850] border border-[#E7E4DA] rounded-full py-1.5"><Home size={13}/> Home</Link>
        {!loggedIn && <Link href="/checkout?login=1" className="focus-ring flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-[#4B5850] border border-[#E7E4DA] rounded-full py-1.5"><LogIn size={13}/> Login</Link>}
        {loggedIn && <Link href="/account" className="focus-ring flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-[#4B5850] border border-[#E7E4DA] rounded-full py-1.5"><User size={13}/> Dashboard</Link>}
        {loggedIn && <Link href="/my-orders" className="focus-ring flex-1 flex items-center justify-center gap-1 text-xs font-semibold text-[#4B5850] border border-[#E7E4DA] rounded-full py-1.5"><Package size={13}/> My Orders</Link>}
      </div>
    </header>
  );
}
