import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { accordionItemMachine, connectAccordionItem } from "../src";
import type { AccordionGroupContext } from "@code-ui/accordion";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("AccordionItem Machine", () => {
  it("initializes standalone uncontrolled item", async () => {
    const machine = new MiniappMachine(accordionItemMachine, {
      value: "item-1",
      label: "Title 1",
    });
    machine.start();

    let api = connectAccordionItem(machine.service);
    expect(api.resolvedValue).toBe("item-1");
    expect(api.label).toBe("Title 1");
    expect(api.isOpen).toBe(false);

    api.toggle();
    await flush();
    api = connectAccordionItem(machine.service);
    expect(api.isOpen).toBe(true);

    api.toggle();
    await flush();
    api = connectAccordionItem(machine.service);
    expect(api.isOpen).toBe(false);

    machine.stop();
  });

  it("reads live state from the parent group context", async () => {
    const value = ["item-1"];
    const toggleItem = vi.fn();
    const groupContext: AccordionGroupContext = {
      value: () => value,
      multiple: () => true,
      collapsible: () => true,
      disabled: () => false,
      size: () => "lg",
      variant: () => "subtle",
      toggleItem,
      setItemOpen: vi.fn(),
      setValue: vi.fn(),
      expandAll: vi.fn(),
      collapseAll: vi.fn(),
    };

    const machine = new MiniappMachine(accordionItemMachine, {
      value: "item-1",
      groupContext,
    });
    machine.start();

    let api = connectAccordionItem(machine.service);
    expect(api.isOpen).toBe(true);
    expect(api.size).toBe("lg");
    expect(api.variant).toBe("subtle");

    api.toggle();
    await flush();
    expect(toggleItem).toHaveBeenCalledWith("item-1");

    machine.stop();
  });

  it("dispatches setItemOpen intents for programmatic open and close", async () => {
    const setItemOpen = vi.fn();
    const groupContext: AccordionGroupContext = {
      value: () => ["item-1"],
      multiple: () => false,
      collapsible: () => true,
      disabled: () => false,
      size: () => "md",
      variant: () => "outline",
      toggleItem: vi.fn(),
      setItemOpen,
      setValue: vi.fn(),
      expandAll: vi.fn(),
      collapseAll: vi.fn(),
    };

    const machine = new MiniappMachine(accordionItemMachine, {
      value: "item-1",
      groupContext,
    });
    machine.start();

    const api = connectAccordionItem(machine.service);
    api.close();
    await flush();
    expect(setItemOpen).toHaveBeenCalledWith("item-1", false);

    machine.stop();
  });

  it("honors disabled prop", async () => {
    const machine = new MiniappMachine(accordionItemMachine, {
      value: "item-1",
      disabled: true,
    });
    machine.start();

    let api = connectAccordionItem(machine.service);
    expect(api.isDisabled).toBe(true);

    api.toggle();
    await flush();
    api = connectAccordionItem(machine.service);
    expect(api.isOpen).toBe(false);

    machine.stop();
  });

  it("prevents collapsing when collapsible is false in standalone mode", async () => {
    const machine = new MiniappMachine(accordionItemMachine, {
      value: "item-1",
      defaultOpen: true,
      collapsible: false,
    });
    machine.start();

    let api = connectAccordionItem(machine.service);
    expect(api.isOpen).toBe(true);

    api.toggle();
    await flush();
    api = connectAccordionItem(machine.service);
    expect(api.isOpen).toBe(true);

    api.close();
    await flush();
    api = connectAccordionItem(machine.service);
    expect(api.isOpen).toBe(true);

    machine.stop();
  });

  it("derives disabled state from the parent group context", async () => {
    const groupContext: AccordionGroupContext = {
      value: () => [],
      multiple: () => false,
      collapsible: () => false,
      disabled: () => true,
      size: () => "md",
      variant: () => "outline",
      toggleItem: vi.fn(),
      setItemOpen: vi.fn(),
      setValue: vi.fn(),
      expandAll: vi.fn(),
      collapseAll: vi.fn(),
    };

    const machine = new MiniappMachine(accordionItemMachine, {
      value: "item-1",
      groupContext,
    });
    machine.start();

    const api = connectAccordionItem(machine.service);
    expect(api.isDisabled).toBe(true);
    expect(api.isCollapsible).toBe(false);

    machine.stop();
  });
});
