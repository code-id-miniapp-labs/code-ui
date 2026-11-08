import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  ariaControlState,
  createScope,
  dataAttrs,
  dataControlState,
  isMinimalDataAttrs,
  itemPartId,
  optPartId,
  partId,
} from "../src";

describe("scope & DOM id / attribute helpers (@code-ui/core)", () => {
  const g = globalThis as any;
  let prevConfig: any;

  beforeEach(() => {
    prevConfig = g.__CODE_UI_GLOBAL_CONFIG__;
  });

  afterEach(() => {
    g.__CODE_UI_GLOBAL_CONFIG__ = prevConfig;
  });

  it("creates scope with id, ids and component references", () => {
    const scope = createScope({ id: "my-btn", ids: { root: "custom-root" } });
    expect(scope.id).toBe("my-btn");
    expect(scope.ids?.root).toBe("custom-root");
    expect(scope.toJSON?.()).toEqual({ id: "my-btn", ids: { root: "custom-root" } });
  });

  it("resolves partId with defaults, custom id, and short alias", () => {
    const scopeDefault = createScope();
    expect(partId(scopeDefault, "btn", "root", "r")).toBe("btn-d-r");

    const scopeWithId = createScope({ id: "123" });
    expect(partId(scopeWithId, "btn", "root", "r")).toBe("btn-123-r");

    const scopeCustom = createScope({ id: "123", ids: { root: "override-root" } });
    expect(partId(scopeCustom, "btn", "root", "r")).toBe("override-root");
  });

  it("resolves itemPartId with index and custom generator", () => {
    const scope = createScope({ id: "tabs" });
    expect(itemPartId(scope, "tb", "trigger", 2, "tr")).toBe("tb-tabs-tr-2");

    const scopeFn = createScope({
      id: "tabs",
      ids: { trigger: (idx: number) => `custom-trigger-${idx}` },
    });
    expect(itemPartId(scopeFn, "tb", "trigger", 2, "tr")).toBe("custom-trigger-2");
  });

  it("resolves optPartId only when explicit string is provided", () => {
    const scopeEmpty = createScope();
    expect(optPartId(scopeEmpty, "indicator")).toBeUndefined();

    const scopeWithOpt = createScope({ ids: { indicator: "ind-1" } });
    expect(optPartId(scopeWithOpt, "indicator")).toBe("ind-1");
  });

  describe("dataAttributes mode: full vs minimal", () => {
    it("returns all data-* attributes in default/full mode", () => {
      delete g.__CODE_UI_GLOBAL_CONFIG__;
      expect(isMinimalDataAttrs()).toBe(false);

      const attrs = dataAttrs({ orientation: "horizontal", active: true });
      expect(attrs).toEqual({
        "data-orientation": "horizontal",
        "data-active": "true",
      });

      const ctrl = dataControlState("open", true, { orientation: "vertical" }, true);
      expect(ctrl).toEqual({
        "data-state": "open",
        "data-disabled": "true",
        "data-focused": "true",
        "data-orientation": "vertical",
      });
    });

    it("omits non-essential data-* attributes in minimal mode", () => {
      g.__CODE_UI_GLOBAL_CONFIG__ = { dataAttributes: "minimal" };
      expect(isMinimalDataAttrs()).toBe(true);

      const attrs = dataAttrs({ orientation: "horizontal", active: true });
      expect(attrs).toEqual({});

      const ctrl = dataControlState("open", true, { orientation: "vertical" }, true);
      expect(ctrl).toEqual({
        "data-state": "open",
        "data-disabled": "true",
        "data-focused": "true",
      });
    });
  });

  it("resolves ariaControlState with boolean values", () => {
    expect(ariaControlState(true, false)).toEqual({
      "aria-disabled": true,
      "aria-invalid": false,
    });

    expect(ariaControlState(undefined, true, { "aria-busy": true })).toEqual({
      "aria-invalid": true,
      "aria-busy": true,
    });
  });
});

