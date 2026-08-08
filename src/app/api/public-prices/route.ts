import { NextResponse } from "next/server";
import { getPricing } from "@/lib/pricing-live";
import { getRoom } from "@/lib/rooms-live";

/**
 * Цены «от» для внешних витрин — сейчас это одностраничная визитка на
 * chimgan-link, которую открывают из инстаграма.
 *
 * ЗАЧЕМ ОТДЕЛЬНЫЙ ЭНДПОИНТ, А НЕ ЦИФРЫ В ВЁРСТКЕ ВИЗИТКИ
 * Ровно та же причина, по которой на самом сайте не осталось вбитых цен:
 * оператор меняет их в админке, и любая копия начинает врать в тот же день.
 * Визитка — самая заметная копия из всех: её открывают чаще главной. Здесь
 * отдаётся тот же живой тариф, что показывают формы заявок.
 *
 * Отдаёт только «от» — минимум по каждой услуге, без разбивки по дням и
 * возрастам. Полный расчёт всё равно на сайте, а витрине нужно одно число.
 *
 * CORS открыт намеренно: это публичный прайс, тот же, что на страницах сайта.
 * Ничего, чего не видно без запроса, здесь нет.
 */
export const revalidate = 300;

export async function GET() {
  const live = await getPricing();
  // Цена проживания приходит из Exely, а не из прайса — но оператор может
  // задать «от» вручную в /admin/nomera, и тогда витрина показывает его число.
  const [glamping, cottage] = await Promise.all([getRoom("glamping"), getRoom("cottage")]);

  const cheapestRide = live.tubing.packages.reduce(
    (min, p) => (p.price < min ? p.price : min),
    Infinity,
  );

  return NextResponse.json(
    {
      currency: "UZS",
      updated: new Date().toISOString(),
      stay: {
        // null — «цена при бронировании»: движок считает её по датам, и
        // подставлять сюда прошлогоднюю константу хуже, чем не показывать.
        glampingFrom: glamping?.priceFrom ?? null,
        chaletFrom: cottage?.priceFrom ?? null,
      },
      day: {
        poolAdultFrom: Math.min(live.pool.adult.weekday, live.pool.adult.weekend),
        topchanFrom: Math.min(live.topchan.weekday, live.topchan.weekend),
        tubingFrom: Number.isFinite(cheapestRide) ? cheapestRide : null,
      },
    },
    {
      headers: {
        "access-control-allow-origin": "*",
        "cache-control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    },
  );
}
