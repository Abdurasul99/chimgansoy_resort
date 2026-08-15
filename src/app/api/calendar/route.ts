import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { checkAvailability } from "@/lib/exely";
import { freeUnits } from "@/lib/pms";
import { STAY_OPENS_AT } from "@/lib/stay-window";

/**
 * Цена и занятость по каждому дню месяца — для календаря в форме заявки.
 *
 * Движок отвечает на диапазон, а не на месяц, поэтому спрашиваем его по одной
 * ночи: заезд d, выезд d+1. Тридцать запросов на месяц — много, поэтому ответ
 * кешируется на час и запросы идут пачками по шесть. Гость листает календарь
 * вперёд-назад, и без кеша каждое движение стоило бы тридцати обращений.
 *
 * День закрыт, если так считает движок ИЛИ наша база: заявка с закреплённым
 * номером занимает домик, а Exely о ней не знает.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MONTH = /^\d{4}-\d{2}$/;
const EXELY_NAME: Record<string, string> = {
  glamping: "Глэмпинг A-frame",
  cottage: "Шале",
};

type Day = { date: string; price: number | null; free: boolean };

function daysOf(month: string): string[] {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return Array.from({ length: last }, (_, i) => `${month}-${String(i + 1).padStart(2, "0")}`);
}

function nextDay(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Одна ночь у движка. Ошибка — не «занято», а «не знаем». */
async function night(room: string, date: string): Promise<Day> {
  const live = await checkAvailability({ checkin: date, checkout: nextDay(date), adults: 2 });
  if (!live.ok) return { date, price: null, free: true };
  const option = live.options.find((o) => o.name === EXELY_NAME[room]);
  return { date, price: option?.price ?? null, free: Boolean(option) };
}

/** Месяц у движка, пачками — чтобы не открывать тридцать соединений разом. */
async function fetchMonth(room: string, month: string): Promise<Day[]> {
  const dates = daysOf(month).filter((d) => d >= STAY_OPENS_AT);
  const out: Day[] = [];
  for (let i = 0; i < dates.length; i += 6) {
    out.push(...(await Promise.all(dates.slice(i, i + 6).map((d) => night(room, d)))));
  }
  return out;
}

const cachedMonth = unstable_cache(fetchMonth, ["exely-month-v1"], { revalidate: 3600 });

export async function GET(req: Request) {
  const url = new URL(req.url);
  const room = String(url.searchParams.get("room") ?? "").trim();
  const month = String(url.searchParams.get("month") ?? "").trim();

  if (!EXELY_NAME[room] || !MONTH.test(month)) {
    return NextResponse.json({ days: [] });
  }

  let days: Day[];
  try {
    days = await cachedMonth(room, month);
  } catch {
    // Календарь без цен всё ещё работает как календарь.
    return NextResponse.json({ days: [] });
  }

  /**
   * Наши брони поверх ответа движка.
   *
   * Спрашиваются вне кеша: оператор закрепляет номер и тут же смотрит сайт, и
   * час устаревших данных здесь стоил бы двойной продажи.
   */
  const withOurs = await Promise.all(
    days.map(async (d) => (d.free && (await freeUnits(room, d.date, nextDay(d.date))) === 0
      ? { ...d, free: false }
      : d)),
  );

  return NextResponse.json({ days: withOurs });
}
