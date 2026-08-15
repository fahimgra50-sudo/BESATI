"use client";
import { useEffect, useState } from "react";
import { Star, ShieldCheck, Trash2 } from "lucide-react";

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="focus-ring" aria-label={`${n} স্টার`}>
          <Star size={22} className={n <= value ? "fill-[#F2A93B] text-[#F2A93B]" : "text-[#DCD8CC]"} />
        </button>
      ))}
    </div>
  );
}

export default function ReviewsSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    const [reviewsRes, meRes] = await Promise.all([
      fetch(`/api/products/${productId}/reviews`),
      fetch("/api/customer/me"),
    ]);
    setReviews(reviewsRes.ok ? await reviewsRes.json() : []);
    const me = meRes.ok ? await meRes.json() : { authed: false };
    setAuthed(!!me.authed);
    if (me.authed) {
      const mine = await fetch(`/api/customer/reviews?productId=${productId}`);
      if (mine.ok) {
        const data = await mine.json();
        if (data) {
          setMyReview(data);
          setRating(data.rating);
          setComment(data.comment || "");
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/customer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "রিভিউ সংরক্ষণ করা যায়নি");
      } else {
        await load();
      }
    } catch {
      setError("সংযোগ সমস্যা হয়েছে, আবার চেষ্টা করুন।");
    }
    setSubmitting(false);
  };

  const remove = async () => {
    if (!confirm("আপনার রিভিউটি মুছে ফেলতে চান?")) return;
    await fetch(`/api/customer/reviews?productId=${productId}`, { method: "DELETE" });
    setMyReview(null);
    setRating(5);
    setComment("");
    await load();
  };

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-8 mt-4">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="font-display font-bold text-lg text-[#1B2A22]">রিভিউ ও রেটিং</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5 text-sm">
            <Star size={16} className="fill-[#F2A93B] text-[#F2A93B]" />
            <span className="font-num font-bold">{avg.toFixed(1)}</span>
            <span className="text-[#8A8A78] font-num">({reviews.length} রিভিউ)</span>
          </div>
        )}
      </div>

      {authed ? (
        <div className="bg-[#f2f0e9] rounded-2xl p-4 mb-5">
          <p className="text-sm font-semibold mb-2">{myReview ? "আপনার রিভিউ সম্পাদনা করুন" : "একটি রিভিউ দিন"}</p>
          <StarPicker value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="পণ্যটি সম্পর্কে আপনার মতামত লিখুন…"
            className="focus-ring w-full mt-3 border border-[#DCD8CC] rounded-xl px-3 py-2.5 text-sm resize-none bg-white"
          />
          {error && <p className="text-xs text-[#C24D57] mt-2">{error}</p>}
          <div className="flex gap-2 mt-3">
            <button onClick={submit} disabled={submitting} className="focus-ring bg-[#EFE8D6] text-[#4A3405] text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-60">
              {submitting ? "সংরক্ষণ হচ্ছে…" : myReview ? "আপডেট করুন" : "রিভিউ জমা দিন"}
            </button>
            {myReview && (
              <button onClick={remove} className="focus-ring flex items-center gap-1 text-[#C24D57] text-sm font-semibold px-3 py-2 rounded-lg hover:bg-[#FBEEEF]">
                <Trash2 size={14} /> মুছুন
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-[#8A8A78] bg-[#f2f0e9] rounded-2xl p-4 mb-5">রিভিউ দিতে অ্যাকাউন্টে লগইন করুন (চেকআউট থেকে করা যাবে)।</p>
      )}

      {loading ? (
        <p className="text-sm text-[#8A8A78]">লোড হচ্ছে…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-[#8A8A78]">এখনো কোনো রিভিউ নেই — প্রথম রিভিউটি আপনি দিন।</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="border-t border-[#EDEBE2] pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{r.customerName}</p>
                {r.verified && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EAF3EC] text-[#3f7259]">
                    <ShieldCheck size={11} /> ভেরিফাইড ক্রেতা
                  </span>
                )}
                <span className="text-[11px] text-[#A6A297] font-num">{new Date(r.createdAt).toLocaleDateString("bn-BD")}</span>
              </div>
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={13} className={n <= r.rating ? "fill-[#F2A93B] text-[#F2A93B]" : "text-[#DCD8CC]"} />
                ))}
              </div>
              {r.comment && <p className="text-sm text-[#4B5850] mt-1.5 leading-relaxed">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
