"use client";
import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Sparkles } from "lucide-react";

export default function ChatWidget({ shopName }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: `আসসালামু আলাইকুম! আমি ${shopName || "শপ"}-এর স্মার্ট দোকানি 🙂 পণ্য, ডেলিভারি বা পেমেন্ট নিয়ে প্রশ্ন করতে পারেন।` },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: next.slice(0, -1) }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "দুঃখিত, উত্তর দিতে পারছি না।" }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", content: "দুঃখিত, একটু সমস্যা হয়েছে। আবার চেষ্টা করুন।" }]);
    }
    setLoading(false);
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="focus-ring fixed bottom-5 right-5 z-30 bg-[#EFE8D6] text-[#4A3405] rounded-full pl-4 pr-5 py-3.5 shadow-xl flex items-center gap-2 hover:bg-[#E5DCC3]"
        >
          <MessageCircle size={20} />
          <span className="font-semibold text-sm">স্মার্ট দোকানি</span>
        </button>
      )}
      {open && (
        <div className="fixed bottom-5 right-5 z-40 w-[92vw] max-w-sm h-[70vh] bg-white rounded-3xl shadow-2xl border border-[#E7E4DA] flex flex-col anim-slideUp">
          <div className="bg-[#EFE8D6] text-[#4A3405] p-4 rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-[#F2A93B]" />
              <div>
                <p className="font-display font-bold text-sm leading-none">স্মার্ট দোকানি</p>
                <p className="text-[11px] text-white/70">সাথে সাথেই উত্তর দেয়</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="focus-ring p-1 rounded-full hover:bg-white/10">
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl whitespace-pre-wrap ${
                    m.role === "user" ? "bg-[#F2A93B] text-[#1B2A22] rounded-br-sm" : "bg-[#F2F1EB] text-[#1B2A22] rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#F2F1EB] px-3 py-2 rounded-2xl rounded-bl-sm text-[#8A8A78]">লিখছে…</div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-[#E7E4DA] flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="প্রশ্ন লিখুন…"
              className="focus-ring flex-1 border border-[#DCD8CC] rounded-xl px-3 py-2 text-sm"
            />
            <button onClick={send} disabled={loading} className="focus-ring bg-[#EFE8D6] text-[#4A3405] p-2.5 rounded-xl disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
