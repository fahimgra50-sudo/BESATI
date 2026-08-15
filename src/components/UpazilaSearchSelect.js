"use client";

import { useMemo, useState } from "react";
import { Search, ChevronDown, Check, MapPin } from "lucide-react";
import { BD_METRO_THANAS } from "@/lib/bdLocations";

export default function UpazilaSearchSelect({ district, value, onChange, locations = {} }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options = useMemo(() => {
    const upazilas = (locations[district] || []).map(name => ({ name, type: "upazila" }));
    const thanas = (BD_METRO_THANAS[district] || []).map(name => ({ name, type: "thana" }));
    return [...upazilas, ...thanas];
  }, [district, locations]);

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("bn-BD");
    if (!q) return options;
    return options.filter(x => x.name.toLocaleLowerCase("bn-BD").includes(q));
  }, [options, query]);

  const select = (item) => {
    onChange(item.name);
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <label className="block text-sm font-semibold mb-1.5">Thana/Upazila</label>
      <button
        type="button"
        disabled={!district}
        onClick={() => setOpen(v => !v)}
        className="w-full border border-[#DCD8CC] rounded-xl px-3 py-3 bg-white text-left flex items-center justify-between disabled:bg-gray-100 disabled:text-gray-400"
      >
        <span>{value || (district ? "Search & select Thana/Upazila" : "Select District first")}</span>
        <ChevronDown size={18} />
      </button>

      {open && district && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E7E4DA] rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-[#E7E4DA] flex items-center gap-2">
            <Search size={17} className="text-gray-500 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Thana/Upazila search করুন..."
              className="w-full outline-none py-2"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length ? filtered.map(item => (
              <button
                key={`${item.type}-${item.name}`}
                type="button"
                onClick={() => select(item)}
                className="w-full px-3 py-2.5 text-left hover:bg-[#f2f0e9] flex items-center gap-2.5"
              >
                <MapPin size={15} className="text-[#A9862D] shrink-0" />
                <span className="flex-1">{item.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F2F1EB] text-[#6B6B5D]">
                  {item.type === "thana" ? "থানা" : "উপজেলা"}
                </span>
                {value === item.name && <Check size={17} className="text-[#A9862D]" />}
              </button>
            )) : (
              <p className="p-4 text-sm text-gray-500">কোনো মিল পাওয়া যায়নি। তালিকা থেকে একটি নির্বাচন করুন।</p>
            )}
          </div>
        </div>
      )}
      <p className="text-xs text-gray-500 mt-1">Search করে তালিকা থেকে একটি নির্বাচন করতে হবে; নিজের মতো লেখা গ্রহণ করা হবে না।</p>
    </div>
  );
}
