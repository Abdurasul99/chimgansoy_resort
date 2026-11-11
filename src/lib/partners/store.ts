import { sqlClient, type SqlClient } from "@/lib/sql-client";
import { OFFER_STATUSES, type Offer, type OfferInput, type OfferPackage, type OfferStatus } from "./model";

/**
 * База партнёрских предложений — та же Postgres на сервере, что у ресторана.
 *
 * Таблица создаётся самим приложением при первом обращении (как у ресторана,
 * lib/restaurant/schema.ts): шаг идемпотентный, отдельной миграции, которую
 * забудут запустить, нет. Все функции бросают исключения — вызывающий обязан
 * узнать, что запись не прошла.
 */

const DDL = [
  `CREATE TABLE IF NOT EXISTS partner_offers (
     id                     serial PRIMARY KEY,
     key                    text NOT NULL UNIQUE,
     company                text NOT NULL,
     contact                text NOT NULL DEFAULT '',
     logo                   text NOT NULL DEFAULT '',
     lead                   text NOT NULL DEFAULT '',
     programs               text[] NOT NULL DEFAULT '{}',
     packages               jsonb NOT NULL DEFAULT '[]'::jsonb,
     valid_until            date,
     status                 text NOT NULL DEFAULT 'draft'
                              CHECK (status IN (${OFFER_STATUSES.map((s) => `'${s}'`).join(", ")})),
     revoked                boolean NOT NULL DEFAULT false,
     note                   text NOT NULL DEFAULT '',
     views                  int NOT NULL DEFAULT 0,
     first_viewed_at        timestamptz,
     last_viewed_at         timestamptz,
     last_notified_at       timestamptz,
     contract_requested_at  timestamptz,
     created_at             timestamptz NOT NULL DEFAULT now(),
     updated_at             timestamptz NOT NULL DEFAULT now()
   )`,
];

/** Ключ замка, под которым создаётся схема (у ресторана — 7 243 019). */
const SCHEMA_LOCK = 7_243_021;
const ready = new Map<string, Promise<void>>();

function ensureSchema(sql: SqlClient, url: string): Promise<void> {
  const existing = ready.get(url);
  if (existing) return existing;
  const p = sql.query([`SELECT pg_advisory_xact_lock(${SCHEMA_LOCK})`, ...DDL].join(";\n")).then(() => undefined);
  ready.set(url, p);
  p.catch(() => ready.delete(url));
  return p;
}

function connect(): { sql: SqlClient; url: string } {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL не задан");
  return { sql: sqlClient(url), url };
}

async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  const { sql, url } = connect();
  await ensureSchema(sql, url);
  try {
    return (await sql.query(text, params)) as T[];
  } catch (e) {
    // Таблицы нет — базу пересоздали, пока процесс работал: схема ещё раз.
    if ((e as { code?: string }).code !== "42P01") throw e;
    ready.delete(url);
    await ensureSchema(sql, url);
    return (await sql.query(text, params)) as T[];
  }
}

const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);
const day = (v: unknown) => (v instanceof Date ? new Date(v.getTime() - v.getTimezoneOffset() * 60_000).toISOString().slice(0, 10) : v ? String(v).slice(0, 10) : null);

function mapOffer(r: Record<string, unknown>): Offer {
  return {
    id: Number(r.id),
    key: String(r.key),
    company: String(r.company),
    contact: String(r.contact ?? ""),
    logo: String(r.logo ?? ""),
    lead: String(r.lead ?? ""),
    programs: (r.programs as string[]) ?? [],
    packages: (r.packages as OfferPackage[]) ?? [],
    validUntil: day(r.valid_until),
    status: r.status as OfferStatus,
    revoked: Boolean(r.revoked),
    note: String(r.note ?? ""),
    views: Number(r.views ?? 0),
    firstViewedAt: iso(r.first_viewed_at),
    lastViewedAt: iso(r.last_viewed_at),
    lastNotifiedAt: iso(r.last_notified_at),
    contractRequestedAt: iso(r.contract_requested_at),
    createdAt: iso(r.created_at) ?? "",
    updatedAt: iso(r.updated_at) ?? "",
  };
}

export async function listOffers(): Promise<Offer[]> {
  return (await q(`SELECT * FROM partner_offers ORDER BY updated_at DESC, id DESC`)).map(mapOffer);
}

export async function getOffer(id: number): Promise<Offer | null> {
  const rows = await q(`SELECT * FROM partner_offers WHERE id = $1`, [id]);
  return rows[0] ? mapOffer(rows[0]) : null;
}

export async function getOfferByKey(key: string): Promise<Offer | null> {
  const rows = await q(`SELECT * FROM partner_offers WHERE key = $1`, [key]);
  return rows[0] ? mapOffer(rows[0]) : null;
}

export async function createOffer(key: string, input: OfferInput): Promise<number> {
  const rows = await q<{ id: number }>(
    `INSERT INTO partner_offers (key, company, contact, lead, programs, packages, valid_until, status, note)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9) RETURNING id`,
    [key, input.company, input.contact, input.lead, input.programs, JSON.stringify(input.packages), input.validUntil, input.status, input.note],
  );
  return Number(rows[0].id);
}

export async function updateOffer(id: number, input: OfferInput): Promise<void> {
  await q(
    `UPDATE partner_offers
        SET company = $2, contact = $3, lead = $4, programs = $5, packages = $6::jsonb,
            valid_until = $7, status = $8, note = $9, updated_at = now()
      WHERE id = $1`,
    [id, input.company, input.contact, input.lead, input.programs, JSON.stringify(input.packages), input.validUntil, input.status, input.note],
  );
}

/** Возвращает прежний логотип, чтобы удалить файл. */
export async function setOfferLogo(id: number, logo: string): Promise<string> {
  const rows = await q<{ old: string }>(
    `UPDATE partner_offers o SET logo = $2, updated_at = now()
       FROM (SELECT logo AS old FROM partner_offers WHERE id = $1) prev
      WHERE o.id = $1 RETURNING prev.old`,
    [id, logo],
  );
  return rows[0]?.old ?? "";
}

export async function setOfferRevoked(id: number, revoked: boolean): Promise<void> {
  await q(`UPDATE partner_offers SET revoked = $2, updated_at = now() WHERE id = $1`, [id, revoked]);
}

export async function deleteOffer(id: number): Promise<string> {
  const rows = await q<{ logo: string }>(`DELETE FROM partner_offers WHERE id = $1 RETURNING logo`, [id]);
  return rows[0]?.logo ?? "";
}

/** Новый ключ — старая ссылка перестаёт открываться (если ушла не тому). */
export async function rekeyOffer(id: number, key: string): Promise<void> {
  await q(`UPDATE partner_offers SET key = $2, updated_at = now() WHERE id = $1`, [id, key]);
}

/**
 * Отметить открытие. Счётчик, даты и статус — одним запросом; возвращает
 * запись ДО обновления уведомления, чтобы решить, писать ли в группу.
 */
export async function recordView(key: string, nextStatus: (s: OfferStatus) => OfferStatus): Promise<Offer | null> {
  const offer = await getOfferByKey(key);
  if (!offer || offer.revoked) return null;
  await q(
    `UPDATE partner_offers
        SET views = views + 1,
            first_viewed_at = COALESCE(first_viewed_at, now()),
            last_viewed_at = now(),
            status = $2
      WHERE id = $1`,
    [offer.id, nextStatus(offer.status)],
  );
  return { ...offer, views: offer.views + 1 };
}

export async function markNotified(id: number): Promise<void> {
  await q(`UPDATE partner_offers SET last_notified_at = now() WHERE id = $1`, [id]);
}

export async function markContractRequested(id: number, status: OfferStatus): Promise<void> {
  await q(`UPDATE partner_offers SET contract_requested_at = now(), status = $2, updated_at = now() WHERE id = $1`, [id, status]);
}
