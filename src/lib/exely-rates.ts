import { unstable_cache } from "next/cache";
import { checkAvailability } from "@/lib/exely";

/**
 * Цена ночи по датам — из движка Exely, того же, что видит гость.
 *
 * Шахматка показывала числа из нашего прайса: 1 500 000 и 3 000 000 на любой
 * день. Настоящая цена живёт в Exely и меняется по датам — в выходные и
 * праздники она другая, — и оператор сверял сетку с их шахматкой, находя
 * расхождение там, где его быть не должно.
 *
 * Движок отвечает на диапазон, а не на месяц, поэтому спрашиваем по одной
 * ночи: заезд d, выезд d+1. Пачками по шесть и с часовым кешем — цены за ночь
 * не меняются чаще, чем раз в день, а тридцать запросов на каждое открытие
 * сетки сделали бы её неоткрываемой.
 */
const EXELY_NAME: Record<string, string> = {
  glamping: "Глэмпинг A-frame",
  cottage: "Шале",
};

function nextDay(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Цены одной ночи по всем типам. Ошибка — пусто, а не ноль. */
async function night(date: string): Promise<Record<string, number>> {
  const live = await checkAvailability({ checkin: date, checkout: nextDay(date), adults: 2 });
  if (!live.ok) return {};
  const out: Record<string, number> = {};
  for (const [slug, name] of Object.entries(EXELY_NAME)) {
    const option = live.options.find((o) => o.name === name);
    if (option) out[slug] = option.price;
  }
  return out;
}

async function fetchRates(dates: string[]): Promise<Record<string, Record<string, number>>> {
  const out: Record<string, Record<string, number>> = {};
  for (let i = 0; i < dates.length; i += 6) {
    const chunk = dates.slice(i, i + 6);
    const prices = await Promise.all(chunk.map(night));
    chunk.forEach((d, k) => {
      out[d] = prices[k];
    });
  }
  return out;
}

export const exelyRates = unstable_cache(fetchRates, ["exely-rates-v1"], { revalidate: 3600 });
