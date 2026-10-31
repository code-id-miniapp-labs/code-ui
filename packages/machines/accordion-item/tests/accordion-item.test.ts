import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { accordionItemMachine, connectAccordionItem } from "../src";
import { createEventBus } from "@code-ui/utils";
import type { AccordionBusEvents } from "@code-ui/accordion";

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

  it("links to groupBus and synchronizes state", async () => {
    const bus = createEventBus<AccordionBusEvents>();
    const onBusToggle = vi.fn();
    bus.on("item:toggle", onBusToggle);

    const machine = new MiniappMachine(accordionItemMachine, {
      value: "item-1",
      groupBus: bus,
      groupValue: [],
    });
    machine.start();

    let api = connectAccordionItem(machine.service);
    expect(api.isOpen).toBe(false);

    api.toggle();
    await flush();
    expect(onBusToggle).toHaveBeenCalledWith({ value: "item-1" });

    // Simulate parent accordion emitting accordion:change
    bus.emit("accordion:change", {
      value: ["item-1"],
      multiple: false,
      collapsible: true,
      disabled: false,
      size: "lg",
      variant: "subtle",
    });
    await flush();

    api = connectAccordionItem(machine.service);
    expect(api.isOpen).toBe(true);
    expect(api.size).toBe("lg");
    expect(api.variant).toBe("subtle");

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

  it("prevents collapsing open item when groupCollapsible is false in single selection", async () => {
    const bus = createEventBus<AccordionBusEvents>();
    const onBusToggle = vi.fn();
    bus.on("item:toggle", onBusToggle);

    const machine = new MiniappMachine(accordionItemMachine, {
      value: "item-1",
      groupBus: bus,
      groupValue: ["item-1"],
      groupCollapsible: false,
      groupMultiple: false,
    });
    machine.start();

    const api = connectAccordionItem(machine.service);
    expect(api.isOpen).toBe(true);

    api.toggle();
    await flush();
    expect(onBusToggle).not.toHaveBeenCalled();

    machine.stop();
  });
});
