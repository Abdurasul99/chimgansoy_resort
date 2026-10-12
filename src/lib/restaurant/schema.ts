import type { SqlClient } from "@/lib/sql-client";

/**
 * Таблицы ресторана.
 *
 * Создаются самим приложением при первом обращении, а не отдельной миграцией:
 * все шаги идемпотентны (IF NOT EXISTS), а ручной запуск scripts/db-migrate.mjs
 * на сервере — это шаг, который однажды забудут. В db-migrate.mjs этой схемы
 * нет намеренно: источник один, здесь.
 *
 * Таблицы заказов, столов и истории статусов (restaurant_orders,
 * restaurant_tables, restaurant_status_log) создавались здесь до 12.10.2026,
 * пока ресторан принимал заказы. В рабочей базе они остались пустыми; код их
 * больше не создаёт и не читает.
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

  // channels (где подаётся блюдо) остались от заказов: столбец не читается,
  // новые блюда получают значение по умолчанию.
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
