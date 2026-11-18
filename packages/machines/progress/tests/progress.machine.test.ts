import { describe, it, expect, vi } from "vitest";
import { MiniappMachine } from "@code-id-labs/miniapp";
import { progressMachine } from "../src/progress.machine";
import { connectProgress } from "../src/progress.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("Progress Machine", () => {
  describe("Initialization & Default Props", () => {
    it("initializes in indeterminate mode when value is null or omitted", () => {
      const machine = new MiniappMachine(progressMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("idle");

      const api = connectProgress(machine.service);
      expect(api.state).toBe("idle");
      expect(api.value).toBeNull();
      expect(api.isIndeterminate).toBe(true);
      expect(api.percent).toBe(-1);
      expect(api.isComplete).toBe(false);
      expect(api.valueAsString).toBe("");
      expect(api.min).toBe(0);
      expect(api.max).toBe(100);

      expect(api.rootProps["aria-valuenow"]).toBeUndefined();
      expect(api.rootProps["data-state"]).toBe("indeterminate");

      machine.stop();
    });

    it("initializes in determinate mode when numeric value is provided", () => {
      const machine = new MiniappMachine(progressMachine, {
        value: 40,
        min: 0,
        max: 100,
      });
      machine.start();

      const api = connectProgress(machine.service);
      expect(api.value).toBe(40);
      expect(api.isIndeterminate).toBe(false);
      expect(api.percent).toBe(40);
      expect(api.isComplete).toBe(false);
      expect(api.valueAsString).toBe("40%");
      expect(api.rootProps["aria-valuenow"]).toBe(40);
      expect(api.rootProps["data-state"]).toBe("loading");

      machine.stop();
    });

    it("clamps percentage and marks isComplete when value reaches or exceeds max", () => {
      const machine = new MiniappMachine(progressMachine, {
        value: 120,
        max: 100,
      });
      machine.start();

      const api = connectProgress(machine.service);
      expect(api.percent).toBe(100);
      expect(api.isComplete).toBe(true);
      expect(api.rootProps["data-state"]).toBe("complete");

      machine.stop();
    });

    it("calculates percentage correctly with custom min and max", () => {
      const machine = new MiniappMachine(progressMachine, {
        value: 150,
        min: 100,
        max: 200,
      });
      machine.start();

      const api = connectProgress(machine.service);
      expect(api.percent).toBe(50);
      expect(api.valueAsString).toBe("50%");

      machine.stop();
    });
  });

  describe("API Methods & Event Handling", () => {
    it("updates value and invokes onValueChange via setValue", async () => {
      const onValueChange = vi.fn();
      const machine = new MiniappMachine(progressMachine, {
        defaultValue: 20,
        onValueChange,
      });
      machine.start();

      const api = connectProgress(machine.service);
      api.setValue(70);
      await flush();

      const nextApi = connectProgress(machine.service);
      expect(nextApi.value).toBe(70);
      expect(nextApi.percent).toBe(70);
      expect(onValueChange).toHaveBeenCalledWith({ value: 70, percent: 70 });

      machine.stop();
    });

    it("jumps to min and max via setToMin and setToMax", async () => {
      const machine = new MiniappMachine(progressMachine, {
        defaultValue: 30,
        min: 10,
        max: 80,
      });
      machine.start();

      let api = connectProgress(machine.service);

      api.setToMax();
      await flush();
      api = connectProgress(machine.service);
      expect(api.value).toBe(80);
      expect(api.percent).toBe(100);
      expect(api.isComplete).toBe(true);

      api.setToMin();
      await flush();
      api = connectProgress(machine.service);
      expect(api.value).toBe(10);
      expect(api.percent).toBe(0);

      machine.stop();
    });

    it("resets value back to defaultValue via reset", async () => {
      const machine = new MiniappMachine(progressMachine, {
        defaultValue: 15,
      });
      machine.start();

      let api = connectProgress(machine.service);
      api.setValue(90);
      await flush();
      api = connectProgress(machine.service);
      expect(api.value).toBe(90);

      api.reset();
      await flush();
      api = connectProgress(machine.service);
      expect(api.value).toBe(15);
      expect(api.percent).toBe(15);

      machine.stop();
    });

    it("syncs lazily when controlled props are updated via updateProps", async () => {
      const machine = new MiniappMachine(progressMachine, {
        value: 10,
      });
      machine.start();

      const api1 = connectProgress(machine.service);
      expect(api1.value).toBe(10);

      machine.updateProps({ value: 85 });
      await flush();

      const api2 = connectProgress(machine.service);
      expect(api2.value).toBe(85);
      expect(api2.percent).toBe(85);

      machine.stop();
    });

    it("toggles indeterminate mode dynamically when controlled value switches between number and null", async () => {
      const machine = new MiniappMachine(progressMachine, {
        value: 60,
      });
      machine.start();

      let api = connectProgress(machine.service);
      expect(api.value).toBe(60);
      expect(api.isIndeterminate).toBe(false);

      machine.updateProps({ value: null });
      await flush();

      api = connectProgress(machine.service);
      expect(api.value).toBeNull();
      expect(api.isIndeterminate).toBe(true);

      machine.updateProps({ value: 75 });
      await flush();

      api = connectProgress(machine.service);
      expect(api.value).toBe(75);
      expect(api.isIndeterminate).toBe(false);

      machine.stop();
    });
  });

  describe("Custom Translations & Accessibility", () => {
    it("formats custom value string via translations.value", () => {
      const machine = new MiniappMachine(progressMachine, {
        value: 3,
        max: 10,
        translations: {
          value: ({ value, max }) => `Step ${value} of ${max}`,
        },
      });
      machine.start();

      const api = connectProgress(machine.service);
      expect(api.valueAsString).toBe("Step 3 of 10");
      expect(api.rootProps["aria-valuetext"]).toBe("Step 3 of 10");

      machine.stop();
    });

    it("generates compact functional IDs and supports custom scope.ids overrides", () => {
      const machine = new MiniappMachine(progressMachine, {
        id: "p1",
        ids: { track: "custom-track" },
        value: 50,
      });
      machine.start();

      const api = connectProgress(machine.service);
      expect(api.rootProps.id).toBe("pg-p1-r");
      expect(api.labelProps.id).toBe("pg-p1-l");
      expect(api.trackProps.id).toBe("custom-track");
      expect(api.rangeProps.id).toBeUndefined();

      machine.stop();
    });
  });
});
