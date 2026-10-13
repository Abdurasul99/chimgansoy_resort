/**
 * Топчаны закрыты оператором 12.10.2026 («отключить бассейн и топчан из поля
 * видимости») — проверяем, что их не видно и не продают нигде, где их может
 * встретить гость: меню, подвал, вопросы перед поездкой, брифинги ИИ.
 */
import { describe, expect, it } from "vitest";
import { topchanClosure } from "@/content/topchan-closure";
import { poolClosure } from "@/content/pool-closure";
import { mainNavigation, footerNavigation } from "@/content/navigation";
import { faqItems } from "@/content/faq";
import { homeShowcase } from "@/content/home-showcase";
import { resolvePricing } from "@/lib/pricing-resolve";
import { money, venueFacts, venueCore } from "@/lib/venue-facts";

const flat = (items: unknown): string => JSON.stringify(items);

describe("топчаны закрыты", () => {
  it("флаг включён — остальные проверки имеют смысл только при нём", () => {
    expect(topchanClosure.closed).toBe(true);
  });

  it("ни меню, ни подвал не ведут к топчану, пикник-зоне и мангалу", () => {
    for (const nav of [mainNavigation, footerNavigation]) {
      const s = flat(nav);
      expect(s).not.toContain('"/topchan"');
      expect(s).not.toContain("/services/picnic-zone");
      expect(s).not.toContain("/services/outdoor-cooking");
    }
  });

  it("«можно приехать на день» не продаёт топчан и не называет его цену", () => {
    const patched = resolvePricing({ "topchan.rent.weekday": 313_131 });
    const day = faqItems(patched).find((i) => i.question.ru.startsWith("Можно приехать на день"))!;
    for (const locale of ["ru", "uz", "en"] as const) {
      expect(day.answer[locale], locale).not.toContain(money(313_131));
    }
    expect(day.answer.ru).toMatch(/топчаны в пикник-зоне закрыты до нового сезона/i);
  });

  it("оба брифинга ИИ знают, что топчаны закрыты, и не зовут к ним", () => {
    for (const text of [venueFacts(), venueCore()]) {
      expect(text).toContain("ТОПЧАНЫ И ПИКНИК-ЗОНА ЗАКРЫТЫ ДО НОВОГО СЕЗОНА");
      // Закрытый бассейн больше не отсылает к закрытым топчанам.
      if (poolClosure.closed) expect(text).not.toMatch(/предлож\S* топчан/i);
    }
  });

  it("рассказ о территории на главной не зовёт в пикник-зону и бассейн", () => {
    const s = JSON.stringify(homeShowcase);
    expect(s).not.toMatch(/пикник|piknik|picnic/i);
    if (poolClosure.closed) expect(s).not.toMatch(/680 м²|680 m²/);
  });

  it("тексты для гостя есть на всех трёх языках", () => {
    for (const field of [topchanClosure.title, topchanClosure.text, topchanClosure.formError]) {
      for (const locale of ["ru", "uz", "en"] as const) expect(field[locale].length).toBeGreaterThan(10);
    }
  });
});
