import { describe, expect, it } from "vitest";
import { pageContext, pageLabel, pageLine } from "@/lib/request-context";

/**
 * Контекст обращения. Оператор получал «Новый вопрос: имя, телефон» и звонил
 * гостю выяснять, о чём вопрос; страница отвечает на это раньше текста.
 *
 * Поле приходит из браузера, поэтому половина тестов — про недоверие к нему.
 */
const form = (page: string) => {
  const fd = new FormData();
  fd.set("page", page);
  return fd;
};

describe("контекст обращения", () => {
  it("берёт путь как есть", () => {
    expect(pageContext(form("/ru/nomera/cottage"))).toBe("/ru/nomera/cottage");
  });

  it("сохраняет параметры — в них даты и число гостей", () => {
    expect(pageContext(form("/ru/bron?checkin=2026-09-01&guests=4"))).toBe(
      "/ru/bron?checkin=2026-09-01&guests=4",
    );
  });

  it("не пропускает чужую ссылку", () => {
    // Оператор кликает по тому, что видит в сообщении. Полный адрес чужого
    // сайта в поле «Страница» — это ссылка, которую туда вписал не он.
    for (const bad of ["https://evil.example/phish", "//evil.example", "javascript:alert(1)"]) {
      expect(pageContext(form(bad)), bad).toBe("");
    }
  });

  it("не пропускает перевод строки — иначе можно дописать своё поле", () => {
    expect(pageContext(form("/ru\nТелефон: +998000000000"))).toBe("");
  });

  it("обрезает слишком длинный путь", () => {
    expect(pageContext(form("/ru/" + "a".repeat(500))).length).toBe(120);
  });

  it("называет раздел словом, а не только адресом", () => {
    expect(pageLabel("/ru/nomera/pool")).toBe("бассейн");
    expect(pageLabel("/uz/topchan")).toBe("топчан");
    expect(pageLabel("/en/tubing")).toBe("тюбинг");
    expect(pageLabel("/ru")).toBe("главная");
  });

  it("незнакомый раздел показывает адресом, а не выдумывает название", () => {
    expect(pageLabel("/ru/что-то-новое")).toBe("");
    expect(pageLine(form("/ru/что-то-новое"))).toBe("/ru/что-то-новое");
  });

  it("строка для оператора читается с одного взгляда", () => {
    expect(pageLine(form("/ru/nomera/cottage"))).toBe("шале (/ru/nomera/cottage)");
  });

  it("пустое поле не превращается в пустую строку «Страница:»", () => {
    expect(pageLine(new FormData())).toBe("");
  });
});
