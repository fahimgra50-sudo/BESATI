export default function Logo({ size = 36, cutoutColor = "#FFF6E4", ring = true }) {
  // "বেসাতি" (Besati) মানে পণ্য/মালপত্র — চিহ্নটি একটি বাঁধা গাঁটরি (পোটলা), যেভাবে
  // ঐতিহ্যবাহী বাংলা ব্যবসায়ীরা তাদের বিক্রয়যোগ্য পণ্য বহন করতেন।
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0" aria-hidden="true">
      <defs>
        <linearGradient id="bs-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#187467" />
          <stop offset="100%" stopColor="#0B3D37" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="10" fill="url(#bs-grad)" />
      {ring && <rect x="1.5" y="1.5" width="37" height="37" rx="9.5" fill="none" stroke="#E8A33D" strokeWidth="0.8" opacity="0.4" />}
      {/* গাঁটরি (bundle) */}
      <path d="M20 10.5 L23.5 13.5 L26 20 A6.4 6.4 0 1 1 14 20 L16.5 13.5 Z" fill={cutoutColor} />
      {/* গিঁট (knot) */}
      <circle cx="20" cy="10.8" r="1.9" fill="#E8A33D" />
      <circle cx="20" cy="10.8" r="0.95" fill="#C48122" />
      <path d="M18.6 9.6 L16.8 6.6" stroke="#E8A33D" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M21.4 9.6 L23.1 6.3" stroke="#E8A33D" strokeWidth="1.3" strokeLinecap="round" />
      {/* বিন্দু — পণ্যের বৈচিত্র্য */}
      <circle cx="9.5" cy="12.5" r="1.15" fill="#E8A33D" />
      <circle cx="31" cy="14" r="0.8" fill="#E8A33D" opacity="0.85" />
      <circle cx="30.5" cy="24" r="0.7" fill="#E8A33D" opacity="0.7" />
    </svg>
  );
}
