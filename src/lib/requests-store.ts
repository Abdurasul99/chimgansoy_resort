/**
 * Persistent log of guest requests.
 *
 * Until now a pool request went to Telegram and to e-mail and was then gone —
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
 * degrades quietly — a request still reaches Telegram, it just isn't archived,
 * and the bot says so rather than reporting an empty day as if nobody booked.
 */

import { list, put } from "@vercel/blob";

export type StoredRequest = {
  id: string;
  /** Which product the request is for — pool today, tubing next. */
  service: "pool" | "tubing";
  /** Date of the visit, YYYY-MM-DD. */
  date: string;
  /** When the guest submitted it, ISO with the Tashkent offset applied. */
  createdAt: string;
  name: string;
  phone: string;
  adults: number;
  kids: number;
  toddlers: number;
  extras: string[];
  total: number;
  tariff: string;
  message?: string;
  locale: string;
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
 * down or unconfigured the request has already gone to Telegram, and losing the
 * archive copy is not a reason to fail the submission.
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
      // Blob URLs are public to anyone holding them, so the random suffix keeps
      // a guest's name and phone from sitting at a guessable address.
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
        const res = await fetch(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(8_000),
        });
        if (!res.ok) return null;
        return (await res.json()) as StoredRequest;
      } catch {
        return null;
      }
    }),
  );
  return rows.filter((r): r is StoredRequest => r !== null);
}

async function pathsUnder(prefix: string): Promise<{ url: string; pathname: string }[]> {
  if (!storeConfigured()) return [];
  try {
    const { blobs } = await list({ prefix, limit: 1000 });
    return blobs.map((b) => ({ url: b.url, pathname: b.pathname }));
  } catch (e) {
    console.error("[store] list failed:", e);
    return [];
  }
}

/** Everyone booked in for a given visit date. */
export async function requestsByDate(
  date: string,
  service: StoredRequest["service"] = "pool",
): Promise<StoredRequest[]> {
  const found = await pathsUnder(`requests/${service}/${date}/`);
  const rows = await hydrate(found.map((f) => f.url));
  return rows.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * The most recently submitted requests, newest first.
 *
 * Pathnames start with the visit date, so listing the whole service and taking
 * the tail would give the furthest-future visits, not the newest submissions —
 * hence the sort on createdAt after hydrating.
 */
export async function recentRequests(
  limit = 10,
  service: StoredRequest["service"] = "pool",
): Promise<StoredRequest[]> {
  const found = await pathsUnder(`requests/${service}/`);
  // Each blob is a separate fetch, so cap the hydration. The epoch stamp in the
  // filename orders submissions within a day; across days the date prefix wins,
  // so take a generous slice from the end and sort properly below.
  const tail = found.slice(-Math.max(limit * 4, 40));
  const rows = await hydrate(tail.map((f) => f.url));
  return rows
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, Math.max(1, limit));
}
