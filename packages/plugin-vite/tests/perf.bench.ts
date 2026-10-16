import { pathToFileURL } from "node:url";
import path from "node:path";
import { describe, test } from "vitest";
import type * as PluginVite from "../src/index";

const distEntryUrl = pathToFileURL(
  path.resolve(import.meta.dirname, "../dist/index.js"),
).href;

const { cleanKeyframes, codeUI } = (await import(
  /* @vite-ignore */ distEntryUrl
)) as typeof PluginVite;

const cssWithoutKeyframes = `
.btn { display: inline-flex; align-items: center; }
.card { border-radius: 16rpx; background: #fff; }
`.repeat(50);

const cssWithSingleKeyframe =
  cssWithoutKeyframes +
  `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;

const cssWithDuplicateKeyframes =
  cssWithSingleKeyframe +
  `
@keyframes pulse {
  50% { opacity: 0.5; }
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes pulse {
  50% { opacity: 0.5; }
}
`;

describe("plugin-vite performance benchmarks", () => {
  const plugin = codeUI({
    autoImport: true,
    ui: {
      colors: {
        primary: "blue",
        brand: "#10b981",
      },
    },
  });

  const resolveId = (plugin as any).resolveId.bind(plugin);
  const load = (plugin as any).load.bind(plugin);
  const transform = (plugin as any).transform.bind(plugin);

  test("cleanKeyframes", async ({ bench }) => {
    await bench.compare(
      bench("0 @keyframes (fast-path) × 1000", () => {
        for (let i = 0; i < 1000; i++) cleanKeyframes(cssWithoutKeyframes);
      }),
      bench("1 @keyframes (fast-path) × 1000", () => {
        for (let i = 0; i < 1000; i++) cleanKeyframes(cssWithSingleKeyframe);
      }),
      bench("duplicate @keyframes deduplication × 1000", () => {
        for (let i = 0; i < 1000; i++)
          cleanKeyframes(cssWithDuplicateKeyframes);
      }),
    );
  });

  test("virtual module load & hook fast-paths", async ({ bench }) => {
    await bench.compare(
      bench("resolveId non-virtual module × 1000", () => {
        for (let i = 0; i < 1000; i++) {
          resolveId("/project/src/pages/index/index.ts");
        }
      }),
      bench("load virtual:cui/theme/button (memoized) × 1000", () => {
        for (let i = 0; i < 1000; i++) {
          load("\0virtual:cui/theme/button");
        }
      }),
      bench("load virtual:cui/theme (memoized) × 1000", () => {
        for (let i = 0; i < 1000; i++) {
          load("\0virtual:cui/theme");
        }
      }),
      bench("transform non-target module fast bailout × 1000", () => {
        for (let i = 0; i < 1000; i++) {
          transform("export const x = 1;", "/project/src/pages/index/index.ts");
        }
      }),
    );
  });
});
