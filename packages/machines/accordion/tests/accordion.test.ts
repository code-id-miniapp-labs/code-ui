import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { accordionMachine, connectAccordion } from "../src";
import type { AccordionChangePayload } from "../src";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Accordion Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes with default props", () => {
      const machine = new MiniappMachine(accordionMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");
      expect(machine.context.get("value")).toEqual([]);

      const api = connectAccordion(machine.service);
      expect(api.value).toEqual([]);
      expect(api.multiple).toBe(false);
      expect(api.collapsible).toBe(true);
      expect(api.disabled).toBe(false);
      expect(api.size).toBe("md");
      expect(api.variant).toBe("outline");
      expect(api.hasItems).toBe(false);
      expect(api.items).toEqual([]);

      machine.stop();
    });

    it("initializes with defaultValue and items", () => {
      const machine = new MiniappMachine(accordionMachine, {
        defaultValue: ["item-1"],
        items: [
          { value: "item-1", label: "Item 1", content: "Content 1" },
          { value: "item-2", label: "Item 2", content: "Content 2" },
        ],
      });
      machine.start();

      const api = connectAccordion(machine.service);
      expect(api.value).toEqual(["item-1"]);
      expect(api.hasItems).toBe(true);
      expect(api.items.length).toBe(2);
      expect(api.items[0]?.isOpen).toBe(true);
      expect(api.items[1]?.isOpen).toBe(false);

      machine.stop();
    });
  });

  describe("Toggling & Values", () => {
    it("toggles single item when single & collapsible", async () => {
      const onChange = vi.fn();
      const machine = new MiniappMachine(accordionMachine, {
        multiple: false,
        collapsible: true,
        onChange,
      });
      machine.start();

      const api = connectAccordion(machine.service);
      api.toggle("1");
      await flush();

      expect(machine.context.get("value")).toEqual(["1"]);
      expect(onChange).toHaveBeenCalledWith({ value: ["1"], expanded: ["1"] });

      api.toggle("1");
      await flush();
      expect(machine.context.get("value")).toEqual([]);

      machine.stop();
    });

    it("prevents collapsing active item when collapsible is false", async () => {
      const machine = new MiniappMachine(accordionMachine, {
        defaultValue: ["1"],
        multiple: false,
        collapsible: false,
      });
      machine.start();

      const api = connectAccordion(machine.service);
      expect(api.value).toEqual(["1"]);

      api.toggle("1");
      await flush();
      expect(machine.context.get("value")).toEqual(["1"]);

      api.toggle("2");
      await flush();
      expect(machine.context.get("value")).toEqual(["2"]);

      machine.stop();
    });

    it("prevents collapsing when collapsible dynamically changes to false via updateProps", async () => {
      const machine = new MiniappMachine(accordionMachine, {
        value: ["1"],
        multiple: false,
        collapsible: true,
      });
      machine.start();

      expect(machine.context.get("collapsible")).toBe(true);

      machine.updateProps({ collapsible: false });
      await flush();

      expect(machine.context.get("collapsible")).toBe(false);

      const api = connectAccordion(machine.service);
      api.toggle("1");
      await flush();

      expect(machine.context.get("value")).toEqual(["1"]);

      machine.stop();
    });

    it("prevents collapsing the only open item when collapsible is false even if multiple is true", async () => {
      const machine = new MiniappMachine(accordionMachine, {
        value: ["item-1"],
        multiple: true,
        collapsible: false,
      });
      machine.start();

      const api = connectAccordion(machine.service);
      expect(api.value).toEqual(["item-1"]);

      // Toggling the only open item must NOT collapse it
      api.toggle("item-1");
      await flush();
      expect(machine.context.get("value")).toEqual(["item-1"]);

      // Opening another item is allowed
      api.toggle("item-2");
      await flush();
      expect(machine.context.get("value")).toEqual(["item-1", "item-2"]);

      // Closing one of multiple items is allowed
      api.toggle("item-1");
      await flush();
      expect(machine.context.get("value")).toEqual(["item-2"]);

      // Closing the last remaining item is blocked
      api.toggle("item-2");
      await flush();
      expect(machine.context.get("value")).toEqual(["item-2"]);

      // collapseAll is blocked
      api.collapseAll();
      await flush();
      expect(machine.context.get("value")).toEqual(["item-2"]);

      machine.stop();
    });

    it("syncs controlled value and flags through updateProps", async () => {
      const machine = new MiniappMachine(accordionMachine, {
        value: ["1"],
        multiple: false,
      });
      machine.start();

      machine.updateProps({ value: ["2"], multiple: true });
      await flush();

      const api = connectAccordion(machine.service);
      expect(api.value).toEqual(["2"]);
      expect(machine.context.get("value")).toEqual(["2"]);
      expect(api.multiple).toBe(true);

      machine.stop();
    });

    it("supports multiple items open when multiple is true", async () => {
      const machine = new MiniappMachine(accordionMachine, {
        multiple: true,
      });
      machine.start();

      const api = connectAccordion(machine.service);
      api.toggle("1");
      await flush();
      api.toggle("2");
      await flush();
      expect(machine.context.get("value")).toEqual(["1", "2"]);

      api.toggle("1");
      await flush();
      expect(machine.context.get("value")).toEqual(["2"]);

      machine.stop();
    });

    it("supports expandAll and collapseAll", async () => {
      const machine = new MiniappMachine(accordionMachine, {
        multiple: true,
        items: [
          { value: "a", label: "A" },
          { value: "b", label: "B" },
        ],
      });
      machine.start();

      const api = connectAccordion(machine.service);
      api.expandAll();
      await flush();
      expect(machine.context.get("value")).toEqual(["a", "b"]);

      api.collapseAll();
      await flush();
      expect(machine.context.get("value")).toEqual([]);

      machine.stop();
    });
  });

  describe("Bus Interaction", () => {
    it("emits a single full accordion:change payload on token toggle", async () => {
      const machine = new MiniappMachine(accordionMachine, {
        multiple: true,
        collapsible: false,
        size: "lg",
        variant: "separated",
      });
      machine.start();

      const bus = machine.service.refs.get("bus");
      const changes: AccordionChangePayload[] = [];
      bus?.on("accordion:change", (payload) => changes.push(payload));

      const api = connectAccordion(machine.service);
      api.toggle("a");
      await flush();

      expect(changes).toEqual([
        {
          value: ["a"],
          multiple: true,
          collapsible: false,
          disabled: false,
          size: "lg",
          variant: "separated",
        },
      ]);

      machine.stop();
    });

    it("listens to item:toggle event on bus", async () => {
      const machine = new MiniappMachine(accordionMachine, {
        multiple: false,
      });
      machine.start();

      const bus = machine.service.refs.get("bus");
      expect(bus).toBeDefined();

      bus?.emit("item:toggle", { value: "item-foo" });
      await flush();
      expect(machine.context.get("value")).toEqual(["item-foo"]);

      bus?.emit("item:toggle", { value: "item-bar" });
      await flush();
      expect(machine.context.get("value")).toEqual(["item-bar"]);

      machine.stop();
    });

    it("supports programmatic data-driven items and toggling via bus", async () => {
      const machine = new MiniappMachine(accordionMachine, {
        items: [
          { value: "faq-1", label: "FAQ 1" },
          { value: "faq-2", label: "FAQ 2" },
        ],
        defaultValue: ["faq-1"],
        multiple: true,
      });
      machine.start();

      let api = connectAccordion(machine.service);
      expect(api.items[0]?.isOpen).toBe(true);
      expect(api.items[1]?.isOpen).toBe(false);

      const bus = machine.service.refs.get("bus");
      bus?.emit("item:toggle", { value: "faq-2" });
      await flush();

      api = connectAccordion(machine.service);
      expect(api.value).toEqual(["faq-1", "faq-2"]);
      expect(api.items[0]?.isOpen).toBe(true);
      expect(api.items[1]?.isOpen).toBe(true);

      bus?.emit("item:toggle", { value: "faq-1" });
      await flush();

      api = connectAccordion(machine.service);
      expect(api.value).toEqual(["faq-2"]);
      expect(api.items[0]?.isOpen).toBe(false);
      expect(api.items[1]?.isOpen).toBe(true);

      machine.stop();
    });
  });
});
