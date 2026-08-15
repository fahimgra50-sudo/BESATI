"use client";

import { ExternalLink, MapPin, PackageCheck, Truck } from "lucide-react";

export default function CustomerTrackingCard({ order }) {
  const hasTracking = Boolean(order?.trackingId || order?.trackingUrl);
  if (!hasTracking) {
    return (
      <div className="bg-[#f2f0e9] border border-[#E7E4DA] rounded-xl p-4">
        <p className="text-sm font-bold">🚚 Track Order</p>
        <p className="text-xs text-[#8A8A78] mt-1">আপনার অর্ডারের tracking information এখনো যোগ করা হয়নি।</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E7E4DA] rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold flex items-center gap-1.5"><Truck size={16}/> Track Order</p>
          <p className="text-xs text-[#8A8A78] mt-1">আপনার parcel tracking information</p>
        </div>
        <PackageCheck size={20} className="text-[#A9862D]"/>
      </div>

      {order.trackingId && (
        <div className="bg-[#f2f0e9] rounded-xl px-3 py-2.5">
          <p className="text-[11px] text-[#8A8A78]">Tracking ID</p>
          <p className="font-num font-bold text-sm mt-0.5 break-all">{order.trackingId}</p>
        </div>
      )}

      {order.currentLocation && (
        <div className="flex items-start gap-2 text-sm">
          <MapPin size={16} className="mt-0.5"/>
          <div><p className="text-[11px] text-[#8A8A78]">Current Location</p><p className="font-semibold">{order.currentLocation}</p></div>
        </div>
      )}

      {order.trackingUrl && (
        <a
          href={order.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-[#EFE8D6] text-[#4A3405] font-bold py-3 rounded-xl flex items-center justify-center gap-2"
        >
          <ExternalLink size={16}/> Track Your Parcel
        </a>
      )}
    </div>
  );
}
