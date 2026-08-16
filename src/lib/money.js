export function money(n) {
  return "৳" + Number(n || 0).toLocaleString("en-BD");
}

export const STATUS_META = {
  pending: { label: "নতুন অর্ডার", color: "#B7791F", bg: "#FEF3E2" },
  processing: { label: "প্রসেসিং হচ্ছে", color: "#1D4ED8", bg: "#E8EEFE" },
  shipped: { label: "ডেলিভারিতে আছে", color: "#7C3AED", bg: "#F1E9FE" },
  delivered: { label: "ডেলিভারি সম্পন্ন", color: "#A9862D", bg: "#EAF3EC" },
  cancelled: { label: "বাতিল হয়েছে", color: "#C24D57", bg: "#FBEEEF" },
};

export const CATEGORY_LIST = ["সব", "Mobile Accessories", "Electronics", "Fashion", "Beauty", "Home & Living", "Kitchen & Dining", "Shoes & Bags", "Watches", "Jewelry & Accessories", "Kids & Toys", "Sports & Fitness", "Books & Stationery"];
