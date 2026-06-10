import { describe, expect, it } from "vitest";
import { getFirstSearchParam } from "../search-params";

describe("getFirstSearchParam", () => {
  it("returns the value for a single-string param", () => {
    expect(getFirstSearchParam({ promo: "SALE" }, "promo")).toBe("SALE");
  });

  it("returns the first value when param is an array", () => {
    expect(getFirstSearchParam({ guests: ["2", "4"] }, "guests")).toBe("2");
  });

  it("returns empty string when key is missing", () => {
    expect(getFirstSearchParam({ a: "x" }, "b")).toBe("");
  });

  it("returns empty string when searchParams is undefined", () => {
    expect(getFirstSearchParam(undefined, "anything")).toBe("");
  });

  it("returns empty string when array is empty", () => {
    expect(getFirstSearchParam({ guests: [] }, "guests")).toBe("");
  });

  it("returns empty string when value is undefined", () => {
    expect(getFirstSearchParam({ promo: undefined }, "promo")).toBe("");
  });
});
