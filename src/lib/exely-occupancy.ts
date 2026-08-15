import { unstable_cache } from "next/cache";
import { getBookingsInPeriod, listRooms, roomTypeName, type PmsRoomStay } from "@/lib/exely-pms";
import type { PmsStatus } from "@/lib/db";
import type { BookingRow } from "@/lib/pms";

/**
 * Брони из Exely — в том же виде, в каком шахматка рисует свои.
 *
 * Оператор работает в двух системах: телефонные и с ресепшена он заводит в
 * Exely, заявки с сайта живут у нас. Шахматка, показывающая половину продаж,
 * хуже бесполезной — по ней принимают решение «свободно ли», и ошибка в эту
 * сторону стоит двойной брони.
 *
 * Односторонне и только на чтение. Мы НЕ пишем в Exely: их система остаётся
 * хозяином собственных броней, а мы показываем, что там происходит. Писать в
 * обе стороны без их подтверждения — верный способ получить расхождение,
 * которое никто не сможет распутать.
 */

/** Их типы номеров → наши слаги. Имя приходит от roomTypeName(). */
function slugOfRoomType(id: string): string | null {
  const name = roomTypeName(id).toLowerCase();
  if (name.includes("шале") || name.includes("chalet")) return "cottage";
  if (name.includes("глэмпинг") || name.includes("glamping") || name.includes("a-frame")) return "glamping";
  return null;
}

/**
 * Их статус → наш.
 *
 * CheckedOut — это «Завершена», а не «Оплачена»: гость уехал. Cancelled в
 * шахматку не попадает вовсе, иначе отменённая бронь держала бы номер.
 */
function statusOf(s: PmsRoomStay): PmsStatus | null {
  switch (s.status) {
    case "Cancelled":
      return null;
    case "CheckedOut":
      return "done";
    case "CheckedIn":
      return "paid";
    default:
      return "confirmed";
  }
}

const DAY = /^\d{4}-\d{2}-\d{2}/;

/**
 * Номер из их системы — «11», «01» — в наш идентификатор единицы.
 *
 * У нас 20 единиц: glamping-01…10 и chalet-01…10. В Exely номера сквозные:
 * 01–10 глэмпинг, 11–20 шале. Не сошлось — бронь всё равно показываем, но без
 * привязки к строке: «есть, а где именно — смотрите в Exely» честнее, чем
 * поставить её не в тот домик.
 */
function unitOf(slug: string, roomNumber: string | null | undefined): string | null {
  const n = Number(String(roomNumber ?? "").replace(/\D/g, ""));
  if (!Number.isFinite(n) || n < 1 || n > 20) return null;
  if (slug === "glamping") return n <= 10 ? `glamping-${String(n).padStart(2, "0")}` : null;
  return n > 10 ? `chalet-${String(n - 10).padStart(2, "0")}` : null;
}

async function fetchExely(from: string, to: string): Promise<BookingRow[]> {
  const res = await getBookingsInPeriod(from, to);
  if (!res.ok) {
    console.error("[exely-occupancy] PMS не ответил:", res.error);
    return [];
  }

  /**
   * Идентификатор номера → его номер на табличке.
   *
   * В брони лежит `roomId` вида «9007199254834751», а человеку и нашей сетке
   * нужен «01». Первая версия разбирала цифры прямо из идентификатора и
   * получала шестнадцатизначное число — ни одна бронь не привязывалась к
   * строке, и шахматка выглядела пустой при 55 бронях в Exely.
   */
  const rooms = await listRooms();
  const nameById = new Map<string, string>();
  if (rooms.ok) for (const r of rooms.data) nameById.set(String(r.id), r.name);

  const rows: BookingRow[] = [];
  for (const b of res.data) {
    for (const stay of b.roomStays) {
      const status = statusOf(stay);
      if (!status) continue;
      /**
       * Тип домика: сперва по справочнику категорий, иначе по номеру.
       *
       * Справочник в exely-pms.ts набран руками и знает не все идентификаторы.
       * Номера в Exely сквозные — 01–10 глэмпинг, 11–20 шале, — и это надёжнее
       * списка, который устареет при первом же изменении на их стороне.
       */
      const roomNumber = nameById.get(String(stay.roomId ?? ""));
      const n = Number(String(roomNumber ?? "").replace(/\D/g, ""));
      const slug =
        slugOfRoomType(stay.roomTypeId) ??
        (Number.isFinite(n) && n >= 1 && n <= 20 ? (n <= 10 ? "glamping" : "cottage") : null);
      if (!slug) continue;
      const checkin = String(stay.checkInDateTime ?? "").slice(0, 10);
      const checkout = String(stay.checkOutDateTime ?? "").slice(0, 10);
      if (!DAY.test(checkin)) continue;

      const name = [b.customer?.firstName, b.customer?.lastName].filter(Boolean).join(" ").trim();
      rows.push({
        // Отрицательный, чтобы никогда не столкнуться с нашими: это чужая
        // запись, её нельзя открыть на редактирование и не надо пытаться.
        id: -Number(b.number.replace(/\D/g, "") || 1),
        unit_id: unitOf(slug, nameById.get(String(stay.roomId ?? ""))),
        room_slug: slug,
        status,
        checkin,
        checkout: DAY.test(checkout) ? checkout : null,
        guest_name: name || `Бронь ${b.number}`,
        phone: b.customer?.phones?.[0] ?? "",
        email: null,
        adults: stay.guestCountInfo?.adults ?? 0,
        kids: stay.guestCountInfo?.children ?? 0,
        comment: b.sourceChannelName ? `Источник: ${b.sourceChannelName}` : null,
        total: stay.totalPrice?.amount ?? 0,
        paid: 0,
        source: "exely",
        locale: "ru",
        created_at: "",
      });
    }
  }
  return rows;
}

/**
 * Пять минут кеша.
 *
 * Их API не бесплатное по времени ответа: месяц броней — это поиск плюс запрос
 * на каждую. Пять минут — компромисс между «оператор только что завёл бронь в
 * Exely и смотрит нашу шахматку» и «шахматка открывается за секунду».
 */
export const EXELY_TAG = "exely-occupancy";

export const exelyOccupancy = unstable_cache(fetchExely, ["exely-occupancy-v1"], {
  revalidate: 300,
  // Тег нужен кнопке «обновить»: оператор завёл бронь в Exely и смотрит нашу
  // шахматку сейчас, а не через пять минут.
  tags: [EXELY_TAG],
});
