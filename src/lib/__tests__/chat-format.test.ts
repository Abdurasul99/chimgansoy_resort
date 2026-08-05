import { describe, expect, it } from "vitest";
import { flattenMarkdown } from "@/lib/chat-format";
import { languageDirective } from "@/lib/ai-context";

describe("flattenMarkdown", () => {
  it("flattens the exact table the guest was shown on 2026-08-05", () => {
    // Verbatim from the operator's screenshot: a guest asked in English about
    // 20 August and got pipes and dashes in the chat bubble.
    const reply = [
      "Yes, we have rooms available for 20 August 2026.",
      "For a one-night stay you can choose:",
      "",
      "| Type | Price (1 night) |",
      "|---|---------|",
      "| Glamping A-frame | 1 500 000 sum |",
      "| Chalet | 3 000 000 sum |",
    ].join("\n");

    const out = flattenMarkdown(reply);

    expect(out).not.toContain("|");
    expect(out).toContain("• Glamping A-frame — 1 500 000 sum");
    expect(out).toContain("• Chalet — 3 000 000 sum");
    // The header row is data too — dropping it silently would lose the label.
    expect(out).toContain("• Type — Price (1 night)");
    // Prose either side survives untouched.
    expect(out).toContain("Yes, we have rooms available for 20 August 2026.");
  });

  it("strips headings and normalises bullets", () => {
    expect(flattenMarkdown("## Цены\n- Топчан\n* Тюбинг\n+ Бассейн")).toBe(
      "Цены\n• Топчан\n• Тюбинг\n• Бассейн",
    );
  });

  it("leaves ordinary answers alone", () => {
    const plain = "Заезд с 15:00, выезд до 12:00.\nБронирование: [страница](/ru/bron)";
    expect(flattenMarkdown(plain)).toBe(plain);
  });

  it("does not eat a lone dash or a price range in prose", () => {
    const prose = "Глэмпинг — до 3 гостей. Бассейн 100 000–200 000 сум.";
    expect(flattenMarkdown(prose)).toBe(prose);
  });

  it("survives a table with no trailing pipe", () => {
    expect(flattenMarkdown("Type | Price\n--- | ---\nChalet | 3 000 000")).toContain("Chalet");
  });
});

describe("languageDirective", () => {
  const ru = (s: string) => languageDirective(s, "en");

  it("forces Russian for a Cyrillic message even mid-English conversation", () => {
    // The reported bug: the UI locale is English and the history is English,
    // but the guest just wrote in Russian.
    expect(ru("Сколько стоит шале на выходные?")).toMatch(/ЯЗЫК СЛЕДУЮЩЕГО ОТВЕТА: РУССКИЙ/);
    expect(ru("Сколько стоит шале?")).toMatch(/даже если весь предыдущий разговор шёл на другом языке/);
  });

  it("forces Uzbek Latin for an Uzbek message", () => {
    const d = languageDirective("Shale narxi qancha?", "ru");
    expect(d).toMatch(/KEYINGI JAVOB TILI: O'ZBEK/);
    expect(d).toMatch(/Kirill alifbosidan foydalanma/);
  });

  it("names English outright for the question from the screenshot", () => {
    // The first version of this said only "match the guest's language", and
    // production answered this very question in Russian — everything else in
    // the context is Russian, so "match" had to compete with the whole prompt.
    const d = languageDirective("Do you have free rooms for 20th of August", "ru");
    expect(d).toMatch(/LANGUAGE OF THE NEXT REPLY: ENGLISH/);
    expect(d).toMatch(/Do NOT reply in Russian/);
  });

  it("leaves other Latin-script languages to the model, but forbids Russian", () => {
    const d = languageDirective("Haben Sie Zimmer frei im August?", "ru");
    expect(d).toMatch(/the language of the guest's LAST message/);
    expect(d).toMatch(/Do NOT default to Russian/);
  });

  it("does not mistake an English contraction for Uzbek", () => {
    // The first cut matched any apostrophe, so "don't" and "I'm" read as Uzbek.
    expect(languageDirective("I don't have a booking yet, what's the price?", "ru")).toMatch(/ENGLISH/);
    expect(languageDirective("We're coming with my family", "ru")).toMatch(/ENGLISH/);
  });

  it("falls back to the UI locale when the message has no letters", () => {
    expect(languageDirective("20.08 — 2 👍", "uz")).toMatch(/O'ZBEK/);
    expect(languageDirective("???", "en")).toMatch(/ENGLISH/);
    expect(languageDirective("", "ru")).toMatch(/РУССКИЙ/);
  });

  it("reads mostly-Cyrillic messages as Russian despite a Latin word", () => {
    // Guests write "wifi", "check-in", brand names in Latin all the time.
    expect(ru("Есть ли wifi в шале?")).toMatch(/РУССКИЙ/);
  });
});
