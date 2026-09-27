import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      "@code-ui/anatomy": resolve(import.meta.dirname, "packages/anatomy/src"),
      "@code-ui/core": resolve(import.meta.dirname, "packages/core/src"),
      "@code-ui/utils": resolve(import.meta.dirname, "packages/utils/src"),
      "@code-ui/miniapp": resolve(
        import.meta.dirname,
        "packages/frameworks/miniapp/src",
      ),
      "@code-ui/button": resolve(import.meta.dirname, "packages/machines/button/src"),
      "@code-ui/drawer": resolve(import.meta.dirname, "packages/machines/drawer/src"),
    },
  },
  test: {
    environment: "node",
    include: ["packages/**/*.{test,spec}.ts"],
  },
});
