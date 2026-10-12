import { describe, expect, it } from "vitest";
import { GALLERY_MAX } from "../model";
import { DEFAULT_SETTINGS, normalizeSettings, pickText, withinHours } from "../rules";

/**
 * Правила ресторана после 12.10.2026: раздел — меню и фотогалерея. Проверяется
 * то, что приходит из базы и чего не видно глазами: битые настройки, старые
 * поля заказов, адреса фото.
 */

describe("настройки из базы", () => {
  it("битая запись не роняет страницы — берутся значения по умолчанию", () => {
    expect(normalizeSettings(null)).toEqual(DEFAULT_SETTINGS);
    const s = normalizeSettings({
      state: "взлом",
      hoursOpen: "25:00",
      instagram: "javascript:alert(1)",
      phones: ["+998 95 521 00 14", "<script>"],
    });
    expect(s.state).toBe("hidden");
    expect(s.hoursOpen).toBe("");
    expect(s.instagram).toBe("");
    expect(s.phones).toEqual(["+998 95 521 00 14"]);
  });

  it("раздел по умолчанию скрыт", () => {
    expect(DEFAULT_SETTINGS.state).toBe("hidden");
  });

  it("прежний «анонс» читается как «виден на сайте»", () => {
    // Анонс отличался от «работает» только закрытыми заказами — заказов больше нет.
    expect(normalizeSettings({ state: "announce" }).state).toBe("open");
    expect(normalizeSettings({ state: "open" }).state).toBe("open");
  });

  it("поля прежних заказов отбрасываются", () => {
    const s = normalizeSettings({ modes: { delivery: true }, tables: true, deliveryFee: 15_000, notifyHotel: true });
    expect(Object.keys(s).sort()).toEqual(Object.keys(DEFAULT_SETTINGS).sort());
  });

  it("старый текст «О ресторане» с приглашением заказать заменяется, свой — остаётся", () => {
    // Он лежит в рабочей базе как сохранённая настройка (30.09.2026).
    const stored = {
      ru: "Кухня ресторана «Сазанчик» — в горах, на территории CHIMGAN DARBAZA. Выберите блюда на сайте: заберите сами, закажите доставку или подачу в домик. Менеджер ресторана подтвердит состав, время и стоимость.",
      uz: "…",
      en: "…",
    };
    expect(normalizeSettings({ about: stored }).about).toEqual(DEFAULT_SETTINGS.about);
    expect(DEFAULT_SETTINGS.about.ru).not.toMatch(/заказ|доставк/i);

    const own = { ru: "Плов на дровах и вид на Чимган.", uz: "", en: "" };
    expect(normalizeSettings({ about: own }).about).toEqual(own);
  });
});

describe("фотогалерея", () => {
  it("берёт только адреса картинок — свои и https, без дублей", () => {
    const s = normalizeSettings({
      gallery: ["/blob/restaurant/gallery/a.webp", "https://cdn.example/b.webp", "javascript:alert(1)", "http://x/y.jpg", 42, "/blob/restaurant/gallery/a.webp"],
    });
    expect(s.gallery).toEqual(["/blob/restaurant/gallery/a.webp", "https://cdn.example/b.webp"]);
  });

  it(`не больше ${GALLERY_MAX} фото, порядок сохраняется`, () => {
    const many = Array.from({ length: GALLERY_MAX + 5 }, (_, i) => `/blob/g/${i}.webp`);
    const s = normalizeSettings({ gallery: many });
    expect(s.gallery).toHaveLength(GALLERY_MAX);
    expect(s.gallery[0]).toBe("/blob/g/0.webp");
  });

  it("нет галереи в базе — пустой список, а не ошибка", () => {
    expect(normalizeSettings({}).gallery).toEqual([]);
    expect(normalizeSettings({ gallery: "не список" }).gallery).toEqual([]);
  });
});

describe("часы работы", () => {
  const day = { hoursOpen: "10:00", hoursClose: "22:00" };
  const night = { hoursOpen: "12:00", hoursClose: "02:00" };

  it("минута закрытия уже не рабочая", () => {
    expect(withinHours(day, 10 * 60)).toBe(true);
    expect(withinHours(day, 22 * 60 - 1)).toBe(true);
    expect(withinHours(day, 22 * 60)).toBe(false);
  });

  it("часы через полночь", () => {
    expect(withinHours(night, 23 * 60)).toBe(true);
    expect(withinHours(night, 60)).toBe(true);
    expect(withinHours(night, 3 * 60)).toBe(false);
  });

  it("часы не заданы — ограничения нет", () => {
    expect(withinHours({ hoursOpen: "", hoursClose: "" }, 3 * 60)).toBe(true);
  });
});

describe("язык текста", () => {
  it("нет перевода — русский", () => {
    expect(pickText({ ru: "Плов", uz: "", en: "" }, "en")).toBe("Плов");
    expect(pickText({ ru: "Плов", uz: "Palov", en: "" }, "uz")).toBe("Palov");
  });
});
