import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { createMachineBehavior } from "@code-ui/miniapp";
import { connectModal, modalMachine } from "@code-ui/modal";
import { connectStepper, stepperMachine } from "@code-ui/stepper";

const RUNTIME_DIR = resolve(__dirname, "../src/runtime");
const FORBIDDEN_INTERNAL_KEYS = new Set([
  "rootProps",
  "baseProps",
  "inputProps",
  "triggerProps",
  "contentProps",
  "backdropProps",
  "overlayProps",
  "closeTriggerProps",
  "indicatorProps",
  "labelProps",
  "errorProps",
  "hiddenInputProps",
  "send",
  "service",
  "getSnapshot",
  "getMachine",
  "getService",
  "noop",
]);

function extractBehaviorOptionKeys(source: string): string[] | null {
  const match = source.match(
    /exportApiKeys\s*:\s*\[([\s\S]*?)\]/,
  );
  if (!match) return null;
  const body = match[1] ?? "";
  return Array.from(body.matchAll(/["']([^"']+)["']/g), (m) => m[1] as string);
}

describe("@code-ui/components exportApiKeys configuration", () => {
  it("configures explicit non-empty exportApiKeys on every machine component with exportApi: true", () => {
    const dirs = readdirSync(RUNTIME_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map((entry) => entry.name)
      .toSorted();

    const machineComponents: string[] = [];

    for (const dir of dirs) {
      const filePath = resolve(RUNTIME_DIR, dir, "index.ts");
      let source: string;
      try {
        source = readFileSync(filePath, "utf-8");
      } catch {
        continue;
      }

      if (!source.includes("createMachineBehavior(")) continue;
      machineComponents.push(dir);

      expect(
        source,
        `${dir}/index.ts should enable exportApi: true`,
      ).toMatch(/exportApi\s*:\s*true/);

      const keys = extractBehaviorOptionKeys(source);
      expect(
        keys,
        `${dir}/index.ts must define exportApiKeys`,
      ).not.toBeNull();
      expect(
        keys?.length ?? 0,
        `${dir}/index.ts exportApiKeys must be non-empty`,
      ).toBeGreaterThan(0);

      for (const key of keys ?? []) {
        expect(
          FORBIDDEN_INTERNAL_KEYS.has(key),
          `${dir}/index.ts exportApiKeys must not expose internal key "${key}"`,
        ).toBe(false);
      }
    }

    expect(machineComponents.length).toBe(33);
  });

  it("exposes only whitelisted keys at runtime via Behavior.export()", () => {
    const prevBehavior = (globalThis as any).Behavior;
    (globalThis as any).Behavior = (def: any) => def;

    try {
      const modalSource = readFileSync(
        resolve(RUNTIME_DIR, "modal/index.ts"),
        "utf-8",
      );
      const modalKeys = extractBehaviorOptionKeys(modalSource) ?? [];

      const modalBehavior = createMachineBehavior({
        machine: modalMachine,
        connect: connectModal,
        key: "modal",
        exportApi: true,
        exportApiKeys: modalKeys,
      });

      const modalComp: any = { id: "m1", data: {}, setData: vi.fn() };
      modalBehavior.lifetimes.attached.call(modalComp);
      const modalRef = modalBehavior.export.call(modalComp);

      expect(Object.keys(modalRef)).toEqual(modalKeys);
      expect(modalRef.rootProps).toBeUndefined();
      expect(modalRef.overlayProps).toBeUndefined();
      expect(modalRef.send).toBeUndefined();
      expect(modalRef.service).toBeUndefined();
      expect(modalRef.getSnapshot).toBeUndefined();
      expect(modalRef.__codeUiInstance).toBe(modalComp);

      const stepperSource = readFileSync(
        resolve(RUNTIME_DIR, "stepper/index.ts"),
        "utf-8",
      );
      const stepperKeys = extractBehaviorOptionKeys(stepperSource) ?? [];

      const stepperBehavior = createMachineBehavior({
        machine: stepperMachine,
        connect: connectStepper,
        key: "stepper",
        exportApi: true,
        exportApiKeys: stepperKeys,
      });

      const stepperComp: any = {
        id: "s1",
        data: {},
        setData: vi.fn(),
        goToStep: vi.fn(),
        scrollToStep: vi.fn(),
      };
      stepperBehavior.lifetimes.attached.call(stepperComp);
      const stepperRef = stepperBehavior.export.call(stepperComp);

      expect(Object.keys(stepperRef)).toEqual(stepperKeys);
      expect(typeof stepperRef.goToStep).toBe("function");
      expect(typeof stepperRef.scrollToStep).toBe("function");
      expect(stepperRef.rootProps).toBeUndefined();
      expect(stepperRef.steps).toBeUndefined();
      expect(stepperRef.send).toBeUndefined();
      expect(stepperRef.getSnapshot).toBeUndefined();
    } finally {
      (globalThis as any).Behavior = prevBehavior;
    }
  });
});
