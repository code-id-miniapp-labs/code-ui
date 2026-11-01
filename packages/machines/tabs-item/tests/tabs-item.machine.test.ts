import { describe, it, expect } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { createEventBus } from "@code-ui/utils";
import type { TabsBusEvents } from "@code-ui/tabs";
import { tabsItemMachine, connectTabsItem } from "../src";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("TabsItem Machine", () => {
  it("initializes with default props", () => {
    const machine = new MiniappMachine(tabsItemMachine, {
      value: "account",
      label: "Account",
    });
    machine.start();

    const api = connectTabsItem(machine.service);
    expect(api.value).toBe("account");
    expect(api.label).toBe("Account");
    expect(api.isSelected).toBe(false);
    expect(api.isDisabled).toBe(false);
    expect(api.lazy).toBe(true);

    machine.stop();
  });

  it("becomes selected when groupValue matches value", () => {
    const machine = new MiniappMachine(tabsItemMachine, {
      value: "account",
      groupValue: "account",
    });
    machine.start();

    const api = connectTabsItem(machine.service);
    expect(api.isSelected).toBe(true);

    machine.stop();
  });

  it("updates isSelected via groupBus tabs:change event", async () => {
    const bus = createEventBus<TabsBusEvents>();
    const machine = new MiniappMachine(tabsItemMachine, {
      value: "account",
      groupBus: bus,
      groupValue: "home",
    });
    machine.start();

    let api = connectTabsItem(machine.service);
    expect(api.isSelected).toBe(false);

    bus.emit("tabs:change", {
      value: "account",
      orientation: "horizontal",
      variant: "pill",
      color: "primary",
      size: "md",
      disabled: false,
    });
    await flush();

    api = connectTabsItem(machine.service);
    expect(api.isSelected).toBe(true);

    bus.emit("tabs:change", {
      value: "other",
      orientation: "horizontal",
      variant: "pill",
      color: "primary",
      size: "md",
      disabled: false,
    });
    await flush();

    api = connectTabsItem(machine.service);
    expect(api.isSelected).toBe(false);

    machine.stop();
  });

  it("handles disabled states from self or group", () => {
    const machine1 = new MiniappMachine(tabsItemMachine, {
      value: "account",
      disabled: true,
    });
    machine1.start();
    expect(connectTabsItem(machine1.service).isDisabled).toBe(true);
    machine1.stop();

    const machine2 = new MiniappMachine(tabsItemMachine, {
      value: "account",
      groupDisabled: true,
    });
    machine2.start();
    expect(connectTabsItem(machine2.service).isDisabled).toBe(true);
    machine2.stop();
  });

  it("emits item:select on parent bus when select is called", async () => {
    const bus = createEventBus<TabsBusEvents>();
    let selectedValue: string | number | undefined;
    bus.on("item:select", ({ value }) => {
      selectedValue = value;
    });

    const machine = new MiniappMachine(tabsItemMachine, {
      value: "profile",
      groupBus: bus,
    });
    machine.start();

    const api = connectTabsItem(machine.service);
    api.select();
    await flush();

    expect(selectedValue).toBe("profile");
    machine.stop();
  });

  it("generates correct DOM props for content", () => {
    const machine = new MiniappMachine(tabsItemMachine, {
      id: "tab1",
      tabsId: "demo",
      value: "profile",
      groupValue: "profile",
    });
    machine.start();

    const api = connectTabsItem(machine.service);
    expect(api.contentProps.id).toBe("cui-tabs-item-tab1-content");
    expect(api.contentProps.role).toBe("tabpanel");
    expect(api.contentProps["aria-labelledby"]).toBe("cui-tabs-demo-trigger-profile");
    expect(api.contentProps["data-state"]).toBe("active");
    expect(api.contentProps.hidden).toBe(false);

    machine.stop();
  });
});
