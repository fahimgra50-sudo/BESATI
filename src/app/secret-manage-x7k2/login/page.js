"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Logo from "@/components/Logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        const res = await fetch("/api/admin/me", { cache: "no-store" });
        const d = await res.json();

        if (cancelled) return;
        if (d.authed) router.replace("/secret-manage-x7k2/dashboard");
        else setChecking(false);
      } catch {
        if (!cancelled) setChecking(false);
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const submit = async () => {
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "পাসওয়ার্ড ভুল হয়েছে।");
      return;
    }
    router.push("/secret-manage-x7k2/dashboard");
  };

  if (checking) return <div className="min-h-screen bg-[#16202A]" />;

  return (
    <div className="min-h-screen bg-[#16202A] flex items-center justify-center p-4">
      <div className="bg-[#1E2A36] rounded-3xl p-7 w-full max-w-sm anim-popIn">
        <div className="mb-4">
          <Logo size={44} cutoutColor="#16202A" />
        </div>
        <h1 className="font-display font-bold text-xl text-white">এডমিন প্যানেল</h1>
        <p className="text-sm text-white/50 mt-1">শুধুমাত্র দোকান পরিচালনার জন্য</p>
        <input
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="পাসওয়ার্ড দিন"
          className="focus-ring w-full mt-5 bg-white/10 text-white rounded-xl px-3 py-2.5 text-sm outline-none border border-white/10"
        />
        {error && <p className="text-sm text-[#FF8A80] mt-2">{error}</p>}
        <button onClick={submit} className="focus-ring w-full mt-4 bg-[#F2A93B] text-[#16202A] font-bold py-2.5 rounded-xl">
          প্রবেশ করুন
        </button>
        <a href="/" className="focus-ring w-full mt-3 text-white/50 text-sm flex items-center justify-center gap-1">
          <ArrowLeft size={14} /> শপে ফিরে যান
        </a>
      </div>
    </div>
  );
}
