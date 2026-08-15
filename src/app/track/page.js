"use client";
import { useState } from "react";
import { Search, MapPin, Clock, CheckCircle2, Circle, Truck, ExternalLink } from "lucide-react";
import Header from "@/components/Header";
import { money, STATUS_META } from "@/lib/money";

export default function TrackPage() {
  const [id, setId] = useState("");
  const [order, setOrder] = useState(undefined);
  const [loading, setLoading] = useState(false);

  const search = async () => {
    if (!id.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/orders/${id.trim()}`);
    setOrder(res.ok ? await res.json() : null);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#f2f0e9]">
      <Header showSearch={false} />
      <div className="max-w-lg mx-auto py-8 px-4">
        <h1 className="font-display font-bold text-2xl mb-1">আমার অর্ডার ট্র্যাক করুন</h1>
        <p className="text-sm text-[#8A8A78] mb-4">অর্ডার আইডি দিন — সরাসরি সিস্টেম থেকেই স্ট্যাটাস দেখতে পাবেন।</p>
        <div className="flex gap-2">
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="অর্ডার আইডি"
            className="focus-ring flex-1 border border-[#DCD8CC] rounded-xl px-3 py-2.5 text-sm font-num"
          />
          <button onClick={search} className="focus-ring bg-[#EFE8D6] text-[#4A3405] px-4 rounded-xl font-semibold flex items-center gap-1">
            <Search size={16} /> খুঁজুন
          </button>
        </div>

        {loading && <p className="text-sm text-[#8A8A78] mt-3">খোঁজা হচ্ছে…</p>}
        {order === null && <p className="text-sm text-[#C24D57] mt-3">এই আইডিতে কোনো অর্ডার পাওয়া যায়নি।</p>}

        {order && (
          <div className="mt-5 border border-[#E7E4DA] bg-white rounded-2xl p-4 anim-slideUp">
            <div className="flex justify-between items-center">
              <span className="font-num font-bold">{order.id}</span>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: STATUS_META[order.status].color, background: STATUS_META[order.status].bg }}>
                {STATUS_META[order.status].label}
              </span>
            </div>
            <p className="text-xs text-[#8A8A78] mt-1 font-num">{new Date(order.createdAt).toLocaleString("bn-BD")}</p>
            <div className="mt-3 space-y-1.5">
              {order.items.map((it) => (
                <div key={it.id} className="flex justify-between text-sm">
                  <span>{it.name} × {it.qty}</span>
                  <span className="font-num">{money(it.price * it.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#f2f0e9] p-3">
              <div className="flex items-center gap-2 mb-2"><Truck size={15} className="text-[#A9862D]"/><p className="text-sm font-bold">ডেলিভারি ট্র্যাকিং</p></div>
              {order.status === "cancelled" ? <p className="text-sm text-[#C24D57] font-semibold">এই অর্ডারটি বাতিল হয়েছে।</p> : <div className="space-y-2">
                {["pending", "processing", "shipped", "delivered"].map((s, i) => { const idx = ["pending", "processing", "shipped", "delivered"].indexOf(order.status); return <div key={s} className="flex items-center gap-2 text-xs">{i <= idx ? <CheckCircle2 size={15} className="text-[#A9862D]"/> : <Circle size={15} className="text-[#BDB8AB]"/>}<span className={i <= idx ? "font-semibold" : "text-[#8A8A78]"}>{STATUS_META[s].label}</span></div>; })}
              </div>}
              {order.currentLocation && <p className="mt-3 text-xs flex gap-1.5"><MapPin size={14} className="text-[#A9862D]"/><span><b>বর্তমান অবস্থান:</b> {order.currentLocation}</span></p>}
              {order.trackingNote && <p className="mt-1.5 text-xs text-[#4B5850]">📝 {order.trackingNote}</p>}
              {order.estimatedDelivery && order.status !== "delivered" && <p className="mt-1.5 text-xs flex gap-1.5"><Clock size={14} className="text-[#8A5A11]"/><span><b>সম্ভাব্য পৌঁছানোর সময়:</b> {new Date(order.estimatedDelivery).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })}</span></p>}
              {order.courierName && <p className="mt-1.5 text-xs"><b>কুরিয়ার:</b> {order.courierName}</p>}
              {order.trackingId && <p className="mt-1.5 text-xs font-num"><b>Tracking ID:</b> {order.trackingId}</p>}
              {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#A9862D] border border-[#E7E4DA] rounded-full px-3 py-1.5"><ExternalLink size={13}/> কুরিয়ার ট্র্যাকিং খুলুন</a>}
            </div>
            <div className="flex justify-between font-bold text-[#A9862D] mt-2 pt-2 border-t border-[#E7E4DA]">
              <span>সর্বমোট</span>
              <span className="font-num">{money(order.total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
