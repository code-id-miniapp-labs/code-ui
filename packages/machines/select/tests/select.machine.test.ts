import { MiniappMachine } from "@code-ui/miniapp";
import { diffSnapshot } from "@code-ui/utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { connectSelect, selectMachine } from "../src";

const flush = () =>
  new Promise<void>((resolve) => queueMicrotask(() => queueMicrotask(resolve)));

describe("selectMachine (@code-ui/select)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("handles uncontrolled single selection in default dropdown mode", async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const machine = new MiniappMachine(selectMachine, {
      id: "sel-1",
      defaultValue: "apple",
      items: ["apple", "banana", "cherry"],
      duration: 150,
      onChange,
      onSelect,
    });
    machine.start();

    let api = connectSelect(machine.service);
    expect(api.value).toBe("apple");
    expect(api.displayLabel).toBe("apple");
    expect(api.hasValue).toBe(true);
    expect(api.open).toBe(false);

    api.openSelect();
    await flush();
    api = connectSelect(machine.service);
    expect(api.open).toBe(true);
    expect(api.items.find((entry) => entry.value === "apple")?.selected).toBe(true);
    expect(api.activeItemDomId).toBe(api.items[0]?.domId);

    api.selectValue("banana");
    await flush();
    api = connectSelect(machine.service);
    expect(api.value).toBe("banana");
    expect(api.displayLabel).toBe("banana");
    expect(api.state).toBe("closing");
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ value: "banana", selected: true }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: "banana" }),
    );

    vi.advanceTimersByTime(150);
    await flush();
    expect(connectSelect(machine.service).state).toBe("closed");
    machine.stop();
  });

  it("supports multiple selection, grouped items, valueKey/labelKey, and clearable", async () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const machine = new MiniappMachine(selectMachine, {
      multiple: true,
      clearable: true,
      valueKey: "id",
      labelKey: "name",
      items: [
        [
          { type: "label", name: "Fruits" },
          { id: 1, name: "Apple" },
          { id: 2, name: "Banana", disabled: true },
        ],
        [
          { type: "label", name: "Veggies" },
          { id: 3, name: "Carrot" },
        ],
      ],
      onChange,
      onClear,
    });
    machine.start();

    let api = connectSelect(machine.service);
    expect(api.items.some((entry) => entry.type === "separator")).toBe(true);
    expect(
      api.items.some((entry) => entry.type === "label" && entry.label === "Fruits"),
    ).toBe(true);

    api.openSelect();
    await flush();
    api.selectValue(1);
    await flush();
    api = connectSelect(machine.service);
    expect(api.open).toBe(true);
    expect(api.value).toEqual([1]);
    expect(api.displayLabel).toBe("Apple");

    // Disabled item cannot be selected
    api.selectValue(2);
    await flush();
    expect(connectSelect(machine.service).value).toEqual([1]);

    // Select second item
    api.selectValue(3);
    await flush();
    api = connectSelect(machine.service);
    expect(api.value).toEqual([1, 3]);
    expect(api.displayLabel).toBe("Apple, Carrot");

    // Toggle first item off
    api.selectValue(1);
    await flush();
    expect(connectSelect(machine.service).value).toEqual([3]);

    // Clear value
    api.clearValue();
    await flush();
    api = connectSelect(machine.service);
    expect(api.value).toEqual([]);
    expect(api.hasValue).toBe(false);
    expect(onClear).toHaveBeenCalledTimes(1);
    machine.stop();
  });

  it("supports picker mode with draft pendingIndices, confirm, cancel, and multi-column", async () => {
    vi.useFakeTimers();
    const onChange = vi.fn();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const onColumnChange = vi.fn();

    const machine = new MiniappMachine(selectMachine, {
      mode: "picker",
      defaultValue: ["2025", "feb"],
      items: [
        [
          { label: "2025", value: "2025" },
          { label: "2026", value: "2026" },
        ],
        [
          { label: "Jan", value: "jan" },
          { label: "Feb", value: "feb" },
          { label: "Mar", value: "mar", disabled: true },
        ],
      ],
      duration: 200,
      onChange,
      onConfirm,
      onCancel,
      onColumnChange,
    });
    machine.start();

    let api = connectSelect(machine.service);
    expect(api.displayLabel).toBe("2025, Feb");

    api.openSelect();
    await flush();
    api = connectSelect(machine.service);
    expect(api.open).toBe(true);
    expect(api.pickerIndices).toEqual([0, 1]);

    // Change column 0 to 2026; column 1 tries index 2 (disabled) -> snaps back to enabled
    api.handlePickerChange([1, 2]);
    await flush();
    api = connectSelect(machine.service);
    expect(api.pickerIndices).toEqual([1, 1]);
    expect(onColumnChange).toHaveBeenCalledWith(
      expect.objectContaining({
        column: 0,
        index: 1,
        value: "2026",
        values: ["2026", "feb"],
      }),
    );
    expect(api.value).toEqual(["2025", "feb"]);
    expect(onChange).not.toHaveBeenCalled();

    // Cancel discards draft
    api.cancelPicker("cancel");
    await flush();
    api = connectSelect(machine.service);
    expect(api.state).toBe("closing");
    expect(api.value).toEqual(["2025", "feb"]);
    expect(onCancel).toHaveBeenCalledWith({ trigger: "cancel" });
    vi.advanceTimersByTime(200);
    await flush();

    // Reopen, change, and confirm
    api.openSelect();
    await flush();
    api.handlePickerChange([1, 0]);
    await flush();
    api.confirmPicker();
    await flush();
    api = connectSelect(machine.service);
    expect(api.state).toBe("closing");
    expect(api.value).toEqual(["2026", "jan"]);
    expect(api.displayLabel).toBe("2026, Jan");
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        value: ["2026", "jan"],
        label: ["2026", "Jan"],
        index: [1, 0],
      }),
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: ["2026", "jan"] }),
    );
    machine.stop();
  });

  it("commits scalar value for single-column picker mode", async () => {
    const onConfirm = vi.fn();
    const machine = new MiniappMachine(selectMachine, {
      mode: "picker",
      items: [
        { label: "Beijing", value: "bj" },
        { label: "Shanghai", value: "sh" },
      ],
      onConfirm,
    });
    machine.start();

    const api = connectSelect(machine.service);
    api.openSelect();
    await flush();
    api.handlePickerChange([1]);
    await flush();
    api.confirmPicker();
    await flush();

    const after = connectSelect(machine.service);
    expect(after.value).toBe("sh");
    expect(after.displayLabel).toBe("Shanghai");
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        value: "sh",
        label: "Shanghai",
        index: [1],
      }),
    );
    machine.stop();
  });

  it("supports selectValue while closed and emits onChange without opening", async () => {
    const onChange = vi.fn();
    const machine = new MiniappMachine(selectMachine, {
      items: [
        { label: "Beijing", value: "bj" },
        { label: "Shanghai", value: "sh" },
      ],
      onChange,
    });
    machine.start();

    connectSelect(machine.service).selectValue("sh");
    await flush();

    const api = connectSelect(machine.service);
    expect(api.state).toBe("closed");
    expect(api.value).toBe("sh");
    expect(api.displayLabel).toBe("Shanghai");
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ value: "sh" }),
    );
    machine.stop();
  });

  it("emits onCancel with trigger backdrop when picker backdrop is tapped", async () => {
    const onCancel = vi.fn();
    const machine = new MiniappMachine(selectMachine, {
      mode: "picker",
      items: ["bj", "sh"],
      onCancel,
    });
    machine.start();

    connectSelect(machine.service).openSelect();
    await flush();
    expect(machine.state.get()).toBe("open");

    machine.send({ type: "BACKDROP.TAP" });
    await flush();

    expect(machine.state.get()).toBe("closing");
    expect(onCancel).toHaveBeenCalledWith({ trigger: "backdrop" });
    machine.stop();
  });

  it("syncs controlled value and open props", async () => {
    vi.useFakeTimers();
    const machine = new MiniappMachine(selectMachine, {
      value: "a",
      open: false,
      items: ["a", "b"],
      duration: 100,
    });
    machine.start();

    expect(connectSelect(machine.service).value).toBe("a");
    expect(machine.state.get()).toBe("closed");

    machine.updateProps({ value: "b", open: true });
    await flush();
    expect(connectSelect(machine.service).value).toBe("b");
    expect(machine.state.get()).toBe("open");

    machine.updateProps({ open: false });
    await flush();
    expect(machine.state.get()).toBe("closing");
    vi.advanceTimersByTime(100);
    await flush();
    expect(machine.state.get()).toBe("closed");
    machine.stop();
  });

  it("integrates with FormHostContext validation and reset", async () => {
    const mockHost = {
      disabled: () => false,
      readOnly: () => false,
      errors: () => ["Required"],
      fieldState: () => ({ disabled: false }),
      register: vi.fn(() => vi.fn()),
      notify: vi.fn(),
    };

    const machine = new MiniappMachine(selectMachine, {
      name: "city",
      defaultValue: "bj",
      items: ["bj", "sh"],
      formContext: mockHost as any,
    });
    machine.start();
    await flush();

    expect(mockHost.register).toHaveBeenCalled();
    expect(connectSelect(machine.service).invalid).toBe(true);

    connectSelect(machine.service).selectValue("sh");
    await flush();
    expect(mockHost.notify).toHaveBeenCalledWith(
      "change",
      expect.objectContaining({ name: "city", value: "sh" }),
    );

    connectSelect(machine.service).resetValue();
    await flush();
    expect(connectSelect(machine.service).value).toBe("bj");

    machine.stop();
  });

  it("produces null diffSnapshot on no-op events and cleans up timers on stop()", async () => {
    vi.useFakeTimers();
    const machine = new MiniappMachine(selectMachine, {
      items: ["a", "b"],
      duration: 150,
    });
    machine.start();

    const before = connectSelect(machine.service);
    machine.send({ type: "CLOSE" });
    await flush();
    const after = connectSelect(machine.service);
    expect(diffSnapshot(before, after, "select")).toBeNull();

    machine.send({ type: "OPEN" });
    await flush();
    machine.send({ type: "CLOSE" });
    await flush();
    expect(vi.getTimerCount()).toBe(1);
    machine.stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
