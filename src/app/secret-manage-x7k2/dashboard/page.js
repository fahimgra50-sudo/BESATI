"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Store, LogOut, ClipboardList, Package, ShieldCheck,
  PlusCircle, Pencil, Trash2, Truck, Wallet, Copy, CheckCheck, Users, Megaphone, Tag,
} from "lucide-react";
import { money, STATUS_META, CATEGORY_LIST } from "@/lib/money";
import Logo from "@/components/Logo";

function buildSupplierText(o) {
  const lines = [
    `গ্রাহকের নাম: ${o.customerName}`,
    `মোবাইল: ${o.phone}`,
    `ঠিকানা: ${o.address}`,
    `জেলা: ${o.district || ""}`,
    `থানা/উপজেলা: ${o.thana || ""}`,
    `অর্ডার নোট: ${o.orderNotes || ""}`,
    ``,
    `পণ্য তালিকা:`,
    ...o.items.map((it) => `- ${it.name} × ${it.qty}`),
    ``,
    `অর্ডার আইডি (নিজের রেফারেন্সের জন্য): ${o.id}`,
  ];
  return lines.join("\n");
}

function TrackingEditor({ order, onSaved }) {
  const [f, setF] = useState({
    trackingId: order.trackingId || "",
    trackingUrl: order.trackingUrl || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: order.status,
          trackingId: f.trackingId.trim(),
          trackingUrl: f.trackingUrl.trim(),
        }),
      });
      if (res.ok) onSaved(await res.json());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 bg-[#f2f0e9] rounded-xl p-3 space-y-2">
      <p className="text-xs font-bold">🚚 কাস্টমার ট্র্যাকিং</p>
      <p className="text-[11px] text-[#8A8A78]">
        শুধু Tracking ID এবং Courier Tracking Link দিন। Location, Status ও Estimated Delivery
        ভবিষ্যতে Courier API যুক্ত হলে automatic করা যাবে।
      </p>

      <div className="grid sm:grid-cols-2 gap-2">
        <input
          value={f.trackingId}
          onChange={(e) => setF({ ...f, trackingId: e.target.value })}
          placeholder="Tracking ID / Consignment No."
          className="focus-ring border border-[#DCD8CC] rounded-lg px-2.5 py-2 text-xs font-num"
        />
        <input
          type="url"
          value={f.trackingUrl}
          onChange={(e) => setF({ ...f, trackingUrl: e.target.value })}
          placeholder="Courier Tracking Link (https://...)"
          className="focus-ring border border-[#DCD8CC] rounded-lg px-2.5 py-2 text-xs"
        />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="focus-ring bg-[#16202A] text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-60"
      >
        {saving ? "সংরক্ষণ হচ্ছে…" : "ট্র্যাকিং তথ্য সংরক্ষণ"}
      </button>
    </div>
  );
}

function CopyOrderButton({ order }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(buildSupplierText(order));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) {}
  };
  return (
    <button
      onClick={copy}
      className={`focus-ring text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
        copied ? "bg-[#EAF3EC] text-[#A9862D] border-[#A9862D]" : "text-[#4B5850] border-[#DCD8CC] hover:border-[#A9862D]"
      }`}
    >
      {copied ? <CheckCheck size={13} /> : <Copy size={13} />}
      {copied ? "কপি হয়েছে" : "সাপ্লায়ারের জন্য কপি করুন"}
    </button>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [authed, setAuthed] = useState(null);
  const [tab, setTab] = useState("orders");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [editing, setEditing] = useState(null);
  const [orderFilter, setOrderFilter] = useState("all");
  const [customers, setCustomers] = useState([]);
  const [ads, setAds] = useState([]);
  const [editingAd, setEditingAd] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [editingCoupon, setEditingCoupon] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        const d = await res.json();

        if (cancelled) return;
        if (!d.authed) router.replace("/secret-manage-x7k2/login");
        else setAuthed(true);
      } catch {
        if (!cancelled) router.replace("/secret-manage-x7k2/login");
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const loadAll = async () => {
    try {
      const [productsRes, ordersRes, settingsRes, customersRes, adsRes, couponsRes] = await Promise.all([
        fetch("/api/products", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
        fetch("/api/settings", { cache: "no-store" }),
        fetch("/api/admin/customers", { cache: "no-store" }),
        fetch("/api/admin/ads", { cache: "no-store" }),
        fetch("/api/admin/coupons", { cache: "no-store" }),
      ]);

      const [productsData, ordersData, settingsData, customersData, adsData, couponsData] = await Promise.all([
        productsRes.json(),
        ordersRes.json(),
        settingsRes.json(),
        customersRes.json(),
        adsRes.json(),
        couponsRes.json(),
      ]);

      setProducts(productsData);
      setOrders(ordersData);
      setSettings(settingsData);
      setCustomers(customersData);
      setAds(adsData);
      setCoupons(couponsData);
    } catch (error) {
      console.error("Admin data load failed:", error);
    }
  };

  useEffect(() => {
    if (!authed) return;

    let cancelled = false;

    (async () => {
      if (!cancelled) await loadAll();
    })();

    return () => {
      cancelled = true;
    };
  }, [authed]);

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/");
  };

  const updateOrderStatus = async (id, status) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
    }
  };

  const updateOrderTracking = (updated) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const saveProduct = async (p) => {
    const method = p.id ? "PUT" : "POST";
    const url = p.id ? `/api/products/${p.id}` : "/api/products";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
    if (res.ok) {
      setEditing(null);
      loadAll();
    }
  };
  const deleteProduct = async (id) => {
    if (!confirm("এই প্রোডাক্টটি মুছে ফেলতে চান?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    loadAll();
  };
  const saveSettings = async (s) => {
    const res = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
    if (res.ok) setSettings(await res.json());
  };

  if (!authed || !settings) return <div className="min-h-screen bg-[#F3F4F1]" />;

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const shownOrders = orderFilter === "all" ? orders : orders.filter((o) => o.status === orderFilter);
  const sortedOrders = [...shownOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="min-h-screen bg-[#F3F4F1]">
      <header className="bg-[#16202A] text-white">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={34} cutoutColor="#16202A" />
            <div>
              <p className="font-display font-bold leading-none">{settings.shopName} · এডমিন</p>
              <p className="text-[11px] text-white/50 mt-0.5">দোকান পরিচালনা প্যানেল</p>
            </div>
          </div>
          <div className="flex gap-2">
            <a href="/" className="focus-ring text-xs sm:text-sm border border-white/20 px-3 py-1.5 rounded-full hover:bg-white/10 flex items-center gap-1">
              <Store size={14} /> <span className="hidden sm:inline">শপ দেখুন</span>
            </a>
            <button onClick={logout} className="focus-ring text-xs sm:text-sm border border-white/20 px-3 py-1.5 rounded-full hover:bg-white/10 flex items-center gap-1">
              <LogOut size={14} /> <span className="hidden sm:inline">লগআউট</span>
            </button>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 flex gap-1 text-sm">
          {[
            { k: "orders", label: "অর্ডারসমূহ", icon: ClipboardList, badge: pendingCount },
            { k: "customers", label: "গ্রাহক", icon: Users },
            { k: "products", label: "প্রোডাক্ট ম্যানেজ", icon: Package },
            { k: "ads", label: "বিজ্ঞাপন", icon: Megaphone },
            { k: "coupons", label: "কুপন", icon: Tag },
            { k: "settings", label: "সেটিংস", icon: ShieldCheck },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`focus-ring flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 transition-colors ${
                tab === t.k ? "border-[#F2A93B] text-white" : "border-transparent text-white/50 hover:text-white"
              }`}
            >
              <t.icon size={15} /> {t.label}
              {!!t.badge && <span className="bg-[#FF6B5C] text-white text-[10px] font-bold rounded-full px-1.5 font-num">{t.badge}</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === "orders" && (
          <div>
            <div className="flex items-center gap-2 overflow-x-auto pb-3">
              {["all", "pending", "processing", "shipped", "delivered", "cancelled"].map((s) => (
                <button
                  key={s}
                  onClick={() => setOrderFilter(s)}
                  className={`focus-ring shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border ${
                    orderFilter === s ? "bg-[#16202A] text-white border-[#16202A]" : "border-[#DCD8CC] text-[#4B5850]"
                  }`}
                >
                  {s === "all" ? "সব" : STATUS_META[s].label}
                </button>
              ))}
            </div>
            {sortedOrders.length === 0 ? (
              <div className="text-center py-16 text-[#8A8A78]">
                <ClipboardList size={36} className="mx-auto mb-3 opacity-40" />
                এখনো কোনো অর্ডার নেই।
              </div>
            ) : (
              <div className="space-y-3">
                {sortedOrders.map((o) => (
                  <div key={o.id} className="bg-white border border-[#E7E4DA] rounded-2xl p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-num font-bold">{o.id}</p>
                        <p className="text-xs text-[#8A8A78] font-num">{new Date(o.createdAt).toLocaleString("bn-BD")}</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: STATUS_META[o.status].color, background: STATUS_META[o.status].bg }}>
                        {STATUS_META[o.status].label}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3 mt-3 text-sm">
                      <div>
                        <p><b>{o.customerName}</b> · <span className="font-num">{o.phone}</span></p>
                        <p className="text-[#4B5850] mt-0.5">{o.address}</p>
                        {(o.district || o.thana) && <p className="text-[#4B5850] mt-0.5">📍 {o.district || ""}{o.thana ? ` · ${o.thana}` : ""}</p>}
                        {o.orderNotes && <p className="text-[#4B5850] mt-0.5">📝 {o.orderNotes}</p>}
                        <p className="mt-1 flex items-center gap-1.5">
                          <Truck size={13} className="text-[#A9862D]" />
                          {o.payment === "bkash" ? "বিকাশ" : o.payment === "nagad" ? "নগদ" : "ক্যাশ অন ডেলিভারি"}
                          {o.paymentTrxId && <span className="font-num text-xs bg-[#EFE8D6] text-[#4A3405] px-1.5 py-0.5 rounded">TrxID: {o.paymentTrxId}</span>}
                        </p>
                      </div>
                      <div className="bg-[#f2f0e9] rounded-xl p-2.5">
                        {o.items.map((it) => (
                          <div key={it.id} className="flex justify-between text-xs py-0.5">
                            <span>{it.name} × {it.qty}</span>
                            <span className="font-num">{money(it.price * it.qty)}</span>
                          </div>
                        ))}
                        {o.discount > 0 && (
                          <div className="flex justify-between text-xs py-0.5 text-[#3f7259]">
                            <span>কুপন {o.couponCode ? `(${o.couponCode})` : ""} ছাড়</span><span className="font-num">-{money(o.discount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-[#A9862D] text-sm pt-1 mt-1 border-t border-[#E7E4DA]">
                          <span>মোট</span><span className="font-num">{money(o.total)}</span>
                        </div>
                      </div>
                    </div>
                    <TrackingEditor order={o} onSaved={updateOrderTracking} />
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {Object.keys(STATUS_META).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateOrderStatus(o.id, s)}
                          className={`focus-ring text-xs font-semibold px-2.5 py-1 rounded-full border ${o.status === s ? "text-white" : "text-[#4B5850] border-[#DCD8CC]"}`}
                          style={o.status === s ? { background: STATUS_META[s].color, borderColor: STATUS_META[s].color } : {}}
                        >
                          {STATUS_META[s].label}
                        </button>
                      ))}
                      {o.items.map((it) => it.product?.supplierUrl ? (
                        <a key={it.id} href={it.product.supplierUrl} target="_blank" rel="noreferrer" className="focus-ring text-xs font-semibold px-2.5 py-1 rounded-full border border-[#DCD8CC] text-[#A9862D]">🔗 {it.name} Supplier</a>
                      ) : null)}
                      <CopyOrderButton order={o} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "customers" && (
          <div>
            <h2 className="font-display font-bold text-lg mb-3">নিবন্ধিত গ্রাহক ({customers.length})</h2>
            {customers.length === 0 ? (
              <div className="text-center py-16 text-[#8A8A78]">
                <Users size={36} className="mx-auto mb-3 opacity-40" />
                এখনো কোনো গ্রাহক অ্যাকাউন্ট তৈরি হয়নি।
              </div>
            ) : (
              <div className="space-y-2.5">
                {customers.map((c) => (
                  <div key={c.id} className="bg-white border border-[#E7E4DA] rounded-xl p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#1B2A22]">{c.name}</p>
                        {c.loyaltyCoins >= 500 && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#FBF3E9] text-[#8A5A11]">🎁 গিফট প্রাপ্য</span>
                        )}
                      </div>
                      <span className="text-xs text-[#8A8A78] font-num">{new Date(c.createdAt).toLocaleDateString("bn-BD")}</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-1 mt-1.5 text-sm text-[#4B5850]">
                      <p>📞 <span className="font-num">{c.phone}</span></p>
                      {c.email && <p>✉️ <span className="font-num">{c.email}</span></p>}
                      {c.address && <p className="sm:col-span-2">📍 {c.address}</p>}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-xs text-[#8A8A78]">মোট অর্ডার: <span className="font-num font-semibold text-[#A9862D]">{c._count?.orders ?? 0}</span></p>
                      <p className="text-xs text-[#8A8A78]">পয়েন্ট: <span className="font-num font-semibold text-[#3f7259]">{c.loyaltyCoins ?? 0}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "ads" && (
          <AdsPanel ads={ads} loadAll={loadAll} editingAd={editingAd} setEditingAd={setEditingAd} />
        )}

        {tab === "coupons" && (
          <CouponsPanel coupons={coupons} loadAll={loadAll} editingCoupon={editingCoupon} setEditingCoupon={setEditingCoupon} />
        )}

        {tab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-lg">প্রোডাক্ট তালিকা ({products.length})</h2>
              {editing !== "new" && (
                <button onClick={() => setEditing("new")} className="focus-ring bg-[#EFE8D6] text-[#4A3405] text-sm font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5">
                  <PlusCircle size={16} /> নতুন প্রোডাক্ট
                </button>
              )}
            </div>
            {editing === "new" && (
              <div className="mb-4">
                <ProductForm onSave={saveProduct} onCancel={() => setEditing(null)} />
              </div>
            )}
            <div className="space-y-2.5">
              {products.map((p) =>
                editing && editing.id === p.id ? (
                  <ProductForm key={p.id} initial={editing} onSave={saveProduct} onCancel={() => setEditing(null)} />
                ) : (
                  <div key={p.id} className="bg-white border border-[#E7E4DA] rounded-xl p-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl shrink-0 overflow-hidden" style={{ background: `${p.color}22` }}>
                      {p.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        p.emoji
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-xs text-[#8A8A78]">
                        {p.category} · <span className="font-num">{money(p.price)}</span> · স্টক: <span className="font-num">{p.stock}</span>
                        {p.costPrice != null && (
                          <> · লাভ: <span className="font-num text-[#3f7259] font-semibold">৳{p.price - p.costPrice}</span></>
                        )}
                        {p.supplierCode && <> · কোড: <span className="font-num">{p.supplierCode}</span></>}
                        {p.supplierUrl && <a href={p.supplierUrl} target="_blank" rel="noreferrer" className="ml-2 text-[#A9862D] underline" onClick={(e)=>e.stopPropagation()}>🔗 Supplier</a>}
                      </p>
                    </div>
                    <button onClick={() => setEditing(p)} className="focus-ring p-2 rounded-lg hover:bg-[#F2F1EB] text-[#4B5850]">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => deleteProduct(p.id)} className="focus-ring p-2 rounded-lg hover:bg-[#FBEEEF] text-[#C24D57]">
                      <Trash2 size={15} />
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {tab === "settings" && <SettingsForm settings={settings} products={products} onSave={saveSettings} />}
      </main>
    </div>
  );
}

function AdsPanel({ ads, loadAll, editingAd, setEditingAd }) {
  const saveAd = async (ad) => {
    const method = ad.id ? "PUT" : "POST";
    const url = ad.id ? `/api/admin/ads/${ad.id}` : "/api/admin/ads";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(ad) });
    if (res.ok) {
      setEditingAd(null);
      loadAll();
    }
  };
  const deleteAd = async (id) => {
    if (!confirm("এই বিজ্ঞাপনটি মুছে ফেলতে চান?")) return;
    await fetch(`/api/admin/ads/${id}`, { method: "DELETE" });
    loadAll();
  };
  const toggleActive = async (ad) => {
    await fetch(`/api/admin/ads/${ad.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ad, active: !ad.active }),
    });
    loadAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg">বিজ্ঞাপন / ব্যানার ({ads.length})</h2>
        {editingAd !== "new" && (
          <button onClick={() => setEditingAd("new")} className="focus-ring bg-[#EFE8D6] text-[#4A3405] text-sm font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5">
            <PlusCircle size={16} /> নতুন বিজ্ঞাপন
          </button>
        )}
      </div>
      <p className="text-xs text-[#8A8A78] mb-3">যোগ করা সক্রিয় বিজ্ঞাপনগুলো হোমপেজের একদম উপরে বড় স্লাইডশো ব্যানার হিসেবে দেখা যাবে (একাধিক থাকলে পাশাপাশি তীরচিহ্ন দিয়ে বদলানো যাবে)। ভালো দেখাতে ছবির মাপ প্রায় ১২০০×৪৮০ পিক্সেল (চওড়া) রাখুন।</p>
      {editingAd === "new" && <div className="mb-4"><AdForm onSave={saveAd} onCancel={() => setEditingAd(null)} /></div>}
      <div className="space-y-2.5">
        {ads.map((ad) =>
          editingAd && editingAd.id === ad.id ? (
            <AdForm key={ad.id} initial={editingAd} onSave={saveAd} onCancel={() => setEditingAd(null)} />
          ) : (
            <div key={ad.id} className="bg-white border border-[#E7E4DA] rounded-xl p-3 flex items-center gap-3">
              <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 bg-[#F2F1EB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" onError={(e) => (e.target.style.display = "none")} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{ad.title}</p>
                <p className="text-xs text-[#8A8A78]">{ad.link ? ad.link : "কোনো লিংক নেই"}</p>
              </div>
              <button
                onClick={() => toggleActive(ad)}
                className={`focus-ring text-xs font-semibold px-2.5 py-1 rounded-full border ${ad.active ? "bg-[#EAF3EC] text-[#3f7259] border-[#3f7259]" : "border-[#DCD8CC] text-[#8A8A78]"}`}
              >
                {ad.active ? "চালু" : "বন্ধ"}
              </button>
              <button onClick={() => setEditingAd(ad)} className="focus-ring p-2 rounded-lg hover:bg-[#F2F1EB] text-[#4B5850]">
                <Pencil size={15} />
              </button>
              <button onClick={() => deleteAd(ad.id)} className="focus-ring p-2 rounded-lg hover:bg-[#FBEEEF] text-[#C24D57]">
                <Trash2 size={15} />
              </button>
            </div>
          )
        )}
        {ads.length === 0 && editingAd !== "new" && (
          <div className="text-center py-12 text-[#8A8A78]">
            <Megaphone size={32} className="mx-auto mb-2 opacity-40" />
            এখনো কোনো বিজ্ঞাপন যোগ করা হয়নি।
          </div>
        )}
      </div>
    </div>
  );
}

function AdForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial || { title: "", imageUrl: "", link: "", active: true, sortOrder: 0 });
  return (
    <div className="bg-white border border-[#E7E4DA] rounded-2xl p-4 space-y-3 anim-slideUp">
      <div>
        <label className="text-xs font-semibold text-[#4B5850]">শিরোনাম</label>
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm" placeholder="যেমনঃ ঈদ স্পেশাল অফার" />
      </div>
      <div>
        <label className="text-xs font-semibold text-[#4B5850]">ব্যানার ছবির লিংক (imgbb.com থেকে আপলোড করে দিন)</label>
        <input value={f.imageUrl} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" placeholder="https://i.ibb.co/xxxxx/banner.jpg" />
        {f.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.imageUrl} alt="preview" className="mt-2 h-20 rounded-lg border border-[#E7E4DA] object-cover" onError={(e) => (e.target.style.display = "none")} />
        )}
      </div>
      <div>
        <label className="text-xs font-semibold text-[#4B5850]">লিংক (ক্লিক করলে কোথায় যাবে — ঐচ্ছিক)</label>
        <input value={f.link || ""} onChange={(e) => setF({ ...f, link: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" placeholder="/product/xxxx বা কোনো URL" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">ক্রম (ছোট সংখ্যা আগে দেখাবে)</label>
          <input type="number" value={f.sortOrder} onChange={(e) => setF({ ...f, sortOrder: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850] block mb-1">অবস্থা</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setF({ ...f, active: true })} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold border ${f.active !== false ? "bg-[#EAF3EC] text-[#3f7259] border-[#3f7259]" : "border-[#DCD8CC] text-[#4B5850]"}`}>চালু</button>
            <button type="button" onClick={() => setF({ ...f, active: false })} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold border ${f.active === false ? "bg-[#FBEEEF] text-[#C24D57] border-[#C24D57]" : "border-[#DCD8CC] text-[#4B5850]"}`}>বন্ধ</button>
          </div>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => {
            if (!f.imageUrl.trim()) return;
            onSave({ ...f, sortOrder: Number(f.sortOrder) || 0 });
          }}
          className="focus-ring bg-[#EFE8D6] text-[#4A3405] font-semibold px-4 py-2 rounded-lg text-sm"
        >
          সংরক্ষণ করুন
        </button>
        <button onClick={onCancel} className="focus-ring border border-[#DCD8CC] px-4 py-2 rounded-lg text-sm font-semibold text-[#4B5850]">বাতিল</button>
      </div>
    </div>
  );
}

function CouponsPanel({ coupons, loadAll, editingCoupon, setEditingCoupon }) {
  const saveCoupon = async (c) => {
    const method = c.id ? "PUT" : "POST";
    const url = c.id ? `/api/admin/coupons/${c.id}` : "/api/admin/coupons";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) });
    if (res.ok) {
      setEditingCoupon(null);
      loadAll();
      return true;
    }
    const data = await res.json().catch(() => ({}));
    return data.error || "কুপন সংরক্ষণ করা যায়নি";
  };
  const deleteCoupon = async (id) => {
    if (!confirm("এই কুপনটি মুছে ফেলতে চান?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    loadAll();
  };
  const toggleActive = async (c) => {
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, active: !c.active }),
    });
    loadAll();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-lg">কুপন / ডিসকাউন্ট কোড ({coupons.length})</h2>
        {editingCoupon !== "new" && (
          <button onClick={() => setEditingCoupon("new")} className="focus-ring bg-[#EFE8D6] text-[#4A3405] text-sm font-semibold px-3.5 py-2 rounded-lg flex items-center gap-1.5">
            <PlusCircle size={16} /> নতুন কুপন
          </button>
        )}
      </div>
      <p className="text-xs text-[#8A8A78] mb-3">তৈরি করা সক্রিয় কুপন কোড কাস্টমার চেকআউটে বসিয়ে ছাড় পাবেন।</p>
      {editingCoupon === "new" && <div className="mb-4"><CouponForm onSave={saveCoupon} onCancel={() => setEditingCoupon(null)} /></div>}
      <div className="space-y-2.5">
        {coupons.map((c) =>
          editingCoupon && editingCoupon.id === c.id ? (
            <CouponForm key={c.id} initial={editingCoupon} onSave={saveCoupon} onCancel={() => setEditingCoupon(null)} />
          ) : (
            <div key={c.id} className="bg-white border border-[#E7E4DA] rounded-xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FBF3E9] text-[#8A5A11] flex items-center justify-center shrink-0"><Tag size={18} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold font-num">{c.code}</p>
                <p className="text-xs text-[#8A8A78]">
                  {c.type === "percent" ? `${c.value}% ছাড়` : `৳${c.value} ছাড়`}
                  {c.minOrder > 0 && <> · সর্বনিম্ন ৳{c.minOrder}</>}
                  {c.maxDiscount != null && <> · সর্বোচ্চ ৳{c.maxDiscount}</>}
                  {c.usageLimit != null && <> · ব্যবহার {c.usedCount}/{c.usageLimit}</>}
                  {c.expiresAt && <> · মেয়াদ {new Date(c.expiresAt).toLocaleDateString("bn-BD")}</>}
                </p>
              </div>
              <button
                onClick={() => toggleActive(c)}
                className={`focus-ring text-xs font-semibold px-2.5 py-1 rounded-full border ${c.active ? "bg-[#EAF3EC] text-[#3f7259] border-[#3f7259]" : "border-[#DCD8CC] text-[#8A8A78]"}`}
              >
                {c.active ? "চালু" : "বন্ধ"}
              </button>
              <button onClick={() => setEditingCoupon(c)} className="focus-ring p-2 rounded-lg hover:bg-[#F2F1EB] text-[#4B5850]">
                <Pencil size={15} />
              </button>
              <button onClick={() => deleteCoupon(c.id)} className="focus-ring p-2 rounded-lg hover:bg-[#FBEEEF] text-[#C24D57]">
                <Trash2 size={15} />
              </button>
            </div>
          )
        )}
        {coupons.length === 0 && editingCoupon !== "new" && (
          <div className="text-center py-12 text-[#8A8A78]">
            <Tag size={32} className="mx-auto mb-2 opacity-40" />
            এখনো কোনো কুপন যোগ করা হয়নি।
          </div>
        )}
      </div>
    </div>
  );
}

function CouponForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(
    initial || { code: "", type: "percent", value: "", minOrder: "", maxDiscount: "", expiresAt: "", usageLimit: "", active: true }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!f.code.trim() || !f.value) { setError("কোড ও মান আবশ্যক"); return; }
    setSaving(true);
    setError("");
    const result = await onSave({
      ...f,
      code: f.code.trim().toUpperCase(),
      value: Number(f.value),
      minOrder: Number(f.minOrder) || 0,
      maxDiscount: f.maxDiscount !== "" ? Number(f.maxDiscount) : null,
      usageLimit: f.usageLimit !== "" ? Number(f.usageLimit) : null,
      expiresAt: f.expiresAt || null,
    });
    setSaving(false);
    if (result !== true) setError(result);
  };

  return (
    <div className="bg-white border border-[#E7E4DA] rounded-2xl p-4 space-y-3 anim-slideUp">
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">কুপন কোড</label>
          <input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} placeholder="যেমনঃ EID50" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num uppercase" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850] block mb-1">ধরন</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setF({ ...f, type: "percent" })} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold border ${f.type !== "fixed" ? "bg-[#EAF3EC] text-[#3f7259] border-[#3f7259]" : "border-[#DCD8CC] text-[#4B5850]"}`}>শতাংশ (%)</button>
            <button type="button" onClick={() => setF({ ...f, type: "fixed" })} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold border ${f.type === "fixed" ? "bg-[#EAF3EC] text-[#3f7259] border-[#3f7259]" : "border-[#DCD8CC] text-[#4B5850]"}`}>টাকা (৳)</button>
          </div>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">{f.type === "fixed" ? "ছাড়ের পরিমাণ (৳)" : "ছাড়ের হার (%)"}</label>
          <input type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" />
        </div>
        {f.type === "percent" && (
          <div>
            <label className="text-xs font-semibold text-[#4B5850]">সর্বোচ্চ ছাড় (৳, ঐচ্ছিক)</label>
            <input type="number" value={f.maxDiscount ?? ""} onChange={(e) => setF({ ...f, maxDiscount: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" placeholder="যেমনঃ 200" />
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">সর্বনিম্ন অর্ডার (৳)</label>
          <input type="number" value={f.minOrder ?? ""} onChange={(e) => setF({ ...f, minOrder: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" placeholder="0" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">ব্যবহারসীমা (ঐচ্ছিক)</label>
          <input type="number" value={f.usageLimit ?? ""} onChange={(e) => setF({ ...f, usageLimit: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" placeholder="যেমনঃ 100" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">মেয়াদ শেষ (ঐচ্ছিক)</label>
          <input type="date" value={f.expiresAt ? String(f.expiresAt).slice(0, 10) : ""} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850] block mb-1">অবস্থা</label>
          <div className="flex gap-2">
            <button type="button" onClick={() => setF({ ...f, active: true })} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold border ${f.active !== false ? "bg-[#EAF3EC] text-[#3f7259] border-[#3f7259]" : "border-[#DCD8CC] text-[#4B5850]"}`}>চালু</button>
            <button type="button" onClick={() => setF({ ...f, active: false })} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold border ${f.active === false ? "bg-[#FBEEEF] text-[#C24D57] border-[#C24D57]" : "border-[#DCD8CC] text-[#4B5850]"}`}>বন্ধ</button>
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-[#C24D57] bg-[#FBEEEF] rounded-lg px-3 py-2">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={submit} disabled={saving} className="focus-ring bg-[#EFE8D6] text-[#4A3405] font-semibold px-4 py-2 rounded-lg text-sm disabled:opacity-60">
          {saving ? "সংরক্ষণ হচ্ছে…" : "সংরক্ষণ করুন"}
        </button>
        <button onClick={onCancel} className="focus-ring border border-[#DCD8CC] px-4 py-2 rounded-lg text-sm font-semibold text-[#4B5850]">বাতিল</button>
      </div>
    </div>
  );
}

function ProductForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(
    initial || { name: "", category: CATEGORY_LIST[1], price: "", mrp: "", stock: "", emoji: "🛍️", color: "#EFE8D6", description: "", imageUrl: "", videoUrl: "", costPrice: "", supplierCode: "", supplierUrl: "", supplierPrice: "", specifications: "", variants: "", active: true }
  );
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [linkInput, setLinkInput] = useState(f.supplierUrl || "");

  const fetchFromLink = async () => {
    if (!linkInput.trim()) return;
    setFetching(true);
    setFetchError("");
    try {
      const res = await fetch("/api/admin/fetch-product-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: linkInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFetchError(data.error || "তথ্য আনা যায়নি");
      } else {
        setF((prev) => ({
          ...prev,
          name: data.name || prev.name,
          imageUrl: data.imageUrl || prev.imageUrl,
          supplierPrice: data.supplierPrice ?? data.price ?? prev.supplierPrice,
          mrp: data.price ?? prev.mrp,
          supplierCode: data.supplierCode || prev.supplierCode,
          supplierUrl: data.supplierUrl || prev.supplierUrl,
          supplierPrice: data.supplierPrice ?? prev.supplierPrice,
          specifications: data.specifications || prev.specifications,
          variants: data.variants || prev.variants,
          description: data.description || prev.description,
        }));
      }
    } catch (e) {
      setFetchError("সংযোগ সমস্যা হয়েছে, আবার চেষ্টা করুন");
    }
    setFetching(false);
  };

  const profit = f.price !== "" && f.costPrice !== "" && f.costPrice !== undefined && f.costPrice !== null
    ? Number(f.price) - Number(f.costPrice)
    : null;
  const margin = profit !== null && Number(f.price) > 0 ? Math.round((profit / Number(f.price)) * 100) : null;

  return (
    <div className="bg-white border border-[#E7E4DA] rounded-2xl p-4 space-y-3 anim-slideUp">
      <div className="bg-[#FBF3E9] border border-[#F0DCB8] rounded-xl p-3">
        <label className="text-xs font-semibold text-[#8A5A11]">Supplier Product Link দিন — দুইটি অনুমোদিত supplier site থেকে তথ্য আনার চেষ্টা করবে</label>
        <div className="flex gap-2 mt-1.5">
          <input
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            placeholder="https://dropgonj.com/product/... অথবা https://www.dropshipping.com.bd/product/..."
            className="focus-ring flex-1 border border-[#E0C68C] rounded-lg px-3 py-2 text-sm font-num"
          />
          <button
            onClick={fetchFromLink}
            disabled={fetching}
            className="focus-ring bg-[#E3B23C] text-[#4A3405] font-semibold px-3 py-2 rounded-lg text-sm whitespace-nowrap disabled:opacity-60"
          >
            {fetching ? "আনা হচ্ছে…" : "তথ্য আনুন"}
          </button>
        </div>
        {fetchError && <p className="text-xs text-[#C24D57] mt-1.5">{fetchError}</p>}
        {f.supplierCode && <p className="text-xs text-[#8A5A11] mt-1.5">সাপ্লায়ার কোড: <b className="font-num">{f.supplierCode}</b></p>}
        <p className="text-xs text-[#8A5A11] mt-1.5">এতে নাম, ছবি, বিবরণ ও একটা রেফারেন্স দাম আসবে — আসল পাইকারি দাম নিজে বসাতে হবে (নিচে)।</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">পণ্যের নাম</label>
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">ক্যাটাগরি</label>
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm">
            {CATEGORY_LIST.filter((c) => c !== "সব").map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">পাইকারি দাম / আপনার কেনা দাম (৳) — লগইন করে দেখুন</label>
          <input type="number" value={f.costPrice ?? ""} onChange={(e) => setF({ ...f, costPrice: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" placeholder="যেমনঃ 190" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">আপনার বিক্রয় মূল্য (৳)</label>
          <input type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">আসল মূল্য / MRP (কাটা দাম দেখাতে, ৳)</label>
          <input type="number" value={f.mrp} onChange={(e) => setF({ ...f, mrp: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">Supplier Price / Source Price (৳)</label>
          <input type="number" value={f.supplierPrice ?? ""} onChange={(e) => setF({ ...f, supplierPrice: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" placeholder="Auto-fill হলে দেখাবে" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">Supplier Product Link</label>
          <input value={f.supplierUrl || ""} onChange={(e) => setF({ ...f, supplierUrl: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">স্টক (পিস)</label>
          <input type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">আইকন (ইমোজি — ছবি না দিলে এটা দেখাবে)</label>
          <input value={f.emoji} onChange={(e) => setF({ ...f, emoji: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm" placeholder="🛍️" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-[#4B5850]">পণ্যের ছবির লিংক (উপরের বাটনে বসবে, বা imgbb.com থেকে নিজে দিন)</label>
          <input value={f.imageUrl || ""} onChange={(e) => setF({ ...f, imageUrl: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" placeholder="https://i.ibb.co/xxxxx/photo.jpg" />
          {f.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.imageUrl} alt="preview" className="mt-2 w-20 h-20 object-cover rounded-lg border border-[#E7E4DA]" onError={(e) => (e.target.style.display = "none")} />
          )}
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold text-[#4B5850]">প্রোডাক্ট ভিডিও লিংক (ফেসবুক পোস্ট/ভিডিওর লিংক — অপশনাল)</label>
          <input value={f.videoUrl || ""} onChange={(e) => setF({ ...f, videoUrl: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" placeholder="https://www.facebook.com/yourpage/videos/xxxxxxxx" />
          <p className="text-xs text-[#8A8A78] mt-1">এই লিংক দিলে কাস্টমার প্রোডাক্ট পেজে ঢুকলেই সরাসরি এই ফেসবুক ভিডিওটা দেখতে পাবে। ভিডিওটা পাবলিক পোস্ট হতে হবে (প্রাইভেট বা গ্রুপ-ওনলি হলে দেখাবে না)।</p>
        </div>
      </div>

      {profit !== null && (
        <div className={`rounded-xl p-3 text-sm font-semibold ${profit >= 0 ? "bg-[#EAF3EC] text-[#3f7259]" : "bg-[#FBEEEF] text-[#C24D57]"}`}>
          প্রতি পিসে লাভ: <span className="font-num">{profit >= 0 ? "৳" + profit : "-৳" + Math.abs(profit)}</span>
          {margin !== null && <span className="font-num"> ({margin}% মার্জিন)</span>}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">Specifications</label>
          <textarea value={f.specifications || ""} onChange={(e) => setF({ ...f, specifications: e.target.value })} rows={4} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm" placeholder="Auto-fetched specs..." />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">Variants</label>
          <textarea value={f.variants || ""} onChange={(e) => setF({ ...f, variants: e.target.value })} rows={4} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm" placeholder="Size, color, model..." />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#4B5850]">বিবরণ</label>
        <textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} rows={2} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm" />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => {
            if (!f.name.trim() || !f.price) return;
            onSave({
              ...f,
              price: Number(f.price),
              mrp: Number(f.mrp) || Number(f.price),
              stock: Number(f.stock) || 0,
              costPrice: f.costPrice !== "" && f.costPrice !== undefined && f.costPrice !== null ? Number(f.costPrice) : null,
              supplierPrice: f.supplierPrice !== "" && f.supplierPrice !== undefined && f.supplierPrice !== null ? Number(f.supplierPrice) : null,
              specifications: f.specifications || "",
              variants: f.variants || "",
              active: f.active !== false,
            });
          }}
          className="focus-ring bg-[#EFE8D6] text-[#4A3405] font-semibold px-4 py-2 rounded-lg text-sm"
        >
          সংরক্ষণ করুন
        </button>
        <button onClick={onCancel} className="focus-ring border border-[#DCD8CC] px-4 py-2 rounded-lg text-sm font-semibold text-[#4B5850]">
          বাতিল
        </button>
      </div>
    </div>
  );
}

function SettingsForm({ settings, products = [], onSave }) {
  const [f, setF] = useState({ ...settings, newPassword: "" });
  return (
    <div className="bg-white border border-[#E7E4DA] rounded-2xl p-5 max-w-xl space-y-4">
      <h2 className="font-display font-bold text-lg">দোকানের সেটিংস</h2>
      {[
        ["shopName", "দোকানের নাম"],
        ["deliveryTimeDhaka", "ঢাকায় ডেলিভারি সময়"],
        ["deliveryTimeOutside", "ঢাকার বাইরে ডেলিভারি সময়"],
        ["returnPolicy", "রিটার্ন পলিসি"],
      ].map(([key, label]) => (
        <div key={key}>
          <label className="text-xs font-semibold text-[#4B5850]">{label}</label>
          <input value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm" />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">ডেলিভারি চার্জ (৳)</label>
          <input type="number" value={f.deliveryCharge} onChange={(e) => setF({ ...f, deliveryCharge: Number(e.target.value) })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" />
        </div>
        <div>
          <label className="text-xs font-semibold text-[#4B5850]">ফ্রি ডেলিভারি (এর বেশি হলে, ৳)</label>
          <input type="number" value={f.freeDeliveryOver} onChange={(e) => setF({ ...f, freeDeliveryOver: Number(e.target.value) })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-semibold text-[#4B5850]">প্রতি ৳100-এ Coins</label><input type="number" value={f.coinsPer100 ?? 10} onChange={(e)=>setF({...f,coinsPer100:Number(e.target.value)})} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num"/></div>
        <div><label className="text-xs font-semibold text-[#4B5850]">Gift Coins</label><input type="number" value={f.giftCoinsRequired ?? 500} onChange={(e)=>setF({...f,giftCoinsRequired:Number(e.target.value)})} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num"/></div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#4B5850]">প্রোডাক্ট ভিডিও (Facebook ভিডিও/পোস্টের লিংক)</label>
        <input
          value={f.featuredVideoUrl || ""}
          onChange={(e) => setF({ ...f, featuredVideoUrl: e.target.value })}
          placeholder="https://www.facebook.com/.../videos/..."
          className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm"
        />
        <p className="text-xs text-[#8A8A78] mt-1">এখানে Facebook-এ পোস্ট করা প্রোডাক্টের ভিডিওর লিংক দিলে হোমপেজে সবার আগে দেখাবে। খালি রাখলে কিছু দেখাবে না।</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs font-semibold text-[#4B5850]">বিকাশ Personal নম্বর</label><input value={f.bkashNumber || ""} onChange={(e)=>setF({...f,bkashNumber:e.target.value})} placeholder="01XXXXXXXXX" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num"/></div>
        <div><label className="text-xs font-semibold text-[#4B5850]">নগদ Personal নম্বর</label><input value={f.nagadNumber || ""} onChange={(e)=>setF({...f,nagadNumber:e.target.value})} placeholder="01XXXXXXXXX" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm font-num"/></div>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#4B5850]">Facebook পেজ লিংক</label>
        <input value={f.facebookUrl || ""} onChange={(e)=>setF({...f,facebookUrl:e.target.value})} placeholder="https://facebook.com/yourpage" className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm"/>
        <p className="text-xs text-[#8A8A78] mt-1">দিলে ওয়েবসাইটের একদম নিচে (ফুটারে) Facebook পেজের লিংক দেখাবে। খালি রাখলে দেখাবে না।</p>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#4B5850]">Gift Product</label>
        <select value={f.giftProductId || ""} onChange={(e)=>setF({...f,giftProductId:e.target.value||null})} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm bg-white">
          <option value="">Gift Product নির্বাচন করুন</option>
          {products.filter(p=>p.active !== false).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <p className="text-xs text-[#8A8A78] mt-1">Gift Product selection-এর জন্য নিচের product list থেকে ID সেট করুন।</p>
      </div>
      <div>
        <label className="text-xs font-semibold text-[#4B5850]">নতুন এডমিন পাসওয়ার্ড (খালি রাখলে বদলাবে না)</label>
        <input type="password" value={f.newPassword} onChange={(e) => setF({ ...f, newPassword: e.target.value })} className="focus-ring w-full mt-1 border border-[#DCD8CC] rounded-lg px-3 py-2 text-sm" placeholder="কমপক্ষে ৪ অক্ষর" />
      </div>
      <button onClick={() => onSave(f)} className="focus-ring bg-[#EFE8D6] text-[#4A3405] font-semibold px-4 py-2.5 rounded-lg text-sm">
        সেটিংস সংরক্ষণ করুন
      </button>
    </div>
  );
}
