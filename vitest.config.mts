import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      "@code-ui/anatomy": resolve(import.meta.dirname, "packages/anatomy/src"),
      "@code-ui/context": resolve(import.meta.dirname, "packages/context/src"),
      "@code-ui/core": resolve(import.meta.dirname, "packages/core/src"),
      "@code-ui/utils": resolve(import.meta.dirname, "packages/utils/src"),
      "@code-ui/miniapp": resolve(
        import.meta.dirname,
        "packages/frameworks/miniapp/src",
      ),
      "@code-ui/button": resolve(import.meta.dirname, "packages/machines/button/src"),
      "@code-ui/checkbox": resolve(import.meta.dirname, "packages/machines/checkbox/src"),
      "@code-ui/checkbox-group": resolve(import.meta.dirname, "packages/machines/checkbox-group/src"),
      "@code-ui/drawer": resolve(import.meta.dirname, "packages/machines/drawer/src"),
      "@code-ui/form/context": resolve(
        import.meta.dirname,
        "packages/machines/form/src/form.context.ts",
      ),
      "@code-ui/form": resolve(import.meta.dirname, "packages/machines/form/src"),
      "@code-ui/form-field": resolve(
        import.meta.dirname,
        "packages/machines/form-field/src",
      ),
      "@code-ui/input": resolve(
        import.meta.dirname,
        "packages/machines/input/src",
      ),
      "@code-ui/pin-input": resolve(
        import.meta.dirname,
        "packages/machines/pin-input/src",
      ),
      "@code-ui/qr-code": resolve(
        import.meta.dirname,
        "packages/machines/qr-code/src",
      ),
      "@code-ui/radio": resolve(
        import.meta.dirname,
        "packages/machines/radio/src",
      ),
      "@code-ui/radio-group": resolve(
        import.meta.dirname,
        "packages/machines/radio-group/src",
      ),
      "@code-ui/stepper": resolve(
        import.meta.dirname,
        "packages/machines/stepper/src",
      ),
      "@code-ui/stepper-item": resolve(
        import.meta.dirname,
        "packages/machines/stepper-item/src",
      ),
      "@code-ui/switch": resolve(
        import.meta.dirname,
        "packages/machines/switch/src",
      ),
      "@code-ui/textarea": resolve(
        import.meta.dirname,
        "packages/machines/textarea/src",
      ),
    },
  },
  test: {
    environment: "node",
    include: ["packages/**/*.{test,spec}.ts"],
  },
});
