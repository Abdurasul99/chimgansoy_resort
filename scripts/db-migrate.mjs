/**
 * Схема мини-PMS. Запускается вручную: node scripts/db-migrate.mjs
 *
 * Каждый шаг идемпотентен (IF NOT EXISTS), поэтому повторный запуск ничего не
 * ломает и не теряет — это важнее краткости, потому что запускать её будут
 * руками и, скорее всего, не один раз.
 *
 * Соединение — прямое (UNPOOLED): pgbouncer не пропускает DDL в транзакции.
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trimStart().startsWith("#"))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);

const url = env.DATABASE_URL_UNPOOLED || env.DATABASE_URL;
if (!url) throw new Error("В .env.local нет DATABASE_URL");
const sql = neon(url);

/** Единицы размещения: 10 шале + 10 глэмпингов. */
const UNITS = [
  ...Array.from({ length: 10 }, (_, i) => ["glamping", `glamping-${String(i + 1).padStart(2, "0")}`, `Глэмпинг A-frame №${i + 1}`, 3]),
  ...Array.from({ length: 10 }, (_, i) => ["cottage", `chalet-${String(i + 1).padStart(2, "0")}`, `Шале №${i + 1}`, 6]),
];

const STEPS = [
  // Статусы вынесены в тип, а не в текст: опечатка «оплочено» в поле-строке
  // тихо создала бы четвёртую категорию, которой нет ни в одном отчёте.
  `DO $$ BEGIN
     CREATE TYPE booking_status AS ENUM ('new', 'confirmed', 'paid', 'cancelled', 'declined', 'done');
   EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

  `CREATE TABLE IF NOT EXISTS units (
     id          text PRIMARY KEY,
     room_slug   text NOT NULL,
     title       text NOT NULL,
     capacity    int  NOT NULL,
     active      boolean NOT NULL DEFAULT true,
     sort        int  NOT NULL DEFAULT 0
   )`,

  `CREATE TABLE IF NOT EXISTS bookings (
     id          bigserial PRIMARY KEY,
     unit_id     text REFERENCES units(id),
     room_slug   text NOT NULL,
     status      booking_status NOT NULL DEFAULT 'new',
     checkin     date NOT NULL,
     checkout    date,
     guest_name  text NOT NULL,
     phone       text NOT NULL,
     email       text,
     adults      int NOT NULL DEFAULT 0,
     kids        int NOT NULL DEFAULT 0,
     comment     text,
     total       bigint NOT NULL DEFAULT 0,
     paid        bigint NOT NULL DEFAULT 0,
     source      text NOT NULL DEFAULT 'site',
     locale      text NOT NULL DEFAULT 'ru',
     created_at  timestamptz NOT NULL DEFAULT now(),
     updated_at  timestamptz NOT NULL DEFAULT now()
   )`,

  // Календарь листают по датам, а панель — по статусу: два самых частых запроса.
  `CREATE INDEX IF NOT EXISTS bookings_dates_idx  ON bookings (checkin, checkout)`,
  `CREATE INDEX IF NOT EXISTS bookings_unit_idx   ON bookings (unit_id, checkin)`,
  `CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings (status, checkin)`,

  // Заявки на услуги — рядом с бронями, но отдельной таблицей: у них нет ни
  // единицы размещения, ни выезда, и складывать их вместе значило бы половину
  // колонок держать пустыми.
  `CREATE TABLE IF NOT EXISTS service_requests (
     id           bigserial PRIMARY KEY,
     service_slug text NOT NULL,
     service_name text NOT NULL,
     status       booking_status NOT NULL DEFAULT 'new',
     visit_date   date,
     guest_name   text NOT NULL,
     phone        text NOT NULL,
     email        text,
     answers      jsonb NOT NULL DEFAULT '{}'::jsonb,
     total        bigint NOT NULL DEFAULT 0,
     paid         bigint NOT NULL DEFAULT 0,
     locale       text NOT NULL DEFAULT 'ru',
     created_at   timestamptz NOT NULL DEFAULT now(),
     updated_at   timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS requests_status_idx ON service_requests (status, created_at DESC)`,

  // Цена за ночь по датам. Пусто на дату — действует обычный прайс.
  `CREATE TABLE IF NOT EXISTS rates (
     room_slug  text NOT NULL,
     day        date NOT NULL,
     price      bigint NOT NULL,
     note       text,
     PRIMARY KEY (room_slug, day)
   )`,

  // Ключ переноса из Blob: по нему повторный импорт узнаёт своё и не задваивает
  // заявки. Уникальный индекс — это и есть вся защита от двойного нажатия.
  `ALTER TABLE bookings ADD COLUMN IF NOT EXISTS source_id text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS bookings_source_idx ON bookings (source_id) WHERE source_id IS NOT NULL`,
  `ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS source_id text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS requests_source_idx ON service_requests (source_id) WHERE source_id IS NOT NULL`,

  // Кто и когда поменял статус. Без этого «а кто отменил бронь» не ответить.
  `CREATE TABLE IF NOT EXISTS status_log (
     id          bigserial PRIMARY KEY,
     kind        text NOT NULL,
     entity_id   bigint NOT NULL,
     from_status booking_status,
     to_status   booking_status NOT NULL,
     by_whom     text NOT NULL DEFAULT 'admin',
     at          timestamptz NOT NULL DEFAULT now()
   )`,
];

for (const [i, step] of STEPS.entries()) {
  await sql.query(step);
  console.log(`шаг ${i + 1}/${STEPS.length} — ок`);
}

for (const [slug, id, title, cap] of UNITS) {
  await sql.query(
    `INSERT INTO units (id, room_slug, title, capacity, sort) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO NOTHING`,
    [id, slug, title, cap, UNITS.findIndex((u) => u[1] === id)],
  );
}

const [{ count }] = await sql.query(`SELECT count(*)::int AS count FROM units`);
const tables = await sql.query(
  `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
);
console.log(`\nединиц размещения: ${count}`);
console.log(`таблицы: ${tables.map((t) => t.table_name).join(", ")}`);
