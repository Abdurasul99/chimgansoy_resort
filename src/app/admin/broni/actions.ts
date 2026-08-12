"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin-auth";
import type { PmsStatus } from "@/lib/db";
import {
  assignUnit,
  getBooking,
  setBookingMoney,
  setBookingStatus,
  setServiceStatus,
} from "@/lib/pms";
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
