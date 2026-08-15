# বেসাতি (Besati) verification report

## Fixed
- React `useEffect(load, [])` cleanup bug in `LoyaltyCoinsCard`.
- Checkout District is a fixed Bangladesh dropdown.
- Thana/Upazila is searchable and selection-only.
- Server rejects invalid District + Thana/Upazila combinations.
- Bangladesh location dataset: 64 districts + 495 upazilas.
- Metropolitan thana options are included for Dhaka, Chattogram, Rajshahi and Khulna.
- Loyalty default: ৳100 = 10 Coins; 500 Coins = 1 Gift Product.
- Loyalty settings now persist correctly.
- Gift claim checks gift stock and deducts stock atomically.
- Customer wishlist no longer exposes supplier/cost fields.
- Customer-facing product APIs exclude supplier URL, supplier price and cost price.
- Admin order data includes supplier link/cost fields for supplier fulfillment.
- Public order tracking response is limited to tracking/order display fields.
- Supplier product import keeps the source price in Supplier Price/MRP instead of silently setting বেসাতি (Besati) Selling Price.

## Static checks performed
- All API/lib JavaScript files passed `node --check`.
- Internal `@/` imports were checked for missing targets.
- Location dataset count checked: 64 districts / 495 upazilas / 26 metropolitan thana options.
- Duplicate upazila names within a district were checked.
- The React cleanup anti-pattern that caused `TypeError: destroy is not a function` was checked and removed.

## Important
A full Next.js production build could not be run in this environment because the package registry available to the environment does not provide the Prisma packages. The project should be run locally with dependencies installed before deployment.
