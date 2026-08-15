"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Truck, MapPin, Phone, User, FileText, Lock, Mail, Tag, X } from "lucide-react";
import Header from "@/components/Header";
import { money } from "@/lib/money";
import { useCart } from "@/lib/CartContext";
import { BD_DISTRICTS, BD_LOCATIONS } from "@/lib/bdLocations";
import UpazilaSearchSelect from "@/components/UpazilaSearchSelect";

export default function CheckoutPage() {
  const { cart, clearCart } = useCart();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", address: "", district: "", thana: "", orderNotes: "" });
  const [account, setAccount] = useState({ name: "", phone: "", email: "", password: "" });
  const [login, setLogin] = useState({ phone: "", password: "" });
  const [authMode, setAuthMode] = useState("register");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { code, discount }
  const [couponError, setCouponError] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);
  const [payment, setPayment] = useState("cod");
  const [paymentTrxId, setPaymentTrxId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
      fetch("/api/customer/me").then((r) => r.json()),
    ]).then(([p, s, me]) => {
      setProducts(p);
      setSettings(s);
      if (me.authed) {
        setCustomer(me);
        setForm((f) => ({ ...f, name: me.name || "", phone: me.phone || "", address: me.address || "" }));
      }
      setAuthLoading(false);
    }).catch(() => setAuthLoading(false));
  }, []);

  const items = cart.map((c) => ({ ...c, product: products.find((p) => p.id === c.productId) })).filter((c) => c.product);
  const subtotal = items.reduce((s, c) => s + c.product.price * c.qty, 0);
  const deliveryFee = settings ? (subtotal >= settings.freeDeliveryOver ? 0 : settings.deliveryCharge) : 0;
  const discount = coupon?.discount || 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value, ...(key === "district" ? { thana: "" } : {}) }));

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponChecking(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim(), subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponError(data.error || "কুপন প্রয়োগ করা যায়নি");
        setCoupon(null);
      } else {
        setCoupon({ code: data.code, discount: data.discount });
        setCouponError("");
      }
    } catch {
      setCouponError("সংযোগ সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
    setCouponChecking(false);
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const createAccount = async () => {
    if (!account.name.trim() || !account.phone.trim() || !account.email.trim() || !account.password.trim()) {
      setError("নাম, ফোন, ইমেইল ও পাসওয়ার্ড দিন।");
      return;
    }
    if (!/^0\d{9,10}$/.test(account.phone.trim())) {
      setError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(account),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "অ্যাকাউন্ট তৈরি করা যায়নি।");
        setSubmitting(false);
        return;
      }
      const me = await fetch("/api/customer/me").then((r) => r.json());
      setCustomer(me);
      setForm((f) => ({ ...f, name: data.name || account.name, phone: data.phone || account.phone }));
      setSubmitting(false);
    } catch {
      setError("সংযোগ সমস্যা হয়েছে, আবার চেষ্টা করুন।");
      setSubmitting(false);
    }
  };

  const loginAccount = async () => {
    if (!login.phone.trim() || !login.password.trim()) {
      setError("ফোন ও পাসওয়ার্ড দিন।");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(login),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "লগইন করা যায়নি।");
        setSubmitting(false);
        return;
      }
      const me = await fetch("/api/customer/me").then((r) => r.json());
      setCustomer(me);
      setForm((f) => ({ ...f, name: me.name || data.name || "", phone: me.phone || data.phone || "", address: me.address || "" }));
      setSubmitting(false);
    } catch {
      setError("সংযোগ সমস্যা হয়েছে, আবার চেষ্টা করুন।");
      setSubmitting(false);
    }
  };

  const submit = async () => {
    if (!form.phone.trim() || !form.name.trim() || !form.address.trim() || !form.district || !form.thana) {
      setError("দয়া করে ফোন, নাম, সম্পূর্ণ ঠিকানা, জেলা এবং থানা/উপজেলা পূরণ করুন।");
      return;
    }
    if (!/^0\d{9,10}$/.test(form.phone.trim())) {
      setError("সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমনঃ 01XXXXXXXXX)।");
      return;
    }
    if (!items.length) {
      setError("কার্ট খালি — আগে পণ্য যোগ করুন।");
      return;
    }
    if (payment !== "cod" && !paymentTrxId.trim()) {
      setError(`${payment === "bkash" ? "বিকাশ" : "নগদ"}-এ টাকা পাঠানোর পর Transaction ID লিখুন।`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name,
          phone: form.phone,
          address: form.address,
          district: form.district,
          thana: form.thana,
          orderNotes: form.orderNotes,
          couponCode: coupon?.code || undefined,
          payment,
          paymentTrxId: payment !== "cod" ? paymentTrxId.trim() : undefined,
          items: items.map((c) => ({ productId: c.productId, qty: c.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "অর্ডার সম্পন্ন করা যায়নি।");
        setSubmitting(false);
        return;
      }
      clearCart();
      router.push(`/order-success/${data.id}`);
    } catch {
      setError("সংযোগ সমস্যা হয়েছে, আবার চেষ্টা করুন।");
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="min-h-screen bg-[#f2f0e9] flex items-center justify-center text-[#8A8A78]">চেকআউট প্রস্তুত হচ্ছে…</div>;
  if (!items.length) return <div className="min-h-screen bg-[#f2f0e9]"><Header showSearch={false}/><div className="max-w-lg mx-auto px-4 py-16 text-center"><p className="text-[#8A8A78]">কার্ট খালি।</p><button onClick={() => router.push("/")} className="mt-4 text-[#A9862D] font-semibold">শপে ফিরে যান →</button></div></div>;

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#f2f0e9]">
        <Header showSearch={false} />
        <div className="max-w-lg mx-auto px-4 py-5 pb-10">
          <h1 className="font-display font-bold text-xl mb-4">অর্ডার করতে অ্যাকাউন্ট দরকার</h1>
          <div className="bg-white border border-[#E7E4DA] rounded-2xl p-5 space-y-4">
            <div className="flex gap-2 border-b border-[#EDEBE2] pb-3">
              <button onClick={() => { setAuthMode("register"); setError(""); }} className={`flex-1 py-2 rounded-lg text-sm font-bold ${authMode === "register" ? "bg-[#EFE8D6] text-[#4A3405]" : "bg-[#F2F1EB]"}`}>নতুন অ্যাকাউন্ট</button>
              <button onClick={() => { setAuthMode("login"); setError(""); }} className={`flex-1 py-2 rounded-lg text-sm font-bold ${authMode === "login" ? "bg-[#EFE8D6] text-[#4A3405]" : "bg-[#F2F1EB]"}`}>আগের অ্যাকাউন্ট</button>
            </div>

            {authMode === "register" ? (
              <>
                <p className="text-sm text-[#4B5850]">কেনাকাটা চালিয়ে যেতে আগে একটি কাস্টমার অ্যাকাউন্ট তৈরি করুন। তারপর Checkout আসবে।</p>
                <div><label className="text-sm font-semibold">নাম</label><input value={account.name} onChange={(e)=>setAccount({...account,name:e.target.value})} placeholder="Full Name" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-xl px-3 py-3 text-sm"/></div>
                <div><label className="text-sm font-semibold">মোবাইল</label><input value={account.phone} onChange={(e)=>setAccount({...account,phone:e.target.value.replace(/\D/g,"").slice(0,11)})} placeholder="01XXXXXXXXX" inputMode="numeric" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-xl px-3 py-3 text-sm font-num"/></div>
                <div><label className="text-sm font-semibold">ইমেইল</label><input type="email" value={account.email} onChange={(e)=>setAccount({...account,email:e.target.value})} placeholder="you@example.com" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-xl px-3 py-3 text-sm"/></div>
                <div><label className="text-sm font-semibold">পাসওয়ার্ড</label><input type="password" value={account.password} onChange={(e)=>setAccount({...account,password:e.target.value})} placeholder="কমপক্ষে ৪ অক্ষর" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-xl px-3 py-3 text-sm"/></div>
                <button onClick={createAccount} disabled={submitting} className="w-full bg-[#EFE8D6] text-[#4A3405] font-bold py-3.5 rounded-xl disabled:opacity-60">{submitting ? "অ্যাকাউন্ট তৈরি হচ্ছে…" : "অ্যাকাউন্ট তৈরি করে Checkout"}</button>
              </>
            ) : (
              <>
                <p className="text-sm text-[#4B5850]">আগে থেকে অ্যাকাউন্ট থাকলে লগইন করুন। তারপর Checkout আসবে।</p>
                <div><label className="text-sm font-semibold">মোবাইল</label><input value={login.phone} onChange={(e)=>setLogin({...login,phone:e.target.value.replace(/\D/g,"").slice(0,11)})} placeholder="01XXXXXXXXX" inputMode="numeric" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-xl px-3 py-3 text-sm font-num"/></div>
                <div><label className="text-sm font-semibold">পাসওয়ার্ড</label><input type="password" value={login.password} onChange={(e)=>setLogin({...login,password:e.target.value})} placeholder="পাসওয়ার্ড" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-xl px-3 py-3 text-sm"/></div>
                <button onClick={loginAccount} disabled={submitting} className="w-full bg-[#EFE8D6] text-[#4A3405] font-bold py-3.5 rounded-xl disabled:opacity-60">{submitting ? "লগইন হচ্ছে…" : "লগইন করে Checkout"}</button>
              </>
            )}

            {error && <p className="text-sm text-[#C24D57] bg-[#FBEEEF] rounded-lg px-3 py-2">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f0e9]">
      <Header showSearch={false} />
      <div className="max-w-lg mx-auto px-4 py-5 pb-10">
        <h1 className="font-display font-bold text-xl mb-4">চেকআউট</h1>
        <div className="bg-white border border-[#E7E4DA] rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#EDEBE2] pb-3">
            <div className="w-9 h-9 rounded-xl bg-[#EEF2FA] text-[#A9862D] flex items-center justify-center"><User size={19}/></div>
            <div><p className="font-bold">Customer Information</p><p className="text-xs text-[#8A8A78]">অর্ডার সম্পন্ন করতে নিচের তথ্যগুলো দিন</p></div>
          </div>
          <div><label className="text-sm font-semibold flex items-center gap-1.5"><Phone size={14}/> Customer Phone</label><input value={form.phone} onChange={(e)=>update("phone",e.target.value.replace(/\D/g,"").slice(0,11))} placeholder="Enter customer 11 digit mobile number" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-xl px-3 py-3 text-sm font-num" inputMode="numeric"/></div>
          <div><label className="text-sm font-semibold">Customer Name</label><input value={form.name} onChange={(e)=>update("name",e.target.value)} placeholder="Full Name" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-xl px-3 py-3 text-sm"/></div>
          <div><label className="text-sm font-semibold">Customer Address</label><textarea value={form.address} onChange={(e)=>update("address",e.target.value)} rows={3} placeholder="Full Address" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-xl px-3 py-3 text-sm resize-none"/></div>
          <div><label className="text-sm font-semibold flex items-center gap-1.5"><MapPin size={14}/> District</label><select value={form.district} onChange={(e)=>update("district",e.target.value)} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-xl px-3 py-3 text-sm bg-white"><option value="">Select District</option>{BD_DISTRICTS.map((d)=><option key={d} value={d}>{d}</option>)}</select></div>
          <UpazilaSearchSelect district={form.district} value={form.thana} onChange={(value) => update("thana", value)} locations={BD_LOCATIONS} />
          <div><label className="text-sm font-semibold flex items-center gap-1.5"><FileText size={14}/> Order Notes <span className="font-normal text-[#8A8A78]">(Optional)</span></label><textarea value={form.orderNotes} onChange={(e)=>update("orderNotes",e.target.value)} rows={3} placeholder="Notes about your order, e.g. special notes for delivery" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-xl px-3 py-3 text-sm resize-none"/></div>
          <div>
            <label className="text-sm font-semibold flex items-center gap-1.5"><Truck size={14}/> পেমেন্ট পদ্ধতি</label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              <button type="button" onClick={() => { setPayment("cod"); setPaymentTrxId(""); }} className={`text-xs font-semibold py-2.5 rounded-xl border ${payment === "cod" ? "bg-[#EFE8D6] border-[#A9862D] text-[#4A3405]" : "border-[#DCD8CC] text-[#4B5850]"}`}>💵 ক্যাশ অন ডেলিভারি</button>
              <button type="button" onClick={() => setPayment("bkash")} className={`text-xs font-semibold py-2.5 rounded-xl border ${payment === "bkash" ? "bg-[#EFE8D6] border-[#A9862D] text-[#4A3405]" : "border-[#DCD8CC] text-[#4B5850]"}`}>📱 বিকাশ</button>
              <button type="button" onClick={() => setPayment("nagad")} className={`text-xs font-semibold py-2.5 rounded-xl border ${payment === "nagad" ? "bg-[#EFE8D6] border-[#A9862D] text-[#4A3405]" : "border-[#DCD8CC] text-[#4B5850]"}`}>📱 নগদ</button>
            </div>
            {payment !== "cod" && (
              <div className="mt-3 bg-[#EAF3EC] rounded-xl p-3 space-y-2">
                <p className="text-sm">
                  <b>{payment === "bkash" ? "বিকাশ" : "নগদ"} Personal নম্বরে</b> "Send Money" করুন:{" "}
                  <span className="font-num font-bold">
                    {payment === "bkash" ? (settings?.bkashNumber || "নম্বর সেট করা নেই") : (settings?.nagadNumber || "নম্বর সেট করা নেই")}
                  </span>{" "}
                  — মোট <b className="font-num">{money(total)}</b>
                </p>
                <input
                  value={paymentTrxId}
                  onChange={(e) => setPaymentTrxId(e.target.value)}
                  placeholder="Transaction ID (যেমনঃ 9F7A2XYZ1)"
                  className="focus-ring w-full border border-[#DCD8CC] rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold flex items-center gap-1.5"><Tag size={14}/> কুপন কোড <span className="font-normal text-[#8A8A78]">(থাকলে)</span></label>
            {coupon ? (
              <div className="mt-1 flex items-center justify-between bg-[#EAF3EC] border border-[#3f7259]/30 rounded-xl px-3 py-2.5">
                <p className="text-sm font-semibold text-[#3f7259] font-num">{coupon.code} প্রয়োগ হয়েছে — ছাড় {money(coupon.discount)}</p>
                <button onClick={removeCoupon} className="focus-ring text-[#3f7259] p-1 rounded-full hover:bg-white/50"><X size={15}/></button>
              </div>
            ) : (
              <div className="flex gap-2 mt-1">
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value.toUpperCase())} placeholder="যেমনঃ EID50" className="focus-ring flex-1 border border-[#DCD8CC] rounded-xl px-3 py-2.5 text-sm font-num uppercase"/>
                <button onClick={applyCoupon} disabled={couponChecking} className="focus-ring bg-[#16202A] text-white text-sm font-semibold px-4 rounded-xl disabled:opacity-60 whitespace-nowrap">{couponChecking ? "যাচাই হচ্ছে…" : "প্রয়োগ করুন"}</button>
              </div>
            )}
            {couponError && <p className="text-xs text-[#C24D57] mt-1">{couponError}</p>}
          </div>

          <div className="bg-[#f2f0e9] rounded-xl p-3 text-sm space-y-1.5">
            <div className="flex justify-between"><span>সাবটোটাল</span><span className="font-num">{money(subtotal)}</span></div>
            <div className="flex justify-between"><span>ডেলিভারি চার্জ</span><span className="font-num">{deliveryFee === 0 ? "ফ্রি" : money(deliveryFee)}</span></div>
            {discount > 0 && <div className="flex justify-between text-[#3f7259]"><span>কুপন ছাড়</span><span className="font-num">-{money(discount)}</span></div>}
            <div className="flex justify-between font-bold text-[#A9862D] text-base pt-1.5 border-t border-[#E7E4DA]"><span>সর্বমোট</span><span className="font-num">{money(total)}</span></div>
          </div>
          {error && <p className="text-sm text-[#C24D57] bg-[#FBEEEF] rounded-lg px-3 py-2">{error}</p>}
          <button onClick={submit} disabled={submitting} className="focus-ring w-full bg-[#EFE8D6] hover:bg-[#E5DCC3] text-[#4A3405] font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"><ShieldCheck size={18}/> {submitting ? "অর্ডার হচ্ছে…" : "অর্ডার কনফার্ম করুন"}</button>
        </div>
      </div>
    </div>
  );
}
