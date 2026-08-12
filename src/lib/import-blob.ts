import { neon } from "@neondatabase/serverless";
import { requestsBetween, type StoredRequest } from "@/lib/requests-store";

/**
 * Перенос старых заявок из Blob в базу.
 *
 * Запускается кнопкой в панели, а не скриптом с моей машины: токен к Blob живёт
 * в переменных проекта, и тащить его на ноутбук ради разовой операции — лишний
 * повод его потерять.
 *
 * Идемпотентен. Blob-идентификатор заявки ложится в source_id с уникальным
 * индексом, и повторное нажатие кнопки просто ничего не добавит. Это важнее
 * скорости: оператор нажмёт дважды, если первый раз покажется, что не сработало.
 *
 * Ничего не удаляет и не меняет в Blob. Старый журнал остаётся как есть —
 * пока оператор сам не скажет, что он больше не нужен.
 */
function db() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL не задан");
  return neon(url);
}

export type ImportResult = { bookings: number; services: number; skipped: number; total: number };

/** Заявка на проживание — по типу услуги в архиве. */
const isStay = (r: StoredRequest) => r.service === "booking";

/**
 * Что из старой заявки становится типом домика.
 *
 * В архиве тип лежит в tariff или первым элементом extras — так его писали
 * формы. Не угадали — считаем глэмпингом: он дешевле, и ошибка в эту сторону
 * заметнее оператору, чем молча выставленное шале.
 */
function roomSlugOf(r: StoredRequest): string {
  const hay = `${r.tariff ?? ""} ${(r.extras ?? []).join(" ")}`.toLowerCase();
  if (hay.includes("шале") || hay.includes("chalet") || hay.includes("cottage")) return "cottage";
  return "glamping";
}

/** Выезд, если он сохранился в extras строкой «Выезд: YYYY-MM-DD». */
function checkoutOf(r: StoredRequest): string | null {
  const line = (r.extras ?? []).find((e) => /выезд/i.test(e));
  const m = line?.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function emailOf(r: StoredRequest): string | null {
  const line = (r.extras ?? []).find((e) => /почта|email/i.test(e));
  const m = line?.match(/[^\s:]+@[^\s,]+/);
  return m ? m[0] : null;
}

export async function importFromBlob(): Promise<ImportResult> {
  const sql = db();
  // Год назад и год вперёд: заявки дальше этого окна не бывают, а полный обход
  // хранилища стоил бы сотен запросов ради пустоты.
  const from = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const to = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);

  const all = await requestsBetween(from, to);
  let bookings = 0;
  let services = 0;

  for (const r of all) {
    if (isStay(r)) {
      const res = await sql.query(
        `INSERT INTO bookings
           (room_slug, checkin, checkout, guest_name, phone, email, adults, kids, comment,
            total, source, locale, source_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'blob',$11,$12,$13)
         ON CONFLICT (source_id) DO NOTHING
         RETURNING id`,
        [
          roomSlugOf(r),
          r.date,
          checkoutOf(r),
          r.name,
          r.phone,
          emailOf(r),
          r.adults ?? 0,
          r.kids ?? 0,
          (r.extras ?? []).join(" · ") || null,
          r.total ?? 0,
          r.locale ?? "ru",
          r.id,
          r.createdAt,
        ],
      );
      if ((res as unknown[]).length) bookings++;
    } else {
      const res = await sql.query(
        `INSERT INTO service_requests
           (service_slug, service_name, visit_date, guest_name, phone, answers, total, locale, source_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10)
         ON CONFLICT (source_id) DO NOTHING
         RETURNING id`,
        [
          r.service,
          r.tariff || r.service,
          r.date,
          r.name,
          r.phone,
          JSON.stringify({
            Гости: `${r.adults ?? 0} взр${r.kids ? ` · ${r.kids} дет` : ""}`,
            ...((r.extras ?? []).length ? { Дополнительно: (r.extras ?? []).join(", ") } : {}),
          }),
          r.total ?? 0,
          r.locale ?? "ru",
          r.id,
          r.createdAt,
        ],
      );
      if ((res as unknown[]).length) services++;
    }
  }

  return { bookings, services, skipped: all.length - bookings - services, total: all.length };
}
