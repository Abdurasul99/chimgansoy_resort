// Server-side proxy for Central Bank of Uzbekistan exchange rates.
// CBU publishes official daily rates at https://cbu.uz — this route caches them
// for 1 hour and exposes only USD/EUR/RUB to the client (the only currencies
// the converter UI supports apart from UZS).
//
// Why server-side: avoids CORS issues for browser → cbu.uz, and lets us cache
// the response across requests via Next.js fetch revalidation.
//
// CBU is occasionally unreachable. When that happens, we return a stub with
// reasonable defaults (sourced from the last hand-checked rates) so the widget
// degrades gracefully instead of returning 503 — the converter still renders
// and the user can convert at approximate values until CBU recovers.

export const revalidate = 3600; // 1 hour
export const runtime = "nodejs";

type CbuItem = {
  Ccy: string;
  Rate: string;
  Diff: string;
  Date: string;
  Nominal: string;
};

const FALLBACK = {
  usd_to_uzs: 11970.68,
  eur_to_uzs: 13902.75,
  rub_to_uzs: 163.18,
  usd_diff: 0,
  eur_diff: 0,
  rub_diff: 0,
  date: "fallback",
  source: "fallback",
};

export async function GET() {
  try {
    const res = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/", {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "ChimganDarbazaResort/1.0" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`cbu ${res.status}`);

    const data: CbuItem[] = await res.json();
    const find = (ccy: string) => data.find((d) => d.Ccy === ccy);

    const usd = find("USD");
    const eur = find("EUR");
    const rub = find("RUB");

    if (!usd || !eur || !rub) throw new Error("missing currencies in cbu response");

    // Some rare currencies use Nominal=10 (per 10 units), but USD/EUR/RUB are
    // always Nominal=1. Still divide defensively in case CBU ever changes it.
    const parseRate = (item: CbuItem) =>
      parseFloat(item.Rate) / parseFloat(item.Nominal || "1");

    return Response.json({
      usd_to_uzs: parseRate(usd),
      eur_to_uzs: parseRate(eur),
      rub_to_uzs: parseRate(rub),
      usd_diff: parseFloat(usd.Diff) || 0,
      eur_diff: parseFloat(eur.Diff) || 0,
      rub_diff: parseFloat(rub.Diff) || 0,
      date: usd.Date, // "26.05.2026"
      source: "CBU",
    });
  } catch (e) {
    console.warn(`[api/rates] CBU unreachable, serving fallback: ${String(e)}`);
    // Return 200 with fallback rates so the client can still render the converter.
    // The widget itself can show a "rates may be stale" hint if it sees source==="fallback".
    return Response.json(FALLBACK);
  }
}
