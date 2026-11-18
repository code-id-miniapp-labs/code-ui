import { describe, it, expect, vi } from "vitest";
import {
  setupAccordionRelations,
  linkAccordionItemToParent,
  unlinkAccordionItemFromParent,
  handleAccordionAttached,
  handleAccordionReady,
} from "../src/behaviors/accordion";
import { accordionMachine } from "@code-id-labs/accordion";
import { accordionItemMachine } from "@code-id-labs/accordion-item";
import { MiniappMachine } from "../src/machine";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Accordion Behavior (Parent-Child Relations)", () => {
  it("links child items to parent accordion and synchronizes props", async () => {
    const parentMachine = new MiniappMachine(accordionMachine, {
      value: ["item-0"],
      multiple: false,
    });
    parentMachine.start();

    const parentInstance: any = {
      data: { id: "test-accordion", size: "lg", variant: "subtle" },
      __codeUiMachine: parentMachine,
    };

    const childMachine1 = new MiniappMachine(accordionItemMachine, {
      value: "item-0",
    });
    childMachine1.start();
    const child1: any = {
      data: { groupSize: "", groupVariant: "" },
      setData(patch: Record<string, any>) {
        Object.assign(this.data, patch);
      },
      __codeUiMachine: childMachine1,
    };

    const childMachine2 = new MiniappMachine(accordionItemMachine, {
      value: "item-1",
    });
    childMachine2.start();
    const child2: any = {
      data: { groupSize: "", groupVariant: "" },
      setData(patch: Record<string, any>) {
        Object.assign(this.data, patch);
      },
      __codeUiMachine: childMachine2,
    };

    linkAccordionItemToParent(parentInstance, child1);
    linkAccordionItemToParent(parentInstance, child2);
    await flush();

    expect(parentMachine.prop("linkedCount")).toBe(2);
    expect(child1.data.groupSize).toBe("lg");
    expect(child1.data.groupVariant).toBe("subtle");
    expect(childMachine1.computed("isOpen")).toBe(true);
    expect(childMachine2.computed("isOpen")).toBe(false);

    // Unlink child 1
    unlinkAccordionItemFromParent(parentInstance, child1);
    await flush();

    expect(parentMachine.prop("linkedCount")).toBe(1);
    expect(childMachine1.prop("groupContext")).toBeUndefined();
    expect(child1.data.groupSize).toBe("");
    expect(child1.data.groupVariant).toBe("");

    parentMachine.stop();
    childMachine1.stop();
    childMachine2.stop();
  });

  it("handles handleAccordionAttached correctly", () => {
    const parentMachine = new MiniappMachine(accordionMachine, {
      value: ["item-1"],
    });
    parentMachine.start();

    const parentInstance: any = {
      data: { id: "acc-1", size: "sm" },
      __codeUiMachine: parentMachine,
    };

    const childInstance: any = {
      data: { groupSize: "", groupVariant: "" },
      setData(patch: Record<string, any>) {
        Object.assign(this.data, patch);
      },
      __codeUiPendingAccordion: parentInstance,
      __codeUiAccordionIndex: 1,
      __codeUiAccordionId: "acc-1",
    };

    const initialProps: Record<string, any> = {};
    handleAccordionAttached(childInstance, initialProps, {
      accordionItem: true,
    });

    expect(initialProps.groupIndex).toBe(1);
    expect(initialProps.accordionId).toBe("acc-1");
    expect(initialProps.groupContext).toBe(
      parentMachine.service.refs.get("groupContext"),
    );
    expect(initialProps.groupContext.value()).toEqual(["item-1"]);
    expect(childInstance.data.groupSize).toBe("sm");

    parentMachine.stop();
  });

  it("configures relation objects in setupAccordionRelations", () => {
    const relations: any = {};
    setupAccordionRelations(relations, { accordion: true });

    expect(relations.cuiAccordionChild).toBeDefined();
    expect(relations.cuiAccordionChild.type).toBe("descendant");

    const itemRelations: any = {};
    setupAccordionRelations(itemRelations, { accordionItem: true });

    expect(itemRelations.cuiAccordionParent).toBeDefined();
    expect(itemRelations.cuiAccordionParent.type).toBe("ancestor");
  });

  it("synchronizes initial controlled value and updates reactively via updateProps", async () => {
    const parentMachine = new MiniappMachine(accordionMachine, {
      value: ["item-0"],
      multiple: true,
    });
    parentMachine.start();

    const parentInstance: any = {
      data: { id: "sync-accordion" },
      __codeUiMachine: parentMachine,
    };

    const initialProps0: Record<string, any> = { value: "item-0" };
    const childInstance0: any = {
      __codeUiPendingAccordion: parentInstance,
      __codeUiAccordionIndex: 0,
      __codeUiAccordionId: "sync-accordion",
    };
    handleAccordionAttached(childInstance0, initialProps0, {
      accordionItem: true,
    });

    const childMachine0 = new MiniappMachine(
      accordionItemMachine,
      initialProps0,
    );
    childMachine0.start();
    childInstance0.__codeUiMachine = childMachine0;
    linkAccordionItemToParent(parentInstance, childInstance0);

    const initialProps1: Record<string, any> = { value: "item-1" };
    const childInstance1: any = {
      __codeUiPendingAccordion: parentInstance,
      __codeUiAccordionIndex: 1,
      __codeUiAccordionId: "sync-accordion",
    };
    handleAccordionAttached(childInstance1, initialProps1, {
      accordionItem: true,
    });

    const childMachine1 = new MiniappMachine(
      accordionItemMachine,
      initialProps1,
    );
    childMachine1.start();
    childInstance1.__codeUiMachine = childMachine1;
    linkAccordionItemToParent(parentInstance, childInstance1);

    await flush();

    // Verify initial sync: item-0 is open, item-1 is closed
    expect(childMachine0.computed("isOpen")).toBe(true);
    expect(childMachine1.computed("isOpen")).toBe(false);

    // Reactively update parent value (like setData({ activeValue: ["item-0", "item-1"] }))
    parentMachine.updateProps({ value: ["item-0", "item-1"] });
    await flush();

    expect(childMachine0.computed("isOpen")).toBe(true);
    expect(childMachine1.computed("isOpen")).toBe(true);

    // Collapse all
    parentMachine.updateProps({ value: [] });
    await flush();

    expect(childMachine0.computed("isOpen")).toBe(false);
    expect(childMachine1.computed("isOpen")).toBe(false);

    parentMachine.stop();
    childMachine0.stop();
    childMachine1.stop();
  });

  it("links shadow-template data-driven items via selectOwnerComponent without relations", async () => {
    const onChange = vi.fn();
    const parentMachine = new MiniappMachine(accordionMachine, {
      value: ["faq-1"],
      collapsible: true,
      onChange,
    });
    parentMachine.start();

    const parentInstance: any = {
      data: { id: "data-accordion", size: "md", variant: "subtle" },
      __codeUiMachine: parentMachine,
    };
    handleAccordionAttached(parentInstance, {}, { accordion: true });

    const childOnChange = vi.fn();
    const childProps: Record<string, any> = {
      value: "faq-2",
      open: false,
      onChange: childOnChange,
    };
    const childInstance: any = {
      data: { value: "faq-2", open: false },
      selectOwnerComponent: () => parentInstance,
      setData: vi.fn(),
    };
    handleAccordionAttached(childInstance, childProps, {
      accordionItem: true,
    });

    const childMachine = new MiniappMachine(accordionItemMachine, childProps);
    childMachine.start();
    childInstance.__codeUiMachine = childMachine;
    handleAccordionReady(childInstance, { accordionItem: true });

    await flush();

    // Verify groupContext is wired even though relations are absent
    expect(childProps.groupContext).toBeDefined();
    expect(childMachine.computed("isOpen")).toBe(false);

    // Tapping item invokes groupContext.toggleItem -> onChange(["faq-2"]) without emitting item change
    childMachine.send({ type: "TOGGLE" });
    await flush();
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: ["faq-2"] }),
    );
    expect(childOnChange).not.toHaveBeenCalled();

    parentMachine.stop();
    childMachine.stop();
  });

  it("toggles data-driven items via controlled onChange fallback when unlinked", async () => {
    const onChange = vi.fn();
    const parentMachine = new MiniappMachine(accordionMachine, {
      value: ["faq-1"],
      items: [{ value: "faq-1" }, { value: "faq-2" }],
      collapsible: true,
      onChange,
    });
    parentMachine.start();

    const childOnChange = vi.fn((details: { value: string; open: boolean }) => {
      parentMachine.send({ type: "VALUE.TOGGLE", value: details.value });
    });
    const childMachine = new MiniappMachine(accordionItemMachine, {
      value: "faq-2",
      open: false,
      onChange: childOnChange,
    });
    childMachine.start();

    childMachine.send({ type: "TOGGLE" });
    await flush();

    expect(childOnChange).toHaveBeenCalledWith({ value: "faq-2", open: true });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: ["faq-2"] }),
    );

    parentMachine.stop();
    childMachine.stop();
  });
});
