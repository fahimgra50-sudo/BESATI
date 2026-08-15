"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Package, LogOut, Gift, MapPin, Clock, User, ChevronRight, CheckCircle2, Truck, Circle } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import { money, STATUS_META } from "@/lib/money";

const STEPS = ["pending", "processing", "shipped", "delivered"];

function Tracking({ order }) {
  const active = STEPS.indexOf(order.status);
  const cancelled = order.status === "cancelled";
  return (
    <div className="mt-3 rounded-xl bg-[#f2f0e9] p-3">
      <div className="flex items-center gap-2 mb-2">
        <Truck size={15} className="text-[#A9862D]" />
        <p className="text-sm font-bold">ডেলিভারি ট্র্যাকিং</p>
      </div>
      {cancelled ? (
        <p className="text-sm text-[#C24D57] font-semibold">এই অর্ডারটি বাতিল হয়েছে।</p>
      ) : (
        <div className="space-y-2">
          {STEPS.map((s, i) => {
            const done = i <= active;
            return (
              <div key={s} className="flex items-center gap-2 text-xs">
                {done ? <CheckCircle2 size={15} className="text-[#A9862D]" /> : <Circle size={15} className="text-[#BDB8AB]" />}
                <span className={done ? "font-semibold text-[#1B2A22]" : "text-[#8A8A78]"}>{STATUS_META[s].label}</span>
              </div>
            );
          })}
        </div>
      )}
      {order.currentLocation && (
        <p className="mt-3 text-xs flex items-start gap-1.5"><MapPin size={14} className="text-[#A9862D] shrink-0" /><span><b>বর্তমান অবস্থান:</b> {order.currentLocation}</span></p>
      )}
      {order.trackingNote && <p className="mt-1.5 text-xs text-[#4B5850]">📝 {order.trackingNote}</p>}
      {order.estimatedDelivery && order.status !== "delivered" && (
        <p className="mt-1.5 text-xs flex items-center gap-1.5"><Clock size={14} className="text-[#8A5A11]" /><span><b>সম্ভাব্য পৌঁছানোর সময়:</b> {new Date(order.estimatedDelivery).toLocaleString("bn-BD", { dateStyle: "medium", timeStyle: "short" })}</span></p>
      )}
      {order.courierName && <p className="mt-1.5 text-xs"><b>কুরিয়ার:</b> {order.courierName}</p>}
      {order.trackingId && <p className="mt-1.5 text-xs font-num"><b>Tracking ID:</b> {order.trackingId}</p>}
      {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#A9862D] border border-[#E7E4DA] rounded-full px-3 py-1.5">🔗 কুরিয়ার ট্র্যাকিং খুলুন</a>}
    </div>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [notAuthed, setNotAuthed] = useState(false);
  const [selected, setSelected] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState("");

  const load = () => fetch("/api/customer/orders").then(async (r) => {
    if (!r.ok) { setNotAuthed(true); return; }
    setData(await r.json());
  });
  useEffect(() => { load(); }, []);

  const cancelOrder = async (orderId) => {
    if (!confirm("আপনি কি নিশ্চিত এই অর্ডারটি বাতিল করতে চান?")) return;
    setCancellingId(orderId);
    setCancelError("");
    try {
      const res = await fetch(`/api/customer/orders/${orderId}/cancel`, { method: "POST" });
      const result = await res.json();
      if (!res.ok) {
        setCancelError(result.error || "অর্ডার বাতিল করা যায়নি");
      } else {
        await load();
      }
    } catch (e) {
      setCancelError("সংযোগ সমস্যা হয়েছে, আবার চেষ্টা করুন");
    }
    setCancellingId(null);
  };

  const logout = async () => { await fetch("/api/customer/logout", { method: "POST" }); router.push("/"); };

  const stats = useMemo(() => {
    const orders = data?.orders || [];
    return {
      total: orders.length,
      active: orders.filter((o) => ["pending", "processing", "shipped"].includes(o.status)).length,
      delivered: orders.filter((o) => o.status === "delivered").length,
    };
  }, [data]);

  if (notAuthed) return <div className="min-h-screen bg-[#f2f0e9]"><Header showSearch={false}/><div className="max-w-md mx-auto px-4 py-16 text-center"><p className="text-[#4B5850]">আপনি লগইন করা নেই।</p><button onClick={() => router.push("/")} className="focus-ring mt-4 text-[#A9862D] font-semibold">শপে ফিরে যান →</button></div></div>;
  if (!data) return <div className="min-h-screen bg-[#f2f0e9]"><Header showSearch={false}/><div className="text-center py-16 text-[#8A8A78]">ড্যাশবোর্ড লোড হচ্ছে…</div></div>;

  const nextRewardAt = 500;
  const progress = Math.min(100, Math.round(((data.loyaltyCoins || 0) / nextRewardAt) * 100));

  return (
    <div className="min-h-screen bg-[#f2f0e9]">
      <Header showSearch={false}/>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div><p className="text-xs text-[#8A8A78]">Customer Dashboard</p><h1 className="font-display font-extrabold text-2xl">স্বাগতম, {data.name}! 👋</h1><p className="text-sm text-[#4B5850] mt-1">আপনার অর্ডার, ডেলিভারি ও পয়েন্ট এক জায়গায় দেখুন।</p></div>
          <button onClick={logout} className="focus-ring text-sm text-[#8A8A78] flex items-center gap-1 border border-[#E7E4DA] rounded-full px-3 py-1.5"><LogOut size={14}/> লগআউট</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <div className="col-span-2 lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              ["👤","My Profile","/account/profile"],["📦","My Orders","/my-orders"],["🚚","Track Order","/track"],["❤️","Wishlist","/account/wishlist"],
              ["🎁","Loyalty Coins","/account/loyalty"],["🏠","My Address","/account/address"],["🔐","Change Password","/account/password"],["🚪","Logout","/"]
            ].map(([icon,label,href])=><Link key={label} href={href} className="bg-white border border-[#E7E4DA] rounded-xl p-3 text-sm font-semibold hover:border-[#A9862D]">{icon} {label}</Link>)}
          </div>
          <div className="bg-white border border-[#E7E4DA] rounded-2xl p-4"><Package size={18} className="text-[#A9862D]"/><p className="text-xs text-[#8A8A78] mt-2">মোট অর্ডার</p><p className="font-num font-extrabold text-2xl">{stats.total}</p></div>
          <div className="bg-white border border-[#E7E4DA] rounded-2xl p-4"><Truck size={18} className="text-[#7C3AED]"/><p className="text-xs text-[#8A8A78] mt-2">চলমান অর্ডার</p><p className="font-num font-extrabold text-2xl">{stats.active}</p></div>
          <div className="bg-white border border-[#E7E4DA] rounded-2xl p-4"><CheckCircle2 size={18} className="text-[#3f7259]"/><p className="text-xs text-[#8A8A78] mt-2">ডেলিভারি সম্পন্ন</p><p className="font-num font-extrabold text-2xl">{stats.delivered}</p></div>
          <div className="bg-gradient-to-br from-[#A9862D] to-[#DCD2AE] text-[#4A3405] rounded-2xl p-4"><Sparkles size={18} className="text-[#F2A93B]"/><p className="text-xs text-[#4A3405]/70 mt-2">Loyalty Coins</p><p className="font-num font-extrabold text-2xl">{data.loyaltyCoins || 0}</p></div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-3"><h2 className="font-display font-bold text-lg flex items-center gap-2"><Package size={18}/> আমার অর্ডারসমূহ</h2><Link href="/track" className="text-xs font-semibold text-[#A9862D]">অর্ডার ট্র্যাক করুন →</Link></div>
            {data.orders.length === 0 ? <div className="bg-white border border-[#E7E4DA] rounded-2xl p-8 text-center text-sm text-[#8A8A78]">এখনো কোনো অর্ডার করেননি।</div> : <div className="space-y-3">{data.orders.map((o) => <div key={o.id} className="bg-white border border-[#E7E4DA] rounded-2xl p-4">
              <div className="flex justify-between items-start gap-2"><div><p className="font-num font-bold text-sm">অর্ডার #{o.id}</p><p className="text-xs text-[#8A8A78] mt-1 font-num">{new Date(o.createdAt).toLocaleString("bn-BD")}</p></div><span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{color: STATUS_META[o.status].color, background: STATUS_META[o.status].bg}}>{STATUS_META[o.status].label}</span></div>
              <div className="mt-3 space-y-1">{o.items.map((it)=><div key={it.id} className="flex justify-between text-sm"><span>{it.name} × {it.qty}</span><span className="font-num">{money(it.price*it.qty)}</span></div>)}</div>
              <div className="flex justify-between font-bold text-[#A9862D] text-sm pt-2 mt-2 border-t border-[#E7E4DA]"><span>মোট</span><span className="font-num">{money(o.total)}</span></div>
              {selected === o.id ? <><Tracking order={o}/><button onClick={()=>setSelected(null)} className="text-xs text-[#8A8A78] mt-2">কম দেখান</button></> : <button onClick={()=>setSelected(o.id)} className="mt-3 text-xs font-semibold text-[#A9862D] flex items-center gap-1">ডেলিভারি বিস্তারিত দেখুন <ChevronRight size={14}/></button>}
              {o.status === "pending" && (
                <button
                  onClick={() => cancelOrder(o.id)}
                  disabled={cancellingId === o.id}
                  className="mt-2 w-full text-xs font-semibold text-[#C24D57] border border-[#F0C9CC] rounded-lg py-2 hover:bg-[#FBEEEF] disabled:opacity-50"
                >
                  {cancellingId === o.id ? "বাতিল হচ্ছে…" : "অর্ডার বাতিল করুন"}
                </button>
              )}
            </div>)}</div>}
            {cancelError && <p className="text-sm text-[#C24D57] bg-[#FBEEEF] rounded-lg px-3 py-2 mt-3">{cancelError}</p>}
          </div>

          <aside className="space-y-4">
            <div className="bg-white border border-[#E7E4DA] rounded-2xl p-5"><h2 className="font-display font-bold flex items-center gap-2"><User size={17}/> আমার প্রোফাইল</h2><div className="mt-3 text-sm space-y-2 text-[#4B5850]"><p><b>নাম:</b> {data.name}</p><p><b>মোবাইল:</b> <span className="font-num">{data.phone}</span></p>{data.email && <p><b>ইমেইল:</b> {data.email}</p>}{data.address && <p className="flex gap-1"><MapPin size={15}/><span>{data.address}</span></p>}</div></div>
            <div className="bg-gradient-to-br from-[#A9862D] to-[#DCD2AE] text-[#4A3405] rounded-2xl p-5"><p className="text-sm text-[#4A3405]/80 flex items-center gap-1.5"><Sparkles size={14} className="text-[#F2A93B]"/> আপনার পয়েন্ট</p><p className="font-num font-extrabold text-4xl mt-1">{data.loyaltyCoins || 0}</p><div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-[#F2A93B] rounded-full" style={{width:`${progress}%`}}/></div><p className="text-xs text-[#4A3405]/70 mt-2 flex items-center gap-1"><Gift size={13}/>{(data.loyaltyCoins || 0) >= nextRewardAt ? "🎁 500 Coins পূর্ণ! Gift Claim করুন।" : `আরও ${nextRewardAt-(data.loyaltyCoins || 0)} Coins হলে ১টি Gift Product পাবেন`}</p></div>
            <div className="bg-white border border-[#E7E4DA] rounded-2xl p-5"><p className="text-sm font-bold mb-2">📦 ডেলিভারি সম্পর্কে</p><p className="text-xs text-[#4B5850] leading-5">অর্ডারের বর্তমান অবস্থা, অবস্থান ও সম্ভাব্য পৌঁছানোর সময় এডমিন আপডেট করলে এখানেই দেখতে পাবেন।</p></div>
          </aside>
        </div>
      </main>
    </div>
  );
}
