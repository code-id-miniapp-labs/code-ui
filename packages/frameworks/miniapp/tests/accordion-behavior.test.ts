import { describe, it, expect } from "vitest";
import {
  setupAccordionRelations,
  syncAccordionChildren,
  linkAccordionItemToParent,
  unlinkAccordionItemFromParent,
  handleAccordionAttached,
} from "../src/behaviors/accordion";
import { accordionMachine } from "@code-ui/accordion";
import { accordionItemMachine } from "@code-ui/accordion-item";
import { MiniappMachine } from "../src/machine";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Accordion Behavior (Parent-Child Relations)", () => {
  it("links child items to parent accordion and synchronizes props", async () => {
    const parentMachine = new MiniappMachine(accordionMachine, {
      value: ["item-0"],
      multiple: false,
      size: "lg",
      variant: "subtle",
    });
    parentMachine.start();

    const parentInstance: any = {
      data: { id: "test-accordion" },
      __codeUiMachine: parentMachine,
    };

    const childMachine1 = new MiniappMachine(accordionItemMachine, {
      value: "item-0",
    });
    childMachine1.start();
    const child1: any = {
      __codeUiMachine: childMachine1,
    };

    const childMachine2 = new MiniappMachine(accordionItemMachine, {
      value: "item-1",
    });
    childMachine2.start();
    const child2: any = {
      __codeUiMachine: childMachine2,
    };

    linkAccordionItemToParent(parentInstance, child1);
    linkAccordionItemToParent(parentInstance, child2);
    await flush();

    expect(parentMachine.context.get("linkedCount")).toBe(2);
    expect(childMachine1.context.get("groupValue")).toEqual(["item-0"]);
    expect(childMachine1.context.get("groupSize")).toBe("lg");
    expect(childMachine1.context.get("groupVariant")).toBe("subtle");
    expect(childMachine1.computed("isOpen")).toBe(true);
    expect(childMachine2.computed("isOpen")).toBe(false);

    // Unlink child 1
    unlinkAccordionItemFromParent(parentInstance, child1);
    await flush();

    expect(parentMachine.context.get("linkedCount")).toBe(1);
    expect(child1.__codeUiAccordionBus).toBeUndefined();

    parentMachine.stop();
    childMachine1.stop();
    childMachine2.stop();
  });

  it("handles handleAccordionAttached correctly", () => {
    const parentMachine = new MiniappMachine(accordionMachine, {
      value: ["item-1"],
      size: "sm",
    });
    parentMachine.start();

    const parentInstance: any = {
      data: { id: "acc-1" },
      __codeUiMachine: parentMachine,
    };

    const childInstance: any = {
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
    expect(initialProps.groupValue).toEqual(["item-1"]);
    expect(initialProps.groupSize).toBe("sm");

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
    syncAccordionChildren(parentInstance);
    await flush();

    expect(childMachine0.computed("isOpen")).toBe(true);
    expect(childMachine1.computed("isOpen")).toBe(true);

    // Collapse all
    parentMachine.updateProps({ value: [] });
    syncAccordionChildren(parentInstance);
    await flush();

    expect(childMachine0.computed("isOpen")).toBe(false);
    expect(childMachine1.computed("isOpen")).toBe(false);

    parentMachine.stop();
    childMachine0.stop();
    childMachine1.stop();
  });
});
