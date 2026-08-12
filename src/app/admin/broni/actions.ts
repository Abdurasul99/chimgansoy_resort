"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import type { PmsStatus } from "@/lib/db";
import {
  assignUnit,
  getBooking,
  setBookingMoney,
  setBookingStatus,
  setRateRange,
  setServiceStatus,
} from "@/lib/pms";
import { insertBooking } from "@/lib/db";
import { importFromBlob } from "@/lib/import-blob";
import { sendGuestConfirmation } from "@/lib/guest-mail";

export type BroniState = { ok?: string; error?: string };

const STATUSES: PmsStatus[] = ["new", "confirmed", "paid", "cancelled", "declined", "done"];
const statusOf = (raw: unknown): PmsStatus | null =>
  STATUSES.find((s) => s === String(raw ?? "").trim()) ?? null;
const idOf = (form: FormData) => Number(String(form.get("id") ?? "0"));

/**
 * Смена статуса брони.
 *
 * «Оплачена» требует закреплённого номера: оплата без ответа на вопрос «куда
 * селить» — это не оплата, а деньги на счету и растерянный администратор на
 * ресепшене. Поэтому переход отклоняется, пока номер не выбран.
 *
 * Письмо гостю уходит ТОЛЬКО на «оплачена» и только если он оставил почту.
 * Оператор сказал прямо: по услугам звонят, письмо нужно за проживание.
 */
export async function changeStatus(_prev: BroniState, form: FormData): Promise<BroniState> {
  await requireAdmin();

  const id = idOf(form);
  const to = statusOf(form.get("status"));
  if (!id || !to) return { error: "Не понял, что менять." };

  try {
    const before = await getBooking(id);
    if (!before) return { error: "Бронь не найдена." };
    if (to === "paid" && !before.unit_id) {
      return { error: "Сначала закрепите номер за гостем — без него оплату ставить нельзя." };
    }

    const after = await setBookingStatus(id, to);
    revalidatePath("/admin/broni");

    if (to === "paid") {
      const sent = await sendGuestConfirmation(after);
      return {
        ok: sent
          ? `Оплачено. Подтверждение отправлено на ${after.email}.`
          : after.email
            ? "Оплачено. Письмо отправить не удалось — подтвердите звонком."
            : "Оплачено. Почты гость не оставил — подтвердите звонком.",
      };
    }

    return { ok: "Статус изменён." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось изменить статус." };
  }
}

/** Закрепление номера. Занятый не даст назначить — проверка в lib/pms.ts. */
export async function changeUnit(_prev: BroniState, form: FormData): Promise<BroniState> {
  await requireAdmin();

  const id = idOf(form);
  const unit = String(form.get("unit") ?? "").trim();
  if (!id) return { error: "Не понял, что менять." };

  try {
    await assignUnit(id, unit || null);
    revalidatePath("/admin/broni");
    return { ok: unit ? `Номер ${unit} закреплён.` : "Номер снят." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось закрепить номер." };
  }
}

/** Сумма и внесённая часть. */
export async function changeMoney(_prev: BroniState, form: FormData): Promise<BroniState> {
  await requireAdmin();

  const id = idOf(form);
  const total = Number(String(form.get("total") ?? "0").replace(/\s/g, ""));
  const paid = Number(String(form.get("paid") ?? "0").replace(/\s/g, ""));
  if (!id) return { error: "Не понял, что менять." };
  if (!Number.isFinite(total) || !Number.isFinite(paid)) return { error: "Суммы должны быть числами." };
  if (paid > total) return { error: "Внесено больше, чем стоимость — проверьте цифры." };

  try {
    await setBookingMoney(id, total, paid);
    revalidatePath("/admin/broni");
    return { ok: "Суммы сохранены." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось сохранить суммы." };
  }
}

/** Статус заявки на услугу — та же логика переходов, без писем и номеров. */
export async function changeServiceStatus(_prev: BroniState, form: FormData): Promise<BroniState> {
  await requireAdmin();

  const id = idOf(form);
  const to = statusOf(form.get("status"));
  if (!id || !to) return { error: "Не понял, что менять." };

  try {
    await setServiceStatus(id, to);
    revalidatePath("/admin/uslugi-zayavki");
    return { ok: "Статус изменён." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось изменить статус." };
  }
}

/** Цена за ночь на диапазон дат. Пустая цена возвращает обычный прайс. */
export async function saveRate(_prev: BroniState, form: FormData): Promise<BroniState> {
  await requireAdmin();

  const room = String(form.get("room") ?? "").trim();
  const from = String(form.get("from") ?? "").trim();
  const to = String(form.get("to") ?? "").trim();
  const raw = String(form.get("price") ?? "").trim();
  const price = raw === "" ? null : Number(raw.replace(/\s/g, ""));

  if (!room || !from || !to) return { error: "Заполните тип и даты." };
  if (to < from) return { error: "«По» раньше, чем «с»." };
  if (price !== null && (!Number.isFinite(price) || price < 0)) return { error: "Цена должна быть числом." };

  /**
   * Какие дни задеть. «Выходные» у оператора — пятница, суббота, воскресенье:
   * это ночи, за которые берут по выходному тарифу, а не дни заезда-выезда.
   */
  const scope = String(form.get("scope") ?? "all").trim();
  const dows = scope === "weekend" ? [5, 6, 0] : scope === "weekday" ? [1, 2, 3, 4] : undefined;

  try {
    const days = await setRateRange(room, from, to, price, undefined, dows);
    revalidatePath("/admin/shahmatka");
    return { ok: price === null ? `Своя цена снята с ${days} дней.` : `Цена задана на ${days} дней.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось сохранить цену." };
  }
}

/**
 * Бронь, заведённая руками — телефонная, с ресепшена, из переписки.
 *
 * Номер можно закрепить сразу: в отличие от заявки с сайта, здесь оператор уже
 * говорит с гостем и знает, куда его селить. Занятый номер не примет — та же
 * проверка, что и везде.
 */
export async function createBooking(_prev: BroniState, form: FormData): Promise<BroniState> {
  await requireAdmin();

  const roomSlug = String(form.get("room_slug") ?? "").trim();
  const checkin = String(form.get("checkin") ?? "").trim();
  const checkout = String(form.get("checkout") ?? "").trim();
  const name = String(form.get("guest_name") ?? "").trim().slice(0, 120);
  const phone = String(form.get("phone") ?? "").trim().slice(0, 40);
  const email = String(form.get("email") ?? "").trim().slice(0, 160);
  const comment = String(form.get("comment") ?? "").trim().slice(0, 600);
  const unit = String(form.get("unit") ?? "").trim();
  const adults = Math.max(0, Number(String(form.get("adults") ?? "2")) || 0);
  const kids = Math.max(0, Number(String(form.get("kids") ?? "0")) || 0);
  const total = Math.max(0, Number(String(form.get("total") ?? "0").replace(/\s/g, "")) || 0);

  if (!["glamping", "cottage"].includes(roomSlug)) return { error: "Выберите тип размещения." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkin)) return { error: "Укажите дату заезда." };
  if (checkout && checkout <= checkin) return { error: "Выезд должен быть позже заезда." };
  if (name.length < 2) return { error: "Укажите имя гостя." };
  if (phone.replace(/\D/g, "").length < 9) return { error: "Проверьте номер телефона." };
  if (adults + kids < 1) return { error: "Укажите хотя бы одного гостя." };

  try {
    const id = await insertBooking({
      roomSlug,
      checkin,
      checkout: checkout || undefined,
      guestName: name,
      phone,
      email: email || undefined,
      adults,
      kids,
      comment: comment || undefined,
      locale: "ru",
      source: "admin",
    });
    if (!id) return { error: "База не приняла запись. Попробуйте ещё раз." };

    if (total > 0) await setBookingMoney(id, total, 0);
    // Номер — последним: если он занят, бронь уже сохранена, и оператор просто
    // выберет другой, а не потеряет всё введённое.
    if (unit) {
      try {
        await assignUnit(id, unit);
      } catch (e) {
        revalidatePath("/admin/broni");
        return { ok: `Бронь №${id} создана, но номер не закреплён: ${e instanceof Error ? e.message : ""}` };
      }
    }

    revalidatePath("/admin/broni");
    revalidatePath("/admin/shahmatka");
    return { ok: `Бронь №${id} создана.` };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось создать бронь." };
  }
}

/** Разовый перенос старых заявок из Blob. Повторное нажатие безопасно. */
export async function runImport(_prev: BroniState, _form: FormData): Promise<BroniState> {
  await requireAdmin();
  try {
    const r = await importFromBlob();
    revalidatePath("/admin/broni");
    revalidatePath("/admin/uslugi-zayavki");
    return {
      ok:
        r.bookings + r.services === 0
          ? `Всё уже перенесено: ${r.total} заявок в архиве, новых нет.`
          : `Перенесено: ${r.bookings} броней, ${r.services} заявок на услуги. Уже были: ${r.skipped}.`,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Перенос не удался." };
  }
}
