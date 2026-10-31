import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/behavior.ts",
    "src/behaviors/computed-behavior.ts",
    "src/behaviors/form.ts",
    "src/behaviors/radio.ts",
    "src/behaviors/checkbox.ts",
    "src/behaviors/stepper.ts",
    "src/behaviors/accordion.ts",
    "src/behaviors/app.ts",
    "src/behaviors/avatar-group.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: false,
  clean: true,
  target: "es2020",
  fixedExtension: false,
});
