// src/app/admin/sync-products/page.js
//
// এই ফাইলটা GitHub-এ এই পাথে তৈরি করুন:
//   src/app/admin/sync-products/page.js
//
// এটা একটা বাটনওয়ালা পেজ — এখানে গিয়ে "সিঙ্ক শুরু করুন" বাটনে চাপ দিলে
// সাপ্লায়ারের সব প্রোডাক্ট এক পেজ এক পেজ করে অটোমেটিক আনতে থাকবে,
// আর নিচে লাইভ প্রগ্রেস দেখাবে। ব্রাউজার থেকে সরাসরি এই পেজে যাবেন:
//   https://besati.vercel.app/admin/sync-products

"use client";

import { useState } from "react";

const ADMIN_KEY = "sync123"; // এটা আপনার Vercel-এ বসানো SYNC_ADMIN_KEY-এর সাথে মিলতে হবে

export default function SyncProductsPage() {
  const [running, setRunning] = useState(false);
  const [log, setLog] = useState([]);
  const [totals, setTotals] = useState({ created: 0, updated: 0, skipped: 0 });
  const [status, setStatus] = useState("শুরু করতে বাটনে চাপ দিন");

  async function startSync() {
    setRunning(true);
    setLog([]);
    setTotals({ created: 0, updated: 0, skipped: 0 });
    setStatus("সিঙ্ক শুরু হয়েছে...");

    let page = 1;
    let hasMore = true;
    let sumCreated = 0;
    let sumUpdated = 0;
    let sumSkipped = 0;

    try {
      while (hasMore) {
        setStatus(`পেজ ${page} প্রসেস হচ্ছে...`);

        const res = await fetch(
          `/api/admin/sync-products?key=${encodeURIComponent(ADMIN_KEY)}&page=${page}`
        );
        const data = await res.json();

        if (!res.ok) {
          setLog((prev) => [
            ...prev,
            `❌ পেজ ${page} এ সমস্যা: ${data.error || "অজানা এরর"}`,
          ]);
          setStatus("একটা এরর হয়েছে, থেমে গেছে");
          setRunning(false);
          return;
        }

        sumCreated += data.created;
        sumUpdated += data.updated;
        sumSkipped += data.skipped;
        setTotals({ created: sumCreated, updated: sumUpdated, skipped: sumSkipped });

        setLog((prev) => [
          ...prev,
          `✅ পেজ ${data.page}/${data.lastPage} — নতুন: ${data.created}, আপডেট: ${data.updated}, স্কিপ: ${data.skipped}`,
        ]);

        hasMore = data.hasMore;
        page = data.nextPage;
      }

      setStatus("🎉 সব প্রোডাক্ট সিঙ্ক শেষ!");
    } catch (err) {
      setLog((prev) => [...prev, `❌ নেটওয়ার্ক এরর: ${err.message}`]);
      setStatus("একটা এরর হয়েছে, থেমে গেছে");
    }

    setRunning(false);
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>প্রোডাক্ট সিঙ্ক</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>
        সাপ্লায়ারের সব প্রোডাক্ট এক ক্লিকে আপনার ওয়েবসাইটে নিয়ে আসুন।
      </p>

      <button
        onClick={startSync}
        disabled={running}
        style={{
          padding: "12px 24px",
          fontSize: 16,
          borderRadius: 8,
          border: "none",
          background: running ? "#999" : "#B3122E",
          color: "#fff",
          cursor: running ? "not-allowed" : "pointer",
        }}
      >
        {running ? "সিঙ্ক হচ্ছে..." : "সিঙ্ক শুরু করুন"}
      </button>

      <p style={{ marginTop: 16, fontWeight: "bold" }}>{status}</p>

      {(totals.created > 0 || totals.updated > 0 || totals.skipped > 0) && (
        <p style={{ marginTop: 4 }}>
          মোট নতুন: {totals.created} | আপডেট: {totals.updated} | স্কিপ: {totals.skipped}
        </p>
      )}

      <div
        style={{
          marginTop: 20,
          background: "#f5f5f5",
          borderRadius: 8,
          padding: 12,
          maxHeight: 400,
          overflowY: "auto",
          fontSize: 14,
        }}
      >
        {log.length === 0 && <p style={{ color: "#999" }}>এখনো কোনো লগ নেই।</p>}
        {log.map((line, i) => (
          <div key={i} style={{ marginBottom: 4 }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}