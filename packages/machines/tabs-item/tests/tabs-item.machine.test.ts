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
    orientation: () => "horizontal",
    variant: () => "pill",
    color: () => "primary",
    size: () => "md",
    disabled: () => false,
    fitted: () => false,
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

  it("becomes selected when the group value matches", () => {
    const machine = new MiniappMachine(tabsItemMachine, {
      value: "account",
      groupContext: makeGroupContext({ value: () => "account" }),
    });
    machine.start();

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
    expect(connectTabsItem(machine1.service).isDisabled).toBe(true);
    machine1.stop();

    const machine2 = new MiniappMachine(tabsItemMachine, {
      value: "account",
      groupContext: makeGroupContext({ disabled: () => true }),
    });
    machine2.start();
    expect(connectTabsItem(machine2.service).isDisabled).toBe(true);
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

  it("resolves presentational values from the group context", () => {
    const machine = new MiniappMachine(tabsItemMachine, {
      value: "profile",
      groupContext: makeGroupContext({
        orientation: () => "vertical",
        variant: () => "link",
        color: () => "danger",
        size: () => "lg",
        fitted: () => true,
      }),
    });
    machine.start();

    const api = connectTabsItem(machine.service);
    expect(api.orientation).toBe("vertical");
    expect(api.variant).toBe("link");
    expect(api.color).toBe("danger");
    expect(api.size).toBe("lg");
    expect(api.fitted).toBe(true);

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
    expect(api.contentProps.id).toBe("cui-tabs-item-tab1-content");
    expect(api.contentProps.role).toBe("tabpanel");
    expect(api.contentProps["aria-labelledby"]).toBe(
      "cui-tabs-demo-trigger-profile",
    );
    expect(api.contentProps["data-state"]).toBe("active");
    expect(api.contentProps.hidden).toBe(false);

    machine.stop();
  });

  it("exposes icon and trailingIcon", () => {
    const m = new MiniappMachine(tabsItemMachine, {
      value: "account",
      icon: "i-lucide-user",
      trailingIcon: "i-lucide-chevron-right",
    });
    m.start();
    const api = connectTabsItem(m.service);
    expect(api.icon).toBe("i-lucide-user");
    expect(api.trailingIcon).toBe("i-lucide-chevron-right");
    m.stop();
  });
});
