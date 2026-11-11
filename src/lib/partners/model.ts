import { randomBytes } from "node:crypto";
import { partnersPage } from "@/content/partners";

/**
 * Персональное предложение компании — /<locale>/partners/o/<key>.
 *
 * Владелец, 11.11.2026: «персональный линк для кабинета условно Uzum, Яндекса
 * … они по этому линку проходят, и там конкретный сайт для них». Одна запись =
 * одна компания и одна ссылка; внутри — до трёх пакетов с ценой.
 *
 * Чистые функции без базы — их держат тесты (__tests__/model.test.ts).
 */

export const OFFER_STATUSES = ["draft", "sent", "opened", "negotiation", "contract", "declined"] as const;
export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const STATUS_LABEL: Record<OfferStatus, string> = {
  draft: "Черновик",
  sent: "Отправлено",
  opened: "Открыто",
  negotiation: "Переговоры",
  contract: "Договор",
  declined: "Отказ",
};

export type OfferPackage = {
  title: string;
  /** Сумы без НДС; 0 — «цена по запросу». */
  price: number;
  /** Что входит — строка на пункт. */
  items: string[];
  note: string;
};

export type Offer = {
  id: number;
  key: string;
  company: string;
  /** Контакт в компании — виден только в админке. */
  contact: string;
  logo: string;
  lead: string;
  programs: string[];
  packages: OfferPackage[];
  validUntil: string | null;
  status: OfferStatus;
  revoked: boolean;
  /** Заметка для себя — гостю не показывается. */
  note: string;
  views: number;
  firstViewedAt: string | null;
  lastViewedAt: string | null;
  lastNotifiedAt: string | null;
  contractRequestedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OfferInput = Pick<Offer, "company" | "contact" | "lead" | "programs" | "packages" | "validUntil" | "status" | "note">;

export const MAX_PACKAGES = 3;
const PROGRAM_IDS = new Set(partnersPage.programs.items.map((p) => p.id));

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "",
  ы: "y", ь: "", э: "e", ю: "yu", я: "ya", ў: "o", қ: "q", ғ: "g", ҳ: "h",
};

/**
 * Ключ ссылки: имя компании латиницей + 6 случайных символов —
 * `uzum-k7Qa2x`. Имя — чтобы ссылку было видно в переписке, хвост — чтобы по
 * имени чужое предложение не открыть (62⁶ ≈ 57 млрд вариантов на имя).
 */
export function makeOfferKey(company: string): string {
  const slug = company
    .toLowerCase()
    .split("")
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24)
    .replace(/-+$/, "");
  const alphabet = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  const tail = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  return slug ? `${slug}-${tail}` : `p-${tail}`;
}

/** Ключ из адреса — только то, что могла выдать makeOfferKey. */
export function isOfferKey(key: string): boolean {
  return /^[a-z0-9-]{1,40}-[a-zA-Z0-9]{6}$/.test(key) || /^p-[a-zA-Z0-9]{6}$/.test(key);
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Цена из поля админки: «150 000 000», «150000000» → число; мусор → null. */
export function parsePrice(raw: string): number | null {
  const digits = raw.replace(/[\s  ]/g, "");
  if (!digits) return 0;
  if (!/^\d{1,13}$/.test(digits)) return null;
  return Number(digits);
}

/**
 * Проверка и очистка того, что пришло из формы админки. Возвращает либо
 * готовые данные, либо понятную ошибку — в базу ничего «на авось» не идёт.
 */
export function normalizeOfferInput(raw: {
  company?: unknown;
  contact?: unknown;
  lead?: unknown;
  programs?: unknown;
  packages?: Array<{ title?: unknown; price?: unknown; items?: unknown; note?: unknown }>;
  validUntil?: unknown;
  status?: unknown;
  note?: unknown;
}): { ok: true; value: OfferInput } | { ok: false; error: string } {
  const company = clean(raw.company, 80);
  if (!company) return { ok: false, error: "Укажите компанию." };

  const programs = (Array.isArray(raw.programs) ? raw.programs : []).filter(
    (p): p is string => typeof p === "string" && PROGRAM_IDS.has(p),
  );

  const packages: OfferPackage[] = [];
  for (const [i, p] of (raw.packages ?? []).slice(0, MAX_PACKAGES).entries()) {
    const title = clean(p.title, 80);
    const priceRaw = clean(p.price, 30);
    const items = clean(p.items, 2000)
      .split(/\r?\n/)
      .map((s) => s.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 15)
      .map((s) => s.slice(0, 160));
    const note = clean(p.note, 200);
    if (!title && !priceRaw && items.length === 0 && !note) continue; // пустой слот
    if (!title) return { ok: false, error: `Пакет ${i + 1}: нужно название.` };
    const price = parsePrice(priceRaw);
    if (price === null) return { ok: false, error: `Пакет ${i + 1}: цена «${priceRaw}» — не число.` };
    packages.push({ title, price, items, note });
  }

  const validRaw = clean(raw.validUntil, 10);
  if (validRaw && !/^\d{4}-\d{2}-\d{2}$/.test(validRaw)) return { ok: false, error: "Срок действия — дата." };

  const status = OFFER_STATUSES.includes(raw.status as OfferStatus) ? (raw.status as OfferStatus) : "draft";

  return {
    ok: true,
    value: {
      company,
      contact: clean(raw.contact, 160),
      lead: clean(raw.lead, 1500),
      programs,
      packages,
      validUntil: validRaw || null,
      status,
      note: clean(raw.note, 1000),
    },
  };
}

/** «Сегодня» по Ташкенту, YYYY-MM-DD. */
export function todayTashkent(now = Date.now()): string {
  return new Date(now + 5 * 3600_000).toISOString().slice(0, 10);
}

/** Срок прошёл — страница честно говорит, что предложение устарело. */
export function isExpired(offer: Pick<Offer, "validUntil">, today = todayTashkent()): boolean {
  return !!offer.validUntil && offer.validUntil < today;
}

/**
 * Открытие ссылки двигает статус вперёд только из «отправлено»: переговоры,
 * договор или отказ открытие не откатывает.
 */
export function statusAfterView(status: OfferStatus): OfferStatus {
  return status === "sent" || status === "draft" ? "opened" : status;
}

/** Запрос договора — переговоры, если сделка ещё не дальше. */
export function statusAfterContractRequest(status: OfferStatus): OfferStatus {
  return status === "contract" ? status : "negotiation";
}

/**
 * Уведомлять ли группу об открытии: первое открытие — всегда, дальше не чаще
 * раза в 30 минут. Иначе каждое обновление страницы — сообщение в группу.
 */
export const VIEW_NOTIFY_GAP_MS = 30 * 60_000;
export function shouldNotifyView(lastNotifiedAt: string | null, now = Date.now()): boolean {
  if (!lastNotifiedAt) return true;
  return now - new Date(lastNotifiedAt).getTime() >= VIEW_NOTIFY_GAP_MS;
}

/** Запрос договора с одной ссылки — не чаще раза в 10 минут (защита группы от спама). */
export const CONTRACT_GAP_MS = 10 * 60_000;
export function canRequestContract(contractRequestedAt: string | null, now = Date.now()): boolean {
  if (!contractRequestedAt) return true;
  return now - new Date(contractRequestedAt).getTime() >= CONTRACT_GAP_MS;
}

/** «150 000 000» — пробелы-разделители, как на остальном сайте. */
export function money(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
