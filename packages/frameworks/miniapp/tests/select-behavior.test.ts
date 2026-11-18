import { describe, expect, it } from "vitest";
import { selectMachine } from "@code-id-labs/select";
import { selectItemMachine } from "@code-id-labs/select-item";
import {
  handleSelectAttached,
  linkSelectItemToParent,
  setupSelectRelations,
  unlinkSelectItemFromParent,
} from "../src/behaviors/select";
import { MiniappMachine } from "../src/machine";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Select Behavior (Parent-Child Relations)", () => {
  it("links declarative select-item children, inherits visuals, and skips managed children", async () => {
    const parentMachine = new MiniappMachine(selectMachine, {
      defaultValue: "b",
      multiple: false,
    });
    parentMachine.start();

    const parentInstance: any = {
      data: {
        id: "sel-1",
        color: "secondary",
        size: "lg",
        selectedIcon: "check-circle",
        linkedChildCount: 0,
      },
      setData(patch: Record<string, any>) {
        Object.assign(this.data, patch);
      },
      __codeUiMachine: parentMachine,
    };

    const childMachineA = new MiniappMachine(selectItemMachine, {
      value: "a",
    });
    childMachineA.start();
    const childA: any = {
      data: {
        value: "a",
        label: "Alpha",
        groupColor: "",
        groupSize: "",
        groupSelectedIcon: "",
      },
      setData(patch: Record<string, any>) {
        Object.assign(this.data, patch);
      },
      __codeUiMachine: childMachineA,
    };

    const childMachineB = new MiniappMachine(selectItemMachine, {
      value: "b",
    });
    childMachineB.start();
    const childB: any = {
      data: {
        value: "b",
        label: "Beta",
        groupColor: "",
        groupSize: "",
        groupSelectedIcon: "",
      },
      setData(patch: Record<string, any>) {
        Object.assign(this.data, patch);
      },
      __codeUiMachine: childMachineB,
    };

    const managedChild: any = {
      data: {
        managed: true,
        value: "m",
        label: "Managed",
      },
      setData(patch: Record<string, any>) {
        Object.assign(this.data, patch);
      },
    };

    linkSelectItemToParent(parentInstance, childA);
    linkSelectItemToParent(parentInstance, childB);
    linkSelectItemToParent(parentInstance, managedChild);
    await flush();

    expect(parentInstance.data.linkedChildCount).toBe(2);
    expect(parentMachine.computed("displayLabel")).toBe("Beta");
    expect(childA.data.groupColor).toBe("secondary");
    expect(childA.data.groupSize).toBe("lg");
    expect(childA.data.groupSelectedIcon).toBe("check-circle");
    expect(childMachineA.computed("isSelected")).toBe(false);
    expect(childMachineB.computed("isSelected")).toBe(true);

    // Unlink child B
    unlinkSelectItemFromParent(parentInstance, childB);
    await flush();

    expect(parentInstance.data.linkedChildCount).toBe(1);
    expect(childMachineB.prop("groupContext")).toBeUndefined();
    expect(childB.data.groupSize).toBe("");

    parentMachine.stop();
    childMachineA.stop();
    childMachineB.stop();
  });

  it("populates initialProps on attached and registers relations", () => {
    const relations: Record<string, any> = {};
    setupSelectRelations(relations, { select: true, selectItem: true });
    expect(relations.cuiSelectChild).toBeDefined();
    expect(relations.cuiSelectParent).toBeDefined();

    const parentMachine = new MiniappMachine(selectMachine, {
      defaultValue: "x",
    });
    parentMachine.start();

    const parentInstance: any = {
      data: { id: "sel-2", color: "info", size: "sm", selectedIcon: "check" },
      __codeUiMachine: parentMachine,
    };

    const childInstance: any = {
      data: { groupColor: "", groupSize: "", groupSelectedIcon: "" },
      setData(patch: Record<string, any>) {
        Object.assign(this.data, patch);
      },
      __codeUiPendingSelect: parentInstance,
      __codeUiSelectIndex: 0,
      __codeUiSelectId: "sel-2",
    };

    const initialProps: Record<string, any> = {};
    handleSelectAttached(childInstance, initialProps, { selectItem: true });

    expect(initialProps.selectId).toBe("sel-2");
    expect(initialProps.groupIndex).toBe(0);
    expect(initialProps.groupContext).toBeDefined();
    expect(childInstance.data.groupColor).toBe("info");
    expect(childInstance.data.groupSize).toBe("sm");

    parentMachine.stop();
  });
});
