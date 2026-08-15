// কুপন যাচাই ও ছাড় হিসাবের কমন লজিক — checkout preview ও অর্ডার বসানোর সময় দুই জায়গাতেই ব্যবহার হয়
export function computeCouponDiscount(coupon, subtotal) {
  if (!coupon) return { error: "কুপন কোডটি সঠিক নয়" };
  if (!coupon.active) return { error: "এই কুপনটি এখন সক্রিয় নেই" };
  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) return { error: "এই কুপনের মেয়াদ শেষ হয়ে গেছে" };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return { error: "এই কুপনের ব্যবহারসীমা শেষ হয়ে গেছে" };
  if (subtotal < coupon.minOrder) return { error: `এই কুপন ব্যবহার করতে কমপক্ষে ৳${coupon.minOrder} এর অর্ডার লাগবে` };

  let discount = coupon.type === "fixed" ? coupon.value : Math.round((subtotal * coupon.value) / 100);
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { discount };
}
