import { NextResponse } from "next/server";
import { checkAvailability } from "@/lib/exely";
import { freeUnits } from "@/lib/pms";
import { STAY_OPENS_AT } from "@/lib/stay-window";

/**
 * Свободно ли на эти даты и почём — для формы заявки.
 *
 * Два источника, и оба нужны:
 *
 *  • Exely знает продажи целиком — там сидят брони с телефона, с ресепшена и
 *    из движка. Он же называет цену на конкретные даты.
 *  • Наша база знает то, чего Exely не видит: заявки с сайта, за которыми
 *    оператор уже закрепил номер.
 *
 * Занято, если так считает ЛЮБОЙ из них. Показать свободным то, что занято, —
 * значит принять заявку, которую придётся отклонить; обратная ошибка стоит
 * одного звонка, и она дешевле.
 *
 * Молчание движка НЕ означает «занято»: сеть падает, а гость не должен из-за
 * этого терять возможность оставить заявку. Тогда отвечаем «unknown», и форма
 * просто не мешает отправить.
 */
export const dynamic = "force-dynamic";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Названия типов у Exely — как их возвращает движок. */
const EXELY_NAME: Record<string, string> = {
  glamping: "Глэмпинг A-frame",
  cottage: "Шале",
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const room = String(url.searchParams.get("room") ?? "").trim();
  const checkin = String(url.searchParams.get("checkin") ?? "").trim();
  const checkout = String(url.searchParams.get("checkout") ?? "").trim();
  const adults = Number(url.searchParams.get("adults") ?? "2") || 2;

  if (!EXELY_NAME[room] || !ISO.test(checkin)) {
    return NextResponse.json({ status: "unknown" });
  }
  if (checkin < STAY_OPENS_AT) {
    return NextResponse.json({ status: "closed", opensAt: STAY_OPENS_AT });
  }

  // Наши брони спрашиваем всегда: они дешевле и не зависят от чужой сети.
  const ours = await freeUnits(room, checkin, checkout || null);
  if (ours === 0) {
    return NextResponse.json({ status: "busy", source: "own" });
  }

  const live = await checkAvailability({ checkin, checkout: checkout || undefined, adults });
  if (!live.ok) {
    // Движок не ответил — не выдаём это за занятость.
    return NextResponse.json({ status: "unknown" });
  }

  const option = live.options.find((o) => o.name === EXELY_NAME[room]);
  if (!option) {
    return NextResponse.json({ status: "busy", source: "exely" });
  }

  return NextResponse.json({
    status: "free",
    price: option.price,
    currency: "UZS",
    // Сколько ночей посчитал движок — чтобы форма не гадала, цена это за ночь
    // или за весь срок.
    checkin: live.checkin,
    checkout: live.checkout,
  });
}
