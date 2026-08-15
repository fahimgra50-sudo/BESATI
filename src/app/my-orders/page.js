"use client";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import CustomerTrackingCard from "@/components/CustomerTrackingCard";
import { money, STATUS_META } from "@/lib/money";

export default function MyOrdersPage(){
 const [data,setData]=useState(null); const [auth,setAuth]=useState(true);
 const [cancellingId,setCancellingId]=useState(null);
 const [cancelError,setCancelError]=useState("");
 const load = ()=>fetch("/api/customer/orders").then(async r=>{if(!r.ok){setAuth(false);return;}setData(await r.json());});
 useEffect(()=>{load();},[]);
 const cancelOrder = async (orderId) => {
   if (!confirm("আপনি কি নিশ্চিত এই অর্ডারটি বাতিল করতে চান?")) return;
   setCancellingId(orderId); setCancelError("");
   try {
     const res = await fetch(`/api/customer/orders/${orderId}/cancel`, { method: "POST" });
     const result = await res.json();
     if (!res.ok) setCancelError(result.error || "অর্ডার বাতিল করা যায়নি"); else await load();
   } catch (e) { setCancelError("সংযোগ সমস্যা হয়েছে, আবার চেষ্টা করুন"); }
   setCancellingId(null);
 };
 if(!auth) return <><Header showSearch={false}/><div className="max-w-md mx-auto p-10 text-center">Login করে My Orders দেখুন।</div></>;
 if(!data) return <><Header showSearch={false}/><div className="p-10 text-center text-[#8A8A78]">লোড হচ্ছে…</div></>;
 return <div className="min-h-screen bg-[#f2f0e9]"><Header showSearch={false}/><main className="max-w-4xl mx-auto p-4 py-6"><h1 className="text-2xl font-extrabold mb-4">📦 My Orders</h1>{cancelError && <p className="text-sm text-[#C24D57] bg-[#FBEEEF] rounded-lg px-3 py-2 mb-3">{cancelError}</p>}{!data.orders.length?<div className="bg-white rounded-2xl p-10 text-center">এখনো কোনো Order নেই।</div>:<div className="space-y-4">{data.orders.map(o=><div key={o.id} className="bg-white border border-[#E7E4DA] rounded-2xl p-4"><div className="flex justify-between"><div><b>Order #{o.id}</b><p className="text-xs text-[#8A8A78]">{new Date(o.createdAt).toLocaleString("bn-BD")}</p></div><span className="text-xs font-bold px-2 py-1 rounded-full" style={{color:STATUS_META[o.status].color,background:STATUS_META[o.status].bg}}>{STATUS_META[o.status].label}</span></div><div className="mt-3 space-y-1">{o.items.map(it=><div key={it.id} className="flex justify-between text-sm"><span>{it.name} × {it.qty}</span><span className="font-num">{money(it.price*it.qty)}</span></div>)}</div><div className="border-t mt-3 pt-2 flex justify-between font-bold text-[#A9862D]"><span>Total</span><span>{money(o.total)}</span></div><div className="mt-3"><CustomerTrackingCard order={o}/></div>{o.status==="pending" && <button onClick={()=>cancelOrder(o.id)} disabled={cancellingId===o.id} className="mt-3 w-full text-xs font-semibold text-[#C24D57] border border-[#F0C9CC] rounded-lg py-2 hover:bg-[#FBEEEF] disabled:opacity-50">{cancellingId===o.id?"বাতিল হচ্ছে…":"অর্ডার বাতিল করুন"}</button>}</div>)}</div>}</main></div>
}
