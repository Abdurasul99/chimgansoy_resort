/**
 * Exely PMS API client (official "Универсальный API Exely PMS", v1.5.0).
 *
 * Docs: https://connect.hopenapi.com/api/exelypms/swagger/ui/index
 * Auth: single integration key in the `X-API-KEY` header — from the Exely
 * admin → Управление отелем → Настройки → Интеграции. Hotel code 514200.
 *
 * Confirmed live (base `/api/exelypms/v1`):
 *   GET /rooms                          — room inventory  → Room[]
 *   GET /bookings?state&affectsPeriod…  — search          → { bookingNumbers: string[] }
 *   GET /bookings/{number}              — one booking      → Booking
 *   GET /analytics/payments             — money flow       → { data: {payments,…} | null }
 *   GET /analytics/services             — charges          → { data: {…} | null }
 *   GET /companies                      — companies        → Company[]
 * Analytics endpoints return {"data": null} when the period is empty.
 */

const DEFAULT_BASE = "https://connect.hopenapi.com/api/exelypms/v1";

function base(): string {
  return (process.env.EXELY_API_BASE?.trim() || DEFAULT_BASE).replace(/\/+$/, "");
}
function apiKey(): string | null {
  return process.env.EXELY_API_KEY?.trim() || null;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type PmsRoom = { id: string; name: string; roomTypeId: string };

export type PmsTotalPrice = { amount: number; toPayAmount?: number; toRefundAmount?: number };
export type PmsRoomStay = {
  id: string;
  roomId?: string | null;
  roomTypeId: string;
  checkInDateTime: string; // "yyyy-MM-ddTHH:mm"
  checkOutDateTime: string;
  status: "New" | "CheckedIn" | "CheckedOut" | "Cancelled" | string;
  bookingStatus?: string;
  guestCountInfo?: { adults?: number; children?: number } | null;
  totalPrice?: PmsTotalPrice;
};
export type PmsBooking = {
  id: string;
  number: string;
  customer?: { firstName?: string; lastName?: string; phones?: string[] } | null;
  currencyId?: string;
  roomStays: PmsRoomStay[];
  sourceChannelName?: string;
};

export type PmsPayment = {
  id: number;
  bookingNumber?: string;
  actionKind?: number; // 0 pay, 1 refund, 2 cancel-pay, 3 cancel-refund, 4 prepay
  amount: number;
  dateTime?: string;
  paymentMethod?: number; // 0 cash, 1 electronic
  paymentSystem?: string;
  currency?: string;
  roomTypeId?: number;
};

export type PmsResult<T> = { ok: true; data: T } | { ok: false; error: string; status?: number };

// roomTypeId → display name. Confirmed against live /rooms (5075760, 5075761).
export const ROOM_TYPE_NAMES: Record<string, string> = {
  "5075760": "Глэмпинг A-frame",
  "5075761": "Шале",
  "5075762": "Топчан",
  "5076232": "Бассейн",
  "5075692": "Бассейн",
};
export function roomTypeName(id: string): string {
  return ROOM_TYPE_NAMES[id] ?? `Категория ${id}`;
}

// ── low-level GET ─────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<PmsResult<T>> {
  const key = apiKey();
  if (!key) return { ok: false, error: "EXELY_API_KEY not set" };
  try {
    const res = await fetch(base() + path, {
      headers: { "X-API-KEY": key, Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { ok: false, status: res.status, error: `HTTP ${res.status} ${body.slice(0, 140)}` };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ── date helpers (Exely uses two formats) ─────────────────────────────────────

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const ymd = (iso: string) => iso.replace(/-/g, ""); // 2026-07-22 → 20260722
const dt = (iso: string, hm: "0000" | "2359") =>
  `${iso}T${hm.slice(0, 2)}:${hm.slice(2)}`; // → 2026-07-22T00:00
const dtCompact = (iso: string, hm: string) => `${ymd(iso)}${hm}`; // → 202607220000

function hotelNowCompact(): string {
  // Uzbekistan UTC+5, no DST → yyyyMMddHHmm.
  const d = new Date(Date.now() + 5 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
}

// ── endpoints ─────────────────────────────────────────────────────────────────

export function listRooms(): Promise<PmsResult<PmsRoom[]>> {
  return get<PmsRoom[]>("/rooms");
}

/** Diagnostic: reachable + key accepted? */
export const pingPms = listRooms;

/** Booking numbers whose stay overlaps [from, to] (YYYY-MM-DD), active only. */
export async function searchBookingNumbers(from: string, to: string): Promise<PmsResult<string[]>> {
  const q = `state=Active&affectsPeriodFrom=${dt(from, "0000")}&affectsPeriodTo=${dt(to, "2359")}`;
  const res = await get<{ bookingNumbers?: string[] }>(`/bookings?${q}`);
  if (!res.ok) return res;
  return { ok: true, data: res.data.bookingNumbers ?? [] };
}

export function getBooking(number: string): Promise<PmsResult<PmsBooking>> {
  return get<PmsBooking>(`/bookings/${encodeURIComponent(number)}`);
}

/** Search + fetch full bookings overlapping [from, to] (small concurrency). */
export async function getBookingsInPeriod(from: string, to: string): Promise<PmsResult<PmsBooking[]>> {
  const nums = await searchBookingNumbers(from, to);
  if (!nums.ok) return nums;
  const out: PmsBooking[] = [];
  for (let i = 0; i < nums.data.length; i += 8) {
    const batch = await Promise.all(nums.data.slice(i, i + 8).map((n) => getBooking(n)));
    for (const b of batch) if (b.ok) out.push(b.data);
  }
  return { ok: true, data: out };
}

type PaymentsEnvelope = { data: { payments?: PmsPayment[] } | null };
export async function getPayments(from: string, to: string): Promise<PmsResult<PmsPayment[]>> {
  // No future dates allowed; cap the end at hotel-now.
  const start = dtCompact(from, "0000");
  let end = dtCompact(to, "2359");
  const now = hotelNowCompact();
  if (end > now) end = now;
  const res = await get<PaymentsEnvelope>(
    `/analytics/payments?startDateTime=${start}&endDateTime=${end}`,
  );
  if (!res.ok) return res;
  return { ok: true, data: res.data.data?.payments ?? [] };
}

// ── domain aggregations ───────────────────────────────────────────────────────

export function stayCoversDate(s: PmsRoomStay, date: string): boolean {
  const ci = (s.checkInDateTime || "").slice(0, 10);
  const co = (s.checkOutDateTime || "").slice(0, 10);
  return ci <= date && date < co;
}
const isActive = (s: PmsRoomStay) => s.status !== "Cancelled";

export type Availability = {
  date: string;
  byType: { roomTypeId: string; name: string; total: number; occupied: number; free: number }[];
  totalRooms: number;
  totalOccupied: number;
  totalFree: number;
};

export async function getAvailability(date: string): Promise<PmsResult<Availability>> {
  if (!DATE.test(date)) return { ok: false, error: "bad_date" };
  const [rooms, bookings] = await Promise.all([listRooms(), getBookingsInPeriod(date, date)]);
  if (!rooms.ok) return rooms;
  if (!bookings.ok) return bookings;

  const total = new Map<string, number>();
  for (const r of rooms.data) total.set(r.roomTypeId, (total.get(r.roomTypeId) ?? 0) + 1);

  const occ = new Map<string, number>();
  for (const b of bookings.data)
    for (const s of b.roomStays ?? [])
      if (isActive(s) && stayCoversDate(s, date))
        occ.set(s.roomTypeId, (occ.get(s.roomTypeId) ?? 0) + 1);

  const byType = [...total.entries()]
    .map(([roomTypeId, t]) => {
      const occupied = Math.min(occ.get(roomTypeId) ?? 0, t);
      return { roomTypeId, name: roomTypeName(roomTypeId), total: t, occupied, free: t - occupied };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const totalRooms = byType.reduce((s, t) => s + t.total, 0);
  const totalOccupied = byType.reduce((s, t) => s + t.occupied, 0);
  return { ok: true, data: { date, byType, totalRooms, totalOccupied, totalFree: totalRooms - totalOccupied } };
}

export type FinanceSummary = {
  from: string; to: string; currency: string;
  gross: number; refunds: number; net: number; count: number;
  byMethod: { method: string; amount: number }[];
};

// signed contribution of a payment to net revenue, by actionKind
const SIGN: Record<number, number> = { 0: 1, 4: 1, 1: -1, 2: -1, 3: 1 };

export async function getFinance(from: string, to: string): Promise<PmsResult<FinanceSummary>> {
  if (!DATE.test(from) || !DATE.test(to)) return { ok: false, error: "bad_date" };
  const res = await getPayments(from, to);
  if (!res.ok) return res;

  let gross = 0, refunds = 0, currency = "UZS";
  const byMethod = new Map<string, number>();
  for (const p of res.data) {
    const amt = Number(p.amount) || 0;
    if (p.currency) currency = p.currency;
    const kind = p.actionKind ?? 0;
    if (kind === 0 || kind === 4) gross += amt;
    else if (kind === 1) refunds += amt;
    const label = p.paymentSystem || (p.paymentMethod === 0 ? "Наличные" : p.paymentMethod === 1 ? "Электронно" : "—");
    byMethod.set(label, (byMethod.get(label) ?? 0) + (SIGN[kind] ?? 1) * amt);
  }
  const net = res.data.reduce((s, p) => s + (SIGN[p.actionKind ?? 0] ?? 1) * (Number(p.amount) || 0), 0);

  return {
    ok: true,
    data: {
      from, to, currency, gross, refunds, net, count: res.data.length,
      byMethod: [...byMethod.entries()].map(([method, amount]) => ({ method, amount })).sort((a, b) => b.amount - a.amount),
    },
  };
}

export type GuestFlow = { from: string; to: string; arrivals: number; departures: number; guests: number; bookings: number };

export async function getGuestFlow(from: string, to: string): Promise<PmsResult<GuestFlow>> {
  if (!DATE.test(from) || !DATE.test(to)) return { ok: false, error: "bad_date" };
  const res = await getBookingsInPeriod(from, to);
  if (!res.ok) return res;

  let arrivals = 0, departures = 0, guests = 0;
  const ids = new Set<string>();
  for (const b of res.data)
    for (const s of b.roomStays ?? []) {
      if (!isActive(s)) continue;
      const ci = (s.checkInDateTime || "").slice(0, 10);
      const co = (s.checkOutDateTime || "").slice(0, 10);
      if (ci >= from && ci <= to) {
        arrivals += 1;
        guests += (s.guestCountInfo?.adults ?? 0) + (s.guestCountInfo?.children ?? 0);
        ids.add(b.id);
      }
      if (co >= from && co <= to) departures += 1;
    }
  return { ok: true, data: { from, to, arrivals, departures, guests, bookings: ids.size } };
}
