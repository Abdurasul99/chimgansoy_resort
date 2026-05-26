import { describe, expect, it } from "vitest";
import {
  defaultLocaleForHost,
  languageAlternates,
  localizedUrl,
  normalizeHost,
  originForLocale,
} from "../domains";

describe("domain i18n routing", () => {
  it("normalizes host names with ports and casing", () => {
    expect(normalizeHost("CHIMGANDARBAZA.COM:443")).toBe("chimgandarbaza.com");
    expect(normalizeHost("www.chimgandarbaza.uz.")).toBe("www.chimgandarbaza.uz");
  });

  it("uses English as the default language on .com", () => {
    expect(defaultLocaleForHost("chimgandarbaza.com")).toBe("en");
    expect(defaultLocaleForHost("www.chimgandarbaza.com")).toBe("en");
  });

  it("uses Uzbek as the default language on .uz", () => {
    expect(defaultLocaleForHost("chimgandarbaza.uz")).toBe("uz");
    expect(defaultLocaleForHost("www.chimgandarbaza.uz")).toBe("uz");
  });

  it("keeps Russian as the fallback for local and unknown hosts", () => {
    expect(defaultLocaleForHost("localhost:3000")).toBe("ru");
    expect(defaultLocaleForHost(undefined)).toBe("ru");
  });

  it("builds canonical URLs by primary locale domain", () => {
    expect(originForLocale("en")).toBe("https://chimgandarbaza.com");
    expect(originForLocale("uz")).toBe("https://chimgandarbaza.uz");
    expect(originForLocale("ru")).toBe("https://chimgandarbaza.uz");
    expect(localizedUrl("en", "/bron")).toBe("https://chimgandarbaza.com/en/bron");
    expect(localizedUrl("uz", "/bron")).toBe("https://chimgandarbaza.uz/uz/bron");
  });

  it("builds language alternates across both domains", () => {
    expect(languageAlternates("/nomera")).toEqual({
      en: "https://chimgandarbaza.com/en/nomera",
      ru: "https://chimgandarbaza.uz/ru/nomera",
      uz: "https://chimgandarbaza.uz/uz/nomera",
      "x-default": "https://chimgandarbaza.com/en/nomera",
    });
  });
});
