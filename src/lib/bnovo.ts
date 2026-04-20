type SearchParams = Record<string, string | string[] | undefined>;

export function getFirstSearchParam(searchParams: SearchParams | undefined, key: string) {
  const value = searchParams?.[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function buildBnovoIframeUrl(baseUrl: string, searchParams?: SearchParams) {
  const url = new URL(baseUrl);

  for (const key of ["checkin", "checkout", "guests", "promo"]) {
    const value = getFirstSearchParam(searchParams, key);

    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url.toString();
}

export type { SearchParams };
