/**
 * Бассейн закрыт оператором 27.08.2026 — проверяем, что он закрыт ВЕЗДЕ.
 *
 * Через панель на chimgansoy.com выключить его было нельзя: там выключатель
 * есть только у услуг, а бассейн заведён как объект размещения. Поэтому флаг
 * живёт в коде, и цена ошибки высока: забытое место — это либо ссылка на
 * несуществующую услугу, либо принятая заявка на то, чего нет.
 */
import { describe, expect, it } from "vitest";
import { poolClosure } from "@/content/pool-closure";
import { topchanClosure } from "@/content/topchan-closure";
import { mainNavigation, footerNavigation } from "@/content/navigation";
import { rooms } from "@/content/rooms";
import { venueFacts, venueCore } from "@/lib/venue-facts";

const flat = (items: unknown): string => JSON.stringify(items);

describe("бассейн закрыт", () => {
  it("флаг включён — остальные проверки имеют смысл только при нём", () => {
    expect(poolClosure.closed).toBe(true);
  });

  it("в главном меню нет ссылки на бассейн", () => {
    expect(flat(mainNavigation)).not.toContain("/nomera/pool");
  });

  it("в подвале нет ссылки на бассейн — ни в размещении, ни в дневном отдыхе", () => {
    expect(flat(footerNavigation)).not.toContain("/nomera/pool");
  });

  it("страница бассейна не удалена — гость с сохранённой ссылки должен что-то увидеть", () => {
    // Ссылку могли сохранить, переслать или напечатать. Убрать страницу
    // значило бы отдать таким гостям 404 вместо объяснения.
    expect(rooms.some((r) => r.slug === "pool")).toBe(true);
  });

  it("ИИ-консьерж и телеграм-бот знают о закрытии", () => {
    for (const text of [venueFacts(), venueCore()]) {
      expect(text).toContain("БАССЕЙН ЗАКРЫТ ДО ЛЕТНЕГО СЕЗОНА");
      expect(text).toContain(poolClosure.since);
    }
  });

  it("ИИ не обещает дату открытия — её нет", () => {
    expect(venueFacts()).toMatch(/НЕ ОБЕЩАЙ точную дату открытия|точную дату открытия не называем/);
  });

  it("тексты для гостя есть на всех трёх языках", () => {
    for (const field of [poolClosure.title, poolClosure.text, poolClosure.alternative, poolClosure.formError]) {
      for (const locale of ["ru", "uz", "en"] as const) {
        expect(field[locale].length).toBeGreaterThan(10);
      }
    }
  });

  it("гостю предлагают то, что работает, а не только отказ", () => {
    expect(poolClosure.alternative.ru).toMatch(/тюбинг/i);
    // Топчаны закрыты с 12.10.2026 — тогда их не предлагают, предлагают ресторан.
    if (topchanClosure.closed) {
      expect(poolClosure.alternative.ru).not.toMatch(/топчан/i);
      expect(poolClosure.formError.ru).not.toMatch(/топчан/i);
      expect(poolClosure.alternative.ru).toMatch(/ресторан/i);
    } else {
      expect(poolClosure.alternative.ru).toMatch(/топчан/i);
    }
  });
});

describe("бассейн закрыт — тексты сайта не обещают его как работающий (оператор, 12.10.2026)", () => {
  it("каталог домиков, «О курорте», «Чем заняться», «Круглый год», «Место», SEO", async () => {
    if (!poolClosure.closed) return;
    const { dictionaries } = await import("@/content/translations");
    const { attractions } = await import("@/content/attractions");
    const { pageSeo } = await import("@/content/seo");
    const texts = [
      ...(["ru", "uz", "en"] as const).flatMap((l) => {
        const h = dictionaries[l].home as unknown as Record<string, unknown>;
        const p = (dictionaries[l] as unknown as { pages: Record<string, { lead: string }> }).pages;
        return [h.thingsText, h.yearRoundText, p.rooms.lead, p.about.lead];
      }),
      JSON.stringify(attractions),
      JSON.stringify(pageSeo),
    ];
    for (const t of texts) expect(t).not.toMatch(/бассейн|basseyn|\bpool\b/i);
  });
});
