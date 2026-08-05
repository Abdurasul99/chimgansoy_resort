/**
 * Persistent log of guest requests.
 *
 * Until now a request went to Telegram and to e-mail and was then gone —
 * nothing could answer "who is coming on Saturday". Vercel functions keep no
 * state between invocations, so the archive has to live outside the app.
 *
 * Vercel Blob holds it: one JSON object per request, filed under the date of
 * the VISIT, which is what anyone asking about a date actually means. Listing a
 * date prefix answers "how many and who" directly, with no index to keep in
 * sync. The volume is a handful of requests a day, so a read per request is
 * cheap and there is nothing to shard.
 *
 * BLOB_READ_WRITE_TOKEN is injected by Vercel. Without it every function here
 * degrades quietly — a request still reaches Telegram and e-mail, it just isn't
 * archived, and the bot says so rather than reporting an empty day as if nobody
 * booked.
 */

import { list, put } from "@vercel/blob";

/**
 * Which form the request came from.
 *   pool / tubing — a dated day visit with a computed total
 *   booking       — an accommodation request; the price comes from the PMS later
 *   inquiry       — the footer question form; no visit date at all
 */
export type RequestService = "pool" | "topchan" | "tubing" | "booking" | "inquiry";

/** The services that represent a booking for a particular day. */
export const DATED_SERVICES: RequestService[] = ["pool", "topchan", "tubing", "booking"];

export type StoredRequest = {
  id: string;
  service: RequestService;
  /**
   * The day the archive files this under, YYYY-MM-DD: the visit day for a pool
   * or tubing request, check-in for accommodation, and — for an inquiry, which
   * has no visit — the day it was submitted, so it is still findable.
   */
  date: string;
  /** When the guest submitted it, ISO with the Tashkent offset applied. */
  createdAt: string;
  name: string;
  phone: string;
  email?: string;
  adults: number;
  kids: number;
  toddlers: number;
  extras: string[];
  /** 0 when the price isn't known at request time (accommodation, inquiries). */
  total: number;
  tariff: string;
  message?: string;
  locale: string;
  /** Accommodation only. */
  checkin?: string;
  checkout?: string;
  room?: string;
  /**
   * How many units the request takes: topchans booked, tubing packages sold.
   * The topchan count is what lets the bot answer "сколько свободно на
   * субботу" — guests are not one-to-one with topchans, since one seats eight.
   */
  units?: number;
};

export function storeConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** Asia/Tashkent is UTC+5 year-round. */
function nowTashkent(): string {
  return new Date(Date.now() + 5 * 3600_000).toISOString().replace("Z", "+05:00");
}

/**
 * Flattens whatever the guest typed into a number Telegram will offer to dial.
 *
 * Telegram only turns a phone into a tappable call when it reads as one
 * international number, so "90 555 44 33" and "+998 90 555-44-33" both have to
 * become +998905554433. Uzbek numbers arrive with +998, with a bare 998, or as
 * the nine national digits. Anything unrecognisable is kept exactly as typed
 * rather than guessed at — a wrong number is worse than an unlinked one.
 */
function dialable(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("998")) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  if (digits.length > 9 && digits.length <= 15) return `+${digits}`;
  return raw;
}

/**
 * Archives a request. Never throws and never blocks delivery: if the store is
 * down or unconfigured the request has already gone out, and losing the archive
 * copy is not a reason to fail the submission.
 */
export async function saveRequest(
  input: Omit<StoredRequest, "id" | "createdAt">,
): Promise<StoredRequest> {
  const createdAt = nowTashkent();
  // Epoch prefix keeps a day's blobs in submission order — list() sorts by
  // pathname, so the log reads chronologically without a separate sort key.
  const stamp = Date.now();
  const id = `${stamp.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const record: StoredRequest = { ...input, phone: dialable(input.phone), id, createdAt };
  if (!storeConfigured()) {
    console.warn("[store] BLOB_READ_WRITE_TOKEN missing — request not archived");
    return record;
  }

  try {
    await put(`requests/${input.service}/${input.date}/${stamp}-${id}.json`, JSON.stringify(record), {
      access: "public",
      contentType: "application/json",
      // Blob URLs are readable by anyone holding them, so the random suffix
      // keeps a guest's name and phone off a guessable address.
      addRandomSuffix: true,
      // The submission waits on this write, so a hanging store would hold the
      // guest's request open until the function is killed — turning a lead the
      // operator has already received into a visible failure.
      abortSignal: AbortSignal.timeout(8_000),
    });
  } catch (e) {
    console.error("[store] failed to archive request:", e);
  }
  return record;
}

/** Reads back the JSON behind a set of blob URLs, skipping anything unreadable. */
async function hydrate(urls: string[]): Promise<StoredRequest[]> {
  const rows = await Promise.all(
    urls.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
        if (!res.ok) return null;
        return (await res.json()) as StoredRequest;
      } catch {
        return null;
      }
    }),
  );
  return rows.filter((r): r is StoredRequest => r !== null);
}

async function urlsUnder(prefix: string): Promise<string[]> {
  if (!storeConfigured()) return [];
  try {
    const { blobs } = await list({ prefix, limit: 1000 });
    return blobs.map((b) => b.url);
  } catch (e) {
    console.error("[store] list failed:", e);
    return [];
  }
}

/**
 * Everyone booked in for a given day, across every service by default.
 *
 * "Who is coming on the 9th" means the pool group AND the guests checking in,
 * so the date view spans services rather than making anyone pick one first.
 */
export async function requestsByDate(
  date: string,
  services: RequestService[] = DATED_SERVICES,
): Promise<StoredRequest[]> {
  const perService = await Promise.all(
    services.map((s) => urlsUnder(`requests/${s}/${date}/`)),
  );
  const rows = await hydrate(perService.flat());
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * The most recently submitted requests, newest first, inquiries included.
 *
 * Pathnames start with the visit date, so listing a service and taking the tail
 * would surface the furthest-future visits rather than the newest submissions —
 * hence the sort on createdAt after hydrating.
 */
export async function recentRequests(
  limit = 10,
  services: RequestService[] = [...DATED_SERVICES, "inquiry"],
): Promise<StoredRequest[]> {
  const perService = await Promise.all(services.map((s) => urlsUnder(`requests/${s}/`)));
  // Each blob is a separate fetch, so cap hydration per service: the tail of a
  // pathname-sorted list is the furthest-future dates, which is where recent
  // submissions concentrate.
  const slice = Math.max(limit * 2, 20);
  const urls = perService.flatMap((u) => u.slice(-slice));
  const rows = await hydrate(urls);
  return rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.max(1, limit));
}

/* ────────────────────────────────────────────────────────────────────────────
 * Reads for the operator's panel.
 *
 * The panel asks two questions the guest-facing code never did: "what came in
 * over a period" and "how much did each service bring". Both are answered from
 * the same archive, but they want very different amounts of it.
 * ──────────────────────────────────────────────────────────────────────────── */

/** One archived request as the pathname alone describes it — no body fetched. */
export type RequestStub = {
  service: RequestService;
  /** The visit date the blob is filed under, YYYY-MM-DD. */
  date: string;
  /** Submission time, from the epoch prefix in the filename. */
  submittedAt: number;
  url: string;
};

/**
 * Every archived request, as pathnames.
 *
 * The key scheme is `requests/<service>/<date>/<epoch>-<id>.json`, so the two
 * fields the panel filters and groups by — which service, and which day — are
 * already in the path. Listing costs one round trip per page of 1000 and no
 * body fetch at all; hydrating the same set would be one HTTP request PER
 * REQUEST, which for a season's archive is thousands.
 *
 * So: index from pathnames, then hydrate only the page being displayed.
 */
export async function requestIndex(): Promise<RequestStub[]> {
  if (!storeConfigured()) return [];
  const out: RequestStub[] = [];
  let cursor: string | undefined;

  try {
    // Paginated, unlike urlsUnder(): that caps at 1000 and silently truncates,
    // which is invisible until the archive passes a thousand and the panel
    // quietly starts under-reporting.
    do {
      const page = await list({ prefix: "requests/", limit: 1000, cursor });
      for (const blob of page.blobs) {
        // requests/<service>/<date>/<epoch>-<id>.json
        const parts = blob.pathname.split("/");
        if (parts.length !== 4) continue;
        const [, service, date, file] = parts;
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
        const stamp = Number(file.split("-")[0]);
        out.push({
          service: service as RequestService,
          date,
          submittedAt: Number.isFinite(stamp) ? stamp : 0,
          url: blob.url,
        });
      }
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);
  } catch (e) {
    console.error("[store] index failed:", e);
    return out;
  }

  return out;
}

/** Requests whose VISIT date falls in [from, to], newest submission first. */
export async function requestsBetween(from: string, to: string): Promise<StoredRequest[]> {
  const stubs = (await requestIndex()).filter((s) => s.date >= from && s.date <= to);
  const rows = await hydrate(stubs.map((s) => s.url));
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** One service's line in the panel's summary. */
export type ServiceTotals = {
  service: RequestService;
  requests: number;
  /** Sum of `total`. Zero for services whose price is not known at request time. */
  revenue: number;
  guests: number;
  units: number;
};

/**
 * Totals per service over a visit-date range.
 *
 * "Revenue" is deliberately the sum of what the FORMS COMPUTED, not money
 * received: there is no payment integration yet, and every row here is a
 * request the operator still has to confirm by phone. The panel labels it
 * accordingly — calling it выручка would be the single most misleading number
 * we could put on that screen.
 *
 * Accommodation and inquiry rows carry total: 0 by design (the rate comes from
 * the PMS later), so they contribute to `requests` and never to `revenue`.
 */
export async function serviceTotals(from: string, to: string): Promise<ServiceTotals[]> {
  const rows = await requestsBetween(from, to);
  const by = new Map<RequestService, ServiceTotals>();

  for (const r of rows) {
    const entry = by.get(r.service) ?? {
      service: r.service,
      requests: 0,
      revenue: 0,
      guests: 0,
      units: 0,
    };
    entry.requests += 1;
    entry.revenue += r.total || 0;
    entry.guests += (r.adults || 0) + (r.kids || 0) + (r.toddlers || 0);
    entry.units += r.units || 0;
    by.set(r.service, entry);
  }

  return [...by.values()].sort((a, b) => b.requests - a.requests);
}
