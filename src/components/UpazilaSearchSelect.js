"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown, Check, MapPin } from "lucide-react";
import { BD_METRO_THANAS } from "@/lib/bdLocations";

export default function UpazilaSearchSelect({ district, value, onChange, locations = {} }) {
  const [open, setOpen] = useState(false);

  const options = useMemo(() => {
    const upazilas = (locations[district] || []).map(name => ({ name, type: "upazila" }));
    const thanas = (BD_METRO_THANAS[district] || []).map(name => ({ name, type: "thana" }));
    return [...upazilas, ...thanas];
  }, [district, locations]);

  const filtered = useMemo(() => {
    const q = (value || "").trim().toLocaleLowerCase("bn-BD");
    if (!q) return options;
    return options.filter(x => x.name.toLocaleLowerCase("bn-BD").includes(q));
  }, [options, value]);

  const select = (item) => {
    onChange(item.name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-semibold mb-1.5">Thana/Upazila</label>
      <div className="relative">
        <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 shrink-0" />
        <input
          type="text"
          disabled={!district}
          value={value || ""}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={district ? "থানা/উপজেলার নাম লিখুন" : "Select District first"}
          className="w-full border border-[#DCD8CC] rounded-xl pl-10 pr-9 py-3 bg-white disabled:bg-gray-100 disabled:text-gray-400"
        />
        <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>

      {open && district && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E7E4DA] rounded-xl shadow-xl overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {filtered.map(item => (
              <button
                key={`${item.type}-${item.name}`}
                type="button"
                onMouseDown={() => select(item)}
                className="w-full px-3 py-2.5 text-left hover:bg-[#f2f0e9] flex items-center gap-2.5"
              >
                <MapPin size={15} className="text-[#A9862D] shrink-0" />
                <span className="flex-1">{item.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F2F1EB] text-[#6B6B5D]">
                  {item.type === "thana" ? "থানা" : "উপজেলা"}
                </span>
                {value === item.name && <Check size={17} className="text-[#A9862D]" />}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-1">নিজে লিখুন অথবা তালিকা থেকে বেছে নিন — যেকোনোটাই গ্রহণযোগ্য।</p>
    </div>
  );
}
