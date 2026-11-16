import { describe, it, expect, vi } from "vitest";
import { signal } from "alien-signals";
import { MiniappMachine } from "@code-ui/miniapp";
import type { TabsGroupContext } from "@code-ui/tabs";
import { tabsItemMachine, connectTabsItem } from "../src";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

function makeGroupContext(
  overrides: Partial<TabsGroupContext> = {},
): TabsGroupContext {
  return {
    value: () => "home",
    disabled: () => false,
    select: vi.fn(),
    setValue: vi.fn(),
    next: vi.fn(),
    previous: vi.fn(),
    first: vi.fn(),
    last: vi.fn(),
    ...overrides,
  };
}

describe("TabsItem Machine", () => {
  it("initializes with default props", () => {
    const machine = new MiniappMachine(tabsItemMachine, {
      value: "account",
      groupIndex: 2,
    });
    machine.start();

    expect(machine.state.get()).toBe("inactive");
    const api = connectTabsItem(machine.service);
    expect(api.state).toBe("inactive");
    expect(api.value).toBe("account");
    expect(api.isSelected).toBe(false);
    expect(api.disabled).toBe(false);

    machine.stop();
  });

  it("becomes selected when the group value matches", () => {
    const machine = new MiniappMachine(tabsItemMachine, {
      value: "account",
      groupContext: makeGroupContext({ value: () => "account" }),
    });
    machine.start();

    expect(machine.state.get()).toBe("active");
    const api = connectTabsItem(machine.service);
    expect(api.isSelected).toBe(true);

    machine.stop();
  });

  it("reads live selection state from the group context", async () => {
    const current = signal<string | number>("home");
    const group = makeGroupContext({ value: () => current() });
    const machine = new MiniappMachine(tabsItemMachine, {
      value: "account",
      groupContext: group,
    });
    machine.start();

    let api = connectTabsItem(machine.service);
    expect(api.isSelected).toBe(false);

    current("account");
    await flush();
    api = connectTabsItem(machine.service);
    expect(api.isSelected).toBe(true);

    current("other");
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
    expect(connectTabsItem(machine1.service).disabled).toBe(true);
    machine1.stop();

    const machine2 = new MiniappMachine(tabsItemMachine, {
      value: "account",
      groupContext: makeGroupContext({ disabled: () => true }),
    });
    machine2.start();
    expect(connectTabsItem(machine2.service).disabled).toBe(true);
    machine2.stop();
  });

  it("dispatches select intents to the group context", async () => {
    const select = vi.fn();
    const machine = new MiniappMachine(tabsItemMachine, {
      value: "profile",
      groupContext: makeGroupContext({ select }),
    });
    machine.start();

    const api = connectTabsItem(machine.service);
    api.select();
    await flush();

    expect(select).toHaveBeenCalledWith("profile");
    machine.stop();
  });

  it("generates correct DOM props for content", () => {
    const machine = new MiniappMachine(tabsItemMachine, {
      id: "tab1",
      tabsId: "demo",
      value: "profile",
      groupContext: makeGroupContext({ value: () => "profile" }),
    });
    machine.start();

    const api = connectTabsItem(machine.service);
    expect(api.contentProps.id).toBe("tbi-tab1-c");
    expect(api.contentProps["aria-role"]).toBe("tabpanel");
    expect(api.contentProps["aria-labelledby"]).toBe(
      "tb-demo-tr-profile",
    );
    expect(api.contentProps["data-state"]).toBe("active");
    expect(api.contentProps.hidden).toBe(false);

    machine.stop();
  });

  it("dispatches only groupContext.select when linked, or onSelect when unlinked", async () => {
    const onSelect = vi.fn();
    const unlinked = new MiniappMachine(tabsItemMachine, {
      value: "profile",
      onSelect,
    });
    unlinked.start();

    connectTabsItem(unlinked.service).select();
    await flush();
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith({ value: "profile" });
    unlinked.stop();

    onSelect.mockClear();
    const groupSelect = vi.fn();
    const linked = new MiniappMachine(tabsItemMachine, {
      value: "profile",
      onSelect,
      groupContext: makeGroupContext({ select: groupSelect }),
    });
    linked.start();

    connectTabsItem(linked.service).select();
    await flush();
    expect(groupSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
    linked.stop();
  });
});
