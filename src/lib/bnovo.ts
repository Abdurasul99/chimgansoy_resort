type SearchParams = Record<string, string | string[] | undefined>;

export function getFirstSearchParam(searchParams: SearchParams | undefined, key: string) {
  const value = searchParams?.[key];
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

// Convert YYYY-MM-DD → DD-MM-YYYY (Bnovo date format)
function toBnovoDate(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

export function buildBnovoIframeUrl(baseUrl: string, searchParams?: SearchParams): string {
  const url = new URL(baseUrl);

  // Always set language if not already in base URL
  if (!url.searchParams.has("lang")) {
    url.searchParams.set("lang", "ru");
  }

  const checkin = getFirstSearchParam(searchParams, "checkin");
  const checkout = getFirstSearchParam(searchParams, "checkout");
  const guests = getFirstSearchParam(searchParams, "guests");
  const promo = getFirstSearchParam(searchParams, "promo");

  if (checkin) url.searchParams.set("dfrom", toBnovoDate(checkin));
  if (checkout) url.searchParams.set("dto", toBnovoDate(checkout));
  if (guests) url.searchParams.set("adults", guests);
  if (promo) url.searchParams.set("promoCode", promo);

  return url.toString();
}

// Direct booking page URL (without widget chrome)
export function buildBnovoBookingUrl(uid: string, searchParams?: SearchParams): string {
  return buildBnovoIframeUrl(
    `https://reservationsteps.ru/rooms/index/${uid}`,
    searchParams
  );
}

export type { SearchParams };
