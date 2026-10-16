import { describe, expect, it } from "vitest";
import { serializeConfig } from "../src/index";

describe("serializeConfig", () => {
  it("serializes primitives, arrays, and nested objects", () => {
    const config = {
      prefix: "cui",
      ui: {
        colors: {
          primary: "emerald",
        },
      },
      flag: true,
      count: 42,
      empty: null,
      list: ["a", "b"],
    };

    const code = serializeConfig(config);
    // eslint-disable-next-line no-eval
    const evaluated = eval(`(${code})`);
    expect(evaluated).toEqual(config);
  });

  it("preserves function replacers in component slots", () => {
    const config = {
      prefix: "cui",
      components: {
        button: {
          slots: {
            root: (defaults: string) => `${defaults} shadow-xl`,
            label: () => "font-bold uppercase",
          },
        },
      },
    };

    const code = serializeConfig(config);
    // eslint-disable-next-line no-eval
    const evaluated = eval(`(${code})`);

    expect(typeof evaluated.components.button.slots.root).toBe("function");
    expect(evaluated.components.button.slots.root("base-btn")).toBe(
      "base-btn shadow-xl",
    );

    expect(typeof evaluated.components.button.slots.label).toBe("function");
    expect(evaluated.components.button.slots.label("default-label")).toBe(
      "font-bold uppercase",
    );
  });

  it("handles standard function declarations and object method shorthand", () => {
    const config = {
      components: {
        button: {
          slots: {
            root: function (defaults: string) {
              return defaults + " custom";
            },
            icon(defaults: string) {
              return defaults + " icon-custom";
            },
          },
        },
      },
    };

    const code = serializeConfig(config);
    // eslint-disable-next-line no-eval
    const evaluated = eval(`(${code})`);

    expect(typeof evaluated.components.button.slots.root).toBe("function");
    expect(evaluated.components.button.slots.root("a")).toBe("a custom");

    expect(typeof evaluated.components.button.slots.icon).toBe("function");
    expect(evaluated.components.button.slots.icon("i")).toBe("i icon-custom");
  });
});
