"use client";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

export default function OrderSuccessPage() {
  const { id } = useParams();
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#f2f0e9] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center anim-popIn">
        <div className="w-16 h-16 rounded-full bg-[#EAF3EC] flex items-center justify-center mx-auto">
          <CheckCircle2 size={34} className="text-[#A9862D]" />
        </div>
        <h1 className="font-display font-bold text-xl mt-4">অর্ডার সম্পন্ন হয়েছে! 🎉</h1>
        <p className="text-sm text-[#4B5850] mt-2">
          আপনার অর্ডার স্বয়ংক্রিয়ভাবে দোকানের কাছে পাঠানো হয়েছে। যাচাই করে শীঘ্রই ডেলিভারি শুরু হবে।
        </p>
        <div className="bg-[#f2f0e9] rounded-xl p-3 mt-4 text-sm font-num">
          অর্ডার আইডি: <b className="text-[#A9862D]">{id}</b>
        </div>
        <p className="text-xs text-[#8A8A78] mt-2">এই আইডি সংরক্ষণ করুন — "আমার অর্ডার" পেজ থেকে স্ট্যাটাস দেখতে পারবেন।</p>
        <button onClick={() => router.push("/")} className="focus-ring mt-5 w-full bg-[#EFE8D6] text-[#4A3405] font-bold py-3 rounded-xl">
          শপিং চালিয়ে যান
        </button>
      </div>
    </div>
  );
}
