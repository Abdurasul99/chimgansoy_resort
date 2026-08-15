import { neon } from "@neondatabase/serverless";
import type { PmsStatus } from "@/lib/db";

/**
 * Чтение и правка броней — то, чем оператор работает каждый день.
 *
 * Отдельно от db.ts намеренно: там запись заявок с сайта, и её правило —
 * «никогда не ломать заявку», поэтому ошибки там глотаются. Здесь наоборот:
 * если смена статуса не удалась, оператор ОБЯЗАН это увидеть, иначе он уйдёт
 * уверенным, что бронь оплачена, а в базе останется «новая».
 */
function sql() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL не задан");
  return neon(url);
}

export const STATUS_LABEL: Record<PmsStatus, string> = {
  new: "Заявка",
  confirmed: "Подтверждена",
  paid: "Оплачена",
  done: "Завершена",
  cancelled: "Отменена",
  declined: "Отказ",
};

/**
 * Куда можно перейти из каждого статуса.
 *
 * Не «любой в любой»: оплаченную бронь нельзя вернуть в «заявку», иначе история
 * денег перестаёт сходиться. Завершённая и отменённая — конечные.
 */
export const NEXT_STATUS: Record<PmsStatus, PmsStatus[]> = {
  new: ["confirmed", "declined", "cancelled"],
  confirmed: ["paid", "cancelled", "declined"],
  paid: ["done", "cancelled"],
  done: [],
  cancelled: [],
  declined: [],
};

export type BookingRow = {
  id: number;
  unit_id: string | null;
  room_slug: string;
  status: PmsStatus;
  checkin: string;
  checkout: string | null;
  guest_name: string;
  phone: string;
  email: string | null;
  adults: number;
  kids: number;
  comment: string | null;
  total: number;
  paid: number;
  source: string;
  locale: string;
  created_at: string;
};

export type UnitRow = { id: string; room_slug: string; title: string; capacity: number; active: boolean };

export async function listUnits(): Promise<UnitRow[]> {
  return (await sql().query(`SELECT id, room_slug, title, capacity, active FROM units ORDER BY sort`)) as UnitRow[];
}

/** Брони за окно дат. Отменённые видны — оператор должен понимать, что было. */
export async function listBookings(from: string, to: string): Promise<BookingRow[]> {
  return (await sql().query(
    `SELECT id, unit_id, room_slug, status, checkin::text, checkout::text, guest_name, phone, email,
            adults, kids, comment, total, paid, source, locale, created_at::text
       FROM bookings
      WHERE checkin <= $2 AND coalesce(checkout, checkin) >= $1
      ORDER BY checkin, id`,
    [from, to],
  )) as BookingRow[];
}

export async function getBooking(id: number): Promise<BookingRow | null> {
  const rows = (await sql().query(
    `SELECT id, unit_id, room_slug, status, checkin::text, checkout::text, guest_name, phone, email,
            adults, kids, comment, total, paid, source, locale, created_at::text
       FROM bookings WHERE id = $1`,
    [id],
  )) as BookingRow[];
  return rows[0] ?? null;
}

/**
 * Свободна ли единица на эти даты.
 *
 * Заезд в день выезда предыдущего гостя — это НЕ пересечение: номер
 * освобождается к 12:00, а заезд с 15:00. Поэтому сравнение строгое по одной
 * границе. Отменённые и отказанные брони место не занимают.
 */
export async function isUnitFree(
  unitId: string,
  checkin: string,
  checkout: string | null,
  exceptBookingId?: number,
): Promise<boolean> {
  const out = checkout ?? checkin;
  const rows = (await sql().query(
    `SELECT 1 FROM bookings
      WHERE unit_id = $1
        AND status NOT IN ('cancelled', 'declined')
        AND ($4::bigint IS NULL OR id <> $4)
        AND checkin < $3::date
        AND coalesce(checkout, checkin + 1) > $2::date
      LIMIT 1`,
    [unitId, checkin, out, exceptBookingId ?? null],
  )) as unknown[];
  return rows.length === 0;
}

/** Смена статуса с записью в журнал: «кто отменил бронь» должно иметь ответ. */
export async function setBookingStatus(id: number, to: PmsStatus, by = "admin"): Promise<BookingRow> {
  const before = await getBooking(id);
  if (!before) throw new Error("Бронь не найдена");
  if (before.status !== to && !NEXT_STATUS[before.status].includes(to)) {
    throw new Error(`Из «${STATUS_LABEL[before.status]}» нельзя перейти в «${STATUS_LABEL[to]}»`);
  }

  await sql().query(`UPDATE bookings SET status = $2, updated_at = now() WHERE id = $1`, [id, to]);
  await sql().query(
    `INSERT INTO status_log (kind, entity_id, from_status, to_status, by_whom) VALUES ('booking', $1, $2, $3, $4)`,
    [id, before.status, to, by],
  );

  return (await getBooking(id))!;
}

/** Закрепление номера за гостем. Занятую единицу не даёт назначить — молча
 *  поставить двоих в один домик хуже, чем отказать оператору. */
export async function assignUnit(id: number, unitId: string | null): Promise<BookingRow> {
  const b = await getBooking(id);
  if (!b) throw new Error("Бронь не найдена");

  if (unitId) {
    const units = await listUnits();
    const unit = units.find((u) => u.id === unitId);
    if (!unit) throw new Error("Такого номера нет");
    if (unit.room_slug !== b.room_slug) throw new Error("Этот номер другого типа");
    if (!(await isUnitFree(unitId, b.checkin, b.checkout, id))) {
      throw new Error("Номер занят на эти даты");
    }
  }

  await sql().query(`UPDATE bookings SET unit_id = $2, updated_at = now() WHERE id = $1`, [id, unitId]);
  return (await getBooking(id))!;
}

/** Суммы: сколько стоит и сколько внесено. */
export async function setBookingMoney(id: number, total: number, paid: number): Promise<BookingRow> {
  await sql().query(`UPDATE bookings SET total = $2, paid = $3, updated_at = now() WHERE id = $1`, [
    id,
    Math.max(0, Math.round(total)),
    Math.max(0, Math.round(paid)),
  ]);
  return (await getBooking(id))!;
}

export type ServiceRequestRow = {
  id: number;
  service_slug: string;
  service_name: string;
  status: PmsStatus;
  visit_date: string | null;
  guest_name: string;
  phone: string;
  email: string | null;
  answers: Record<string, string>;
  total: number;
  paid: number;
  created_at: string;
};

export async function listServiceRequests(limit = 200): Promise<ServiceRequestRow[]> {
  return (await sql().query(
    `SELECT id, service_slug, service_name, status, visit_date::text, guest_name, phone, email,
            answers, total, paid, created_at::text
       FROM service_requests ORDER BY created_at DESC LIMIT $1`,
    [limit],
  )) as ServiceRequestRow[];
}

/** Тот же переход статусов, что у броней: у оператора одна логика на всё. */
export async function setServiceStatus(id: number, to: PmsStatus, by = "admin"): Promise<void> {
  const rows = (await sql().query(`SELECT status FROM service_requests WHERE id = $1`, [id])) as {
    status: PmsStatus;
  }[];
  const from = rows[0]?.status;
  if (!from) throw new Error("Заявка не найдена");
  if (from !== to && !NEXT_STATUS[from].includes(to)) {
    throw new Error(`Из «${STATUS_LABEL[from]}» нельзя перейти в «${STATUS_LABEL[to]}»`);
  }

  await sql().query(`UPDATE service_requests SET status = $2, updated_at = now() WHERE id = $1`, [id, to]);
  await sql().query(
    `INSERT INTO status_log (kind, entity_id, from_status, to_status, by_whom) VALUES ('service', $1, $2, $3, $4)`,
    [id, from, to, by],
  );
}

export type RateRow = { room_slug: string; day: string; price: number; note: string | null };

/** Цены по датам за окно. Пусто на дату — действует обычный прайс. */
export async function listRates(from: string, to: string): Promise<RateRow[]> {
  return (await sql().query(
    `SELECT room_slug, day::text, price, note FROM rates WHERE day BETWEEN $1 AND $2 ORDER BY day`,
    [from, to],
  )) as RateRow[];
}

/**
 * Цена на диапазон дат разом.
 *
 * По одному дню оператор задавать не станет — «с 1 по 30 сентября столько» это
 * то, как о ценах думают. Пустая цена стирает запись: тогда на эти даты снова
 * действует обычный прайс, и это единственный способ отменить праздничную
 * наценку, не удаляя её по одному дню.
 */
export async function setRateRange(
  roomSlug: string,
  from: string,
  to: string,
  price: number | null,
  note?: string,
  /**
   * Дни недели, к которым применить цену: 0 — воскресенье, 6 — суббота.
   * Пусто — все дни диапазона.
   *
   * Ради выходных это и сделано: у оператора пятница, суббота и воскресенье
   * стоят иначе, и задавать их по одному дню на месяц вперёд — двенадцать
   * заходов в форму вместо одного.
   */
  dows?: number[],
): Promise<number> {
  // extract(dow) в Postgres: 0 — воскресенье, как и в JS.
  const pick = dows && dows.length ? dows : null;

  if (price === null) {
    const res = await sql().query(
      `DELETE FROM rates
        WHERE room_slug = $1 AND day BETWEEN $2 AND $3
          AND ($4::int[] IS NULL OR extract(dow from day)::int = ANY($4))
        RETURNING day`,
      [roomSlug, from, to, pick],
    );
    return (res as unknown[]).length;
  }

  const res = await sql().query(
    `INSERT INTO rates (room_slug, day, price, note)
     SELECT $1, d::date, $4, $5
       FROM generate_series($2::date, $3::date, '1 day') AS d
      WHERE $6::int[] IS NULL OR extract(dow from d)::int = ANY($6)
     ON CONFLICT (room_slug, day) DO UPDATE SET price = excluded.price, note = excluded.note
     RETURNING day`,
    [roomSlug, from, to, Math.max(0, Math.round(price)), note?.trim() || null, pick],
  );
  return (res as unknown[]).length;
}

/** Занятость: только те брони, за которыми закреплён номер. */
export async function occupancy(from: string, to: string): Promise<BookingRow[]> {
  return (await listBookings(from, to)).filter(
    (b) => b.unit_id && b.status !== "cancelled" && b.status !== "declined",
  );
}

/**
 * Сколько единиц этого типа свободно на даты.
 *
 * Считает только те брони, за которыми закреплён номер: заявка без номера
 * инвентарь не занимает — иначе десять неподтверждённых заявок закрыли бы
 * продажи на месяц.
 *
 * Никогда не бросает: недоступная база не должна мешать гостю оставить заявку.
 * В этом случае возвращает число единиц как есть — пусть лучше оператор
 * разберётся с пересечением руками, чем сайт откажет реальному гостю.
 */
export async function freeUnits(roomSlug: string, checkin: string, checkout: string | null): Promise<number> {
  const out = checkout ?? checkin;
  try {
    const rows = (await sql().query(
      `SELECT count(*)::int AS n FROM units u
        WHERE u.room_slug = $1 AND u.active
          AND NOT EXISTS (
            SELECT 1 FROM bookings b
             WHERE b.unit_id = u.id
               AND b.status NOT IN ('cancelled', 'declined')
               AND b.checkin < $3::date
               AND coalesce(b.checkout, b.checkin + 1) > $2::date
          )`,
      [roomSlug, checkin, out],
    )) as { n: number }[];
    return rows[0]?.n ?? 0;
  } catch (e) {
    console.error("[pms] проверка занятости не удалась:", e);
    return 99;
  }
}

/**
 * Удаление брони.
 *
 * Только своя: чужие приходят из Exely на чтение, и удалять их надо там же,
 * где завели. Проверка по id — у чужих он отрицательный, — а не по полю
 * source: подделать поле в форме проще, чем знак числа в базе.
 *
 * Совсем удаляем, а не помечаем: у бунгало и домиков нет истории платежей на
 * нашей стороне, а «Отмена» уже есть отдельным статусом для случая, когда
 * запись нужно сохранить. Кнопка удаления — для опечаток и дублей.
 */
export async function deleteBooking(id: number): Promise<void> {
  if (!Number.isFinite(id) || id <= 0) throw new Error("Эту бронь удалить нельзя — она из Exely");
  await sql().query(`DELETE FROM status_log WHERE kind = 'booking' AND entity_id = $1`, [id]);
  const res = await sql().query(`DELETE FROM bookings WHERE id = $1 RETURNING id`, [id]);
  if ((res as unknown[]).length === 0) throw new Error("Бронь не найдена");
}

/**
 * Цена дня для типа размещения: своя на эту дату, иначе обычная из прайса.
 *
 * Нужна там, где сумму не спрашивают у оператора — у бунгало. Спрашивать её
 * значит просить человека помнить прайс наизусть и ошибаться на выходных.
 */
export async function priceFor(roomSlug: string, day: string, fallback: number): Promise<number> {
  try {
    const rows = (await sql().query(
      `SELECT price FROM rates WHERE room_slug = $1 AND day = $2`,
      [roomSlug, day],
    )) as { price: number }[];
    return rows[0]?.price ?? fallback;
  } catch {
    return fallback;
  }
}
