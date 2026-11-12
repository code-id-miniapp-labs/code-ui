import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { actionSheetMachine } from "../src/action-sheet.machine";
import { connectActionSheet } from "../src/action-sheet.connect";
import type { ActionSheetAction, ActionSheetItem } from "../src/action-sheet.types";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe("ActionSheet Machine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Initialization & Default Props", () => {
    it("initializes in closed state by default", () => {
      const machine = new MiniappMachine(actionSheetMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("closed");
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isVisible")).toBe(false);

      const api = connectActionSheet(machine.service);
      expect(api.open).toBe(false);
      expect(api.visible).toBe(false);
      expect(api.state).toBe("closed");
      expect(api.duration).toBe(300);
      expect(api.items).toEqual([]);
      expect(api.actions).toEqual([]);

      machine.stop();
    });

    it("initializes in open state when defaultOpen is true", () => {
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

      const api = connectActionSheet(machine.service);
      expect(api.open).toBe(true);
      expect(api.visible).toBe(true);
      expect(api.state).toBe("open");

      machine.stop();
    });

    it("initializes in open state when controlled open is true", () => {
      const machine = new MiniappMachine(actionSheetMachine, { open: true });
      machine.start();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("isVisible")).toBe(true);

      machine.stop();
    });
  });

  describe("Open & Close Lifecycle", () => {
    it("opens via openActionSheet and closes via closeActionSheet", async () => {
      const onOpenChange = vi.fn();
      const onClose = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        onOpenChange,
        onClose,
        duration: 200,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.openActionSheet();
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(onOpenChange).toHaveBeenCalledWith({ open: true });

      api.closeActionSheet();
      await flush();
      expect(machine.state.get()).toBe("closing");
      expect(onOpenChange).toHaveBeenCalledWith({ open: false });
      expect(onClose).toHaveBeenCalled();

      // In closing, visible remains true
      const closingApi = connectActionSheet(machine.service);
      expect(closingApi.open).toBe(false);
      expect(closingApi.visible).toBe(true);

      // Advance timers for close animation
      vi.advanceTimersByTime(200);
      await flush();
      expect(machine.state.get()).toBe("closed");

      const closedApi = connectActionSheet(machine.service);
      expect(closedApi.visible).toBe(false);

      machine.stop();
    });

    it("supports setOpen(true) and setOpen(false)", async () => {
      const machine = new MiniappMachine(actionSheetMachine, {
        duration: 150,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.setOpen(true);
      await flush();
      expect(machine.state.get()).toBe("open");

      api.setOpen(false);
      await flush();
      expect(machine.state.get()).toBe("closing");

      vi.advanceTimersByTime(150);
      await flush();
      expect(machine.state.get()).toBe("closed");

      machine.stop();
    });

    it("ignores redundant setOpen calls", async () => {
      const onOpenChange = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        onOpenChange,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.setOpen(true);
      await flush();
      expect(onOpenChange).not.toHaveBeenCalled();

      machine.stop();
    });
  });

  describe("Controlled Open State", () => {
    it("syncs state when controlled open prop changes", async () => {
      const machine = new MiniappMachine(actionSheetMachine, {
        open: false,
        duration: 100,
      });
      machine.start();
      expect(machine.state.get()).toBe("closed");

      machine.updateProps({ open: true });
      await flush();
      expect(machine.state.get()).toBe("open");

      machine.updateProps({ open: false });
      await flush();
      expect(machine.state.get()).toBe("closing");

      vi.advanceTimersByTime(100);
      await flush();
      expect(machine.state.get()).toBe("closed");

      machine.stop();
    });
  });

  describe("Backdrop & Header Close Tap", () => {
    it("closes when backdrop is tapped and closeOnBackdropClick is true", async () => {
      const onOpenChange = vi.fn();
      const onClose = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        closeOnBackdropClick: true,
        onOpenChange,
        onClose,
      });
      machine.start();

      machine.send({ type: "BACKDROP.TAP" });
      await flush();
      expect(machine.state.get()).toBe("closing");
      expect(onOpenChange).toHaveBeenCalledWith({ open: false });
      expect(onClose).toHaveBeenCalled();

      machine.stop();
    });

    it("does not close when backdrop is tapped and closeOnBackdropClick is false", async () => {
      const onOpenChange = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        closeOnBackdropClick: false,
        onOpenChange,
      });
      machine.start();

      machine.send({ type: "BACKDROP.TAP" });
      await flush();
      expect(machine.state.get()).toBe("open");
      expect(onOpenChange).not.toHaveBeenCalled();

      machine.stop();
    });

    it("closes when header close trigger is tapped", async () => {
      const onClose = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        close: true,
        onClose,
      });
      machine.start();

      machine.send({ type: "CLOSE_TRIGGER.TAP" });
      await flush();
      expect(machine.state.get()).toBe("closing");
      expect(onClose).toHaveBeenCalled();

      machine.stop();
    });
  });

  describe("Menu Items Selection (items prop)", () => {
    const sampleItems: ActionSheetItem[] = [
      { label: "Save to Local Files", icon: "download" },
      { label: "Delete", destructive: true },
      { label: "Disabled Option", disabled: true },
      { label: "Loading Option", loading: true },
    ];

    it("selects item and closes when closeOnItem is true", async () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        items: sampleItems,
        closeOnItem: true,
        onSelect,
        onClose,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.select(1);
      await flush();

      expect(onSelect).toHaveBeenCalledWith({
        item: expect.objectContaining({ label: "Delete", destructive: true }),
        index: 1,
      });
      expect(onClose).toHaveBeenCalled();
      expect(machine.state.get()).toBe("closing");

      machine.stop();
    });

    it("selects item but stays open when closeOnItem is false", async () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        items: sampleItems,
        closeOnItem: false,
        onSelect,
        onClose,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.select(0);
      await flush();

      expect(onSelect).toHaveBeenCalledWith({
        item: expect.objectContaining({ label: "Save to Local Files" }),
        index: 0,
      });
      expect(onClose).not.toHaveBeenCalled();
      expect(machine.state.get()).toBe("open");

      machine.stop();
    });

    it("does not select disabled or loading items", async () => {
      const onSelect = vi.fn();
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        items: sampleItems,
        onSelect,
      });
      machine.start();

      const api = connectActionSheet(machine.service);

      // Select disabled item (index 2)
      api.select(2);
      await flush();
      expect(onSelect).not.toHaveBeenCalled();
      expect(machine.state.get()).toBe("open");

      // Select loading item (index 3)
      api.select(3);
      await flush();
      expect(onSelect).not.toHaveBeenCalled();
      expect(machine.state.get()).toBe("open");

      machine.stop();
    });
  });

  describe("Footer Actions Selection (actions prop)", () => {
    it("handles action click, triggers onClick, onAction and closes by default", async () => {
      const onClick = vi.fn();
      const onAction = vi.fn();
      const onClose = vi.fn();

      const sampleActions: ActionSheetAction[] = [
        { label: "Cancel", onClick, variant: "ghost", color: "neutral" },
      ];

      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        actions: sampleActions,
        onAction,
        onClose,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.handleAction(0);
      await flush();

      expect(onClick).toHaveBeenCalled();
      expect(onAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: expect.objectContaining({ label: "Cancel" }),
          index: 0,
        }),
      );
      expect(onClose).toHaveBeenCalled();
      expect(machine.state.get()).toBe("closing");

      machine.stop();
    });

    it("stays open when action has closeOnClick: false", async () => {
      const onClick = vi.fn();
      const onAction = vi.fn();
      const onClose = vi.fn();

      const sampleActions: ActionSheetAction[] = [
        { label: "Retry", onClick, closeOnClick: false },
      ];

      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        actions: sampleActions,
        onAction,
        onClose,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      api.handleAction(0);
      await flush();

      expect(onClick).toHaveBeenCalled();
      expect(onAction).toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(machine.state.get()).toBe("open");

      machine.stop();
    });

    it("returns result of async onClick for c-button autoLoading", () => {
      const asyncPromise = Promise.resolve();
      const onClick = vi.fn(() => asyncPromise);

      const sampleActions: ActionSheetAction[] = [
        { label: "Async Action", onClick },
      ];

      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        actions: sampleActions,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      const ret = api.handleAction(0);

      expect(onClick).toHaveBeenCalled();
      expect(ret).toBe(asyncPromise);

      machine.stop();
    });

    it("returns result of async onAction when onClick is not provided", () => {
      const asyncPromise = Promise.resolve();
      const onAction = vi.fn(() => asyncPromise);

      const sampleActions: ActionSheetAction[] = [
        { label: "Async Save", closeOnClick: false },
      ];

      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        actions: sampleActions,
        onAction,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      const ret = api.handleAction(0);

      expect(onAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: expect.objectContaining({ label: "Async Save" }),
          index: 0,
        }),
      );
      expect(ret).toBe(asyncPromise);

      machine.stop();
    });

    it("integrates with c-button component bridge for end-to-end autoLoading", async () => {
      vi.useRealTimers();

      const { buttonMachine, connectButton } = await import(
        "@code-ui/button"
      );

      const page: Record<string, any> = {
        async onFooterAction() {
          await sleep(50);
        },
      };
      (globalThis as any).getCurrentPages = () => [page];

      const cAppInstance = {
        selectOwnerComponent: () => null,
      };

      const actionSheetInstance: any = {
        selectOwnerComponent: () => cAppInstance,
        triggerEvent: vi.fn((name: string, detail: any) => {
          if (name === "action") {
            page.onFooterAction({ detail });
          }
        }),
      };

      const asMachine = new MiniappMachine(actionSheetMachine, {
        component: actionSheetInstance,
        actions: [
          { label: "Async Save", loadingAuto: true, closeOnClick: false },
        ],
      });
      asMachine.start();
      const asApi = connectActionSheet(asMachine.service);

      actionSheetInstance.handleActionTap = vi.fn((ev: any) => {
        const idx = ev?.currentTarget?.dataset?.index ?? 0;
        return asApi.handleAction(idx);
      });

      const buttonComponent = {
        selectOwnerComponent: () => actionSheetInstance,
        triggerEvent: vi.fn((name: string, detail: any) => {
          if (name === "tap") {
            actionSheetInstance.handleActionTap({
              currentTarget: { dataset: { index: 0 } },
              detail,
            });
          }
        }),
      };

      const btnMachine = new MiniappMachine(buttonMachine, {
        component: buttonComponent,
        loadingAuto: true,
      });

      const loadingSnapshots: boolean[] = [];
      btnMachine.subscribe((service) => {
        loadingSnapshots.push(connectButton(service as any).loading);
      });
      btnMachine.start();

      const btnApi = connectButton(btnMachine.service);
      btnApi.handleTap({});

      await sleep(10);
      expect(btnMachine.state.get()).toBe("loading");
      expect(btnMachine.computed("isLoading")).toBe(true);

      await sleep(60);
      expect(btnMachine.state.get()).not.toBe("loading");
      expect(btnMachine.computed("isLoading")).toBe(false);

      btnMachine.stop();
      asMachine.stop();
    });

    it("tracks action loading state during async execution via loadingActionIndex", async () => {
      vi.useRealTimers();

      let resolvePromise!: () => void;
      const asyncTask = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });

      const machine = new MiniappMachine(actionSheetMachine, {
        actions: [
          {
            label: "Save",
            onClick: () => asyncTask,
            closeOnClick: false,
          },
        ],
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      expect(api.actions[0]?.loading).toBe(false);

      const promise = api.handleAction(0);
      await Promise.resolve();
      const loadingApi = connectActionSheet(machine.service);
      expect(loadingApi.actions[0]?.loading).toBe(true);

      resolvePromise();
      await promise;
      await Promise.resolve();

      const settledApi = connectActionSheet(machine.service);
      expect(settledApi.actions[0]?.loading).toBe(false);

      machine.stop();
    });
  });

  describe("DOM & ARIA Props", () => {
    it("provides correct accessibility and state attributes", () => {
      const machine = new MiniappMachine(actionSheetMachine, {
        defaultOpen: true,
        close: true,
      });
      machine.start();

      const api = connectActionSheet(machine.service);
      expect(api.rootProps["data-state"]).toBe("open");
      expect(api.rootProps.hidden).toBe(false);

      expect(api.backdropProps["data-state"]).toBe("open");
      expect(api.backdropProps["aria-hidden"]).toBe(true);

      expect(api.contentProps["data-state"]).toBe("open");
      expect(api.contentProps["aria-role"]).toBe("dialog");
      expect(api.contentProps["aria-modal"]).toBe(true);
      expect(api.contentProps["aria-hidden"]).toBe(false);

      expect(api.closeTriggerProps["aria-role"]).toBe("button");
      expect(api.actionsProps).toHaveProperty("id");

      machine.stop();
    });
  });
});
