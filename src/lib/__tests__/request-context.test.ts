import { describe, expect, it } from "vitest";
import { pageContext, pageLabel, pageLine, trafficSource } from "@/lib/request-context";

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

describe("откуда пришёл гость", () => {
  const withPage = (page: string) => {
    const fd = new FormData();
    fd.set("page", page);
    return fd;
  };

  it("визитку из шапки Instagram называет словами", () => {
    // Ровно то, что пришло оператору 23.08.2026 тремя параметрами подряд.
    const fd = withPage("/ru/topchan?utm_source=vizitka&utm_medium=bio&utm_campaign=instagram");
    expect(trafficSource(fd)).toBe("визитка из шапки Instagram");
  });

  it("убирает метки из адреса страницы — там они только мешают", () => {
    const fd = withPage("/ru/topchan?utm_source=vizitka&utm_medium=bio&utm_campaign=instagram");
    expect(pageLine(fd)).toBe("топчан (/ru/topchan)");
  });

  it("даты и гостей из адреса не трогает", () => {
    const fd = withPage("/ru/bron?checkin=2026-09-01&guests=4&utm_source=instagram");
    expect(pageLine(fd)).toBe("бронирование (/ru/bron?checkin=2026-09-01&guests=4)");
  });

  it("незнакомую метку печатает как есть, а не выдумывает ей название", () => {
    expect(trafficSource(withPage("/ru?utm_source=blogger_akmal"))).toBe("blogger_akmal");
  });

  it("не повторяет источник, когда кампания названа так же", () => {
    expect(trafficSource(withPage("/ru?utm_source=instagram&utm_campaign=instagram"))).toBe("Instagram");
  });

  it("рекламу называет рекламой", () => {
    expect(trafficSource(withPage("/ru?utm_source=google&utm_medium=cpc&utm_campaign=avgust"))).toBe(
      "Google · реклама · avgust",
    );
  });

  it("без меток молчит — пустая строка «Пришёл из» хуже, чем её отсутствие", () => {
    expect(trafficSource(withPage("/ru/topchan"))).toBe("");
    expect(trafficSource(new FormData())).toBe("");
  });

  it("метку с разметкой отбрасывает целиком", () => {
    // Значение приходит из браузера, а строка печатается оператору. Показать
    // «bhackb» можно было бы, но молчание честнее: это уже не источник.
    expect(trafficSource(withPage("/ru?utm_source=<b>hack</b>"))).toBe("");
  });

  it("помнит источник, когда гость ушёл со страницы приземления", () => {
    // Тот самый случай из заявки 24.08.2026: гость пришёл по ссылке из шапки
    // Instagram на главную, а заявку оставил на странице глэмпинга — там в
    // адресе меток уже нет. Источник приходит отдельным полем.
    const fd = new FormData();
    fd.set("page", "/uz/nomera/glamping");
    fd.set("source", "utm_source=vizitka&utm_medium=bio&utm_campaign=instagram");

    expect(trafficSource(fd)).toBe("визитка из шапки Instagram");
    expect(pageLine(fd)).toBe("глэмпинг (/uz/nomera/glamping)");
  });

  it("запомненный источник главнее адреса страницы", () => {
    // Внутри сайта ссылки тоже бывают с метками. Первый источник за визит
    // отвечает на вопрос «что привело гостя», переход внутри — нет.
    const fd = new FormData();
    fd.set("page", "/ru/topchan?utm_source=banner");
    fd.set("source", "utm_source=instagram&utm_medium=stories");

    expect(trafficSource(fd)).toBe("Instagram · сторис");
  });

  it("пустое поле источника не мешает разобрать адрес", () => {
    const fd = new FormData();
    fd.set("page", "/ru/topchan?utm_source=qr&utm_medium=onsite");
    fd.set("source", "");

    expect(trafficSource(fd)).toBe("QR-код · onsite");
  });
});
