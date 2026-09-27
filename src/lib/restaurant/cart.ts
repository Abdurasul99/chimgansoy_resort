import { useSyncExternalStore } from "react";
import { MAX_LINES, MAX_QTY, type CartLine } from "./rules";
import { ORDER_MODES, type OrderMode } from "./model";

/**
 * Корзина ресторана — в localStorage, без контекста React.
 *
 * Без провайдера, потому что корзину читают и страницы ресторана, и шапка
 * сайта («Корзина · 3»), а шапка живёт в общем layout. Внешнее хранилище через
 * useSyncExternalStore видно отовсюду и синхронно между вкладками (событие
 * storage).
 *
 * В корзине только «блюдо × N» и выбранный способ получения. Цены и названия
 * берутся из меню при каждом показе — иначе вчерашняя корзина показала бы
 * вчерашние цены.
 *
 * Хранилище может быть недоступно (приватное окно, запрет сайтовых данных):
 * тогда корзина живёт в памяти до перезагрузки — заказать всё равно можно.
 *
 * Ключ попытки (attempt) — для защиты от дублей: пока состав и контакты те же,
 * повторная отправка идёт с тем же ключом, и сервер вернёт уже созданный
 * заказ. Поменялся состав — ключ новый, это уже другой заказ.
 */

export type CartState = {
  lines: CartLine[];
  mode: OrderMode | null;
  attempt: { key: string; sig: string; at: number } | null;
};

/**
 * Ключ попытки живёт полчаса: этого хватает на повтор после обрыва связи, а
 * вчерашний ключ не должен вернуть вчерашний заказ вместо нового.
 */
const ATTEMPT_TTL_MS = 30 * 60_000;

const KEY = "cd_rest_cart_v1";
const EVENT = "cd-rest-cart";
const EMPTY: CartState = { lines: [], mode: null, attempt: null };

let memory: string | null = null;
// Запись в localStorage однажды не прошла (кончилось место) — дальше корзина
// живёт в памяти: иначе чтение возвращало бы старое содержимое хранилища, и
// «+» переставал бы работать.
let memoryOnly = false;
let cachedRaw: string | null | undefined;
let cached: CartState = EMPTY;

function readRaw(): string | null {
  if (memoryOnly) return memory;
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return memory;
  }
}

function parse(raw: string | null): CartState {
  if (!raw) return EMPTY;
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const lines: CartLine[] = [];
    if (Array.isArray(o.lines)) {
      for (const l of o.lines.slice(0, MAX_LINES)) {
        const id = Number((l as CartLine)?.dishId);
        const qty = Math.floor(Number((l as CartLine)?.qty));
        if (Number.isInteger(id) && id > 0 && qty > 0) lines.push({ dishId: id, qty: Math.min(qty, MAX_QTY) });
      }
    }
    const mode = ORDER_MODES.includes(o.mode as OrderMode) ? (o.mode as OrderMode) : null;
    const a = o.attempt as { key?: unknown; sig?: unknown; at?: unknown } | null | undefined;
    const attempt =
      a && typeof a.key === "string" && typeof a.sig === "string"
        ? { key: a.key, sig: a.sig, at: typeof a.at === "number" ? a.at : 0 }
        : null;
    return { lines, mode, attempt };
  } catch {
    return EMPTY;
  }
}

export function getCart(): CartState {
  if (typeof window === "undefined") return EMPTY;
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cached = parse(raw);
  }
  return cached;
}

function write(next: CartState): void {
  const empty = next.lines.length === 0 && !next.mode && !next.attempt;
  const raw = empty ? null : JSON.stringify(next);
  memory = raw;
  try {
    if (raw === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, raw);
  } catch {
    // Хранилище недоступно — корзина остаётся в памяти.
    memoryOnly = true;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useCart(): CartState {
  return useSyncExternalStore(subscribe, getCart, () => EMPTY);
}

export function cartCount(state: CartState): number {
  return state.lines.reduce((n, l) => n + l.qty, 0);
}

export function qtyOf(state: CartState, dishId: number): number {
  return state.lines.find((l) => l.dishId === dishId)?.qty ?? 0;
}

export function setQty(dishId: number, qty: number): void {
  const cur = getCart();
  const q = Math.max(0, Math.min(Math.floor(qty), MAX_QTY));
  const exists = cur.lines.some((l) => l.dishId === dishId);
  let lines: CartLine[];
  if (q === 0) lines = cur.lines.filter((l) => l.dishId !== dishId);
  else if (exists) lines = cur.lines.map((l) => (l.dishId === dishId ? { ...l, qty: q } : l));
  else if (cur.lines.length >= MAX_LINES) return;
  else lines = [...cur.lines, { dishId, qty: q }];
  write({ ...cur, lines });
}

export function addDish(dishId: number, n = 1): void {
  setQty(dishId, qtyOf(getCart(), dishId) + n);
}

export function removeDishes(ids: number[]): void {
  const cur = getCart();
  write({ ...cur, lines: cur.lines.filter((l) => !ids.includes(l.dishId)) });
}

export function setCartMode(mode: OrderMode | null): void {
  write({ ...getCart(), mode });
}

/** После успешного заказа: корзина пуста, способ получения запомнен. */
export function clearCart(): void {
  write({ lines: [], mode: getCart().mode, attempt: null });
}

function randomKey(): string {
  try {
    const bytes = new Uint8Array(18);
    crypto.getRandomValues(bytes);
    return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  } catch {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
  }
}

/**
 * Ключ попытки для этого содержимого. `sig` — отпечаток того, что уходит
 * серверу (состав, способ, телефон): тот же отпечаток — тот же ключ.
 */
export function attemptKey(sig: string): string {
  const cur = getCart();
  const now = Date.now();
  if (cur.attempt && cur.attempt.sig === sig && now - cur.attempt.at < ATTEMPT_TTL_MS) return cur.attempt.key;
  const key = randomKey();
  write({ ...cur, attempt: { key, sig, at: now } });
  return key;
}
