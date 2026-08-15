"use client";
import { useEffect, useState } from "react";
export default function LoyaltyCoinsCard() {
  const [data,setData]=useState(null); const [busy,setBusy]=useState(false); const [msg,setMsg]=useState("");
  const load=()=>fetch("/api/customer/loyalty").then(r=>r.ok?r.json():null).then(setData).catch(()=>{});
  useEffect(() => { load(); }, []);
  if(!data) return null;
  const claim=async()=>{setBusy(true);setMsg("");const r=await fetch("/api/customer/loyalty",{method:"POST"});const j=await r.json();setMsg(j.message||j.error||"");setBusy(false);load();};
  return <div className="bg-white border border-[#E7E4DA] rounded-2xl p-4">
    <div className="flex justify-between gap-3"><div><p className="font-bold">🎁 Loyalty Points</p><p className="text-xs text-[#8A8A78] mt-1">{data.required} Coins হলে ১টি Gift Product</p></div><p className="font-num text-2xl font-extrabold">🪙 {data.coins}</p></div>
    <div className="mt-3 h-2 bg-[#EEECE5] rounded-full overflow-hidden"><div className="h-full bg-[#EFE8D6]" style={{width:`${data.progress}%`}}/></div>
    {data.giftProduct && <p className="text-xs text-[#4B5850] mt-2">🎁 Gift: {data.giftProduct.name}</p>}
    {data.canClaim && <button onClick={claim} disabled={busy} className="mt-3 w-full bg-[#EFE8D6] text-[#4A3405] font-bold py-2.5 rounded-xl disabled:opacity-60">{busy?"Processing…":"🎁 Claim Gift"}</button>}
    {msg && <p className="text-xs mt-2">{msg}</p>}
  </div>;
}
