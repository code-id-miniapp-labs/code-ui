import { afterEach, describe, expect, it, vi } from "vitest";

const capturedDefs: any[] = [];
(globalThis as any).Behavior = vi.fn((def: any) => {
  capturedDefs.push(def);
  return def;
});

describe("computedBehavior initial evaluation (FOUC prevention)", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("skips definition-time pre-evaluation when component declares properties and flushes real props in attached()", async () => {
    const { computedBehavior } = await import(
      "../src/behaviors/computed-behavior"
    );
    const behaviorDef = computedBehavior as any;

    const classesGetter = vi.fn(function (this: any) {
      return {
        root: `bg-${this.data.color} variant-${this.data.variant}`,
      };
    });

    const defFields: any = {
      data: {},
      properties: {
        color: { type: String, value: "primary" },
        variant: { type: String, value: "solid" },
      },
      computed: {
        classes: classesGetter,
      },
    };

    behaviorDef.definitionFilter(defFields);

    // Must NOT bake default `bg-primary variant-solid` into initial data
    expect(defFields.data.classes).toBeUndefined();
    expect(classesGetter).not.toHaveBeenCalled();

    // Simulate WeChat mounting instance with parent-passed props
    const setDataCalls: Record<string, any>[] = [];
    const instance: any = {
      data: {
        color: "neutral",
        variant: "ghost",
      },
      ...defFields.methods,
      setData(payload: Record<string, any>) {
        setDataCalls.push(payload);
        Object.assign(this.data, payload);
      },
    };

    behaviorDef.lifetimes.created.call(instance);
    expect(setDataCalls).toHaveLength(0);

    behaviorDef.lifetimes.attached.call(instance);
    expect(setDataCalls).toHaveLength(1);
    expect(instance.data.classes).toEqual({
      root: "bg-neutral variant-ghost",
    });

    behaviorDef.lifetimes.detached.call(instance);
  });

  it("still pre-evaluates computed fields for prop-less components", async () => {
    const { computedBehavior } = await import(
      "../src/behaviors/computed-behavior"
    );
    const behaviorDef = computedBehavior as any;

    const defFields: any = {
      data: { count: 2 },
      computed: {
        doubled(this: any) {
          return this.data.count * 2;
        },
      },
    };

    behaviorDef.definitionFilter(defFields);
    expect(defFields.data.doubled).toBe(4);
  });
});
