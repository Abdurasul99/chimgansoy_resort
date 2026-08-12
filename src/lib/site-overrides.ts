import { head, put } from "@vercel/blob";
import { unstable_cache, revalidateTag, updateTag } from "next/cache";

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

export type UploadedPhoto = {
  /** Стабильный ключ, которым на него ссылается галерея домика. */
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
  uploadedAt: string;
};

/** Раздел карточки. Совпадает с категориями в content/services.ts. */
export type ServiceCategory = "relax" | "food" | "activity";
const CATEGORIES: ServiceCategory[] = ["relax", "food", "activity"];

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
  /**
   * Per-service-slug patch: hidden, a price line the card shows, и место
   * услуги — на главной ли она и в каком порядке идёт.
   *
   * `showOnHome` отсутствует, пока оператор не трогал переключатель: услуга из
   * кода по умолчанию претендует на главную, как было до появления этого поля.
   * `order` отсутствует — значит место определяет порядок в services.ts.
   */
  services: Record<
    string,
    { hidden?: boolean; priceNote?: string; showOnHome?: boolean; order?: number }
  >;
  /** Services the operator added. Kept separate from the code's own list. */
  customServices: Array<{
    slug: string;
    title: string;
    description: string;
    /** Строка под заголовком карточки. Без неё карточка берёт начало описания. */
    shortDescription?: string;
    priceNote?: string;
    /** Ключ resortImages или адрес загруженного фото. */
    image?: string;
    category?: ServiceCategory;
    hidden?: boolean;
    showOnHome?: boolean;
    order?: number;
  }>;
  /**
   * Per-room patch for /nomera/<slug>: the lists a guest reads, the photos in
   * the gallery, and a price line.
   *
   * A list is REPLACED when present, not merged item by item. Merging would
   * make removing a line from the code impossible — the operator would delete
   * it and it would come straight back on the next deploy.
   */
  rooms: Record<
    string,
    {
      priceNote?: string;
      /**
       * «от … сум / ночь» на карточке и на странице домика.
       *
       * Перебивает живую цену из Exely. Оператор попросил это прямо, зная,
       * что движок продолжит считать по своей ставке — см. комментарий в
       * lib/rooms-live.ts.
       */
      priceFrom?: number;
      amenities?: string[];
      features?: string[];
      /** Keys of resortImages, in the order they should appear. */
      gallery?: string[];
    }
  >;
  /**
   * Фотографии, загруженные оператором. Хранятся отдельно от реестра в коде:
   * реестр — это то, что снято и обработано для сайта, а это — то, что
   * оператор добавил сам. Ссылка ведёт в Blob, файл уже сжат при загрузке.
   */
  photos: UploadedPhoto[];
  news: NewsItem[];
};

export type Overrides = {
  version: number;
  updatedAt: string;
  updatedBy: string;
  data: OverrideData;
};

export const EMPTY: OverrideData = { prices: {}, services: {}, customServices: [], rooms: {}, photos: [], news: [] };

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

  /** Порядковый номер: неотрицательное целое, иначе поля просто нет. */
  const order = (x: unknown): number | undefined =>
    typeof x === "number" && Number.isFinite(x) && x >= 0 ? Math.round(x) : undefined;
  /** Трёхзначный переключатель: не трогали — undefined, а не false. */
  const flag = (x: unknown): boolean | undefined => (typeof x === "boolean" ? x : undefined);
  const str = (x: unknown): string | undefined =>
    typeof x === "string" && x.trim() ? x.trim() : undefined;
  const category = (x: unknown): ServiceCategory | undefined =>
    typeof x === "string" && (CATEGORIES as string[]).includes(x) ? (x as ServiceCategory) : undefined;

  const services: OverrideData["services"] = {};
  for (const [k, v] of Object.entries(d.services ?? {})) {
    if (!v || typeof v !== "object") continue;
    const s = v as Record<string, unknown>;
    services[k] = {
      hidden: Boolean(s.hidden),
      priceNote: typeof s.priceNote === "string" ? s.priceNote : undefined,
      showOnHome: flag(s.showOnHome),
      order: order(s.order),
    };
  }

  const customServices = Array.isArray(d.customServices)
    ? d.customServices
        .filter(
          (s): s is OverrideData["customServices"][number] =>
            !!s && typeof s === "object" && typeof s.slug === "string" && typeof s.title === "string",
        )
        .map((s) => ({
          slug: s.slug,
          title: s.title,
          description: typeof s.description === "string" ? s.description : "",
          shortDescription: str(s.shortDescription),
          priceNote: str(s.priceNote),
          image: str(s.image),
          category: category(s.category),
          hidden: Boolean(s.hidden),
          showOnHome: flag(s.showOnHome),
          order: order(s.order),
        }))
    : [];

  const news = Array.isArray(d.news)
    ? d.news.filter(
        (n): n is NewsItem =>
          !!n && typeof n === "object" && typeof n.id === "string" && typeof n.title === "string",
      )
    : [];

  // Rooms were added after the first documents were saved. A missing key is
  // read as "no room edits" rather than as a version mismatch — bumping the
  // version would discard every price the operator had already set.
  const rooms: OverrideData["rooms"] = {};
  for (const [slug, v] of Object.entries(d.rooms ?? {})) {
    if (!v || typeof v !== "object") continue;
    const r = v as Record<string, unknown>;
    const list = (x: unknown) =>
      Array.isArray(x)
        ? x.filter((i): i is string => typeof i === "string" && i.trim().length > 0).map((i) => i.trim())
        : undefined;
    const priceFrom = typeof r.priceFrom === "number" && Number.isFinite(r.priceFrom) && r.priceFrom > 0
      ? Math.round(r.priceFrom)
      : undefined;
    rooms[slug] = {
      priceFrom,
      priceNote: typeof r.priceNote === "string" && r.priceNote.trim() ? r.priceNote.trim() : undefined,
      amenities: list(r.amenities),
      features: list(r.features),
      gallery: list(r.gallery),
    };
  }

  const photos = Array.isArray(d.photos)
    ? d.photos.filter(
        (p): p is UploadedPhoto =>
          !!p &&
          typeof p === "object" &&
          typeof p.id === "string" &&
          typeof p.url === "string" &&
          // Only our own store: a URL from anywhere else would let a saved
          // document point the site at someone else's server.
          /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//.test(p.url),
      )
    : [];

  return { prices, services, customServices, rooms, photos, news };
}

async function fetchOverrides(): Promise<OverrideData> {
  if (!configured()) return EMPTY;
  try {
    const meta = await head(OVERRIDES_PATH);
    /**
     * Метка последней записи в адресе — иначе читается прошлая версия файла.
     *
     * Адрес документа не меняется при перезаписи, и CDN хранилища какое-то время
     * отдаёт по нему прежнее тело: cache: "no-store" запрещает кеш нам, а не
     * ему. Проверено на проде: услуга, добавленная в панели, пропадала из списка
     * при следующем открытии экрана и появлялась на сайте минутой позже —
     * выглядело как «сохранение не сработало», хотя запись прошла. Хуже того,
     * следующая правка читала устаревший документ и затирала ею же созданное.
     *
     * uploadedAt приходит из head(), а он ходит в API, а не в CDN, и меняется на
     * каждую запись — значит и адрес на каждую запись новый.
     */
    const url = `${meta.url}?v=${meta.uploadedAt.getTime()}`;
    const res = await fetch(url, {
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

  /**
   * Публичные страницы читают через тегированный кеш, и без сброса правка
   * оператора доходила бы до сайта минутами — он успевал сохранить второй раз.
   *
   * updateTag, а не revalidateTag: второй в Next 16 принимает профиль и лишь
   * ПЛАНИРУЕТ истечение записи, а updateTag сбрасывает её здесь и сейчас, ради
   * чего и сделан — «читай то, что сам только что записал». Проверено на проде:
   * с revalidateTag("max") удалённая услуга оставалась на сайте и после
   * сохранения, до конца пятиминутного TTL.
   *
   * Вызывать его можно только из серверного действия. Все правки приходят
   * оттуда, но если однажды придут не оттуда — падать из-за сброса кеша сохранение
   * не должно, поэтому запасной путь оставлен.
   */
  try {
    updateTag(OVERRIDES_TAG);
  } catch {
    revalidateTag(OVERRIDES_TAG, "max");
  }
  return { ok: true };
}
