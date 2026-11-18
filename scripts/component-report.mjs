#!/usr/bin/env node
/**
 * Component & architecture inventory report for code-ui.
 *
 * Counts and categorizes:
 *  - Runtime components in packages/components/src/runtime (main vs sub/compound)
 *  - Presentational vs Stateful (FSM) vs Relational components
 *  - State machines in packages/machines
 *  - Theme definitions in packages/core/src/theme/definitions
 *  - Composables in packages/composables/src
 *
 * Usage: node scripts/component-report.mjs [--json]
 */
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
const asJson = args.includes("--json");

const root = resolve(".");
const runtimeDir = join(root, "packages/components/src/runtime");
const machinesDir = join(root, "packages/machines");
const themesDir = join(root, "packages/core/src/theme/definitions");
const composablesDir = join(root, "packages/composables/src");

const runtimeComponents = existsSync(runtimeDir)
  ? readdirSync(runtimeDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
      .map((d) => d.name)
      .sort()
  : [];

const SUB_SUFFIXES = ["-item", "-group", "-field"];
const isSubComponent = (name) => SUB_SUFFIXES.some((s) => name.endsWith(s));

const mainComponents = runtimeComponents.filter((name) => !isSubComponent(name));
const subComponents = runtimeComponents.filter((name) => isSubComponent(name));

const presentationalComponents = [];
const statefulComponents = [];

for (const name of runtimeComponents) {
  const indexTs = join(runtimeDir, name, "index.ts");
  if (!existsSync(indexTs)) continue;
  const code = readFileSync(indexTs, "utf8");
  if (code.includes("../_shared/machine") || code.includes("@code-id-labs/miniapp/behaviors/")) {
    statefulComponents.push(name);
  } else {
    presentationalComponents.push(name);
  }
}

const machines = existsSync(machinesDir)
  ? readdirSync(machinesDir, { withFileTypes: true })
      .filter((d) => d.isDirectory() && !d.name.startsWith("."))
      .map((d) => d.name)
      .sort()
  : [];

const themes = existsSync(themesDir)
  ? readdirSync(themesDir)
      .filter((f) => f.endsWith(".ts") && f !== "index.ts")
      .map((f) => f.replace(/\.ts$/, ""))
      .sort()
  : [];

const composables = existsSync(composablesDir)
  ? readdirSync(composablesDir)
      .filter((f) => f.startsWith("use-") && f.endsWith(".ts") && !f.endsWith(".test.ts"))
      .map((f) => f.replace(/\.ts$/, ""))
      .sort()
  : [];

const report = {
  counts: {
    totalRuntimeComponents: runtimeComponents.length,
    mainComponents: mainComponents.length,
    subComponents: subComponents.length,
    presentationalComponents: presentationalComponents.length,
    statefulComponents: statefulComponents.length,
    machines: machines.length,
    themes: themes.length,
    composables: composables.length,
  },
  runtimeComponents,
  mainComponents,
  subComponents,
  presentationalComponents,
  statefulComponents,
  machines,
  themes,
  composables,
};

if (asJson) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

console.log("=== CODE-UI COMPONENT INVENTORY ===");
console.log(`Total Runtime Components : ${report.counts.totalRuntimeComponents}`);
console.log(`  ├─ Main Components     : ${report.counts.mainComponents}`);
console.log(`  └─ Sub/Compound        : ${report.counts.subComponents} (-item / -group / -field)`);
console.log(`Runtime Tiering          :`);
console.log(`  ├─ Presentational      : ${report.counts.presentationalComponents} (base behavior only)`);
console.log(`  └─ Stateful / Relation : ${report.counts.statefulComponents} (FSM / behavior relation)`);
console.log(`Total State Machines     : ${report.counts.machines}`);
console.log(`Total Theme Definitions  : ${report.counts.themes}`);
console.log(`Total Composables (Hooks): ${report.counts.composables} (${composables.join(", ")})`);

console.log(`\n--- Main Components (${mainComponents.length}) ---`);
mainComponents.forEach((c, i) => {
  const tier = presentationalComponents.includes(c) ? "presentational" : "stateful";
  console.log(`  ${String(i + 1).padStart(2, " ")}. c-${c.padEnd(20, " ")} [${tier}]`);
});

console.log(`\n--- Sub / Compound Components (${subComponents.length}) ---`);
subComponents.forEach((c, i) => {
  const tier = presentationalComponents.includes(c) ? "presentational" : "stateful/relation";
  console.log(`  ${String(i + 1).padStart(2, " ")}. c-${c.padEnd(20, " ")} [${tier}]`);
});
