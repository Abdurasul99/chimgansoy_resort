import { describe, expect, it } from "vitest";
import { getDayProduct } from "./day-products";
import { policies } from "./policies";

describe("правила тюбинговой горки", () => {
  const rules = policies.find((policy) => policy.slug === "tubing-rules");

  it("публикует все 19 нумерованных разделов документа", () => {
    expect(rules).toBeDefined();
    const numbered = rules?.sections.filter((section) => /^\d+\.\s/.test(section.title.ru)) ?? [];
    expect(numbered).toHaveLength(19);
  });

  it("сохраняет ключевые ограничения без смягчения текста", () => {
    const text = rules?.sections.flatMap((section) => section.items.ru).join("\n") ?? "";

    expect(text).toContain("Дети младше 4 лет к спуску с Горки не допускаются.");
    expect(text).toContain("сила ветра превышает 8 м/с");
    expect(text).toContain("беременные женщины");
    expect(text).toContain("Посещение Горки означает согласие с настоящими Правилами.");
  });

  it("публикует реквизиты именно из переданного DOCX", () => {
    const text = rules?.sections.flatMap((section) => section.items.ru).join("\n") ?? "";

    expect(text).toContain("ИНН: 312824233");
    expect(text).toContain("info@chimgandarbaza.uz");
    expect(text).toContain("+998 70 176 00 11");
  });

  it("добавляет актуальные ограничения тюбинга 100 см редакции № 3", () => {
    const text = rules?.sections.flatMap((section) => section.items.ru).join("\n") ?? "";

    expect(text).toContain("Диаметр тюбинга: 100 см.");
    expect(text).toContain("Максимальная нагрузка: строго до 95 кг");
    expect(text).toContain("рост от 140 см");
    // Совместный спуск запрещён распоряжением от 18.08.2026: катается один
    // человек, поэтому суммарного веса пары больше не существует как понятия.
    expect(text).not.toContain("Суммарный вес взрослого и ребёнка");
    expect(text).toMatch(/ТОЛЬКО ОДНОМУ ЧЕЛОВЕКУ|Совместный спуск ЗАПРЕЩЁН/);
  });

  it("не оставляет старые разрешения, противоречащие новым правилам", () => {
    const text = rules?.sections.flatMap((section) => section.items.ru).join("\n") ?? "";

    expect(text).not.toContain("рост не менее 120 см");
    expect(text).not.toContain("сидя цепочкой");
    expect(text).not.toContain("лёжа на спине ногами вперёд");
    expect(text).not.toContain("кроме экстренных случаев");
  });

  it("не разбивает номера пунктов 10–19 на отдельные цифры", () => {
    const items = rules?.sections.flatMap((section) => section.items.ru) ?? [];

    expect(items).not.toContain("1");
  });

  it("публикует ключевые правила на узбекском и английском", () => {
    const uz = rules?.sections.flatMap((section) => section.items.uz).join("\n") ?? "";
    const en = rules?.sections.flatMap((section) => section.items.en).join("\n") ?? "";

    expect(uz).toContain("Tyubing diametri: 100 sm");
    expect(uz).toContain("95 kg");
    expect(en).toContain("Tube diameter: 100 cm");
    expect(en).toContain("95 kg");
  });
});

describe("публичная оферта — приложение о тюбинговой горке", () => {
  const offer = policies.find((policy) => policy.slug === "public-offer");
  const text = offer?.sections.flatMap((section) => section.items.ru).join("\n") ?? "";

  it("совпадает с техническими ограничениями тюбинга 100 см", () => {
    expect(text).toContain("Диаметр тюбинга составляет 100 см");
    expect(text).toContain("строго до 95 кг");
    expect(text).toContain("ростом от 140 см");
  });

  it("не содержит отменённых разрешений", () => {
    expect(text).not.toContain("ростом от 120 см");
    expect(text).not.toContain("кроме экстренных случаев для предотвращения столкновения");
  });
});

describe("страница услуги тюбинга", () => {
  const product = getDayProduct("tubing");

  it("до формы объясняет основные технические ограничения", () => {
    const ru = [
      ...(product?.highlights.ru ?? []),
      ...(product?.sections?.map((section) => section.body.ru) ?? []),
    ].join("\n");

    expect(ru).toContain("100 см");
    expect(ru).toContain("95 кг");
    expect(ru).toContain("140 см");
  });
});
