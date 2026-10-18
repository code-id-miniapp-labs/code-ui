import { describe, expect, it } from "vitest";
import { isEmpty, isNotEmpty } from "../src";

describe("isEmpty and isNotEmpty utils", () => {
  it("handles null and undefined", () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isNotEmpty(null)).toBe(false);
    expect(isNotEmpty(undefined)).toBe(false);
  });

  it("handles strings including whitespace", () => {
    expect(isEmpty("")).toBe(true);
    expect(isEmpty("   ")).toBe(true);
    expect(isEmpty("\t\n")).toBe(true);
    expect(isEmpty("a")).toBe(false);
    expect(isEmpty(" 123 ")).toBe(false);
    expect(isNotEmpty("hello")).toBe(true);
    expect(isNotEmpty("")).toBe(false);
  });

  it("handles numbers correctly (0 is not empty, NaN is empty)", () => {
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty(42)).toBe(false);
    expect(isEmpty(-1)).toBe(false);
    expect(isEmpty(Number.NaN)).toBe(true);
    expect(isNotEmpty(0)).toBe(true);
  });

  it("handles booleans (false is empty, true is not empty)", () => {
    expect(isEmpty(false)).toBe(true);
    expect(isEmpty(true)).toBe(false);
    expect(isNotEmpty(true)).toBe(true);
    expect(isNotEmpty(false)).toBe(false);
  });

  it("handles arrays and nested empty arrays", () => {
    expect(isEmpty([])).toBe(true);
    expect(isEmpty([""])).toBe(true);
    expect(isEmpty(["", "   "])).toBe(true);
    expect(isEmpty([null, undefined, ""])).toBe(true);
    expect(isEmpty(["a"])).toBe(false);
    expect(isEmpty(["", "a"])).toBe(false);
    expect(isEmpty([0])).toBe(false);
    expect(isNotEmpty(["pin-1"])).toBe(true);
  });

  it("handles plain objects", () => {
    expect(isEmpty({})).toBe(true);
    expect(isEmpty(Object.create(null))).toBe(true);
    expect(isEmpty({ a: 1 })).toBe(false);
    expect(isNotEmpty({ key: "val" })).toBe(true);
  });

  it("handles Map and Set", () => {
    expect(isEmpty(new Map())).toBe(true);
    expect(isEmpty(new Set())).toBe(true);
    expect(isEmpty(new Map([["a", 1]]))).toBe(false);
    expect(isEmpty(new Set([1]))).toBe(false);
  });

  it("handles special non-empty instances like Date and RegExp", () => {
    expect(isEmpty(new Date())).toBe(false);
    expect(isEmpty(/test/)).toBe(false);
    expect(isEmpty(() => {})).toBe(false);
  });
});
