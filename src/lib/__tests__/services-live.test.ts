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

describe("услуги — список выключенных для сеток", () => {
  // Главная и страницы номеров рисуют карточки из кода, а не из getServices().
  // Им нужен список того, что оператор погасил; getServices() его дать не может
  // — он это уже выбросил. Первая версия считала hidden поверх getServices() и
  // всегда получала пустой список: выключатель гасил только каталог /services.
  it("visibleServices ничего не знает о скрытых", () => {
    const slug = services[0].slug;
    const data = patch({ services: { [slug]: { hidden: true } } });
    expect(visibleServices(data).filter((s) => s.hidden)).toEqual([]);
  });

  it("resolveServices отдаёт именно те слаги, что выключены", () => {
    const [a, , c] = services;
    const data = patch({ services: { [a.slug]: { hidden: true }, [c.slug]: { hidden: true } } });
    const hidden = resolveServices(data).filter((s) => s.hidden).map((s) => s.slug);
    expect(hidden).toEqual([a.slug, c.slug]);
  });
});

describe("услуги — главная и порядок", () => {
  it("услуга из кода по умолчанию претендует на главную", () => {
    // Иначе деплой с новым полем молча очистил бы блок «чем занять день».
    expect(resolveServices(EMPTY).every((s) => s.showOnHome)).toBe(true);
  });

  it("своя услуга по умолчанию идёт в каталог, но не на главную", () => {
    const data = patch({
      customServices: [{ slug: "sauna", title: "Сауна", description: "Частная сауна на дровах" }],
    });
    const sauna = visibleServices(data).find((s) => s.slug === "sauna")!;
    expect(sauna.showOnHome).toBe(false);
    expect(sauna.hidden).toBe(false);
  });

  it("снятая с главной остаётся в каталоге", () => {
    const slug = services[1].slug;
    const data = patch({ services: { [slug]: { showOnHome: false } } });
    const one = visibleServices(data).find((s) => s.slug === slug)!;
    expect(one.showOnHome).toBe(false);
    expect(one.hidden).toBe(false);
  });

  it("номер поднимает услугу выше остальных", () => {
    // Оператор ставит новую услугу на место убранной — без правки кода.
    const last = services[services.length - 1].slug;
    const data = patch({ services: { [last]: { order: 0 } } });
    expect(visibleServices(data)[0].slug).toBe(last);
  });

  it("своя услуга может встать между услугами из кода", () => {
    const data = patch({
      customServices: [
        { slug: "horse-riding", title: "Конные прогулки", description: "Прогулки верхом", order: 1, showOnHome: true },
      ],
    });
    expect(visibleServices(data)[1].slug).toBe("horse-riding");
  });

  it("при равных номерах порядок остаётся как в коде", () => {
    const [a, b] = services;
    const data = patch({ services: { [a.slug]: { order: 5 }, [b.slug]: { order: 5 } } });
    const order = visibleServices(data).map((s) => s.slug);
    expect(order.indexOf(a.slug)).toBeLessThan(order.indexOf(b.slug));
  });
});
