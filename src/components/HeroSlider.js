"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

// এডমিন প্যানেলে "বিজ্ঞাপন" ট্যাব থেকে আপলোড করা ব্যানার ছবিগুলো এখানে বড় আকারে স্লাইডশো হিসেবে দেখায় —
// বাম/ডান তীরচিহ্ন দিয়ে ম্যানুয়ালি বদলানো যায়, এবং কিছুক্ষণ পরপর নিজে থেকেও বদলায়
export default function HeroSlider({ ads }) {
  const [index, setIndex] = useState(0);
  const timerRef = useRef(null);

  const go = (i) => setIndex((i + ads.length) % ads.length);
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  useEffect(() => {
    if (ads.length <= 1) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % ads.length), 5000);
    return () => clearInterval(timerRef.current);
  }, [ads.length]);

  const restartAutoplay = () => {
    clearInterval(timerRef.current);
    if (ads.length > 1) timerRef.current = setInterval(() => setIndex((i) => (i + 1) % ads.length), 5000);
  };

  if (!ads.length) return null;
  const ad = ads[index];

  const Slide = (
    <div className="relative w-full h-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-transparent" />
      {ad.title && (
        <div className="absolute left-4 sm:left-10 bottom-6 sm:bottom-10 right-4 sm:right-auto">
          <p className="text-white font-display font-bold text-xl sm:text-3xl drop-shadow max-w-md">{ad.title}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative w-full h-56 sm:h-[420px] bg-[#16202A] overflow-hidden">
      {ad.link ? (
        <Link href={ad.link} className="focus-ring block w-full h-full">
          {Slide}
        </Link>
      ) : (
        Slide
      )}

      {ads.length > 1 && (
        <>
          <button
            onClick={() => { prev(); restartAutoplay(); }}
            aria-label="আগের ব্যানার"
            className="focus-ring absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md"
          >
            <ChevronLeft size={20} className="text-[#1B2A22]" />
          </button>
          <button
            onClick={() => { next(); restartAutoplay(); }}
            aria-label="পরের ব্যানার"
            className="focus-ring absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 hover:bg-white flex items-center justify-center shadow-md"
          >
            <ChevronRight size={20} className="text-[#1B2A22]" />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => { go(i); restartAutoplay(); }}
                aria-label={`স্লাইড ${i + 1}`}
                className={`focus-ring h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50 hover:bg-white/75"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
