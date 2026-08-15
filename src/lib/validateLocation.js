import { BD_LOCATIONS, BD_DISTRICTS, BD_METRO_THANAS } from "@/lib/bdLocations";

export function isValidBangladeshLocation(district, thana) {
  if (!district || !thana || !BD_DISTRICTS.includes(district)) return false;
  const upazilas = BD_LOCATIONS[district] || [];
  const metroThanas = BD_METRO_THANAS[district] || [];
  return upazilas.includes(thana) || metroThanas.includes(thana);
}
