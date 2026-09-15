import { Pool } from "pg";

/**
 * Клиент Postgres для мини-PMS.
 *
 * Раньше здесь был `neon()` из `@neondatabase/serverless` — он ходит в базу по
 * HTTP и работает только с Neon. После переезда база живёт на том же сервере,
 * что и сайт, поэтому транспорт обычный, по TCP.
 *
 * Форма ответа намеренно оставлена прежней: `query(text, params)` отдаёт
 * **массив строк**, как отдавал Neon, а не `{ rows }` из node-postgres. Так
 * вызывающий код (db.ts, pms.ts, import-blob.ts) не пришлось переписывать —
 * менялся транспорт, а не логика, и диффу нечего было скрывать.
 *
 * Пул на процесс, а не соединение на запрос: сайт отвечает короткими
 * запросами, и открывать под каждый своё соединение — заново платить за
 * рукопожатие. Пул один на строку подключения, потому что их две: обычная и
 * прямая (для миграций).
 */
const pools = new Map<string, Pool>();

function poolFor(url: string): Pool {
  const existing = pools.get(url);
  if (existing) return existing;

  const pool = new Pool({
    connectionString: url,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  // Без этого обработчика разрыв простаивающего соединения роняет процесс:
  // node-postgres поднимает 'error' на самом пуле, а необработанное событие
  // 'error' в Node — исключение. Сайт не должен падать оттого, что база
  // закрыла неиспользуемое соединение.
  pool.on("error", (err) => {
    console.error("[db] соединение в пуле оборвалось:", err.message);
  });

  pools.set(url, pool);
  return pool;
}

export type SqlClient = {
  query: (text: string, params?: unknown[]) => Promise<Record<string, unknown>[]>;
};

export function sqlClient(url: string): SqlClient {
  const pool = poolFor(url);
  return {
    query: async (text, params) => {
      const res = await pool.query(text, params as unknown[]);
      return res.rows;
    },
  };
}
