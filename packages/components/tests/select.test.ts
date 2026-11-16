import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { transformWxmlSlots } from "@code-ui/compiler";
import {
  floatingMenuTheme as createFloatingMenuTheme,
  selectItemTheme as createSelectItemTheme,
  selectTheme as createSelectTheme,
} from "@code-ui/core";
import { MiniappMachine, connectToComponent } from "@code-ui/miniapp";
import { connectSelect, selectMachine } from "@code-ui/select";
import { resolveSlots } from "../src/utils/ui";
import { tv } from "../src/utils/variants";

const selectTheme = tv(createSelectTheme());
const selectItemTheme = tv(createSelectItemTheme());
const floatingMenuTheme = tv(createFloatingMenuTheme());

const RUNTIME_DIR = resolve(__dirname, "../src/runtime");
const flush = () =>
  new Promise<void>((done) => queueMicrotask(() => queueMicrotask(done)));

describe("Select, SelectItem & FloatingMenu runtime & theme resolution", () => {
  it("resolves select trigger, dropdown, and picker theme slots across variants", () => {
    const outlineClosed = resolveSlots(
      selectTheme({ variant: "outline", color: "primary", size: "md", open: false }),
      {},
      "",
    );
    expect(outlineClosed.base).toContain("border-accented");
    expect(outlineClosed.pickerContent).toContain("translate-y-full");

    const openPrimary = resolveSlots(
      selectTheme({ variant: "outline", color: "primary", size: "lg", open: true }),
      {},
      "my-select",
    );
    expect(openPrimary.root).toContain("my-select");
    expect(openPrimary.trailingIcon).toContain("rotate-180");
    expect(openPrimary.pickerContent).toContain("translate-y-0");
    expect(openPrimary.base).toContain("h-10");
  });

  it("resolves select-item and floating-menu theme slots", () => {
    const itemSlots = resolveSlots(
      selectItemTheme({ color: "primary", size: "md", selected: true, disabled: false }),
      {},
      "",
    );
    expect(itemSlots.base).toContain("bg-elevated_f70");
    expect(itemSlots.trailingIcon).toContain("text-primary");

    const fmSlots = resolveSlots(
      floatingMenuTheme({ portal: true, open: true, side: "top" }),
      {},
      "",
    );
    expect(fmSlots.positioner).toContain("fixed");
    expect(fmSlots.content).toContain("opacity-100");
    expect(fmSlots.arrow).toContain("border-b");
  });

  it("detects slots on c-select and c-select-item via @code-ui/compiler", () => {
    const source = `
      <c-select placeholder="Assign">
        <c-icon slot="leading" name="i-lucide-user" />
        <c-select-item value="a" label="Alice">
          <c-avatar slot="leading" text="Alice" />
        </c-select-item>
      </c-select>
    `;
    const result = transformWxmlSlots(source);
    expect(result.hasChanges).toBe(true);
    expect(result.code).toContain("leading: true");
    expect(result.code).toContain("default: true");
  });

  it("binds required WXML attributes and templates cleanly", () => {
    const selectWxml = readFileSync(resolve(RUNTIME_DIR, "select/index.wxml"), "utf8");
    const itemWxml = readFileSync(resolve(RUNTIME_DIR, "select-item/index.wxml"), "utf8");
    const menuWxml = readFileSync(resolve(RUNTIME_DIR, "floating-menu/index.wxml"), "utf8");

    expect(selectWxml).toContain("<c-floating-menu");
    expect(selectWxml).toContain("<picker-view");
    expect(selectWxml).toContain("<picker-view-column");
    expect(itemWxml).toContain('aria-role="option"');
    expect(menuWxml).toContain("<root-portal");
  });

  it("connects selectMachine to MiniProgram instance with <= 1 setData call per selection", async () => {
    const patches: Record<string, any>[] = [];
    const data: Record<string, any> = {};
    const instance: any = {
      data,
      properties: data,
      setData(patch: Record<string, any>) {
        Object.assign(data, patch);
        patches.push(patch);
      },
      triggerEvent: () => {},
    };

    const machine = new MiniappMachine(selectMachine, {
      id: "s1",
      items: ["Apple", "Banana", "Cherry"],
      duration: 0,
    });
    machine.start();
    const dispose = connectToComponent(machine, instance, connectSelect, "select");

    expect(patches.length).toBe(1);
    patches.length = 0;

    instance.__codeUiApi.openSelect();
    await flush();
    expect(patches.length).toBe(1);
    expect(patches[0]?.["select.open"]).toBe(true);
    patches.length = 0;

    instance.__codeUiApi.selectValue("Banana");
    await flush();
    expect(patches.length).toBe(1);
    expect(patches[0]?.["select.value"]).toBe("Banana");
    expect(patches[0]?.["select.displayLabel"]).toBe("Banana");
    expect(instance.__codeUiApi.value).toBe("Banana");

    dispose();
    machine.stop();
  });
});
