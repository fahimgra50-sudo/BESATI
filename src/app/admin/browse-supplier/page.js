"use client";

import { useState, useEffect } from "react";

const ADMIN_KEY = "sync123";

export default function BrowseSupplierPage() {
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState([]);
  const [lastPage, setLastPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    loadPage(page);
  }, [page]);

  async function loadPage(p) {
    setLoading(true);
    const res = await fetch(`/api/admin/browse-supplier?key=${ADMIN_KEY}&page=${p}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLastPage(data.lastPage || 1);
    setLoading(false);
  }

  function toggle(code) {
    const next = new Set(selected);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelected(next);
  }

  async function addSelected() {
    if (selected.size === 0) return;
    if (!window.confirm(`${selected.size}টা প্রোডাক্ট যোগ করবেন?`)) return;
    setStatus("যোগ করা হচ্ছে...");
    const res = await fetch("/api/admin/add-selected-products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: ADMIN_KEY, supplierCodes: [...selected] }),
    });
    const data = await res.json();
    setStatus(`✅ ${data.created}টা যোগ হয়েছে, স্কিপ: ${data.skipped}`);
    setSelected(new Set());
  }

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1>সাপ্লায়ার প্রোডাক্ট ব্রাউজ করুন</h1>
      <p>বাছাই করা: {selected.size}টা</p>
      <button onClick={addSelected} disabled={selected.size === 0} style={{ padding: "10px 20px", background: "#B3122E", color: "#fff", border: "none", marginBottom: 16 }}>
        বেছে নেওয়া প্রোডাক্ট যোগ করুন
      </button>
      {status && <p>{status}</p>}

      {loading ? <p>লোড হচ্ছে...</p> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
          {products.map((p) => (
            <div key={p.supplierCode} style={{ border: "1px solid #ddd", padding: 8, borderRadius: 8 }}>
              <input type="checkbox" checked={selected.has(p.supplierCode)} onChange={() => toggle(p.supplierCode)} />
              {p.thumbnail && <img src={p.thumbnail} alt={p.name} style={{ width: "100%", height: 100, objectFit: "cover" }} />}
              <p style={{ fontSize: 12 }}>{p.name}</p>
              <p style={{ fontSize: 12, color: "#555" }}>বিক্রয়: ৳{p.salePrice} | পাইকারি: ৳{p.costPrice}</p>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>আগের পেজ</button>
        <span style={{ margin: "0 12px" }}>পেজ {page} / {lastPage}</span>
        <button onClick={() => setPage((p) => Math.min(lastPage, p + 1))} disabled={page >= lastPage}>পরের পেজ</button>
      </div>
    </div>
  );
          }
