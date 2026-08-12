import { describe, expect, it } from "vitest";
import { coerce, type OverrideData } from "@/lib/site-overrides";

/**
 * Разбор схемы формы из хранилища.
 *
 * Проверяется не «сохраняется ли», а что сайт переживёт кривой документ: поле
 * без типа, список без вариантов, два поля с одним ключом. Публичная страница
 * не должна падать из-за того, что кто-то поправил JSON руками.
 */
const withFields = (formFields: unknown) =>
  coerce({
    version: 1,
    updatedAt: "",
    updatedBy: "test",
    data: {
      prices: {},
      services: {},
      customServices: [{ slug: "sauna", title: "Сауна", description: "Частная сауна", formFields }],
      rooms: {},
      photos: [],
      news: [],
    },
  });

const fieldsOf = (data: OverrideData) => data.customServices.find((s) => s.slug === "sauna")?.formFields;

describe("поля формы — что доезжает до страницы", () => {
  it("нормальное поле проходит целиком", () => {
    const f = fieldsOf(
      withFields([{ key: "guests", label: "Гостей", type: "number", required: true, min: 1, max: 20 }]),
    );
    expect(f).toEqual([
      { key: "guests", label: "Гостей", type: "number", required: true, placeholder: undefined, options: undefined, min: 1, max: 20 },
    ]);
  });

  it("список вариантов сохраняет порядок", () => {
    const f = fieldsOf(withFields([{ key: "paket", label: "Пакет", type: "select", options: ["Стандарт", "Премиум"] }]));
    expect(f?.[0].options).toEqual(["Стандарт", "Премиум"]);
  });
});

describe("поля формы — мусор в документе", () => {
  const dropped = (raw: unknown) => expect(fieldsOf(withFields([raw]))).toBeUndefined();

  it("поле без ключа выбрасывается", () => dropped({ label: "Гостей", type: "text" }));
  it("поле без названия выбрасывается", () => dropped({ key: "guests", type: "text" }));
  it("незнакомый тип выбрасывается", () => dropped({ key: "x", label: "Файл", type: "upload" }));

  it("список без вариантов выбрасывается — заполнить его нельзя", () => {
    dropped({ key: "paket", label: "Пакет", type: "select" });
    dropped({ key: "paket", label: "Пакет", type: "select", options: [] });
  });

  it("второе поле с тем же ключом выбрасывается — иначе ответы перетрут друг друга", () => {
    const f = fieldsOf(
      withFields([
        { key: "guests", label: "Гостей", type: "number" },
        { key: "guests", label: "Ещё гостей", type: "number" },
      ]),
    );
    expect(f).toHaveLength(1);
    expect(f?.[0].label).toBe("Гостей");
  });

  it("не массив читается как «формы нет»", () => {
    expect(fieldsOf(withFields("да"))).toBeUndefined();
    expect(fieldsOf(withFields(null))).toBeUndefined();
  });

  it("одно кривое поле не уносит с собой остальные", () => {
    const f = fieldsOf(
      withFields([
        { key: "date", label: "Дата", type: "date" },
        { label: "Без ключа", type: "text" },
        { key: "note", label: "Комментарий", type: "textarea" },
      ]),
    );
    expect(f?.map((x) => x.key)).toEqual(["date", "note"]);
  });
});
