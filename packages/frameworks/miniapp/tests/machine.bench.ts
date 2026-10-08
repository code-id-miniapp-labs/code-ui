import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, test } from "vitest";
import { createMachine } from "@code-ui/core";

const root = fileURLToPath(new URL("../../../../", import.meta.url));
const outDir = fileURLToPath(
  new URL("../node_modules/.cache/bench", import.meta.url),
);

/**
 * Bundles `src/machine.ts` with its workspace deps into a single ESM file and
 * imports it natively. Benchmarking source through Vite's module runner wraps
 * every cross-module call in an export getter, which skews the results.
 *
 * @see https://vitest.dev/guide/benchmarking#module-runner-overhead
 */
async function loadBundledMachine() {
  const { build } = await import("tsdown");
  await build({
    config: false,
    entry: { machine: `${root}packages/frameworks/miniapp/src/machine.ts` },
    outDir,
    format: "esm",
    platform: "neutral",
    fixedExtension: true,
    dts: false,
    tsconfig: false,
    logLevel: "silent",
    alias: {
      "@code-ui/core": `${root}packages/core/src/index.ts`,
      "@code-ui/utils": `${root}packages/utils/src/index.ts`,
    },
    deps: { alwaysBundle: [/.*/] },
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
  });
  const mod: typeof import("../src/machine") = await import(
    /* @vite-ignore */ pathToFileURL(`${outDir}/machine.mjs`).href
  );
  return mod.MiniappMachine;
}

const MiniappMachine = await loadBundledMachine();

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));
const noop = () => {};

/**
 * A realistic component machine: prop defaults, controlled context bindables
 * that read props, chained computed values, nested states, guards,
 * entry/exit actions and effects.
 */
const schema = createMachine({
  props: ({ props }) => ({
    size: "md",
    variant: "solid",
    color: "primary",
    disabled: false,
    ...props,
  }),
  initialState: ({ prop }) => (prop("disabled") ? "disabled" : "idle"),
  context: ({ prop, bindable }) => ({
    count: bindable<number>(() => ({ defaultValue: 0 })),
    pressed: bindable<boolean>(() => ({ defaultValue: false })),
    size: bindable<string>(() => ({ value: prop("size"), defaultValue: "md" })),
    variant: bindable<string>(() => ({
      value: prop("variant"),
      defaultValue: "solid",
    })),
    color: bindable<string>(() => ({
      value: prop("color"),
      defaultValue: "primary",
    })),
  }),
  computed: {
    isActive: ({ state }) => state.matches("active"),
    isInteractive: ({ context, computed }) =>
      !context.get("pressed") && !computed("isActive"),
    label: ({ context }) =>
      `${context.get("variant")}-${context.get("color")}-${context.get("size")}`,
  },
  on: { RESET: { target: "idle", actions: ["reset"] } },
  states: {
    idle: {
      tags: ["interactive"],
      on: {
        PRESS: [
          { guard: "isDisabled", target: "disabled" },
          { target: "active", actions: ["setPressed", "increment"] },
        ],
        PING: { actions: ["increment"] },
      },
    },
    active: {
      tags: ["interactive", "busy"],
      initial: "pressing",
      entry: ["noop"],
      exit: ["noop"],
      effects: ["trackPress"],
      on: { RELEASE: { target: "idle", actions: ["clearPressed"] } },
      states: {
        pressing: { on: { HOLD: { target: "holding" } } },
        holding: { entry: ["noop"] },
      },
    },
    disabled: {},
  },
  implementations: {
    guards: { isDisabled: ({ prop }) => Boolean(prop("disabled")) },
    actions: {
      noop,
      reset: ({ context }) => context.set("count", 0),
      increment: ({ context }) => context.set("count", (c: number) => c + 1),
      setPressed: ({ context }) => context.set("pressed", true),
      clearPressed: ({ context }) => context.set("pressed", false),
    },
    effects: { trackPress: () => noop },
  },
});

function started(props: Record<string, unknown> = {}) {
  const machine = new MiniappMachine(schema, props);
  machine.start();
  return machine;
}

describe("MiniappMachine", () => {
  test("lifecycle", async ({ bench }) => {
    await bench("create + start + stop", () => {
      const machine = new MiniappMachine(schema, { size: "lg" });
      machine.start();
      machine.stop();
    }).run();
  });

  test("props", async ({ bench }) => {
    const machine = started({ size: "lg", variant: "outline" });
    let n = 0;

    await bench.compare(
      bench("prop() × 1000", () => {
        for (let i = 0; i < 1000; i++) {
          machine.prop("size");
          machine.prop("variant");
          machine.prop("color");
        }
      }),
      bench("updateProps + prop() × 100", () => {
        for (let i = 0; i < 100; i++) {
          machine.updateProps({ size: ++n % 2 ? "sm" : "lg" });
          machine.prop("size");
        }
      }),
    );
    machine.stop();
  });

  test("state queries", async ({ bench }) => {
    const machine = started();
    const { state } = machine.service;

    await bench.compare(
      bench("state.get() × 1000", () => {
        for (let i = 0; i < 1000; i++) state.get();
      }),
      bench("state.matches() × 1000", () => {
        for (let i = 0; i < 1000; i++) state.matches("active", "idle");
      }),
      bench("state.hasTag() × 1000", () => {
        for (let i = 0; i < 1000; i++) state.hasTag("interactive");
      }),
    );
    machine.stop();
  });

  test("context & computed", async ({ bench }) => {
    const machine = started();
    let c = 0;

    await bench.compare(
      bench("context.get() × 1000 (controlled bindables)", () => {
        for (let i = 0; i < 1000; i++) {
          machine.context.get("size");
          machine.context.get("variant");
        }
      }),
      bench("computed() × 1000 (cached)", () => {
        for (let i = 0; i < 1000; i++) {
          machine.computed("label");
          machine.computed("isInteractive");
        }
      }),
      bench("context.set + computed() × 100 (invalidated)", () => {
        for (let i = 0; i < 100; i++) {
          machine.context.set("pressed", ++c % 2 === 0);
          machine.computed("isInteractive");
        }
      }),
    );
    machine.stop();
  });

  test("params & service", async ({ bench }) => {
    const machine = started();

    await bench.compare(
      bench("getParams() × 1000", () => {
        for (let i = 0; i < 1000; i++) machine.getParams();
      }),
      bench("service × 1000", () => {
        for (let i = 0; i < 1000; i++) void machine.service;
      }),
    );
    machine.stop();
  });

  test("transitions", async ({ bench }) => {
    const machine = started();

    await bench.compare(
      bench("targetless transition × 100", async () => {
        for (let i = 0; i < 100; i++) machine.send({ type: "PING" });
        await flush();
      }),
      bench("idle → active.pressing → active.holding → idle × 100", async () => {
        for (let i = 0; i < 100; i++) {
          machine.send({ type: "PRESS" });
          machine.send({ type: "HOLD" });
          machine.send({ type: "RELEASE" });
        }
        await flush();
      }),
    );
    machine.stop();
  });

  test("notifications", async ({ bench }) => {
    const machine = started();
    for (let i = 0; i < 5; i++) {
      machine.subscribe((service) => {
        service.state.get();
        service.prop("size");
      });
    }
    let c = 0;

    await bench("context.set → notify 5 subscribers × 100", () => {
      for (let i = 0; i < 100; i++) machine.context.set("count", ++c);
    }).run();
    machine.stop();
  });
});
