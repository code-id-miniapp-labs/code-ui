import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  root: import.meta.dirname,
  resolve: {
    alias: {
      "@code-id-labs/anatomy": resolve(import.meta.dirname, "packages/anatomy/src"),
      "@code-id-labs/compiler": resolve(
        import.meta.dirname,
        "packages/compiler/src",
      ),
      "@code-id-labs/context": resolve(import.meta.dirname, "packages/context/src"),
      "@code-id-labs/core": resolve(import.meta.dirname, "packages/core/src"),
      "@code-id-labs/utils": resolve(import.meta.dirname, "packages/utils/src"),
      "@code-id-labs/miniapp": resolve(
        import.meta.dirname,
        "packages/frameworks/miniapp/src",
      ),
      "@code-id-labs/accordion": resolve(
        import.meta.dirname,
        "packages/machines/accordion/src",
      ),
      "@code-id-labs/action-sheet": resolve(
        import.meta.dirname,
        "packages/machines/action-sheet/src",
      ),
      "@code-id-labs/accordion-item": resolve(
        import.meta.dirname,
        "packages/machines/accordion-item/src",
      ),
      "@code-id-labs/banner": resolve(
        import.meta.dirname,
        "packages/machines/banner/src",
      ),
      "@code-id-labs/button": resolve(
        import.meta.dirname,
        "packages/machines/button/src",
      ),
      "@code-id-labs/checkbox": resolve(
        import.meta.dirname,
        "packages/machines/checkbox/src",
      ),
      "@code-id-labs/checkbox-group": resolve(
        import.meta.dirname,
        "packages/machines/checkbox-group/src",
      ),
      "@code-id-labs/drawer": resolve(
        import.meta.dirname,
        "packages/machines/drawer/src",
      ),
      "@code-id-labs/file-upload": resolve(
        import.meta.dirname,
        "packages/machines/file-upload/src",
      ),
      "@code-id-labs/popover": resolve(
        import.meta.dirname,
        "packages/machines/popover/src",
      ),
      "@code-id-labs/form/context": resolve(
        import.meta.dirname,
        "packages/machines/form/src/form.context.ts",
      ),
      "@code-id-labs/form": resolve(
        import.meta.dirname,
        "packages/machines/form/src",
      ),
      "@code-id-labs/form-field": resolve(
        import.meta.dirname,
        "packages/machines/form-field/src",
      ),
      "@code-id-labs/input": resolve(
        import.meta.dirname,
        "packages/machines/input/src",
      ),
      "@code-id-labs/input-menu": resolve(
        import.meta.dirname,
        "packages/machines/input-menu/src",
      ),
      "@code-id-labs/input-menu-item": resolve(
        import.meta.dirname,
        "packages/machines/input-menu-item/src",
      ),
      "@code-id-labs/modal": resolve(
        import.meta.dirname,
        "packages/machines/modal/src",
      ),
      "@code-id-labs/pin-input": resolve(
        import.meta.dirname,
        "packages/machines/pin-input/src",
      ),
      "@code-id-labs/presence": resolve(
        import.meta.dirname,
        "packages/machines/presence/src",
      ),
      "@code-id-labs/progress": resolve(
        import.meta.dirname,
        "packages/machines/progress/src",
      ),
      "@code-id-labs/pull-down-refresh": resolve(
        import.meta.dirname,
        "packages/machines/pull-down-refresh/src",
      ),
      "@code-id-labs/qr-code": resolve(
        import.meta.dirname,
        "packages/machines/qr-code/src",
      ),
      "@code-id-labs/radio": resolve(
        import.meta.dirname,
        "packages/machines/radio/src",
      ),
      "@code-id-labs/radio-group": resolve(
        import.meta.dirname,
        "packages/machines/radio-group/src",
      ),
      "@code-id-labs/select": resolve(
        import.meta.dirname,
        "packages/machines/select/src",
      ),
      "@code-id-labs/select-item": resolve(
        import.meta.dirname,
        "packages/machines/select-item/src",
      ),
      "@code-id-labs/slider": resolve(
        import.meta.dirname,
        "packages/machines/slider/src",
      ),
      "@code-id-labs/stepper": resolve(
        import.meta.dirname,
        "packages/machines/stepper/src",
      ),
      "@code-id-labs/stepper-item": resolve(
        import.meta.dirname,
        "packages/machines/stepper-item/src",
      ),
      "@code-id-labs/swipe-cell": resolve(
        import.meta.dirname,
        "packages/machines/swipe-cell/src",
      ),
      "@code-id-labs/switch": resolve(
        import.meta.dirname,
        "packages/machines/switch/src",
      ),
      "@code-id-labs/tabs": resolve(
        import.meta.dirname,
        "packages/machines/tabs/src",
      ),
      "@code-id-labs/tabs-item": resolve(
        import.meta.dirname,
        "packages/machines/tabs-item/src",
      ),
      "@code-id-labs/textarea": resolve(
        import.meta.dirname,
        "packages/machines/textarea/src",
      ),
      "@code-id-labs/toast": resolve(
        import.meta.dirname,
        "packages/machines/toast/src",
      ),
      "@code-id-labs/tour": resolve(
        import.meta.dirname,
        "packages/machines/tour/src",
      ),
    },
  },
  test: {
    environment: "node",
    include: ["packages/**/*.{test,spec}.ts"],
  },
});
