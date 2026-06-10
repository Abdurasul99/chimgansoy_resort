/**
 * Tests for the CBU exchange-rates proxy.
 *
 * AAA pattern: each test arranges a specific server-side scenario (CBU up,
 * down, malformed), acts by calling GET(), then asserts response shape +
 * status. MSW intercepts the fetch so we never hit cbu.uz from CI.
 */
import { describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../../tests/setup";
import { CBU_FIXTURE } from "../../../../tests/mocks/handlers";
import { GET } from "./route";

describe("/api/rates — CBU proxy", () => {
  describe("happy path", () => {
    it("parses USD/EUR/RUB rates from CBU response", async () => {
      // Arrange — default handler returns CBU_FIXTURE
      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toMatchObject({
        usd_to_uzs: 11997.83,
        eur_to_uzs: 13967.87,
        rub_to_uzs: 167.31,
        source: "CBU",
        date: "10.06.2026",
      });
    });

    it("includes daily diff for each currency", async () => {
      // Arrange + Act
      const response = await GET();
      const data = await response.json();

      // Assert — diff matches the Diff field, parsed to number
      expect(data.usd_diff).toBe(18.19);
      expect(data.eur_diff).toBe(66.7);
      expect(data.rub_diff).toBe(-0.21);
    });

    it("divides Rate by Nominal so per-unit rate is correct", async () => {
      // Arrange — override one currency to nominal=10 (like IDR/IRR in real CBU data)
      server.use(
        http.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/", () =>
          HttpResponse.json([
            { ...CBU_FIXTURE[0], Nominal: "10", Rate: "119978.30" }, // per 10 USD
            CBU_FIXTURE[1],
            CBU_FIXTURE[2],
          ]),
        ),
      );

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert — divided to per-unit: 119978.30 / 10 = 11997.83
      expect(data.usd_to_uzs).toBeCloseTo(11997.83, 2);
    });
  });

  describe("graceful degradation when CBU is unreachable", () => {
    it("returns fallback rates when CBU responds 500", async () => {
      // Arrange
      server.use(
        http.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/", () =>
          HttpResponse.json({ error: "internal" }, { status: 500 }),
        ),
      );

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert — 200 with fallback flag so client renders the converter
      expect(response.status).toBe(200);
      expect(data.source).toBe("fallback");
      expect(typeof data.usd_to_uzs).toBe("number");
      expect(data.usd_to_uzs).toBeGreaterThan(1000); // a sensible UZS rate
    });

    it("returns fallback when CBU network errors out", async () => {
      // Arrange
      server.use(
        http.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/", () =>
          HttpResponse.error(),
        ),
      );

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.source).toBe("fallback");
    });

    it("returns fallback when CBU response is missing USD/EUR/RUB", async () => {
      // Arrange — CBU could in theory return a list without our 3 currencies
      server.use(
        http.get("https://cbu.uz/uz/arkhiv-kursov-valyut/json/", () =>
          HttpResponse.json([{ Ccy: "JPY", Rate: "75.49", Nominal: "1", Diff: "0", Date: "10.06.2026" }]),
        ),
      );

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert — graceful fallback, not a crash
      expect(response.status).toBe(200);
      expect(data.source).toBe("fallback");
    });
  });

  describe("response Cache-Control header", () => {
    it("sets long cache + stale-while-revalidate for CDN reuse", async () => {
      // Arrange + Act
      const response = await GET();

      // Assert — exact header so we catch regressions if someone tweaks it
      const cc = response.headers.get("Cache-Control");
      expect(cc).toContain("max-age=3600");
      expect(cc).toContain("stale-while-revalidate=82800");
      expect(cc).toContain("public");
    });
  });
});
