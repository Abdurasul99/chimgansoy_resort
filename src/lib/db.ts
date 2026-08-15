import { neon } from "@neondatabase/serverless";

/**
 * Доступ к базе мини-PMS.
 *
 * Правило одно и оно важнее удобства: **запись в базу никогда не ломает
 * заявку**. Гость уже нажал «отправить», письмо и сообщение в Telegram ушли —
 * и если база в этот момент недоступна, потерять нужно строку в журнале, а не
 * лид. Поэтому все функции здесь ловят свои ошибки и возвращают null, а вызовы
 * идут ПОСЛЕ доставки, а не вместо неё.
 *
 * Пул (DATABASE_URL), а не прямое соединение: приложение живёт короткими
 * запросами из serverless-функций, и открывать под каждый своё соединение
 * Neon не даст. Прямое нужно только миграциям — см. scripts/db-migrate.mjs.
 */
function client() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("[db] DATABASE_URL не задан — запись пропущена");
    return null;
  }
  return neon(url);
}

/** Одинаковый для броней и услуг: панель показывает их в одной логике. */
export type PmsStatus = "new" | "confirmed" | "paid" | "cancelled" | "declined" | "done";

export type NewBooking = {
  roomSlug: string;
  checkin: string;
  checkout?: string;
  guestName: string;
  phone: string;
  email?: string;
  adults: number;
  kids: number;
  comment?: string;
  locale: string;
  /** «site» для заявок с сайта, «admin» для заведённых руками. */
  source?: string;
  /** Сумма. Пишется сразу, чтобы не делать второй запрос ради одного поля. */
  total?: number;
  unitId?: string | null;
};

/**
 * Бронь из заявки с сайта.
 *
 * unit_id намеренно пуст: гость выбирает тип домика, а конкретную единицу
 * назначает оператор, когда подтверждает. Ставить её автоматически значило бы
 * занимать номер, который человек ещё не подтвердил.
 */
export async function insertBooking(b: NewBooking): Promise<number | null> {
  const sql = client();
  if (!sql) return null;
  try {
    const rows = await sql.query(
      `INSERT INTO bookings
         (room_slug, checkin, checkout, guest_name, phone, email, adults, kids, comment,
          locale, source, total, unit_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id`,
      [
        b.roomSlug,
        b.checkin,
        b.checkout || null,
        b.guestName,
        b.phone,
        b.email || null,
        b.adults,
        b.kids,
        b.comment || null,
        b.locale,
        b.source ?? "site",
        Math.max(0, Math.round(b.total ?? 0)),
        b.unitId ?? null,
      ],
    );
    return (rows as { id: number }[])[0]?.id ?? null;
  } catch (e) {
    console.error("[db] не удалось записать бронь:", e);
    return null;
  }
}

export type NewServiceRequest = {
  serviceSlug: string;
  serviceName: string;
  visitDate?: string;
  guestName: string;
  phone: string;
  email?: string;
  /** Ответы на поля формы: ключ поля → что написал гость. */
  answers: Record<string, string>;
  total?: number;
  locale: string;
};

export async function insertServiceRequest(r: NewServiceRequest): Promise<number | null> {
  const sql = client();
  if (!sql) return null;
  try {
    const rows = await sql.query(
      `INSERT INTO service_requests
         (service_slug, service_name, visit_date, guest_name, phone, email, answers, total, locale)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9)
       RETURNING id`,
      [
        r.serviceSlug,
        r.serviceName,
        r.visitDate || null,
        r.guestName,
        r.phone,
        r.email || null,
        JSON.stringify(r.answers),
        r.total ?? 0,
        r.locale,
      ],
    );
    return (rows as { id: number }[])[0]?.id ?? null;
  } catch (e) {
    console.error("[db] не удалось записать заявку на услугу:", e);
    return null;
  }
}
