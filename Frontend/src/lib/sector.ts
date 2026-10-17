export type Sector = {
  name: string;
  lat: number;
  lon: number;
  /** true when the address could not be matched and a default sector was used */
  approximate: boolean;
};

type City = { keys: string[]; name: string; lat: number; lon: number };

// Lightweight offline lookup so the radar lock works without a network call.
// TODO: swap resolveSector() for a real geocoder (e.g. the ClimateGuard FastAPI backend).
const CITIES: City[] = [
  {
    keys: ["noida", "delhi", "ncr", "gurgaon", "gurugram", "ghaziabad", "faridabad"],
    name: "Delhi NCR",
    lat: 28.61,
    lon: 77.21,
  },
  {
    keys: ["mumbai", "bombay", "thane", "navi mumbai"],
    name: "Mumbai Sector",
    lat: 19.08,
    lon: 72.88,
  },
  { keys: ["bengaluru", "bangalore"], name: "Bengaluru Sector", lat: 12.97, lon: 77.59 },
  { keys: ["hyderabad"], name: "Hyderabad Sector", lat: 17.39, lon: 78.49 },
  { keys: ["chennai"], name: "Chennai Sector", lat: 13.08, lon: 80.27 },
  { keys: ["kolkata", "calcutta"], name: "Kolkata Sector", lat: 22.57, lon: 88.36 },
  { keys: ["pune"], name: "Pune Sector", lat: 18.52, lon: 73.86 },
  { keys: ["jaipur"], name: "Jaipur Sector", lat: 26.91, lon: 75.79 },
  { keys: ["lucknow"], name: "Lucknow Sector", lat: 26.85, lon: 80.95 },
  { keys: ["tokyo"], name: "Tokyo Sector", lat: 35.68, lon: 139.69 },
  { keys: ["singapore"], name: "Singapore Sector", lat: 1.35, lon: 103.82 },
  { keys: ["dubai"], name: "Dubai Sector", lat: 25.2, lon: 55.27 },
  { keys: ["london"], name: "London Sector", lat: 51.51, lon: -0.13 },
  { keys: ["paris"], name: "Paris Sector", lat: 48.86, lon: 2.35 },
  { keys: ["berlin"], name: "Berlin Sector", lat: 52.52, lon: 13.4 },
  { keys: ["new york", "nyc", "manhattan"], name: "New York Sector", lat: 40.71, lon: -74.01 },
  { keys: ["san francisco", "bay area"], name: "Bay Area Sector", lat: 37.77, lon: -122.42 },
  { keys: ["sydney"], name: "Sydney Sector", lat: -33.87, lon: 151.21 },
  { keys: ["sao paulo", "são paulo"], name: "São Paulo Sector", lat: -23.55, lon: -46.63 },
  { keys: ["lagos"], name: "Lagos Sector", lat: 6.52, lon: 3.38 },
  { keys: ["cairo"], name: "Cairo Sector", lat: 30.04, lon: 31.24 },
];

const FALLBACK: Sector = { name: "Delhi NCR", lat: 28.61, lon: 77.21, approximate: true };

export async function resolveSector(address: string): Promise<Sector> {
  const text = address.toLowerCase();
  const hit = CITIES.find((city) => city.keys.some((key) => text.includes(key)));
  return hit ? { name: hit.name, lat: hit.lat, lon: hit.lon, approximate: false } : FALLBACK;
}

export const fmtLat = (lat: number, digits = 3) =>
  `${Math.abs(lat).toFixed(digits)}° ${lat >= 0 ? "N" : "S"}`;
export const fmtLon = (lon: number, digits = 3) =>
  `${Math.abs(lon).toFixed(digits)}° ${lon >= 0 ? "E" : "W"}`;
