/**
 * Ограничение частоты заказов с одного адреса.
 *
 * В памяти процесса — и этого достаточно: сайт с 15.09.2026 работает одним
 * процессом на своём сервере, а не на serverless, где каждая функция живёт
 * отдельно (комментарий в admin/actions.ts писался для той эпохи). Лимит
 * мягкий: он против скрипта, который шлёт заказы очередью, а не против
 * компании, которая заказывает второй раз за вечер.
 */
const WINDOW_MS = 10 * 60_000;
const MAX_PER_WINDOW = 12;

const hits = new Map<string, number[]>();

export function allow(key: string, now = Date.now()): boolean {
  if (!key) return true;
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  // Не даём карте расти бесконечно: за пять тысяч адресов — выметаем старьё.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return true;
}

export function clientIp(h: Headers): string {
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
}

/** Только для тестов. */
export function resetRateLimit(): void {
  hits.clear();
}
