/**
 * Фоновая досылка уведомлений ресторана.
 *
 * Досылка идёт после каждого заказа и при открытии панели, но ночью, когда
 * заказов нет и панель закрыта, неудачная первая отправка висела бы до утра.
 * Сайт — один процесс Node на своём сервере, поэтому хватает одного таймера
 * на процесс. На сборке таймер не запускается.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (!process.env.DATABASE_URL?.trim()) return;
  const { retryPendingNotifications, telegramReady } = await import("@/lib/restaurant/notify");
  if (!telegramReady()) return;
  const timer = setInterval(() => {
    retryPendingNotifications().catch(() => {});
  }, 60_000);
  timer.unref?.();
}
