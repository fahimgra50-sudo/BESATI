"use client";

import { useState } from "react";

const ADMIN_KEY = "sync123";

export default function BulkDeletePage() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function handlePreview() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/delete-range", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: ADMIN_KEY, start, end, confirm: false }),
    });
    const data = await res.json();
    setPreview(data);
    setLoading(false);
  }

  async function handleDelete() {
    if (!window.confirm(`আপনি কি নিশ্চিত? এতে ${preview.count}টা প্রোডাক্ট স্থায়ীভাবে ডিলিট হয়ে যাবে!`)) return;
    setLoading(true);
    const res = await fetch("/api/admin/delete-range", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: ADMIN_KEY, start, end, confirm: true }),
    });
    const data = await res.json();
    setResult(data);
    setPreview(null);
    setLoading(false);
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>বাল্ক ডিলিট (রেঞ্জ অনুযায়ী)</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>
        প্রোডাক্ট তালিকার ক্রমিক অবস্থান অনুযায়ী একসাথে অনেক প্রোডাক্ট ডিলিট করুন।
      </p>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <input
          type="number"
          placeholder="শুরু (যেমন 12)"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          style={{ padding: 10, flex: 1 }}
        />
        <input
          type="number"
          placeholder="শেষ (যেমন 2457)"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          style={{ padding: 10, flex: 1 }}
        />
      </div>

      <button onClick={handlePreview} disabled={loading || !start || !end} style={{ padding: "10px 20px", marginRight: 10 }}>
        প্রিভিউ দেখুন
      </button>

      {preview && (
        <div style={{ marginTop: 20, background: "#fff3f3", padding: 16, borderRadius: 8 }}>
          <p><strong>মোট {preview.count}টা প্রোডাক্ট ডিলিট হবে</strong></p>
          <p style={{ fontSize: 13, color: "#555" }}>প্রথম কয়েকটা: {preview.firstFew?.join(", ")}</p>
          <p style={{ fontSize: 13, color: "#555" }}>শেষ কয়েকটা: {preview.lastFew?.join(", ")}</p>
          <button onClick={handleDelete} disabled={loading} style={{ padding: "10px 20px", background: "#B3122E", color: "#fff", border: "none", marginTop: 10 }}>
            {loading ? "ডিলিট হচ্ছে..." : "নিশ্চিত — ডিলিট করুন"}
          </button>
        </div>
      )}

      {result && (
        <div style={{ marginTop: 20, background: "#f0f9f0", padding: 16, borderRadius: 8 }}>
          <p>✅ {result.deletedCount}টা প্রোডাক্ট ডিলিট হয়েছে</p>
        </div>
      )}
    </div>
  );
  }
