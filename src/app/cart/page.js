"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Package, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import { money } from "@/lib/money";
import { useCart } from "@/lib/CartContext";

export default function CartPage() {
  const { cart, updateQty, removeItem, ready } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then(setProducts);
  }, []);

  const items = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.productId) })).filter((c) => c.product);
  const subtotal = items.reduce((s, c) => s + c.product.price * c.qty, 0);

  return (
    <div className="min-h-screen bg-[#f2f0e9]">
      <Header showSearch={false} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="font-display font-bold text-xl mb-4">আপনার কার্ট</h1>

        {ready && items.length === 0 && (
          <div className="text-center text-[#8A8A78] mt-16">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            কার্ট এখনো খালি।
            <div className="mt-4">
              <Link href="/" className="focus-ring text-[#A9862D] font-semibold">কেনাকাটা শুরু করুন →</Link>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {items.map((c) => (
            <div key={c.productId} className="flex gap-3 bg-white border border-[#EDEBE2] rounded-xl p-3">
              <div className="w-16 h-16 rounded-lg flex items-center justify-center text-3xl shrink-0" style={{ background: `${c.product.color}22` }}>
                {c.product.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold line-clamp-1">{c.product.name}</p>
                <p className="font-num text-[#A9862D] font-bold text-sm">{money(c.product.price)}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button onClick={() => updateQty(c.productId, c.qty - 1, c.product.stock)} className="focus-ring w-7 h-7 rounded-md border border-[#DCD8CC] flex items-center justify-center hover:bg-[#F2F1EB]">
                    <Minus size={13} />
                  </button>
                  <span className="font-num text-sm w-5 text-center">{c.qty}</span>
                  <button
                    onClick={() => updateQty(c.productId, c.qty + 1, c.product.stock)}
                    disabled={c.qty >= c.product.stock}
                    className="focus-ring w-7 h-7 rounded-md border border-[#DCD8CC] flex items-center justify-center hover:bg-[#F2F1EB] disabled:opacity-40"
                  >
                    <Plus size={13} />
                  </button>
                  <button onClick={() => removeItem(c.productId)} className="focus-ring ml-auto text-[#C24D57] p-1 hover:bg-[#FBEEEF] rounded-md">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="mt-5 bg-white border border-[#E7E4DA] rounded-2xl p-4 space-y-3">
            <div className="flex justify-between text-sm text-[#4B5850]">
              <span>সাবটোটাল</span>
              <span className="font-num font-bold text-[#1B2A22]">{money(subtotal)}</span>
            </div>
            <p className="text-xs text-[#8A8A78]">ডেলিভারি চার্জ পরের পেজে হিসাব হবে।</p>
            <button
              onClick={() => router.push("/checkout")}
              className="focus-ring w-full bg-[#F2A93B] hover:bg-[#e19c2e] text-[#1B2A22] font-bold py-3 rounded-xl flex items-center justify-center gap-2"
            >
              চেকআউট করুন <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
