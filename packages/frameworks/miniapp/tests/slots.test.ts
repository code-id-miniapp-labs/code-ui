import { describe, it, expect, vi } from "vitest";
import {
  createComponentOptions,
  setupComputed,
} from "../src/behaviors/computed-behavior";

describe("createComponentOptions - slots option", () => {
  it("registers properties.slots with default slot booleans", () => {
    const options = createComponentOptions({
      slots: {
        leading: false,
        trailing: false,
        loadingIcon: false,
      },
      computed: {
        hasAdornment() {
          return this.data.slots.leading || this.data.slots.trailing;
        },
      },
    });

    expect(options.properties.slots).toEqual({
      type: Object,
      value: {
        leading: false,
        trailing: false,
        loadingIcon: false,
      },
    });
  });

  it("normalizes partial slots passed from parent WXML and preserves extra dynamic keys", () => {
    const options = createComponentOptions({
      slots: {
        leading: false,
        trailing: false,
        loadingIcon: false,
      },
      computed: {
        summary() {
          return `${this.data.slots.leading}:${this.data.slots.trailing}:${this.data.slots.loadingIcon}`;
        },
      },
    });

    const setDataMock = vi.fn((patch: Record<string, any>) => {
      Object.assign(instance.data, patch);
    });

    const instance: any = {
      data: {
        slots: { leading: true, customTab: 1 },
      },
      properties: {},
      setData: setDataMock,
      computed: options.computed,
    };

    options.lifetimes.created.call(instance);
    setupComputed(instance, options.computed);

    expect(instance.data.slots).toEqual({
      leading: true,
      trailing: false,
      loadingIcon: false,
      customTab: true,
    });
    expect(instance.summary).toBe("true:false:false");

    // Simulate parent updating slots dynamically via observer
    options.observers["slots.**"].call(instance, {
      trailing: true,
    });

    expect(instance.data.slots).toEqual({
      leading: false,
      trailing: true,
      loadingIcon: false,
    });
    expect(instance.summary).toBe("false:true:false");
  });
});

