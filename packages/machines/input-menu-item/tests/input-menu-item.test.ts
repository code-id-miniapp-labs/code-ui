import {
  connectInputMenu,
  inputMenuMachine,
  type InputMenuGroupContext,
} from "@code-id-labs/input-menu";
import { MiniappMachine } from "@code-id-labs/miniapp";
import { describe, expect, it, vi } from "vitest";
import { connectInputMenuItem, inputMenuItemMachine } from "../src";

const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("inputMenuItemMachine", () => {
  it("tracks parent selection and filter visibility through groupContext", async () => {
    const parent = new MiniappMachine(inputMenuMachine, {
      childItems: [
        { value: "alice", label: "Alice Wang" },
        { value: "bob", label: "Bob Chen" },
      ],
      defaultValue: "alice",
    });
    parent.start();

    const groupContext = parent.service.refs.get(
      "groupContext",
    ) as InputMenuGroupContext;

    const childAlice = new MiniappMachine(inputMenuItemMachine, {
      value: "alice",
      groupIndex: 0,
      groupContext,
    });
    const childBob = new MiniappMachine(inputMenuItemMachine, {
      value: "bob",
      groupIndex: 1,
      groupContext,
    });
    childAlice.start();
    childBob.start();

    expect(connectInputMenuItem(childAlice.service).selected).toBe(true);
    expect(connectInputMenuItem(childBob.service).selected).toBe(false);
    expect(connectInputMenuItem(childAlice.service).hidden).toBe(false);
    expect(connectInputMenuItem(childBob.service).hidden).toBe(false);

    // Filter parent by "bob"
    connectInputMenu(parent.service).handleInput("bob");
    await flush();
    expect(connectInputMenuItem(childAlice.service).hidden).toBe(true);
    expect(connectInputMenuItem(childBob.service).hidden).toBe(false);

    // Selecting bob via child machine updates parent value
    const onSelect = vi.fn();
    childBob.updateProps({ onSelect });
    connectInputMenuItem(childBob.service).select();
    await flush();
    await flush();

    expect(connectInputMenu(parent.service).value).toBe("bob");
    expect(connectInputMenuItem(childBob.service).selected).toBe(true);
    expect(onSelect).toHaveBeenCalledWith({ value: "bob" });

    childAlice.stop();
    childBob.stop();
    parent.stop();
  });
});
