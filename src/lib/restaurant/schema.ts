import type { SqlClient } from "@/lib/sql-client";

/**
 * Таблицы ресторана.
 *
 * Создаются самим приложением при первом обращении, а не отдельной миграцией:
 * все шаги идемпотентны (IF NOT EXISTS), а ручной запуск scripts/db-migrate.mjs
 * на сервере — это шаг, который однажды забудут, и тогда первый же заказ
 * упадёт на «relation does not exist». В db-migrate.mjs этой схемы нет
 * намеренно: источник один, здесь.
 *
 * Статусы — text с CHECK, не enum: см. комментарий в model.ts.
 */
export const RESTAURANT_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS restaurant_settings (
     id          int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
     data        jsonb NOT NULL DEFAULT '{}'::jsonb,
     updated_at  timestamptz NOT NULL DEFAULT now(),
     updated_by  text NOT NULL DEFAULT ''
   )`,

  `CREATE TABLE IF NOT EXISTS restaurant_categories (
     id          serial PRIMARY KEY,
     title       jsonb NOT NULL,
     sort        int NOT NULL DEFAULT 0,
     visible     boolean NOT NULL DEFAULT true,
     created_at  timestamptz NOT NULL DEFAULT now(),
     updated_at  timestamptz NOT NULL DEFAULT now()
   )`,

  // Блюдо не удаляется, а уходит в архив: заказы хранят снимок названия и
  // цены, но ссылка на позицию нужна, чтобы понять, что именно заказали.
  `CREATE TABLE IF NOT EXISTS restaurant_dishes (
     id            serial PRIMARY KEY,
     category_id   int REFERENCES restaurant_categories(id) ON DELETE SET NULL,
     title         jsonb NOT NULL,
     description   jsonb NOT NULL DEFAULT '{}'::jsonb,
     portion       text NOT NULL DEFAULT '',
     price         bigint NOT NULL DEFAULT 0 CHECK (price >= 0),
     image         text NOT NULL DEFAULT '',
     availability  text NOT NULL DEFAULT 'available'
                   CHECK (availability IN ('available', 'unavailable', 'preorder')),
     channels      text[] NOT NULL DEFAULT ARRAY['hall', 'takeaway', 'delivery', 'room'],
     state         text NOT NULL DEFAULT 'published'
                   CHECK (state IN ('published', 'hidden', 'archived')),
     sort          int NOT NULL DEFAULT 0,
     created_at    timestamptz NOT NULL DEFAULT now(),
     updated_at    timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS restaurant_dishes_cat_idx ON restaurant_dishes (category_id, sort)`,

  // idem_key — ключ попытки из браузера. Уникальный индекс и есть защита от
  // двойного нажатия и повторной отправки при обрыве связи в горах: второй
  // запрос с тем же ключом получает уже созданный заказ, а не новый.
  `CREATE TABLE IF NOT EXISTS restaurant_orders (
     id                bigserial PRIMARY KEY,
     token             text NOT NULL UNIQUE,
     idem_key          text NOT NULL UNIQUE,
     mode              text NOT NULL CHECK (mode IN ('takeaway', 'delivery', 'room', 'preorder')),
     status            text NOT NULL DEFAULT 'new'
                       CHECK (status IN ('new', 'confirmed', 'cooking', 'ready', 'done', 'cancelled')),
     guest_name        text NOT NULL,
     phone             text NOT NULL,
     details           jsonb NOT NULL DEFAULT '{}'::jsonb,
     desired_time      text NOT NULL DEFAULT 'asap',
     confirmed_time    text NOT NULL DEFAULT '',
     items             jsonb NOT NULL,
     subtotal          bigint NOT NULL DEFAULT 0,
     fee               bigint,
     fee_pending       boolean NOT NULL DEFAULT false,
     total             bigint NOT NULL DEFAULT 0,
     payment_status    text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
     comment           text NOT NULL DEFAULT '',
     locale            text NOT NULL DEFAULT 'ru',
     source            text NOT NULL DEFAULT '',
     page              text NOT NULL DEFAULT '',
     cancel_reason     text NOT NULL DEFAULT '',
     is_test           boolean NOT NULL DEFAULT false,
     tg_messages       jsonb NOT NULL DEFAULT '[]'::jsonb,
     notified_at       timestamptz,
     notify_claimed_at timestamptz,
     created_at        timestamptz NOT NULL DEFAULT now(),
     updated_at        timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS restaurant_orders_status_idx ON restaurant_orders (status, created_at DESC)`,

  `CREATE TABLE IF NOT EXISTS restaurant_tables (
     id                bigserial PRIMARY KEY,
     token             text NOT NULL UNIQUE,
     idem_key          text NOT NULL UNIQUE,
     status            text NOT NULL DEFAULT 'new'
                       CHECK (status IN ('new', 'confirmed', 'declined', 'cancelled', 'done')),
     visit_date        date NOT NULL,
     visit_time        text NOT NULL,
     adults            int NOT NULL DEFAULT 1,
     kids              int NOT NULL DEFAULT 0,
     guest_name        text NOT NULL,
     phone             text NOT NULL,
     comment           text NOT NULL DEFAULT '',
     locale            text NOT NULL DEFAULT 'ru',
     source            text NOT NULL DEFAULT '',
     page              text NOT NULL DEFAULT '',
     cancel_reason     text NOT NULL DEFAULT '',
     is_test           boolean NOT NULL DEFAULT false,
     tg_messages       jsonb NOT NULL DEFAULT '[]'::jsonb,
     notified_at       timestamptz,
     notify_claimed_at timestamptz,
     created_at        timestamptz NOT NULL DEFAULT now(),
     updated_at        timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS restaurant_tables_date_idx ON restaurant_tables (visit_date, visit_time)`,

  // Кто, когда, откуда и почему поменял статус. ТЗ, п. 7: время, сотрудник,
  // причина отмены и история изменений сохраняются всегда.
  `CREATE TABLE IF NOT EXISTS restaurant_status_log (
     id          bigserial PRIMARY KEY,
     kind        text NOT NULL CHECK (kind IN ('order', 'table')),
     entity_id   bigint NOT NULL,
     from_status text,
     to_status   text NOT NULL,
     by_whom     text NOT NULL,
     via         text NOT NULL CHECK (via IN ('site', 'admin', 'telegram')),
     reason      text NOT NULL DEFAULT '',
     at          timestamptz NOT NULL DEFAULT now()
   )`,
  `CREATE INDEX IF NOT EXISTS restaurant_status_log_idx ON restaurant_status_log (kind, entity_id, at)`,

  // Сколько раз пробовали отправить: досылка берёт сначала тех, кого пробовали
  // меньше, — иначе пять вечно неуходящих заказов заслоняли бы все новые.
  `ALTER TABLE restaurant_orders ADD COLUMN IF NOT EXISTS notify_tries int NOT NULL DEFAULT 0`,
  `ALTER TABLE restaurant_tables ADD COLUMN IF NOT EXISTS notify_tries int NOT NULL DEFAULT 0`,
];

const ready = new Map<string, Promise<void>>();

/** Ключ замка, под которым создаётся схема. Любое постоянное число. */
const SCHEMA_LOCK = 7_243_019;

/**
 * Один прогон DDL на процесс и строку подключения. Неудача не запоминается:
 * база могла быть недоступна минуту, и следующий запрос попробует снова.
 *
 * Все шаги — ОДНИМ запросом под транзакционным замком. Два одновременных
 * CREATE TABLE IF NOT EXISTS в Postgres не безопасны: второй падает на
 * «duplicate key … pg_type_typname_nsp_index» (так и было при сборке, где
 * страницы собираются параллельно). Несколько команд в одном простом запросе
 * Postgres выполняет одной транзакцией, поэтому замок отпускается сам —
 * и при успехе, и при ошибке, — а соединение возвращается в пул чистым.
 */
export function ensureSchema(sql: SqlClient, url: string): Promise<void> {
  const existing = ready.get(url);
  if (existing) return existing;
  const p = (async () => {
    await sql.query([`SELECT pg_advisory_xact_lock(${SCHEMA_LOCK})`, ...RESTAURANT_DDL].join(";\n"));
  })();
  ready.set(url, p);
  p.catch(() => ready.delete(url));
  return p;
}

/** Забыть, что схема готова: следующий запрос прогонит DDL заново. */
export function resetSchema(url: string): void {
  ready.delete(url);
}
