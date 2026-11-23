/**
 * Блок акций на границе сроков — рендер с подменённым часами.
 *
 * Когда «2+1» по сроку уходит, ведущей становится следующая акция — её расчёт
 * должен остаться на месте, а не пропасть вместе с ведущим шаблоном.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { OffersSection } from "../OffersSection";

// С 30.09.2026 у акций срока нет; здесь он подставлен — как было в сентябре,
// — чтобы граница срока оставалась проверенной до следующей датированной акции.
vi.mock("@/content/promotions", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/content/promotions")>();
  return {
    ...mod,
    // Срок подставлен только «2+1» — у «−20% на Chalet» свой.
    promotions: mod.promotions.map((p) =>
      p.slug === "2plus1" ? { ...p, until: "2026-09-30" } : p,
    ),
  };
});

const at = (iso: string) => {
  vi.useFakeTimers({ toFake: ["Date"] });
  // Полдень по Ташкенту (UTC+5).
  vi.setSystemTime(new Date(`${iso}T07:00:00Z`));
};

afterEach(() => {
  vi.useRealTimers();
});

describe("блок акций по датам", () => {
  it("28.09: «2+1» ещё видна — это последний день заезда", () => {
    at("2026-09-28");
    render(<OffersSection locale="ru" />);
    expect(screen.getByText("«2+1» — третья ночь в подарок")).toBeInTheDocument();
  });

  it("29.09: «2+1» снята, ведущая «−20% на Chalet» — с расчётом", () => {
    at("2026-09-29");
    render(<OffersSection locale="ru" />);
    expect(screen.queryByText("«2+1» — третья ночь в подарок")).toBeNull();
    expect(screen.getByText("−20% на Chalet весь ноябрь")).toBeInTheDocument();
    expect(screen.getByText("Всего 600 000 сум / человек / ночь")).toBeInTheDocument();
  });

  it("29.10: «Всё включено» и «Выходной без спешки» сняты — их карточек нет", () => {
    at("2026-10-29");
    const { container } = render(<OffersSection locale="ru" />);
    expect(container.textContent).not.toMatch(/Всё включено|Выходной без спешки/);
  });

  it("05.10: «−20% на Chalet» с расчётом оператора", () => {
    at("2026-10-05");
    render(<OffersSection locale="ru" />);
    expect(screen.getByText("−20% на Chalet весь ноябрь")).toBeInTheDocument();
    // 3 000 000 → 2 400 000, экономия 600 000, при четверых — 600 000 с человека.
    expect(screen.getByText("2 400 000")).toBeInTheDocument();
    expect(screen.getByText("600 000 сум за каждую ночь")).toBeInTheDocument();
    expect(screen.getByText("Всего 600 000 сум / человек / ночь")).toBeInTheDocument();
  });

  it("30.11: скидка на Chalet ещё идёт — владелец продлил её на ноябрь", () => {
    at("2026-11-30");
    render(<OffersSection locale="ru" />);
    expect(screen.getByText("−20% на Chalet весь ноябрь")).toBeInTheDocument();
    expect(screen.getAllByText(/Акция действует весь ноябрь на проживание в Chalet/).length).toBeGreaterThan(0);
  });

  it("01.12: скидка на Chalet ушла сама", () => {
    at("2026-12-01");
    render(<OffersSection locale="ru" />);
    expect(screen.queryByText("−20% на Chalet весь ноябрь")).toBeNull();
  });

  it("у каждой акции «в один клик» к форме заявки и онлайн-бронь в движке — с меткой акции", () => {
    at("2026-11-23");
    render(<OffersSection locale="uz" />);
    const oneClick = screen.getAllByRole("link", { name: /Bir bosishda bron qilish/ }).map((a) => a.getAttribute("href"));
    const engine = screen.getAllByRole("link", { name: "Onlayn bron qilish" }).map((a) => a.getAttribute("href"));
    // −20% на Chalet — прямо к форме на странице шале, движок сразу на шале.
    expect(oneClick).toContain("/uz/nomera/cottage?utm_source=site&utm_medium=offers&utm_content=chalet-october#zayavka");
    expect(engine).toContain("/uz/bron?room-type=5075761&utm_source=site&utm_medium=offers&utm_content=chalet-october");
    // Акция на любой домик (день рождения; «2+1» в этом файле снята подменённым
    // сроком) — в каталог, где у каждого домика своя такая кнопка.
    expect(oneClick).toContain("/uz/nomera?utm_source=site&utm_medium=offers&utm_content=birthday");
    expect(engine).toContain("/uz/bron?utm_source=site&utm_medium=offers&utm_content=birthday");
    expect(oneClick).toHaveLength(engine.length);
  });

  it("01.10: акций со сроком 30.09 нет", () => {
    at("2026-10-01");
    render(<OffersSection locale="ru" />);
    expect(screen.queryByText("«2+1» — третья ночь в подарок")).toBeNull();
  });
});
