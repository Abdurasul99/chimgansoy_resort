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
export type RequestService = "pool" | "tubing" | "booking" | "inquiry";

/** The services that represent a booking for a particular day. */
export const DATED_SERVICES: RequestService[] = ["pool", "tubing", "booking"];

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
};

export function storeConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** Asia/Tashkent is UTC+5 year-round. */
function nowTashkent(): string {
  return new Date(Date.now() + 5 * 3600_000).toISOString().replace("Z", "+05:00");
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
  const record: StoredRequest = { ...input, id, createdAt };
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
