import { describe, it, expect, vi } from "vitest";
import { signal, effect } from "alien-signals";
import { batch } from "../src/batch";
import { MiniappMachine } from "../src/machine";
import { connectToComponent } from "../src/connect";
import { createMachine, bindable } from "@code-ui/core";
import { setupComputed } from "../src/behaviors/computed-behavior";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Batching & SetData Optimization", () => {
  it("batches multiple signal mutations so an effect runs only once", () => {
    const a = signal(0);
    const b = signal(0);
    const c = signal(0);

    let effectRuns = 0;
    effect(() => {
      // Read all 3 signals
      a();
      b();
      c();
      effectRuns++;
    });

    expect(effectRuns).toBe(1); // Initial run

    // Without batch: 3 writes = 3 effect runs
    a(1);
    b(1);
    c(1);
    expect(effectRuns).toBe(4);

    // With batch: 3 writes = only 1 additional effect run!
    batch(() => {
      a(2);
      b(2);
      c(2);
    });

    expect(effectRuns).toBe(5); // Only incremented by 1!
  });

  it("MiniappMachine batches transition state and action context changes into a single notification", async () => {
    const testMachine = createMachine({
      initialState: () => "idle",
      context: ({ bindable }) => ({
        count: bindable<number>(() => ({ defaultValue: 0 })),
        label: bindable<string>(() => ({ defaultValue: "initial" })),
        active: bindable<boolean>(() => ({ defaultValue: false })),
      }),
      states: {
        idle: {
          on: {
            TRIGGER: {
              target: "active",
              actions: ["updateContextValues"],
            },
          },
        },
        active: {},
      },
      implementations: {
        actions: {
          updateContextValues: ({ context }) => {
            // Mutate 3 separate bindables in one transition action
            context.set("count", 42);
            context.set("label", "updated");
            context.set("active", true);
          },
        },
      },
    });

    const machine = new MiniappMachine(testMachine);
    machine.start();

    let effectRuns = 0;
    effect(() => {
      // Read state and context values
      machine.state.get();
      machine.context.get("count");
      machine.context.get("label");
      machine.context.get("active");
      effectRuns++;
    });

    expect(effectRuns).toBe(1); // Initial run

    // Send transition event
    machine.send({ type: "TRIGGER" });
    await flush();

    // Despite state changing + 3 context signals updating, the batching ensures only 1 notification!
    expect(effectRuns).toBe(2);
    expect(machine.state.get()).toBe("active");
    expect(machine.context.get("count")).toBe(42);
    expect(machine.context.get("label")).toBe("updated");
    expect(machine.context.get("active")).toBe(true);

    machine.stop();
  });

  it("coalesces multiple reactive signal updates into a single setData call", async () => {
    const count = signal(0);
    const multiplier = signal(2);

    const setDataMock = vi.fn();
    const fakeComponent = {
      data: {} as Record<string, any>,
      setData: setDataMock,
    };

    setupComputed(fakeComponent, {
      doubled() {
        return count() * 2;
      },
      product() {
        return count() * multiplier();
      },
    });

    // Initial mount flush calls setData once to populate initial computed values
    expect(setDataMock).toHaveBeenCalledTimes(1);
    expect(setDataMock).toHaveBeenLastCalledWith(
      {
        doubled: 0,
        product: 0,
      },
      undefined
    );
    setDataMock.mockClear();

    // Multiple reactive signals change in the same tick
    count(5);
    multiplier(10);

    // Microtask coalescing prevents synchronous thrashing
    expect(setDataMock).toHaveBeenCalledTimes(0);

    // Allow microtask queue to flush
    await flush();

    // Exactly 1 coalesced setData call with both computed updates!
    expect(setDataMock).toHaveBeenCalledTimes(1);
    expect(setDataMock).toHaveBeenLastCalledWith(
      {
        doubled: 10,
        product: 50,
      },
      undefined
    );
  });
});
