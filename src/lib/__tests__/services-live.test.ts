import { describe, expect, it } from "vitest";
import { resolveServices, visibleServices } from "@/lib/services-live";
import { services } from "@/content/services";
import { EMPTY, type OverrideData } from "@/lib/site-overrides";

const patch = (p: Partial<OverrideData>): OverrideData => ({ ...EMPTY, ...p });

describe("услуги — без правок оператора", () => {
  it("показываются ровно те, что в коде", () => {
    const live = visibleServices(EMPTY);
    expect(live.map((s) => s.slug)).toEqual(services.map((s) => s.slug));
    expect(live.every((s) => !s.isCustom)).toBe(true);
    expect(live.every((s) => s.priceNote === undefined)).toBe(true);
  });
});

describe("услуги — скрытие", () => {
  const slug = services[0].slug;

  it("скрытая исчезает из выдачи, но остаётся в админке", () => {
    const data = patch({ services: { [slug]: { hidden: true } } });
    expect(visibleServices(data).map((s) => s.slug)).not.toContain(slug);
    // The admin still lists it — otherwise there is no way to switch it back on.
    expect(resolveServices(data).map((s) => s.slug)).toContain(slug);
    expect(resolveServices(data).find((s) => s.slug === slug)!.hidden).toBe(true);
  });

  it("скрытие одной не задевает остальные", () => {
    const data = patch({ services: { [slug]: { hidden: true } } });
    expect(visibleServices(data).length).toBe(services.length - 1);
  });
});

describe("услуги — строка с ценой", () => {
  it("свободный текст, а не число", () => {
    const slug = services[1].slug;
    for (const note of ["от 150 000 сум", "по запросу", "включено в проживание"]) {
      const data = patch({ services: { [slug]: { priceNote: note } } });
      expect(visibleServices(data).find((s) => s.slug === slug)!.priceNote).toBe(note);
    }
  });

  it("пустая строка не превращается в пустую подпись под карточкой", () => {
    const slug = services[1].slug;
    const data = patch({ services: { [slug]: { priceNote: "" } } });
    expect(visibleServices(data).find((s) => s.slug === slug)!.priceNote).toBeUndefined();
  });
});

describe("услуги оператора", () => {
  const custom = {
    slug: "bania",
    title: "Баня",
    description: "Дровяная баня у реки, на компанию до шести человек.",
    priceNote: "500 000 сум за два часа",
    hidden: false,
  };

  it("добавляются в конец списка и помечены как свои", () => {
    const live = visibleServices(patch({ customServices: [custom] }));
    expect(live.at(-1)!.slug).toBe("bania");
    expect(live.at(-1)!.isCustom).toBe(true);
    expect(live.at(-1)!.custom?.title).toBe("Баня");
  });

  it("тоже скрываются", () => {
    const live = visibleServices(patch({ customServices: [{ ...custom, hidden: true }] }));
    expect(live.map((s) => s.slug)).not.toContain("bania");
  });

  it("не могут перебить услугу из кода тем же адресом", () => {
    // Two cards under one URL is the failure this guards: the code wins, and
    // the admin refuses the collision earlier — this is the second line.
    const collide = { ...custom, slug: services[0].slug, title: "Подделка" };
    const live = visibleServices(patch({ customServices: [collide] }));
    expect(live.filter((s) => s.slug === services[0].slug).length).toBe(1);
    expect(live.find((s) => s.slug === services[0].slug)!.isCustom).toBe(false);
  });
});

describe("услуги — мусор в сторе", () => {
  it("пустой список правок эквивалентен отсутствию правок", () => {
    expect(visibleServices(patch({ services: {}, customServices: [] }))).toEqual(visibleServices(EMPTY));
  });

  it("правка для несуществующего слага ничего не ломает", () => {
    const data = patch({ services: { "нет-такой-услуги": { hidden: true } } });
    expect(visibleServices(data).length).toBe(services.length);
  });
});
