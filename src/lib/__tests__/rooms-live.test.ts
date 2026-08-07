import { describe, expect, it } from "vitest";
import { resolveRoom, resolveRooms } from "@/lib/rooms-live";
import { rooms } from "@/content/rooms";
import { EMPTY, type OverrideData } from "@/lib/site-overrides";

const glamping = rooms.find((r) => r.slug === "glamping")!;
const patch = (rooms: OverrideData["rooms"]): OverrideData => ({ ...EMPTY, rooms });

describe("страница домика — без правок оператора", () => {
  it("показывает ровно то, что в коде, на всех локалях", () => {
    const live = resolveRoom(glamping, EMPTY);
    for (const locale of ["ru", "uz", "en"] as const) {
      expect(live.amenities(locale)).toEqual(glamping.amenities[locale]);
      expect(live.features(locale)).toEqual(glamping.features[locale]);
    }
    // gallery отдаёт готовые кадры, galleryKeys — исходные ключи.
    expect(live.galleryKeys).toEqual(glamping.gallery);
    expect(live.gallery.length).toBe(glamping.gallery.length);
    expect(live.priceNote).toBeUndefined();
    expect(live.edited).toEqual({ amenities: false, features: false, gallery: false });
  });

  it("резолвит все домики", () => {
    expect(resolveRooms(EMPTY).map((r) => r.base.slug)).toEqual(rooms.map((r) => r.slug));
  });
});

describe("страница домика — списки", () => {
  it("список оператора ЗАМЕНЯЕТ кодовый, а не дополняет его", () => {
    // The whole point: an operator who deletes a line means it. Merging would
    // put it straight back and make removal impossible.
    const live = resolveRoom(glamping, patch({ glamping: { amenities: ["Только это"] } }));
    expect(live.amenities("ru")).toEqual(["Только это"]);
    expect(live.amenities("ru")).not.toContain(glamping.amenities.ru[0]);
  });

  it("один и тот же список на всех трёх языках", () => {
    const live = resolveRoom(glamping, patch({ glamping: { amenities: ["Мангал по запросу"] } }));
    expect(live.amenities("uz")).toEqual(["Мангал по запросу"]);
    expect(live.amenities("en")).toEqual(["Мангал по запросу"]);
  });

  it("нетронутый список продолжает следовать коду", () => {
    const live = resolveRoom(glamping, patch({ glamping: { amenities: ["Одно"] } }));
    // features untouched → still translated three ways.
    expect(live.features("uz")).toEqual(glamping.features.uz);
    expect(live.edited).toMatchObject({ amenities: true, features: false });
  });
});

describe("страница домика — галерея", () => {
  it("оператор выбирает кадры и их порядок", () => {
    const chosen = [glamping.gallery[2], glamping.gallery[0]];
    const live = resolveRoom(glamping, patch({ glamping: { gallery: chosen } }));
    expect(live.galleryKeys).toEqual(chosen);
    expect(live.edited.gallery).toBe(true);
  });

  it("несуществующий ключ отбрасывается, страница не падает", () => {
    // A photo renamed in a deploy must not 500 the room page for everyone.
    const live = resolveRoom(glamping, patch({ glamping: { gallery: ["нет-такой-картинки", glamping.gallery[1]] } }));
    expect(live.galleryKeys).toEqual([glamping.gallery[1]]);
  });

  it("пустая галерея откатывается к кодовой, а не оставляет пустое место", () => {
    for (const empty of [[], ["нет-такой", "и-такой"]]) {
      const live = resolveRoom(glamping, patch({ glamping: { gallery: empty } }));
      // gallery отдаёт готовые кадры, galleryKeys — исходные ключи.
    expect(live.galleryKeys).toEqual(glamping.gallery);
    expect(live.gallery.length).toBe(glamping.gallery.length);
      expect(live.edited.gallery).toBe(false);
    }
  });
});

describe("страница домика — строка с ценой", () => {
  it("перебивает живую цену, когда заполнена", () => {
    const live = resolveRoom(glamping, patch({ glamping: { priceNote: "по запросу" } }));
    expect(live.priceNote).toBe("по запросу");
  });

  it("пустая строка не считается правкой", () => {
    expect(resolveRoom(glamping, patch({ glamping: {} })).priceNote).toBeUndefined();
  });
});

describe("страница домика — правки одного не задевают другой", () => {
  it("правка глэмпинга не меняет шале", () => {
    const data = patch({ glamping: { amenities: ["Одно"] } });
    const cottage = rooms.find((r) => r.slug === "cottage")!;
    expect(resolveRoom(cottage, data).amenities("ru")).toEqual(cottage.amenities.ru);
  });

  it("правка для несуществующего домика ничего не ломает", () => {
    expect(resolveRoom(glamping, patch({ "нет-домика": { amenities: ["x"] } })).amenities("ru")).toEqual(
      glamping.amenities.ru,
    );
  });
});
