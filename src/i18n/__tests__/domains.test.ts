import { describe, expect, it } from "vitest";
import {
  defaultLocaleForHost,
  languageAlternates,
  localizedUrl,
  normalizeHost,
  originForLocale,
} from "../domains";

/**
 * Single-domain setup: chimgandarbaza.uz serves all locales.
 * The .com variant was never purchased — these tests guard against
 * anyone reintroducing dead-domain URLs into canonical/hreflang/sitemap.
 */
describe("domain i18n routing (single-domain)", () => {
  it("normalizes host names with ports and casing", () => {
    expect(normalizeHost("CHIMGANDARBAZA.UZ:443")).toBe("chimgandarbaza.uz");
    expect(normalizeHost("www.chimgandarbaza.uz.")).toBe("www.chimgandarbaza.uz");
  });

  it("uses Uzbek as the default language on the primary domain", () => {
    expect(defaultLocaleForHost("chimgandarbaza.uz")).toBe("uz");
    expect(defaultLocaleForHost("www.chimgandarbaza.uz")).toBe("uz");
  });

  it("keeps Russian as the fallback for local and unknown hosts", () => {
    expect(defaultLocaleForHost("localhost:3000")).toBe("ru");
    expect(defaultLocaleForHost(undefined)).toBe("ru");
  });

  it("ALL locales resolve to the .uz origin — no dead .com URLs", () => {
    expect(originForLocale("en")).toBe("https://chimgandarbaza.uz");
    expect(originForLocale("uz")).toBe("https://chimgandarbaza.uz");
    expect(originForLocale("ru")).toBe("https://chimgandarbaza.uz");
    expect(localizedUrl("en", "/bron")).toBe("https://chimgandarbaza.uz/en/bron");
    expect(localizedUrl("uz", "/bron")).toBe("https://chimgandarbaza.uz/uz/bron");
  });

  it("language alternates all live on .uz (incl. x-default)", () => {
    expect(languageAlternates("/nomera")).toEqual({
      en: "https://chimgandarbaza.uz/en/nomera",
      ru: "https://chimgandarbaza.uz/ru/nomera",
      uz: "https://chimgandarbaza.uz/uz/nomera",
      "x-default": "https://chimgandarbaza.uz/en/nomera",
    });
  });

  it("no alternate ever references the unregistered .com domain", () => {
    const alternates = Object.values(languageAlternates("/"));
    for (const url of alternates) {
      expect(url).not.toContain("chimgandarbaza.com");
    }
  });
});
