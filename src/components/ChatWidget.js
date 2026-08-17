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

  // বাটনের position (null মানে ডিফল্ট bottom-5 right-5 জায়গায় থাকবে)
  const [pos, setPos] = useState(null);
  const dragRef = useRef({ dragging: false, moved: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });
  const btnRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const clampPos = (x, y) => {
    const w = btnRef.current?.offsetWidth || 150;
    const h = btnRef.current?.offsetHeight || 50;
    const maxX = window.innerWidth - w - 8;
    const maxY = window.innerHeight - h - 8;
    return { x: Math.min(Math.max(8, x), Math.max(8, maxX)), y: Math.min(Math.max(8, y), Math.max(8, maxY)) };
  };

  const onPointerDown = (e) => {
    const rect = btnRef.current.getBoundingClientRect();
    dragRef.current = {
      dragging: true,
      moved: false,
      startX: e.clientX,
      startY: e.clientY,
      baseX: rect.left,
      baseY: rect.top,
    };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragRef.current.moved = true;
    const next = clampPos(dragRef.current.baseX + dx, dragRef.current.baseY + dy);
    setPos(next);
  };

  const onPointerUp = () => {
    dragRef.current.dragging = false;
  };

  const handleButtonClick = () => {
    // টেনে সরানোর পরে ক্লিক ইভেন্ট যেন চ্যাট না খুলে ফেলে
    if (dragRef.current.moved) {
      dragRef.current.moved = false;
      return;
    }
    setOpen(true);
  };

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
          ref={btnRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={handleButtonClick}
          style={
            pos
              ? { position: "fixed", left: pos.x, top: pos.y, right: "auto", bottom: "auto", touchAction: "none" }
              : { touchAction: "none" }
          }
          className={`focus-ring ${!pos ? "fixed bottom-5 right-5" : ""} z-30 bg-[#EFE8D6] text-[#4A3405] rounded-full pl-4 pr-5 py-3.5 shadow-xl flex items-center gap-2 hover:bg-[#E5DCC3] select-none cursor-grab active:cursor-grabbing`}
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
