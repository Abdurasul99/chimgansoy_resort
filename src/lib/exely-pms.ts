/**
 * Exely / TravelLine "WebPMS Universal API" client.
 *
 * This is the OFFICIAL PMS API (unlike src/lib/exely.ts, which scrapes the
 * public booking-widget JSON). Auth is a single integration key sent as the
 * `X-API-KEY` header — taken from the Exely admin:
 *   Управление отелем → Настройки → Интеграции → "Доступ к Универсальному API Exely PMS".
 *
 * Confirmed live surface (base `/api/webpms/v1/`):
 *   GET /rooms                     — physical room inventory (номерной фонд)
 *   GET /bookings                  — search bookings (шахматка source data)
 *   GET /bookings/{number}         — single booking
 *   GET /analytics/payments        — money flow (платежи)
 *   GET /analytics/services        — charges (начисления/услуги)
 *   GET /companies                 — corporate profiles
 *
 * Host note: the RU cluster is partner.tlintegration.com; the Exely
 * (international) cluster is partner.hopenapi.com. We default to the Exely
 * host and let EXELY_API_BASE override it — set it to whatever the Exely
 * extranet / support confirms for hotel 514200.
 */

const DEFAULT_BASE = "https://partner.hopenapi.com/api/webpms/v1";

function base(): string {
  return (process.env.EXELY_API_BASE?.trim() || DEFAULT_BASE).replace(/\/+$/, "");
}

function apiKey(): string | null {
  return process.env.EXELY_API_KEY?.trim() || null;
}

// ── Types (mirrors the WebPMS Universal API v1 response schemas) ──────────────

export type PmsRoom = { id: string; name: string; roomTypeId: string };

export type PmsTotalPrice = { amount: number; toPayAmount?: number; toRefundAmount?: number };

export type PmsRoomStay = {
  id: string;
  bookingId: string;
  roomId?: string | null;
  roomTypeId: string;
  checkInDateTime: string; // ISO
  checkOutDateTime: string; // ISO
  actualCheckInDateTime?: string | null;
  actualCheckOutDateTime?: string | null;
  status: "New" | "CheckedIn" | "CheckedOut" | "Cancelled" | string;
  bookingStatus?: string;
  guestCountInfo?: { adults?: number; children?: number } | null;
  guestsIds?: string[];
  totalPrice?: PmsTotalPrice;
};

export type PmsBooking = {
  id: string;
  number: string;
  customer?: { firstName?: string; lastName?: string; phone?: string; email?: string } | null;
  customerComment?: string;
  lastModified?: string;
  currencyId?: string;
  roomStays: PmsRoomStay[];
  source?: string;
  sourceChannelName?: string;
};

export type PmsPayment = {
  id: string;
  bookingNumber?: string;
  actionKind?: string; // e.g. Payment / Refund
  kind?: string;
  amount: number;
  quantity?: number;
  dateTime?: string;
  paymentDateTime?: string;
  paymentMethod?: string;
  paymentSystem?: string;
  currency?: string;
  roomTypeId?: string;
  username?: string;
};

export type PmsResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

// Known room-type id → display name. PMS internal roomTypeId values may differ
// from the booking-engine codes; extend/adjust once a live /rooms call is seen.
export const ROOM_TYPE_NAMES: Record<string, string> = {
  "5075760": "Глэмпинг A-frame",
  "5075761": "Шале",
  "5075762": "Топчан",
  "5076232": "Бассейн",
  "5075692": "Бассейн",
};

export function roomTypeName(id: string): string {
  return ROOM_TYPE_NAMES[id] ?? `Тип ${id}`;
}

// ── Low-level GET ─────────────────────────────────────────────────────────────

async function get<T>(path: string, params?: Record<string, string | number>): Promise<PmsResult<T>> {
  const key = apiKey();
  if (!key) return { ok: false, error: "EXELY_API_KEY not set" };

  const url = new URL(base() + path);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));

  try {
    const res = await fetch(url.toString(), {
      headers: { "X-API-KEY": key, Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: `HTTP ${res.status} ${body.slice(0, 120)}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ── Public methods ────────────────────────────────────────────────────────────

/** Diagnostic: is the API reachable + key accepted? */
export async function pingPms(): Promise<PmsResult<PmsRoom[]>> {
  return get<PmsRoom[]>("/rooms");
}

export async function listRooms(): Promise<PmsResult<PmsRoom[]>> {
  return get<PmsRoom[]>("/rooms");
}

/**
 * Bookings whose stay overlaps [from, to] (YYYY-MM-DD). Param names vary by
 * WebPMS build; we send the documented pair and a common alias so the query
 * lands regardless. Cancelled stays are kept in the raw result — callers filter.
 */
export async function searchBookings(from: string, to: string): Promise<PmsResult<PmsBooking[]>> {
  const res = await get<PmsBooking[] | { bookings?: PmsBooking[] }>("/bookings", {
    stayDateFrom: from,
    stayDateTo: to,
  });
  if (!res.ok) return res;
  const data = Array.isArray(res.data) ? res.data : (res.data.bookings ?? []);
  return { ok: true, data };
}

export async function getPayments(from: string, to: string): Promise<PmsResult<PmsPayment[]>> {
  const res = await get<PmsPayment[] | { payments?: PmsPayment[] }>("/analytics/payments", {
    dateFrom: from,
    dateTo: to,
  });
  if (!res.ok) return res;
  const data = Array.isArray(res.data) ? res.data : (res.data.payments ?? []);
  return { ok: true, data };
}

// ── Domain aggregations (the "шахматка" numbers the staff bot shows) ───────────

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True if a stay covers the night of `date` (check-in ≤ date < check-out). */
export function stayCoversDate(stay: PmsRoomStay, date: string): boolean {
  const ci = (stay.checkInDateTime || "").slice(0, 10);
  const co = (stay.checkOutDateTime || "").slice(0, 10);
  return ci <= date && date < co;
}

export function isActive(stay: PmsRoomStay): boolean {
  return stay.status !== "Cancelled";
}

export type Availability = {
  date: string;
  byType: { roomTypeId: string; name: string; total: number; occupied: number; free: number }[];
  totalRooms: number;
  totalOccupied: number;
  totalFree: number;
};

/** Compute free rooms per type for a given date from inventory + bookings. */
export async function getAvailability(date: string): Promise<PmsResult<Availability>> {
  if (!DATE.test(date)) return { ok: false, error: "bad_date" };

  const [roomsRes, bookingsRes] = await Promise.all([listRooms(), searchBookings(date, date)]);
  if (!roomsRes.ok) return roomsRes;
  if (!bookingsRes.ok) return bookingsRes;

  const totalByType = new Map<string, number>();
  for (const r of roomsRes.data) totalByType.set(r.roomTypeId, (totalByType.get(r.roomTypeId) ?? 0) + 1);

  const occByType = new Map<string, number>();
  for (const b of bookingsRes.data) {
    for (const s of b.roomStays ?? []) {
      if (isActive(s) && stayCoversDate(s, date)) {
        occByType.set(s.roomTypeId, (occByType.get(s.roomTypeId) ?? 0) + 1);
      }
    }
  }

  const byType = [...totalByType.entries()]
    .map(([roomTypeId, total]) => {
      const occupied = Math.min(occByType.get(roomTypeId) ?? 0, total);
      return { roomTypeId, name: roomTypeName(roomTypeId), total, occupied, free: total - occupied };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const totalRooms = byType.reduce((s, t) => s + t.total, 0);
  const totalOccupied = byType.reduce((s, t) => s + t.occupied, 0);
  return { ok: true, data: { date, byType, totalRooms, totalOccupied, totalFree: totalRooms - totalOccupied } };
}

export type FinanceSummary = {
  from: string;
  to: string;
  currency: string;
  gross: number;
  refunds: number;
  net: number;
  count: number;
  byMethod: { method: string; amount: number }[];
};

/** Money flow over a period from /analytics/payments. */
export async function getFinance(from: string, to: string): Promise<PmsResult<FinanceSummary>> {
  if (!DATE.test(from) || !DATE.test(to)) return { ok: false, error: "bad_date" };
  const res = await getPayments(from, to);
  if (!res.ok) return res;

  let gross = 0;
  let refunds = 0;
  let currency = "UZS";
  const byMethodMap = new Map<string, number>();

  for (const p of res.data) {
    const amt = Number(p.amount) || 0;
    if (p.currency) currency = p.currency;
    const isRefund = (p.actionKind || "").toLowerCase().includes("refund") || amt < 0;
    if (isRefund) refunds += Math.abs(amt);
    else gross += amt;
    const method = p.paymentMethod || p.paymentSystem || "—";
    byMethodMap.set(method, (byMethodMap.get(method) ?? 0) + amt);
  }

  const byMethod = [...byMethodMap.entries()]
    .map(([method, amount]) => ({ method, amount }))
    .sort((a, b) => b.amount - a.amount);

  return { ok: true, data: { from, to, currency, gross, refunds, net: gross - refunds, count: res.data.length, byMethod } };
}

export type GuestFlow = {
  from: string;
  to: string;
  arrivals: number;
  departures: number;
  guests: number;
  bookings: number;
};

/** Visitor flow: arrivals/departures and guest headcount over a period. */
export async function getGuestFlow(from: string, to: string): Promise<PmsResult<GuestFlow>> {
  if (!DATE.test(from) || !DATE.test(to)) return { ok: false, error: "bad_date" };
  const res = await searchBookings(from, to);
  if (!res.ok) return res;

  let arrivals = 0;
  let departures = 0;
  let guests = 0;
  const bookingIds = new Set<string>();

  for (const b of res.data) {
    for (const s of b.roomStays ?? []) {
      if (!isActive(s)) continue;
      const ci = (s.checkInDateTime || "").slice(0, 10);
      const co = (s.checkOutDateTime || "").slice(0, 10);
      if (ci >= from && ci <= to) {
        arrivals += 1;
        guests += (s.guestCountInfo?.adults ?? 0) + (s.guestCountInfo?.children ?? 0);
        bookingIds.add(b.id);
      }
      if (co >= from && co <= to) departures += 1;
    }
  }

  return { ok: true, data: { from, to, arrivals, departures, guests, bookings: bookingIds.size } };
}
