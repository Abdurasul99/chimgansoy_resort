"use server";

import { cookies } from "next/headers";
import { esc } from "@/lib/telegram";
import { sendPartnerTelegram } from "@/lib/partners-telegram";
import { PARTNERS_COOKIE, sessionValid } from "@/lib/partners/auth";
import {
  canRequestContract,
  isOfferKey,
  money,
  shouldNotifyView,
  statusAfterContractRequest,
  statusAfterView,
} from "@/lib/partners/model";
import * as store from "@/lib/partners/store";

/**
 * Что делает компания на своей странице предложения.
 *
 * Обе функции публичные (страница открыта по ссылке без входа), поэтому:
 *   • ключ проверяется по форме, отозванная ссылка — как несуществующая;
 *   • в группу пишут с ограничением частоты: «открыл» — не чаще раза в 30 мин,
 *     «запросил договор» — раз в 10 мин с одной ссылки;
 *   • открытия из админки (свой предпросмотр) не считаются.
 * Ошибки базы глотаются: счётчик не должен ломать страницу партнёру.
 */

async function isAdminPreview(): Promise<boolean> {
  return sessionValid((await cookies()).get(PARTNERS_COOKIE)?.value);
}

export async function recordOfferView(key: string): Promise<void> {
  if (typeof key !== "string" || !isOfferKey(key)) return;
  try {
    if (await isAdminPreview()) return;
    const offer = await store.recordView(key, statusAfterView);
    if (!offer) return;
    if (!shouldNotifyView(offer.lastNotifiedAt)) return;
    await store.markNotified(offer.id);
    const first = offer.views === 1;
    await sendPartnerTelegram(
      [
        first ? `👀 <b>${esc(offer.company)}</b> впервые открыл предложение` : `👀 <b>${esc(offer.company)}</b> снова открыл предложение`,
        `Открытий всего: ${offer.views}`,
        ...(offer.contact ? [`Контакт: ${esc(offer.contact)}`] : []),
      ].join("\n"),
    );
  } catch (e) {
    console.error("[partner-offer] view:", e);
  }
}

export type ContractResult = { ok: true } | { ok: false; error: string };

export async function requestOfferContract(key: string, packageIndex: number): Promise<ContractResult> {
  const fail = { ok: false as const, error: "Не удалось отправить запрос. Позвоните нам: +998 70 176 00 11" };
  if (typeof key !== "string" || !isOfferKey(key)) return fail;
  try {
    const offer = await store.getOfferByKey(key);
    if (!offer || offer.revoked) return fail;
    // Повторное нажатие в течение 10 минут — успех без второго сообщения.
    if (!canRequestContract(offer.contractRequestedAt)) return { ok: true };
    const pkg = Number.isInteger(packageIndex) ? offer.packages[packageIndex] : undefined;
    await store.markContractRequested(offer.id, statusAfterContractRequest(offer.status));
    const sent = await sendPartnerTelegram(
      [
        `🤝 <b>${esc(offer.company)}</b> просит договор`,
        "",
        pkg ? `Пакет: ${esc(pkg.title)}${pkg.price ? ` — ${money(pkg.price)} сум без НДС` : ""}` : "Пакет не выбран",
        ...(offer.contact ? [`Контакт: ${esc(offer.contact)}`] : []),
        "",
        "Статус в админке — «Переговоры».",
      ].join("\n"),
    );
    return sent > 0 ? { ok: true } : fail;
  } catch (e) {
    console.error("[partner-offer] contract:", e);
    return fail;
  }
}
