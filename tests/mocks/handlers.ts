import { http, HttpResponse } from "msw";

// Realistic CBU API response shape (slimmed to USD/EUR/RUB which our code uses)
export const CBU_FIXTURE = [
  {
    id: 68,
    Code: "840",
    Ccy: "USD",
    CcyNm_RU: "Доллар США",
    CcyNm_UZ: "AQSH dollari",
    CcyNm_UZC: "АҚШ доллари",
    CcyNm_EN: "US Dollar",
    Nominal: "1",
    Rate: "11997.83",
    Diff: "18.19",
    Date: "10.06.2026",
  },
  {
    id: 20,
    Code: "978",
    Ccy: "EUR",
    CcyNm_RU: "Евро",
    CcyNm_UZ: "EVRO",
    CcyNm_UZC: "ЕВРО",
    CcyNm_EN: "Euro",
    Nominal: "1",
    Rate: "13967.87",
    Diff: "66.7",
    Date: "10.06.2026",
  },
  {
    id: 56,
    Code: "643",
    Ccy: "RUB",
    CcyNm_RU: "Российский рубль",
    CcyNm_UZ: "Rossiya rubli",
    CcyNm_UZC: "Россия рубли",
    CcyNm_EN: "Russian Ruble",
    Nominal: "1",
    Rate: "167.31",
    Diff: "-0.21",
    Date: "10.06.2026",
  },
];

// Default handlers stub successful responses. Tests can override per-case
// via `server.use(http.get(...))` for failures, timeouts, malformed data.
export const defaultHandlers = [
  // CBU exchange rates
  http.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/", () =>
    HttpResponse.json(CBU_FIXTURE),
  ),

  // Telegram bot send-message (server action)
  http.post("https://api.telegram.org/*", () =>
    HttpResponse.json({ ok: true, result: { message_id: 1 } }),
  ),

  // Resend email API (server action)
  http.post("https://api.resend.com/emails", () =>
    HttpResponse.json({ id: "test-email-id" }),
  ),

  // Currency API fallback (no longer used but kept for safety)
  http.get("https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api/*", () =>
    HttpResponse.json({ usd: { uzs: 11997.83, eur: 0.8587, rub: 71.7 } }),
  ),
];
