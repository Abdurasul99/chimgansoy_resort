"use client";

import { useActionState, useEffect, useState } from "react";
import { changeStatus, refreshExely, saveRate, type BroniState } from "../broni/actions";
import type { PmsStatus } from "@/lib/db";
import type { BookingRow, RateRow, UnitRow } from "@/lib/pms";

/**
 * Шахматка: единицы по строкам, дни по столбцам.
 *
 * Таблица, а не сетка из блоков: строка «домик» и столбец «день» — это ровно
 * то, что таблица описывает, и браузер сам держит их выровненными при
 * горизонтальной прокрутке. Своя раскладка на flex рассыпается на первом же
 * домике с длинным именем.
 */
const TONE: Record<PmsStatus, string> = {
  new: "bg-[var(--surface-warm)] text-[var(--ink)] border-[var(--line-strong)]",
  confirmed: "bg-[var(--sun)]/35 text-[var(--sun-dark)] border-[var(--sun)]",
  paid: "bg-[var(--green,#3f7d52)] text-white border-[var(--green,#3f7d52)]",
  done: "bg-[var(--mist)] text-[var(--muted)] border-[var(--line)]",
  cancelled: "bg-transparent text-[var(--muted)] border-[var(--line)]",
  declined: "bg-transparent text-[var(--muted)] border-[var(--line)]",
};

const ROOM_LABEL: Record<string, string> = {
  glamping: "Глэмпинг A-frame",
  cottage: "Шале",
  "bungalow-small": "Бунгало Standard",
  "bungalow-large": "Бунгало Family",
};

/**
 * У бунгало нет ночей: их снимают на день вместе с бассейном. Строка цен для
 * них показывает дневной тариф, а бронь занимает ровно одну клетку.
 */
const DAY_USE = new Set(["bungalow-small", "bungalow-large"]);
const money = (n: number) => n.toLocaleString("ru-RU").replaceAll(",", " ");
const input =
  "rounded-xl border border-[color:var(--line)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--sun)] focus:ring-2 focus:ring-[var(--sun)]/30";

/** Занимает ли бронь этот день: выезд — день освобождения, он уже свободен. */
function covers(b: BookingRow, day: string): boolean {
  const out = b.checkout ?? b.checkin;
  return day >= b.checkin && (day < out || (b.checkout === null && day === b.checkin));
}

export function Grid({
  days,
  units,
  bookings,
  rates,
  basePrice,
  live,
}: {
  days: string[];
  units: UnitRow[];
  bookings: BookingRow[];
  rates: RateRow[];
  /** Обычная цена из прайса — последний запасной вариант. */
  basePrice: Record<string, number>;
  /**
   * Цены из Exely по датам: date → slug → цена. Это то же число, что видит
   * гость на сайте, и оператор в их шахматке.
   */
  live?: Record<string, Record<string, number>>;
}) {
  const [state, act, pending] = useActionState<BroniState, FormData>(saveRate, {});
  const [ref, refresh, refreshing] = useActionState<BroniState, FormData>(() => refreshExely(), {});
  const [cancel, doCancel, cancelling] = useActionState<BroniState, FormData>(changeStatus, {});
  /** Бронь, по которой кликнули. Карточка показывается под сеткой. */
  const [picked, setPicked] = useState<BookingRow | null>(null);

  // Esc закрывает окно: рука уже на клавиатуре, когда сверяешь сетку с Exely.
  useEffect(() => {
    if (!picked) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPicked(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked]);

  const rateOf = (slug: string, day: string) => rates.find((r) => r.room_slug === slug && r.day === day)?.price;
  const groups = ["glamping", "cottage", "bungalow-small", "bungalow-large"].filter((s) =>
    units.some((u) => u.room_slug === s),
  );

  const dayLabel = (d: string) => {
    const dt = new Date(`${d}T12:00:00`);
    return { num: dt.getDate(), dow: dt.toLocaleDateString("ru-RU", { weekday: "short" }), weekend: [0, 5, 6].includes(dt.getDay()) };
  };

  return (
    <div className="space-y-6">
      {/* Цена на диапазон: «с 1 по 30 сентября столько» — так о ценах и думают. */}
      <form action={act} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[color:var(--line)] p-4">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Тип</span>
          <select name="room" className={input} defaultValue="glamping">
            {groups.map((s) => (
              <option key={s} value={s}>
                {ROOM_LABEL[s] ?? s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">С</span>
          <input name="from" type="date" required defaultValue={days[0]} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">По</span>
          <input name="to" type="date" required defaultValue={days[days.length - 1]} className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
            Цена за ночь <span className="font-normal normal-case">— пусто, чтобы вернуть обычную</span>
          </span>
          <input name="price" type="number" min={0} placeholder="напр. 1800000" className={`${input} w-48`} />
        </label>
        <label className="block">
          {/* Выходные у оператора — пятница, суббота, воскресенье: это ночи, за
              которые берут по выходному тарифу, а не дни заезда и выезда. */}
          <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Дни</span>
          <select name="scope" defaultValue="all" className={input}>
            <option value="all">Все дни</option>
            <option value="weekend">Выходные: пт, сб, вс</option>
            <option value="weekday">Будни: пн–чт</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-gradient-to-b from-[var(--sun)] to-[var(--sun-dark)] px-6 py-2.5 text-sm font-extrabold text-[var(--on-accent)] transition hover:brightness-105 disabled:opacity-60"
        >
          {pending ? "Сохраняем…" : "Задать цену"}
        </button>
        {state.error && <span className="text-sm font-semibold text-[var(--rose,#b4413c)]">{state.error}</span>}
        {state.ok && <span className="text-sm font-semibold text-[var(--green,#3f7d52)]">{state.ok}</span>}
      </form>

      {/* Брони из Exely подтягиваются сами раз в пять минут. Кнопка — для той
          минуты, когда оператор только что завёл бронь у них. */}
      <form action={refresh} className="flex items-center gap-3">
        <button
          type="submit"
          disabled={refreshing}
          className="rounded-xl border border-[color:var(--line)] px-4 py-2 text-sm font-semibold text-[var(--muted)] transition hover:border-[var(--sun)] hover:text-[var(--ink)] disabled:opacity-50"
        >
          {refreshing ? "Обновляем…" : "Обновить из Exely"}
        </button>
        {ref.ok && <span className="text-sm font-semibold text-[var(--green,#3f7d52)]">{ref.ok}</span>}
        {ref.error && <span className="text-sm font-semibold text-[var(--rose,#b4413c)]">{ref.error}</span>}
      </form>

      {/*
        Прокрутка только вбок.

        Строку дат я пробовал прилепить сверху — дважды, и оба раза честно
        мерил результат: не работает. Таблица лежит в горизонтальном
        контейнере прокрутки, и «прилипание» по вертикали считается
        относительно него, а не страницы — ни с overflow auto, ни с clip. В
        итоге контейнер уезжал под меню целиком, вместе с датами, и заголовки
        накрывали таблицу.

        Оставил как есть: даты уезжают вверх как обычное содержимое, ничего ни
        на что не наползает. Чтобы держать их на месте, нужен другой каркас —
        отдельная таблица-шапка с синхронной прокруткой; это отдельная работа,
        а не строчка стилей.
      */}
      <div className="overflow-x-auto rounded-2xl border border-[color:var(--line)]">
        <table className="w-max border-collapse text-sm">
          {/* Даты прилипают под меню: в сетке на тридцать колонок, прокрутив
              вниз, иначе невозможно понять, какой день перед тобой. */}
          {/* sticky живёт на ячейках, а не на <thead>: на самом thead его
              игнорируют все браузеры, и строка дат уезжала вверх. */}
          <thead>
            <tr>
              <th className="sticky left-0 z-[2] bg-[var(--surface-warm)] px-4 py-2 text-left text-xs font-bold uppercase tracking-wide text-[var(--muted)]">
                Домик
              </th>
              {days.map((d) => {
                const { num, dow, weekend } = dayLabel(d);
                return (
                  <th
                    key={d}
                    className={`min-w-[46px] px-1 py-2 text-center text-xs font-semibold ${
                      weekend ? "bg-[var(--sun)]/12 text-[var(--sun-dark)]" : "bg-[var(--surface-warm)] text-[var(--muted)]"
                    }`}
                  >
                    <div>{num}</div>
                    <div className="text-[10px] font-normal">{dow}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {groups.map((slug) => (
              <>
                {/* Строка цен — над блоком своего типа: цена у глэмпинга и шале
                    разная, и одна общая строка врала бы про половину сетки. */}
                <tr key={`${slug}-rates`}>
                  <th className="sticky left-0 z-[2] bg-[var(--mist)] px-4 py-1.5 text-left text-xs font-bold text-[var(--ink)]">
                    {ROOM_LABEL[slug] ?? slug} · {DAY_USE.has(slug) ? "день" : "цена"}
                  </th>
                  {days.map((d) => {
                    /**
                     * Порядок важен: своя цена оператора бьёт всё, потом цена
                     * из Exely — она настоящая и меняется по датам, — и только
                     * потом число из прайса, как последний ориентир.
                     */
                    const own = rateOf(slug, d);
                    const fromExely = live?.[d]?.[slug];
                    const shown = own ?? fromExely ?? basePrice[slug] ?? 0;
                    return (
                      <td
                        key={d}
                        title={own ? "Своя цена на эту дату" : fromExely ? "Цена из Exely" : "Из прайса — Exely не ответил"}
                        className={`px-1 py-1.5 text-center text-[10px] ${
                          own ? "bg-[var(--sun)]/20 font-bold text-[var(--sun-dark)]" : "text-[var(--muted)]"
                        }`}
                      >
                        {Math.round(shown / 1000)}к
                      </td>
                    );
                  })}
                </tr>

                {units
                  .filter((u) => u.room_slug === slug)
                  .map((u) => (
                    <tr key={u.id} className="border-t border-[color:var(--line)]">
                      <th className="sticky left-0 z-[2] bg-[var(--paper)] px-4 py-2 text-left font-semibold text-[var(--ink)]">
                        {u.id}
                      </th>
                      {days.map((d) => {
                        const b = bookings.find((x) => x.unit_id === u.id && covers(x, d));
                        if (!b) return <td key={d} className="border-l border-[color:var(--line)] px-1 py-2" />;
                        const first = d === b.checkin;
                        return (
                          <td
                            key={d}
                            title={`${b.guest_name} · ${b.phone || "без телефона"} · ${b.checkin}${
                              b.checkout ? ` → ${b.checkout}` : ""
                            } · ${money(b.total)} сум${b.source === "exely" ? " · из Exely" : ""}`}
                            className={`border-l px-1 py-2 text-center text-[10px] font-bold ${TONE[b.status]} ${
                              // Пунктир — «это не наша запись, править её здесь
                              // нельзя»: она живёт в Exely и оттуда читается.
                              b.source === "exely" ? "border-dashed opacity-90" : ""
                            }`}
                          >
                            {/* Клик открывает карточку. Кнопка, а не div с
                                обработчиком: клавиатура и читалки должны
                                добираться до брони так же, как мышь. */}
                            <button
                              type="button"
                              onClick={() => setPicked(b)}
                              className="w-full cursor-pointer"
                              aria-label={`Бронь ${b.guest_name}`}
                            >
                              {first ? b.guest_name.split(" ")[0].slice(0, 6) : "·"}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/*
        Карточка брони по клику.

        Отменить можно только бунгало — так распорядился оператор, и это
        совпадает с тем, где живут записи. Домики продаются через Exely: их
        брони приходят к нам на чтение, и отмена здесь создала бы расхождение
        с системой, которая ими управляет. Кнопки просто нет, а не «есть и
        ругается»: недоступное действие лучше не показывать вовсе.
      */}
      {picked && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(21,29,24,0.45)] p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Бронь ${picked.guest_name}`}
          // Клик мимо карточки закрывает её — так ведут себя все окна, и
          // искать крестик глазами не приходится.
          onClick={(e) => {
            if (e.target === e.currentTarget) setPicked(null);
          }}
        >
          <div
            className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[color:var(--line-strong)] bg-[var(--paper)] p-5 shadow-[0_28px_90px_rgba(21,29,24,0.35)] sm:p-6"
          >
          {/*
            Заголовок и крестик — разные ряды по смыслу, а не по вёрстке.

            Всё лежало в одном flex-wrap с ml-auto на кнопке: стоило имени
            гостя стать длинным, ряд переносился, и «закрыть» уезжала на
            отдельную строку справа — висела в пустоте. Теперь кнопка закреплена
            в правом верхнем углу и не участвует в переносе.
          */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="font-serif text-xl font-bold leading-tight text-[var(--ink)]">
                {picked.guest_name}
              </p>
              {picked.phone && (
                <a
                  href={`tel:${picked.phone}`}
                  className="mt-1 inline-block font-semibold text-[var(--sun-dark)]"
                >
                  {picked.phone}
                </a>
              )}
            </div>
            {/*
              Кнопка нарисована, а не набрана символом: «×» из шрифта выходит
              тонким и светлым, и оператор писал, что закрытие плохо видно.
              Обводка, своя подложка и крестик линиями в цвет текста — теперь
              это кнопка, а не тень от неё.
            */}
            <button
              type="button"
              onClick={() => setPicked(null)}
              aria-label="Закрыть"
              title="Закрыть (Esc)"
              className="-mr-1 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] transition hover:border-[color:var(--ink)] hover:bg-[var(--ink)] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sun-dark)]"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3.5 3.5 12.5 12.5M12.5 3.5 3.5 12.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[var(--mist)] px-3 py-1 text-xs font-semibold text-[var(--ink)]">
              {ROOM_LABEL[picked.room_slug] ?? picked.room_slug}
            </span>
            {picked.unit_id && (
              <span className="rounded-full bg-[var(--ink)] px-3 py-1 text-xs font-bold text-white">
                {picked.unit_id}
              </span>
            )}
            <span className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
              {picked.source === "exely" ? "из Exely" : "заведена в панели"}
            </span>
          </div>

          <div className="mt-4 grid gap-2 border-t border-[color:var(--line)] pt-4 text-sm text-[var(--ink)] sm:grid-cols-2">
            <span>
              <b>{DAY_USE.has(picked.room_slug) ? "День" : "Заезд"}</b> {picked.checkin}
              {picked.checkout ? ` → ${picked.checkout}` : ""}
            </span>
            <span>
              <b>Гости</b> {picked.adults} взр{picked.kids > 0 ? ` · ${picked.kids} дет` : ""}
            </span>
            <span>
              <b>Сумма</b> {money(picked.total)} сум
            </span>

          </div>

          {DAY_USE.has(picked.room_slug) && picked.id > 0 && picked.status !== "cancelled" ? (
            <form
              action={doCancel}
              className="mt-4 flex items-center gap-3 border-t border-[color:var(--line)] pt-4"
              onSubmit={(e) => {
                if (!confirm(`Отменить бронь «${picked.guest_name}»?`)) e.preventDefault();
              }}
            >
              <input type="hidden" name="id" value={picked.id} />
              <input type="hidden" name="status" value="cancelled" />
              <button
                type="submit"
                disabled={cancelling}
                className="rounded-xl border border-[color:var(--rose,#b4413c)] px-5 py-2 text-sm font-bold text-[var(--rose,#b4413c)] transition hover:bg-[var(--rose,#b4413c)]/8 disabled:opacity-50"
              >
                {cancelling ? "Отменяем…" : "Отменить бронь"}
              </button>
              {cancel.ok && <span className="text-sm font-semibold text-[var(--green,#3f7d52)]">{cancel.ok}</span>}
              {cancel.error && <span className="text-sm font-semibold text-[var(--rose,#b4413c)]">{cancel.error}</span>}
            </form>
          ) : (
            <p className="mt-4 border-t border-[color:var(--line)] pt-4 text-sm text-[var(--muted)]">
              {picked.source === "exely"
                ? "Бронь живёт в Exely — отменяйте её там же, где завели."
                : "Отмена домиков идёт через Exely; здесь бронь только показана."}
            </p>
          )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-[var(--muted)]">
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded bg-[var(--surface-warm)] align-middle ring-1 ring-[var(--line-strong)]" />Заявка</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded bg-[var(--sun)]/60 align-middle" />Подтверждена</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded bg-[var(--green,#3f7d52)] align-middle" />Оплачена</span>
        <span><span className="mr-1.5 inline-block h-3 w-3 rounded border border-dashed border-[var(--sun)] align-middle" />Из Exely — только для чтения</span>
        <span>Пустая клетка — свободно. Наведите на бронь, чтобы увидеть телефон и сумму.</span>
      </div>
    </div>
  );
}
