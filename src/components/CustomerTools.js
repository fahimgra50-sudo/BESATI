"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import { BD_DISTRICTS, BD_LOCATIONS } from "@/lib/bdLocations";
import UpazilaSearchSelect from "@/components/UpazilaSearchSelect";

function LoyaltySection({ me }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(null);
  const [msg, setMsg] = useState("");
  const coins = me?.loyaltyCoins || 0;
  const eligible = coins >= 500;

  useEffect(() => {
    if (eligible) {
      fetch("/api/customer/claim-gift").then(r => r.ok ? r.json() : []).then(setProducts).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [eligible]);

  const claim = async (productId, name) => {
    if (!confirm(`আপনি কি "${name}" গিফট হিসেবে দাবি করতে চান? এতে ৫০০ কয়েন কেটে নেওয়া হবে।`)) return;
    setClaiming(productId);
    setMsg("");
    try {
      const res = await fetch("/api/customer/claim-gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error || "দাবি করা যায়নি");
      } else {
        setMsg(data.message);
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (e) {
      setMsg("সংযোগ সমস্যা হয়েছে, আবার চেষ্টা করুন");
    }
    setClaiming(null);
  };

  return (
    <section>
      <h1 className="text-2xl font-extrabold">🎁 Loyalty Coins</h1>
      <div className="mt-4 bg-white rounded-2xl p-5">
        <p className="text-4xl font-extrabold">🪙 {coins}</p>
        <p className="mt-2 text-sm">500 Coins হলে ১০০০ টাকার মধ্যে ১টি Gift Product দাবি করতে পারবেন।</p>
        <div className="h-2 bg-[#EEECE5] rounded-full mt-4">
          <div className="h-2 bg-[#EFE8D6] rounded-full" style={{width:`${Math.min(100,(coins/500)*100)}%`}}/>
        </div>
      </div>

      {msg && <p className="mt-3 bg-white rounded-xl p-3 text-sm">{msg}</p>}

      {eligible ? (
        <div className="mt-5">
          <h2 className="text-lg font-bold mb-3">🎁 একটি প্রোডাক্ট বেছে নিন</h2>
          {loading ? (
            <p className="text-sm text-[#8A8A78]">লোড হচ্ছে…</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-[#8A8A78]">এই মুহূর্তে দাবি করার মতো কোনো প্রোডাক্ট নেই।</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-xl p-3">
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} className="w-full aspect-square object-contain rounded-lg" />
                  ) : (
                    <div className="w-full aspect-square rounded-lg flex items-center justify-center text-4xl" style={{ background: `${p.color}22` }}>{p.emoji}</div>
                  )}
                  <p className="text-sm font-semibold mt-2 line-clamp-2">{p.name}</p>
                  <p className="text-sm text-[#A9862D] font-bold">৳{p.price}</p>
                  <button
                    disabled={claiming === p.id}
                    onClick={() => claim(p.id, p.name)}
                    className="mt-2 w-full bg-[#EFE8D6] text-[#4A3405] font-bold rounded-xl py-2 text-sm disabled:opacity-50"
                  >
                    {claiming === p.id ? "দাবি হচ্ছে…" : "Claim করুন"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#8A8A78]">আরও {500 - coins} কয়েন হলে গিফট দাবি করতে পারবেন।</p>
      )}
    </section>
  );
}

export default function CustomerTools({type}){
 const [me,setMe]=useState(null),[msg,setMsg]=useState(""),[busy,setBusy]=useState(false),[wish,setWish]=useState([]);
 const [f,setF]=useState({name:"",email:"",address:"",district:"",thana:"",currentPassword:"",newPassword:""});
 useEffect(()=>{fetch("/api/customer/me").then(r=>r.json()).then(d=>{setMe(d);setF(x=>({...x,name:d.name||"",email:d.email||"",address:d.address||"",district:d.district||"",thana:d.thana||""}))}); if(type==="wishlist") fetch("/api/customer/wishlist").then(r=>r.ok?r.json():[]).then(setWish)},[type]);
 const save=async(body)=>{setBusy(true);setMsg("");const r=await fetch("/api/customer/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const j=await r.json();setMsg(j.error||"সংরক্ষণ হয়েছে");setBusy(false);if(r.ok)setMe({...me,...j})};
 if(type==="wishlist") return <section><h1 className="text-2xl font-extrabold">❤️ Wishlist</h1><div className="mt-4 space-y-2">{!wish.length?<p className="text-sm text-[#8A8A78]">Wishlist খালি।</p>:wish.map(x=><div key={x.id} className="bg-white rounded-xl p-3 flex gap-3"><img src={x.product.imageUrl||"/placeholder.png"} className="w-16 h-16 object-cover rounded-lg" alt=""/><div><b>{x.product.name}</b><p>৳{x.product.price}</p></div></div>)}</div></section>;
 if(type==="loyalty") return <LoyaltySection me={me}/>;
 if(type==="password") return <section><h1 className="text-2xl font-extrabold">🔐 Change Password</h1><div className="mt-4 bg-white rounded-2xl p-5 space-y-3"><input type="password" placeholder="Current Password" value={f.currentPassword} onChange={e=>setF({...f,currentPassword:e.target.value})} className="w-full border rounded-xl p-3"/><input type="password" placeholder="New Password" value={f.newPassword} onChange={e=>setF({...f,newPassword:e.target.value})} className="w-full border rounded-xl p-3"/><button disabled={busy} onClick={()=>save({currentPassword:f.currentPassword,newPassword:f.newPassword})} className="bg-[#EFE8D6] text-[#4A3405] font-bold rounded-xl px-4 py-3">Save Password</button>{msg&&<p>{msg}</p>}</div></section>;
 return <section><h1 className="text-2xl font-extrabold">{type==="address"?"🏠 My Address":"👤 My Profile"}</h1><div className="mt-4 bg-white rounded-2xl p-5 space-y-3">
 {type==="profile"&&<><input placeholder="Name" value={f.name} onChange={e=>setF({...f,name:e.target.value})} className="w-full border rounded-xl p-3"/><input placeholder="Email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} className="w-full border rounded-xl p-3"/></>}
 <textarea placeholder="Full Address" value={f.address} onChange={e=>setF({...f,address:e.target.value})} className="w-full border rounded-xl p-3"/>
 {type==="address"&&<><select value={f.district} onChange={e=>setF({...f,district:e.target.value,thana:""})} className="w-full border rounded-xl p-3 bg-white"><option value="">Select District</option>{BD_DISTRICTS.map(d=><option key={d} value={d}>{d}</option>)}</select><UpazilaSearchSelect district={f.district} value={f.thana} onChange={thana=>setF({...f,thana})} locations={BD_LOCATIONS}/></>}
 <button disabled={busy} onClick={()=>save({name:f.name,email:f.email,address:f.address,district:f.district,thana:f.thana})} className="bg-[#EFE8D6] text-[#4A3405] font-bold rounded-xl px-4 py-3">Save</button>{msg&&<p>{msg}</p>}</div><Link href="/account" className="inline-block mt-4 text-[#A9862D]">← Dashboard</Link></section>
                     }
