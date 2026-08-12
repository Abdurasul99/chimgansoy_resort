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

/**
 * Поле формы заявки, настроенное оператором.
 *
 * Типов ровно столько, сколько оператор может осмысленно объяснить гостю и
 * сколько сервер умеет проверить. Расширять этот список дешевле, чем чинить
 * форму, где половина типов рисуется, но не проверяется.
 */
export type FieldType = "text" | "textarea" | "number" | "phone" | "date" | "select" | "checkbox";
const FIELD_TYPES: FieldType[] = ["text", "textarea", "number", "phone", "date", "select", "checkbox"];

export type FormField = {
  /** Ключ, под которым ответ попадает в заявку. Латиница, задаётся из названия. */
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  /** Только для select. */
  options?: string[];
  /** Только для number. */
  min?: number;
  max?: number;
};

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
    /**
     * Форма заявки этой услуги. Пусто — формы нет, страница показывает
     * телефон и общую кнопку брони: пустая форма без полей хуже её отсутствия.
     */
    formFields?: FormField[];
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
  /** Монотонный номер записи. Отсутствует в документах, записанных до его появления. */
  rev?: number;
  updatedAt: string;
  updatedBy: string;
  data: OverrideData;
};

export const EMPTY: OverrideData = { prices: {}, services: {}, customServices: [], rooms: {}, photos: [], news: [] };

function configured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/**
 * Shape-checks a parsed document. Anything unexpected degrades to empty.
 *
 * Экспортируется ради тестов: это единственное место, где решается, переживёт
 * ли сайт кривой документ, и проверять это через хранилище значило бы не
 * проверять вовсе.
 */
export function coerce(raw: unknown): OverrideData {
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
  const num = (x: unknown): number | undefined =>
    typeof x === "number" && Number.isFinite(x) ? x : undefined;

  /**
   * Поля формы. Поле без ключа, названия или с незнакомым типом выбрасывается
   * целиком: отрисовать его нечем, а проверить на сервере — тем более.
   */
  const fields = (x: unknown): FormField[] | undefined => {
    if (!Array.isArray(x)) return undefined;
    const out: FormField[] = [];
    for (const raw of x) {
      if (!raw || typeof raw !== "object") continue;
      const f = raw as Record<string, unknown>;
      const key = str(f.key);
      const label = str(f.label);
      const type = typeof f.type === "string" && (FIELD_TYPES as string[]).includes(f.type)
        ? (f.type as FieldType)
        : null;
      if (!key || !label || !type) continue;
      // Два поля с одним ключом перетёрли бы ответ друг друга в заявке.
      if (out.some((o) => o.key === key)) continue;
      const options = Array.isArray(f.options)
        ? f.options.filter((o): o is string => typeof o === "string" && o.trim().length > 0).map((o) => o.trim())
        : undefined;
      // Список без вариантов — это поле, которое гость не сможет заполнить.
      if (type === "select" && (!options || options.length === 0)) continue;
      out.push({
        key,
        label,
        type,
        required: Boolean(f.required),
        placeholder: str(f.placeholder),
        options,
        min: num(f.min),
        max: num(f.max),
      });
    }
    return out.length ? out : undefined;
  };

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
          formFields: fields((s as { formFields?: unknown }).formFields),
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

/**
 * Последнее, что записал этот процесс, — чтобы читать то, что сам сохранил.
 *
 * Хранилище отдаёт запись не мгновенно: и тело файла, и метаданные какое-то
 * время приходят прежние. На проде это стоило потерянных правок — оператор
 * добавлял поле за полем, каждое сохранение рапортовало об успехе, а в списке
 * оставалось только первое: следующая правка читала документ без предыдущей и
 * записывала его обратно.
 *
 * Память процессная, поэтому спасает не всегда: другой инстанс её не видит.
 * Но правки идут одна за другой из одной вкладки, и это ровно тот случай.
 */
let lastWritten: { rev: number; data: OverrideData } | null = null;
/** Самый большой номер, который этот процесс видел или писал. */
let lastSeenRev = 0;

async function fetchOverrides(): Promise<OverrideData> {
  return (await fetchDoc()).data;
}

/** Документ вместе с его номером ревизии. */
async function fetchDoc(): Promise<{ rev: number; data: OverrideData }> {
  if (!configured()) return { rev: 0, data: EMPTY };
  try {
    const meta = await head(OVERRIDES_PATH);
    /**
     * Обход кеша меткой времени ЗАПРОСА, а не записи.
     *
     * Адрес документа не меняется при перезаписи, и CDN хранилища какое-то время
     * отдаёт по нему прежнее тело: cache: "no-store" запрещает кеш нам, а не ему.
     * Здесь стояла метка из head().uploadedAt — и лечило это ровно наполовину:
     * head() сам может отдать прежние метаданные, тогда адрес не меняется и CDN
     * во второй раз отдаёт тот же устаревший файл. Проверено на проде: из
     * четырёх полей, добавленных подряд, доезжали два.
     *
     * Уникальный адрес на каждый запрос — гарантированный промах мимо кеша.
     * Документ занимает килобайты, а читается через unstable_cache, так что до
     * origin доходят единицы запросов в минуту.
     */
    const res = await fetch(`${meta.url}?t=${Date.now()}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return { rev: 0, data: fresher(EMPTY, 0) };
    const raw = await res.json();
    const rev = typeof raw?.rev === "number" && Number.isFinite(raw.rev) ? raw.rev : 0;
    return { rev, data: fresher(coerce(raw), rev) };
  } catch {
    // Includes the very common case of the blob not existing yet, which is not
    // an error — it is simply an operator who has not edited anything.
    return { rev: 0, data: fresher(EMPTY, 0) };
  }
}

/**
 * Отдаёт свою же запись, если хранилище ещё не догнало её.
 *
 * Сравнение по номеру ревизии, а не по времени: время записи приходит из тех же
 * метаданных, которые могут отстать, а номер лежит внутри самого документа —
 * если мы читаем документ, мы читаем и его номер.
 */
function fresher(fetched: OverrideData, rev: number): OverrideData {
  if (lastWritten && lastWritten.rev > rev) return lastWritten.data;
  lastSeenRev = Math.max(lastSeenRev, rev);
  return fetched;
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

/**
 * Чтение вместе с номером ревизии — для экранов панели.
 *
 * Экран отдаёт этот номер своим формам, а форма возвращает его серверу. Так
 * правка знает, какую версию видел оператор.
 */
export async function readForEditWithRev(): Promise<{ rev: number; data: OverrideData }> {
  const { rev, data } = await fetchDoc();
  return { rev: Math.max(rev, lastWritten?.rev ?? 0), data };
}

/**
 * Документ не старше указанной ревизии — основа любой правки в панели.
 *
 * Хранилище отдаёт запись не мгновенно, и следующая правка успевала прочитать
 * документ БЕЗ предыдущей и записать его обратно: оператор добавлял поля одно
 * за другим, каждое сохранение отвечало «Сохранено», а доезжали не все.
 *
 * Память процесса тут не спасает — соседний запрос может обслужить другой
 * инстанс, который ничего не знает. Знает браузер: он получил номер вместе со
 * страницей и присылает его обратно. Поэтому здесь мы просто ждём, пока
 * хранилище догонит то, что оператор уже видел своими глазами.
 */
export async function readAtLeast(minRev: number): Promise<OverrideData | null> {
  if (!Number.isFinite(minRev) || minRev <= 0) return fetchOverrides();

  // Десять попыток с нарастающей паузой — около четырёх секунд. Дольше держать
  // оператора у крутящейся кнопки хуже, чем попросить повторить.
  for (let attempt = 0; attempt < 10; attempt++) {
    const { rev, data } = await fetchDoc();
    if (rev >= minRev) return data;
    await new Promise((r) => setTimeout(r, 150 + attempt * 80));
  }

  /**
   * Хранилище так и не догнало. Записывать НЕЛЬЗЯ: мы применили бы правку к
   * документу без предыдущей и тихо стёрли бы её — ровно то, из-за чего из
   * четырёх полей подряд доезжали два, а каждое сохранение отвечало «Сохранено».
   * Честный отказ оператор повторит; потерю он не заметит.
   */
  console.error(`[overrides] store still behind rev ${minRev} after 10 tries`);
  return null;
}


/** Успешная запись возвращает свой номер: форма запомнит его и пришлёт со
 *  следующей правкой, чтобы та не легла поверх этой. */
export type SaveResult = { ok: true; rev: number } | { ok: false; error: string };

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

  /**
   * Номер ревизии — то, по чему видно, догнало ли хранилище нашу запись.
   *
   * Растёт монотонно от самого большого, что процесс видел или писал сам.
   * Без него «свежесть» приходилось определять по времени из метаданных,
   * которые отстают ровно тогда, когда это важнее всего.
   */
  const rev = Math.max(lastSeenRev, lastWritten?.rev ?? 0) + 1;

  const doc: Overrides = {
    version: VERSION,
    rev,
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
  // То, что записали, помним у себя: хранилище отдаст его не сразу.
  lastWritten = { rev, data };
  lastSeenRev = rev;

  try {
    updateTag(OVERRIDES_TAG);
  } catch {
    revalidateTag(OVERRIDES_TAG, "max");
  }
  return { ok: true, rev };
}
