// Server-side proxy for Central Bank of Uzbekistan exchange rates.
// CBU publishes official daily rates at https://cbu.uz — this route caches them
// for 1 hour and exposes only USD/EUR/RUB to the client (the only currencies
// the converter UI supports apart from UZS).
//
// Why server-side: avoids CORS issues for browser → cbu.uz, and lets us cache
// the response across requests via Next.js fetch revalidation.

export const dynamic = "force-static";
export const revalidate = 3600; // 1 hour

type CbuItem = {
  Ccy: string;
  Rate: string;
  Diff: string;
  Date: string;
  Nominal: string;
};

export async function GET() {
  try {
    const res = await fetch("https://cbu.uz/uz/arkhiv-kursov-valyut/json/", {
      next: { revalidate: 3600 },
      headers: { "User-Agent": "ChimganDarbazaResort/1.0" },
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
    return Response.json(
      { error: "Failed to fetch CBU rates", detail: String(e) },
      { status: 503 },
    );
  }
}
