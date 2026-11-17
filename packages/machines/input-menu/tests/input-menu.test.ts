import { MiniappMachine } from "@code-ui/miniapp";
import { diffSnapshot } from "@code-ui/utils";
import { describe, expect, it, vi } from "vitest";
import {
  connectInputMenu,
  inputMenuMachine,
  type InputMenuProps,
} from "../src";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

function setupInputMenu(props: InputMenuProps = {}) {
  const machine = new MiniappMachine(inputMenuMachine, props);
  machine.start();
  return {
    machine,
    api: () => connectInputMenu(machine.service),
  };
}

describe("inputMenuMachine", () => {
  it("initializes closed with default value and displays selected label in single mode", () => {
    const { machine, api } = setupInputMenu({
      items: ["Backlog", "Todo", "In Progress", "Done"],
      defaultValue: "Todo",
    });

    const snap = api();
    expect(snap.state).toBe("closed");
    expect(snap.open).toBe(false);
    expect(snap.value).toBe("Todo");
    expect(snap.displayLabel).toBe("Todo");
    expect(snap.inputValue).toBe("Todo");
    expect(snap.items).toHaveLength(4);
    expect(snap.items.find((i) => i.value === "Todo")?.selected).toBe(true);

    machine.stop();
  });

  it("stays closed on focus/tap by default and opens on search input or toggle", async () => {
    const onFocus = vi.fn();
    const { machine, api } = setupInputMenu({
      items: ["Backlog", "Todo", "In Progress", "Done"],
      defaultValue: "Todo",
      onFocus,
    });

    api().handleFocus();
    await flush();
    expect(api().focused).toBe(true);
    expect(api().open).toBe(false);
    expect(onFocus).toHaveBeenCalledTimes(1);

    // Tapping trigger while already focused does not open or re-emit onFocus
    api().handleTriggerTap();
    await flush();
    expect(api().open).toBe(false);
    expect(onFocus).toHaveBeenCalledTimes(1);

    // Searching opens the floating menu and filters items
    api().handleInput("back");
    await flush();
    expect(api().open).toBe(true);
    expect(api().items).toHaveLength(1);
    expect(api().items[0]?.label).toBe("Backlog");

    // Toggle closes and reopens explicitly
    api().toggle();
    await flush();
    expect(api().open).toBe(false);

    machine.stop();
  });

  it("opens on focus when openOnFocus is true, keeps filtered items stable during closing animation, and resets after closed", async () => {
    vi.useFakeTimers();
    const { machine, api } = setupInputMenu({
      items: ["Backlog", "Todo", "In Progress", "Done"],
      defaultValue: "Todo",
      openOnFocus: true,
      duration: 150,
    });

    try {
      api().handleFocus();
      await flush();
      expect(api().open).toBe(true);
      expect(api().focused).toBe(true);
      expect(api().inputValue).toBe("Todo");
      expect(api().items).toHaveLength(4);

      api().handleInput("back");
      await flush();
      expect(api().inputValue).toBe("back");
      expect(api().items).toHaveLength(1);
      expect(api().items[0]?.label).toBe("Backlog");

      // Selecting "Backlog" transitions to "closing":
      // - inputValue immediately displays "Backlog"
      // - focused becomes false so native <input> does not re-focus
      // - items remain filtered (1 item) while fading out so full list never flashes
      api().selectValue("Backlog");
      await flush();
      expect(api().state).toBe("closing");
      expect(api().open).toBe(false);
      expect(api().visible).toBe(true);
      expect(api().focused).toBe(false);
      expect(api().value).toBe("Backlog");
      expect(api().inputValue).toBe("Backlog");
      expect(api().items).toHaveLength(1);

      // Once close animation finishes, searchTerm resets while hidden
      vi.advanceTimersByTime(200);
      await flush();
      expect(api().state).toBe("closed");
      expect(api().visible).toBe(false);
      expect(api().searchTerm).toBe("");
      expect(api().inputValue).toBe("Backlog");
      expect(api().items).toHaveLength(4);
    } finally {
      machine.stop();
      vi.useRealTimers();
    }
  });

  it("filters grouped items and prunes empty group labels and separators", async () => {
    const { machine, api } = setupInputMenu({
      items: [
        [
          { type: "label", label: "Fruits" },
          { label: "Apple", value: "apple" },
          { label: "Banana", value: "banana" },
        ],
        [
          { type: "label", label: "Vegetables" },
          { label: "Carrot", value: "carrot" },
        ],
      ],
    });

    expect(api().items.map((i) => `${i.type}:${i.label}`)).toEqual([
      "label:Fruits",
      "item:Apple",
      "item:Banana",
      "separator:",
      "label:Vegetables",
      "item:Carrot",
    ]);

    api().handleInput("carr");
    await flush();
    expect(api().items.map((i) => `${i.type}:${i.label}`)).toEqual([
      "label:Vegetables",
      "item:Carrot",
    ]);

    machine.stop();
  });

  it("supports multiple selection with removable tags", async () => {
    const onChange = vi.fn();
    const { machine, api } = setupInputMenu({
      multiple: true,
      items: [
        { label: "Apple", value: "apple" },
        { label: "Banana", value: "banana" },
        { label: "Cherry", value: "cherry" },
      ],
      defaultValue: ["apple"],
      onChange,
    });

    expect(api().tags).toHaveLength(1);
    expect(api().tags[0]?.label).toBe("Apple");

    api().handleInput("ban");
    await flush();
    expect(api().items).toHaveLength(1);

    api().selectValue("banana");
    await flush();
    expect(api().value).toEqual(["apple", "banana"]);
    expect(api().tags.map((t) => t.label)).toEqual(["Apple", "Banana"]);
    expect(api().searchTerm).toBe("");
    expect(onChange).toHaveBeenCalledTimes(1);

    api().removeTag("apple");
    await flush();
    expect(api().value).toEqual(["banana"]);
    expect(api().tags.map((t) => t.label)).toEqual(["Banana"]);

    machine.stop();
  });

  it("supports createItem when empty or always, and suppresses on exact match", async () => {
    const onCreate = vi.fn();
    const { machine, api } = setupInputMenu({
      items: ["Backlog", "Todo"],
      createItem: { position: "top", when: "always" },
      onCreate,
    });

    expect(api().showCreateItem).toBe(false);
    expect(api().createItemPosition).toBe("top");

    // Exact match (case-insensitive) suppresses createItem
    api().handleInput("todo");
    await flush();
    expect(api().showCreateItem).toBe(false);

    // Partial match with when: "always" shows createItem
    api().handleInput("tod");
    await flush();
    expect(api().showCreateItem).toBe(true);

    // Non-matching query shows createItem and triggers onCreate
    api().handleInput("Urgent");
    await flush();
    expect(api().showCreateItem).toBe(true);
    api().createItem();
    await flush();
    expect(onCreate).toHaveBeenCalledWith({ value: "Urgent" });
    expect(api().state).toBe("closing");

    machine.stop();
  });

  it("re-focuses the input after selecting or creating in multiple mode so the user can keep typing", async () => {
    const onCreate = vi.fn();
    const { machine, api } = setupInputMenu({
      multiple: true,
      items: ["Bug", "Feature"],
      createItem: { position: "top", when: "always" },
      onCreate,
    });

    api().handleFocus();
    api().handleInput("Urgent");
    await flush();
    expect(api().open).toBe(true);

    // Tapping the create option natively blurs the <input> first
    api().handleBlur();
    await flush();
    expect(api().focused).toBe(false);

    api().createItem();
    await flush();
    expect(onCreate).toHaveBeenCalledWith({ value: "Urgent" });
    expect(api().state).toBe("open");
    expect(api().focused).toBe(true);

    // Same for picking an existing option
    api().handleInput("bu");
    await flush();
    api().handleBlur();
    await flush();
    api().selectValue("Bug");
    await flush();
    expect(api().value).toEqual(["Bug"]);
    expect(api().state).toBe("open");
    expect(api().focused).toBe(true);

    machine.stop();
  });

  it("syncs controlled props (open, value, searchTerm)", async () => {
    const { machine, api } = setupInputMenu({
      items: ["A", "B", "C"],
      value: "A",
      open: false,
    });

    machine.updateProps({ open: true, value: "B", searchTerm: "C" });
    await flush();

    expect(api().open).toBe(true);
    expect(api().value).toBe("B");
    expect(api().searchTerm).toBe("C");
    expect(api().items.map((i) => i.label)).toEqual(["C"]);

    machine.stop();
  });

  it("emits a null delta for a no-op event", async () => {
    const { machine, api } = setupInputMenu({
      items: ["A", "B"],
      defaultValue: "A",
    });

    const before = api();
    machine.send({ type: "SET_VALUE", value: "A" });
    await flush();
    const after = api();
    expect(diffSnapshot(before, after, "inputMenu")).toBeNull();

    machine.stop();
  });

  it("clears close animation timer on stop()", async () => {
    vi.useFakeTimers();
    const { machine, api } = setupInputMenu({
      items: ["A", "B"],
      defaultOpen: true,
      duration: 200,
    });
    try {
      api().closeInputMenu();
      await flush();
      expect(api().state).toBe("closing");
      expect(vi.getTimerCount()).toBe(1);
      machine.stop();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      machine.stop();
      vi.useRealTimers();
    }
  });
});
