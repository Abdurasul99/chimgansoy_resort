import { head, put } from "@vercel/blob";
import { unstable_cache, revalidateTag } from "next/cache";

/**
 * Operator edits, layered over the TypeScript content modules.
 *
 * The content of this site lives in src/content/*.ts and always will: those
 * files are the DEFAULTS, they ship with the build, and they are what renders
 * when this store is empty, unreachable or corrupt. What lands in Blob is only
 * the difference — the prices the operator has changed, the services they have
 * added or hidden, the news they have posted.
 *
 * Why a sparse patch and not a copy of the catalogue
 * --------------------------------------------------
 * If the store held a complete catalogue, then a correction shipped in the code
 * — a fixed typo, a corrected price, a new field — would be permanently masked
 * by whatever was saved months earlier, and nobody would understand why the
 * deploy "did nothing". A patch merges field by field: anything the operator
 * has not touched keeps following the code.
 *
 * Why one document and not three
 * ------------------------------
 * Three documents mean three reads on every render, three etags, and a save
 * that can half-succeed. There is one editor and a few kilobytes of data.
 *
 * Failure behaviour, which is the point of the whole design
 * ---------------------------------------------------------
 * `readOverrides()` NEVER throws and never returns a partial parse. Any error —
 * missing token, timeout, malformed JSON, wrong version — yields an empty
 * patch, and the site renders exactly what it renders today. The public pages
 * must not be able to break because a store the operator edits is having a bad
 * afternoon.
 */

export const OVERRIDES_PATH = "site/overrides.json";
export const OVERRIDES_TAG = "site-overrides";

/** Bumped only for a breaking shape change; a mismatch is treated as empty. */
const VERSION = 1;

export type NewsItem = {
  id: string;
  /** YYYY-MM-DD, the date shown to a guest. */
  date: string;
  title: string;
  body: string;
  /** A key of resortImages, or omitted. Uploads are not supported by design. */
  image?: string;
  published: boolean;
};

export type OverrideData = {
  /** Flat price overrides, keyed by a dotted path the price page defines. */
  prices: Record<string, number>;
  /** Per-service-slug patch: hidden, and a price line the card shows. */
  services: Record<string, { hidden?: boolean; priceNote?: string }>;
  /** Services the operator added. Kept separate from the code's own list. */
  customServices: Array<{
    slug: string;
    title: string;
    description: string;
    priceNote?: string;
    image?: string;
    hidden?: boolean;
  }>;
  news: NewsItem[];
};

export type Overrides = {
  version: number;
  updatedAt: string;
  updatedBy: string;
  data: OverrideData;
};

export const EMPTY: OverrideData = { prices: {}, services: {}, customServices: [], news: [] };

function configured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** Shape-checks a parsed document. Anything unexpected degrades to empty. */
function coerce(raw: unknown): OverrideData {
  if (!raw || typeof raw !== "object") return EMPTY;
  const doc = raw as Partial<Overrides>;
  if (doc.version !== VERSION) return EMPTY;
  const d = doc.data;
  if (!d || typeof d !== "object") return EMPTY;

  const prices: Record<string, number> = {};
  for (const [k, v] of Object.entries(d.prices ?? {})) {
    // A price is a non-negative finite number. A string, a NaN or a negative
    // would each render as something nonsensical on a public page.
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) prices[k] = Math.round(v);
  }

  const services: OverrideData["services"] = {};
  for (const [k, v] of Object.entries(d.services ?? {})) {
    if (!v || typeof v !== "object") continue;
    services[k] = {
      hidden: Boolean((v as { hidden?: unknown }).hidden),
      priceNote: typeof (v as { priceNote?: unknown }).priceNote === "string" ? (v as { priceNote: string }).priceNote : undefined,
    };
  }

  const customServices = Array.isArray(d.customServices)
    ? d.customServices.filter(
        (s): s is OverrideData["customServices"][number] =>
          !!s && typeof s === "object" && typeof s.slug === "string" && typeof s.title === "string",
      )
    : [];

  const news = Array.isArray(d.news)
    ? d.news.filter(
        (n): n is NewsItem =>
          !!n && typeof n === "object" && typeof n.id === "string" && typeof n.title === "string",
      )
    : [];

  return { prices, services, customServices, news };
}

async function fetchOverrides(): Promise<OverrideData> {
  if (!configured()) return EMPTY;
  try {
    const meta = await head(OVERRIDES_PATH);
    const res = await fetch(meta.url, {
      // The document is small and changes on a human timescale; the CDN copy is
      // bypassed so a save is visible immediately rather than after its TTL.
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return EMPTY;
    return coerce(await res.json());
  } catch {
    // Includes the very common case of the blob not existing yet, which is not
    // an error — it is simply an operator who has not edited anything.
    return EMPTY;
  }
}

/**
 * Cached read for public pages.
 *
 * `unstable_cache` with a tag rather than a route-segment `revalidate`: the
 * latter would flip every prerendered page on the site to ISR to serve a
 * document that changes a few times a month. A save calls revalidateTag, so
 * the wait is zero when it matters and five minutes otherwise.
 */
export const readOverrides = unstable_cache(fetchOverrides, ["site-overrides-v1"], {
  revalidate: 300,
  tags: [OVERRIDES_TAG],
});

/** Uncached read for the admin screens — never the cached one, or an operator
 *  would edit a copy up to five minutes old and overwrite their own change. */
export async function readForEdit(): Promise<OverrideData> {
  return fetchOverrides();
}

export type SaveResult = { ok: true } | { ok: false; error: string };

/**
 * Writes the whole document.
 *
 * `allowOverwrite` with no `ifMatch`: there is exactly one operator with one
 * password, so the lost-update problem this guards against needs that operator
 * to have two tabs open on the same screen. Conditional writes were designed in
 * and then dropped, because @vercel/blob only exposes the etag on the write
 * result and on `head()` in a form that does not round-trip cleanly here — a
 * half-working precondition is worse than an honest absence of one.
 */
export async function saveOverrides(data: OverrideData, by = "admin"): Promise<SaveResult> {
  if (!configured()) return { ok: false, error: "Хранилище не подключено (BLOB_READ_WRITE_TOKEN)." };

  const doc: Overrides = {
    version: VERSION,
    updatedAt: new Date(Date.now() + 5 * 3600_000).toISOString().replace("Z", "+05:00"),
    updatedBy: by,
    data,
  };

  try {
    await put(OVERRIDES_PATH, JSON.stringify(doc, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      // One minute is the floor the API allows; the read bypasses the CDN
      // anyway, so this only bounds how stale an unlucky edge copy can be.
      cacheControlMaxAge: 60,
      abortSignal: AbortSignal.timeout(8_000),
    });
  } catch (e) {
    console.error("[overrides] save failed:", e);
    return { ok: false, error: "Не удалось сохранить. Попробуйте ещё раз." };
  }

  // Public pages read through the tagged cache; without this the change would
  // not appear for up to five minutes and the operator would save again.
  // Next 16 requires a cache profile as the second argument — "max" expires the
  // entry immediately rather than scheduling it, which is what a save means.
  revalidateTag(OVERRIDES_TAG, "max");
  return { ok: true };
}
