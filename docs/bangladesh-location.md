# Bangladesh Location Selection

Checkout uses a fixed District → Thana/Upazila selection.
Customers cannot type arbitrary District or Thana/Upazila values.

Source basis: Bangladesh National Portal currently lists 8 divisions, 64 districts and 499 upazilas.
Backend validation should reject any district/upazila combination not present in `src/lib/bdLocations.js`.
