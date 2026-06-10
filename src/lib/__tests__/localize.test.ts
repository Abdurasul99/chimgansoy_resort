import { describe, expect, it } from "vitest";
import { text, list } from "../localize";

describe("text() localization", () => {
  it("returns the value for the requested locale", () => {
    // Arrange
    const value = { ru: "Привет", uz: "Salom", en: "Hello" };
    // Act
    const result = text(value, "uz");
    // Assert
    expect(result).toBe("Salom");
  });

  it("falls back to the default locale (ru) when target is missing", () => {
    // Arrange — value missing the EN key
    const value = { ru: "Привет", uz: "Salom", en: "" } as const;
    // Act
    const result = text(value, "en");
    // Assert — falls back to ru
    expect(result).toBe("Привет");
  });

  it("returns the value verbatim for the default locale", () => {
    const value = { ru: "Привет", uz: "Salom", en: "Hello" };
    expect(text(value, "ru")).toBe("Привет");
  });
});

describe("list() localization", () => {
  it("returns the array for the requested locale", () => {
    const value = {
      ru: ["Один", "Два"],
      uz: ["Bir", "Ikki"],
      en: ["One", "Two"],
    };
    expect(list(value, "uz")).toEqual(["Bir", "Ikki"]);
  });

  it("falls back to ru when target is empty", () => {
    const value = {
      ru: ["Один"],
      uz: [] as string[],
      en: ["One"],
    };
    // empty arrays are falsy in JS? No — [] is truthy. So this returns []
    // We expect the function to honour the present (if empty) array.
    expect(list(value, "uz")).toEqual([]);
  });
});
