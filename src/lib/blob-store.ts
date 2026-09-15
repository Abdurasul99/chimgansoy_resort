import { randomBytes } from "node:crypto";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Хранилище файлов оператора: правки панели, архив заявок, фото домиков, видео.
 *
 * Раньше это был Vercel Blob. После переезда файлы лежат на диске сервера, а
 * отдаёт их nginx по адресу /blob/ — гонять видео через Node незачем.
 *
 * API повторяет `@vercel/blob` (put/list/del/head) намеренно: вызывающий код
 * не переписывался, поменялось только, где лежат байты. Отличия от оригинала
 * там, где они неизбежны, отмечены комментариями.
 *
 * ДВА АДРЕСА, И ЭТО ВАЖНО
 * -----------------------
 * `put()` отдаёт ПУБЛИЧНЫЙ адрес: он попадает в данные (например, в карточку
 * домика) и открывается в браузере гостя.
 *
 * `head()` и `list()` отдают ВНУТРЕННИЙ адрес (127.0.0.1): по ним ходит сам
 * сервер, когда читает документ или заявку. Публичный адрес здесь означал бы
 * выход наружу и возврат на себя же — лишний круг через интернет ради файла,
 * лежащего на соседней дорожке диска.
 */
const ROOT = process.env.BLOB_DIR?.trim() || "/var/lib/chimgan-blob";

function base(kind: "public" | "internal") {
  if (kind === "internal") {
    const raw = process.env.BLOB_INTERNAL_BASE?.trim() || "http://127.0.0.1/blob";
    return raw.replace(/\/+$/, "");
  }
  const raw = process.env.BLOB_PUBLIC_BASE?.trim() || "https://chimgandarbaza.uz/blob";
  return raw.replace(/\/+$/, "");
}

export type PutOptions = {
  access?: "public";
  contentType?: string;
  addRandomSuffix?: boolean;
  allowOverwrite?: boolean;
  cacheControlMaxAge?: number;
  abortSignal?: AbortSignal;
};

export type BlobResult = {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: Date;
  contentType?: string;
};

export class BlobNotFoundError extends Error {
  constructor(pathname: string) {
    super(`Файл не найден в хранилище: ${pathname}`);
    this.name = "BlobNotFoundError";
  }
}

/**
 * Путь внутри хранилища и никуда больше.
 *
 * Имена приходят из кода, но одно из них собирается из пользовательских данных
 * (услуга и дата в архиве заявок). Без этой проверки `../` в имени писал бы
 * куда угодно на диске — проверка стоит дёшево, а стоимость её отсутствия
 * измеряется не в багах.
 */
function resolveSafe(pathname: string): string {
  const clean = pathname.replace(/^\/+/, "");
  const full = path.resolve(ROOT, clean);
  if (full !== ROOT && !full.startsWith(ROOT + path.sep)) {
    throw new Error(`Недопустимый путь в хранилище: ${pathname}`);
  }
  return full;
}

function urlFor(pathname: string, kind: "public" | "internal" = "public"): string {
  const encoded = pathname.split("/").map(encodeURIComponent).join("/");
  return `${base(kind)}/${encoded}`;
}

/** Обратное преобразование: из адреса — во внутреннее имя файла. */
export function pathnameFromUrl(url: string): string {
  const marker = "/blob/";
  const at = url.indexOf(marker);
  const tail = at >= 0 ? url.slice(at + marker.length) : url;
  return tail
    .split("?")[0]
    .split("/")
    .map((s) => {
      try {
        return decodeURIComponent(s);
      } catch {
        return s;
      }
    })
    .join("/");
}

export async function put(
  pathname: string,
  body: string | Buffer | Uint8Array,
  options: PutOptions = {},
): Promise<BlobResult> {
  let target = pathname.replace(/^\/+/, "");

  // Случайный суффикс — не украшение: по такому адресу лежит заявка с именем и
  // телефоном гостя, и угадываемый адрес означал бы, что её может открыть
  // любой, кто подставит дату.
  if (options.addRandomSuffix) {
    const ext = path.extname(target);
    const stem = ext ? target.slice(0, -ext.length) : target;
    target = `${stem}-${randomBytes(8).toString("hex")}${ext}`;
  }

  const full = resolveSafe(target);

  if (options.allowOverwrite === false) {
    const exists = await stat(full).then(
      () => true,
      () => false,
    );
    if (exists) throw new Error(`Файл уже существует: ${target}`);
  }

  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
  const info = await stat(full);

  return {
    url: urlFor(target, "public"),
    pathname: target,
    size: info.size,
    uploadedAt: info.mtime,
    contentType: options.contentType,
  };
}

async function walk(dir: string, prefix = ""): Promise<{ pathname: string; size: number; uploadedAt: Date }[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const out: { pathname: string; size: number; uploadedAt: Date }[] = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      out.push(...(await walk(path.join(dir, entry.name), rel)));
    } else if (entry.isFile()) {
      const info = await stat(path.join(dir, entry.name));
      out.push({ pathname: rel, size: info.size, uploadedAt: info.mtime });
    }
  }
  return out;
}

export async function list(options: { prefix?: string; limit?: number; cursor?: string } = {}): Promise<{
  blobs: BlobResult[];
  cursor?: string;
  hasMore: boolean;
}> {
  const all = (await walk(ROOT))
    .filter((f) => !options.prefix || f.pathname.startsWith(options.prefix.replace(/^\/+/, "")))
    // Имя несёт метку времени, поэтому сортировка по имени — это и порядок
    // подачи. Так же вёл себя list() хранилища, и код архива на это опирается.
    .sort((a, b) => a.pathname.localeCompare(b.pathname));

  const from = options.cursor ? Number(options.cursor) || 0 : 0;
  const limit = options.limit ?? 1000;
  const page = all.slice(from, from + limit);
  const next = from + limit;

  return {
    blobs: page.map((f) => ({
      url: urlFor(f.pathname, "internal"),
      pathname: f.pathname,
      size: f.size,
      uploadedAt: f.uploadedAt,
    })),
    cursor: next < all.length ? String(next) : undefined,
    hasMore: next < all.length,
  };
}

export async function head(pathnameOrUrl: string): Promise<BlobResult> {
  const pathname = pathnameFromUrl(pathnameOrUrl);
  const full = resolveSafe(pathname);
  const info = await stat(full).catch(() => null);
  if (!info) throw new BlobNotFoundError(pathname);
  return {
    url: urlFor(pathname, "internal"),
    pathname,
    size: info.size,
    uploadedAt: info.mtime,
  };
}

export async function del(urlOrPathname: string | string[]): Promise<void> {
  const items = Array.isArray(urlOrPathname) ? urlOrPathname : [urlOrPathname];
  for (const item of items) {
    const full = resolveSafe(pathnameFromUrl(item));
    await rm(full, { force: true });
  }
}
