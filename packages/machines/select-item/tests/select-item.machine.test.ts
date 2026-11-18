import { MiniappMachine } from "@code-id-labs/miniapp";
import { connectSelect, selectMachine } from "@code-id-labs/select";
import { describe, expect, it, vi } from "vitest";
import { connectSelectItem, selectItemMachine } from "../src";

const flush = () =>
  new Promise<void>((resolve) => queueMicrotask(() => queueMicrotask(resolve)));

describe("selectItemMachine (@code-id-labs/select-item)", () => {
  it("syncs selection and disabled state via live SelectGroupContext facade", async () => {
    const parent = new MiniappMachine(selectMachine, {
      multiple: true,
      defaultValue: ["a"],
    });
    parent.start();

    const groupContext = parent.service.refs.get("groupContext");

    const itemA = new MiniappMachine(selectItemMachine, {
      value: "a",
      groupContext,
      groupIndex: 0,
    });
    const itemB = new MiniappMachine(selectItemMachine, {
      value: "b",
      groupContext,
      groupIndex: 1,
    });
    itemA.start();
    itemB.start();

    expect(connectSelectItem(itemA.service).selected).toBe(true);
    expect(connectSelectItem(itemB.service).selected).toBe(false);

    // Selecting itemB updates parent and itemB state reactively
    connectSelectItem(itemB.service).select();
    await flush();
    expect(connectSelect(parent.service).value).toEqual(["a", "b"]);
    expect(connectSelectItem(itemB.service).selected).toBe(true);

    // Clicking itemA toggles it off
    connectSelectItem(itemA.service).select();
    await flush();
    expect(connectSelect(parent.service).value).toEqual(["b"]);
    expect(connectSelectItem(itemA.service).selected).toBe(false);

    // Parent disabled blocks item interaction
    parent.updateProps({ disabled: true });
    await flush();
    expect(connectSelectItem(itemA.service).disabled).toBe(true);
    connectSelectItem(itemA.service).select();
    await flush();
    expect(connectSelect(parent.service).value).toEqual(["b"]);

    itemA.stop();
    itemB.stop();
    parent.stop();
  });

  it("supports standalone and managed modes without double-firing", async () => {
    const onSelect = vi.fn();
    const selectGroup = vi.fn();
    const managedItem = new MiniappMachine(selectItemMachine, {
      value: "x",
      managed: true,
      selected: true,
      groupContext: {
        value: () => "x",
        multiple: () => false,
        disabled: () => false,
        isSelected: () => true,
        select: selectGroup,
      },
      onSelect,
    });
    managedItem.start();

    connectSelectItem(managedItem.service).select();
    await flush();
    expect(onSelect).toHaveBeenCalledWith({ value: "x" });
    expect(selectGroup).not.toHaveBeenCalled();

    managedItem.stop();
  });

  it("treats label and separator types as non-interactive", async () => {
    const onSelect = vi.fn();
    const labelItem = new MiniappMachine(selectItemMachine, {
      type: "label",
      value: "grp",
      onSelect,
    });
    labelItem.start();
    expect(connectSelectItem(labelItem.service).disabled).toBe(true);
    connectSelectItem(labelItem.service).select();
    await flush();
    expect(onSelect).not.toHaveBeenCalled();
    labelItem.stop();
  });
});
