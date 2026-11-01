import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MiniappMachine } from "@code-ui/miniapp";
import { swipeCellMachine } from "../src/swipe-cell.machine";
import { connectSwipeCell } from "../src/swipe-cell.connect";

function flush(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

describe("SwipeCell Machine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Initialization & Default Props", () => {
    it("initializes in closed state by default", () => {
      const machine = new MiniappMachine(swipeCellMachine, {});
      machine.start();

      expect(machine.state.get()).toBe("closed");
      expect(machine.computed("isOpen")).toBe(false);
      expect(machine.computed("isClosed")).toBe(true);
      expect(machine.computed("isDragging")).toBe(false);
      expect(machine.computed("openedSide")).toBe(null);
      expect(machine.computed("offset")).toBe(0);

      const api = connectSwipeCell(machine.service);
      expect(api.open).toBe(false);
      expect(api.state).toBe("closed");
      expect(api.openedSide).toBe(null);
      expect(api.offset).toBe(0);
      expect(api.duration).toBe(300);
      expect(api.threshold).toBe(30);
      expect(api.variant).toBe("plain");
      expect(api.size).toBe("md");
      expect(api.contentStyle).toBe("");

      machine.stop();
    });

    it("respects custom variant and size props", () => {
      const machine = new MiniappMachine(swipeCellMachine, {
        variant: "separated",
        size: "sm",
      });
      machine.start();

      const api = connectSwipeCell(machine.service);
      expect(api.variant).toBe("separated");
      expect(api.size).toBe("sm");

      machine.stop();
    });

    it("initializes in open state when defaultOpened is true", () => {
      const machine = new MiniappMachine(swipeCellMachine, {
        defaultOpened: true,
        rightWidth: 100,
      });
      machine.start();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("openedSide")).toBe("right");
      expect(machine.computed("offset")).toBe(-100);

      const api = connectSwipeCell(machine.service);
      expect(api.open).toBe(true);
      expect(api.state).toBe("open");
      expect(api.openedSide).toBe("right");
      expect(api.offset).toBe(-100);
      expect(api.contentStyle).toBe("transform: translate3d(-100px, 0, 0);");

      machine.stop();
    });

    it("initializes in open state when defaultOpened is 'left'", () => {
      const machine = new MiniappMachine(swipeCellMachine, {
        defaultOpened: "left",
        leftWidth: 80,
      });
      machine.start();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("isOpen")).toBe(true);
      expect(machine.computed("openedSide")).toBe("left");
      expect(machine.computed("offset")).toBe(80);

      const api = connectSwipeCell(machine.service);
      expect(api.offset).toBe(80);
      expect(api.contentStyle).toBe("transform: translate3d(80px, 0, 0);");

      machine.stop();
    });

    it("precomputes leftActions and rightActions snapshots", () => {
      const leftActionClick = vi.fn();
      const machine = new MiniappMachine(swipeCellMachine, {
        left: [
          {
            value: "star",
            text: "Star",
            icon: "star",
            color: "warning",
            onClick: leftActionClick,
          },
        ],
        right: [
          { value: "delete", text: "Delete", color: "danger" },
          { value: "archive", text: "Archive", color: "neutral" },
        ],
      });
      machine.start();

      const api = connectSwipeCell(machine.service);
      expect(api.hasLeftActions).toBe(true);
      expect(api.hasRightActions).toBe(true);
      expect(api.leftActions).toHaveLength(1);
      expect(api.leftActions[0]).toEqual({
        index: 0,
        side: "left",
        value: "star",
        text: "Star",
        icon: "star",
        color: "warning",
        className: undefined,
        style: undefined,
        disabled: undefined,
        raw: expect.any(Object),
      });

      expect(api.rightActions).toHaveLength(2);
      expect(api.rightActions[0]?.value).toBe("delete");
      expect(api.rightActions[0]?.text).toBe("Delete");
      expect(api.rightActions[1]?.value).toBe("archive");
      expect(api.rightActions[1]?.text).toBe("Archive");

      machine.stop();
    });
  });

  describe("Programmatic API & State Transitions", () => {
    it("opens, closes, and toggles cell via api", async () => {
      const onOpen = vi.fn();
      const onClose = vi.fn();
      const onOpenChange = vi.fn();

      const machine = new MiniappMachine(swipeCellMachine, {
        rightWidth: 120,
        leftWidth: 100,
        onOpen,
        onClose,
        onOpenChange,
      });
      machine.start();

      let api = connectSwipeCell(machine.service);
      api.openCell("right");
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(onOpen).toHaveBeenCalledWith({ side: "right" });
      expect(onOpenChange).toHaveBeenCalledWith({
        opened: true,
        side: "right",
      });

      api = connectSwipeCell(machine.service);
      expect(api.open).toBe(true);
      expect(api.openedSide).toBe("right");
      expect(api.offset).toBe(-120);

      // Close
      api.closeCell();
      await flush();
      expect(machine.state.get()).toBe("closed");
      expect(onClose).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith({
        opened: false,
        side: null,
      });

      // Toggle to open left
      api = connectSwipeCell(machine.service);
      api.toggleCell("left");
      await flush();
      expect(machine.state.get()).toBe("open");
      expect(machine.computed("openedSide")).toBe("left");
      expect(machine.computed("offset")).toBe(100);

      // Toggle to close
      api = connectSwipeCell(machine.service);
      api.toggleCell();
      await flush();
      expect(machine.state.get()).toBe("closed");

      machine.stop();
    });

    it("handles dynamic width updates via SET_WIDTHS", async () => {
      const machine = new MiniappMachine(swipeCellMachine, {
        defaultOpened: "right",
      });
      machine.start();

      machine.send({
        type: "SET_WIDTHS",
        leftWidth: 90,
        rightWidth: 150,
      });
      await flush();

      const api = connectSwipeCell(machine.service);
      expect(api.leftWidth).toBe(90);
      expect(api.rightWidth).toBe(150);
      expect(api.offset).toBe(-150);

      machine.stop();
    });
  });

  describe("Gestures & Dragging", () => {
    it("handles drag sequence ending in opened state", async () => {
      const onOpen = vi.fn();
      const onOpenChange = vi.fn();

      const machine = new MiniappMachine(swipeCellMachine, {
        rightWidth: 100,
        onOpen,
        onOpenChange,
      });
      machine.start();

      machine.send({ type: "DRAG_START" });
      await flush();
      expect(machine.state.get()).toBe("dragging");
      expect(machine.computed("isDragging")).toBe(true);

      machine.send({ type: "DRAG_MOVE", offset: -50 });
      await flush();
      expect(machine.computed("offset")).toBe(-50);

      machine.send({
        type: "DRAG_END",
        opened: true,
        side: "right",
        offset: -100,
      });
      await flush();

      expect(machine.state.get()).toBe("open");
      expect(machine.computed("openedSide")).toBe("right");
      expect(machine.computed("offset")).toBe(-100);
      expect(onOpen).toHaveBeenCalledWith({ side: "right" });
      expect(onOpenChange).toHaveBeenCalledWith({
        opened: true,
        side: "right",
      });

      machine.stop();
    });

    it("handles drag sequence ending in closed state", async () => {
      const onClose = vi.fn();
      const onOpenChange = vi.fn();

      const machine = new MiniappMachine(swipeCellMachine, {
        defaultOpened: "right",
        rightWidth: 100,
        onClose,
        onOpenChange,
      });
      machine.start();

      machine.send({ type: "DRAG_START" });
      await flush();
      expect(machine.state.get()).toBe("dragging");

      machine.send({
        type: "DRAG_END",
        opened: false,
        side: null,
        offset: 0,
      });
      await flush();

      expect(machine.state.get()).toBe("closed");
      expect(machine.computed("offset")).toBe(0);
      expect(onClose).toHaveBeenCalled();
      expect(onOpenChange).toHaveBeenCalledWith({
        opened: false,
        side: null,
      });

      machine.stop();
    });
  });

  describe("Taps & Action Clicks", () => {
    it("closes cell on content tap when open and closeOnContentClick is true", async () => {
      const machine = new MiniappMachine(swipeCellMachine, {
        defaultOpened: "right",
        closeOnContentClick: true,
      });
      machine.start();

      expect(machine.state.get()).toBe("open");
      machine.send({ type: "CONTENT_TAP" });
      await flush();
      expect(machine.state.get()).toBe("closed");

      machine.stop();
    });

    it("ignores content tap when closeOnContentClick is false", async () => {
      const machine = new MiniappMachine(swipeCellMachine, {
        defaultOpened: "right",
        closeOnContentClick: false,
      });
      machine.start();

      machine.send({ type: "CONTENT_TAP" });
      await flush();
      expect(machine.state.get()).toBe("open");

      machine.stop();
    });

    it("handles action click, executes callback, and closes if closeOnActionClick is true", async () => {
      const actionClick = vi.fn();
      const onActionClick = vi.fn();
      const onClose = vi.fn();

      const action = { text: "Delete", onClick: actionClick };
      const machine = new MiniappMachine(swipeCellMachine, {
        defaultOpened: "right",
        closeOnActionClick: true,
        onActionClick,
        onClose,
      });
      machine.start();

      machine.send({
        type: "ACTION_CLICK",
        action,
        side: "right",
        index: 0,
      });
      await flush();

      expect(actionClick).toHaveBeenCalledWith(action);
      expect(onActionClick).toHaveBeenCalledWith({
        action,
        side: "right",
        index: 0,
      });
      expect(machine.state.get()).toBe("closed");
      expect(onClose).toHaveBeenCalled();

      machine.stop();
    });

    it("stays open on action click if closeOnActionClick is false", async () => {
      const action = { text: "Pin" };
      const machine = new MiniappMachine(swipeCellMachine, {
        defaultOpened: "right",
        closeOnActionClick: false,
      });
      machine.start();

      machine.send({
        type: "ACTION_CLICK",
        action,
        side: "right",
        index: 0,
      });
      await flush();

      expect(machine.state.get()).toBe("open");
      machine.stop();
    });
  });

  describe("Disabled State", () => {
    it("blocks open and drag events when disabled is true", async () => {
      const machine = new MiniappMachine(swipeCellMachine, {
        disabled: true,
      });
      machine.start();

      machine.send({ type: "OPEN" });
      await flush();
      expect(machine.state.get()).toBe("closed");

      machine.send({ type: "DRAG_START" });
      await flush();
      expect(machine.state.get()).toBe("closed");

      machine.stop();
    });
  });

  describe("Controlled Props", () => {
    it("syncs controlled opened prop changes", async () => {
      const machine = new MiniappMachine(swipeCellMachine, {
        opened: false,
        rightWidth: 100,
      });
      machine.start();

      expect(machine.state.get()).toBe("closed");

      machine.updateProps({ opened: "right" });
      await flush();
      expect(machine.state.get()).toBe("open");
      expect(machine.computed("openedSide")).toBe("right");

      machine.updateProps({ opened: "left" });
      await flush();
      expect(machine.state.get()).toBe("open");
      expect(machine.computed("openedSide")).toBe("left");

      machine.updateProps({ opened: false });
      await flush();
      expect(machine.state.get()).toBe("closed");

      machine.stop();
    });

    it("allows gesture interaction when externally controlled and stays persistent", async () => {
      const onOpenChange = vi.fn();
      const machine = new MiniappMachine(swipeCellMachine, {
        opened: null,
        leftWidth: 80,
        rightWidth: 100,
        onOpenChange,
      });
      machine.start();

      const api = connectSwipeCell(machine.service);

      // 1. External control opens right
      machine.updateProps({ opened: "right" });
      await flush();
      expect(machine.state.get()).toBe("open");
      expect(machine.computed("openedSide")).toBe("right");

      // 2. User drags to open left side instead
      api.handleTouchStart();
      await flush();
      expect(machine.state.get()).toBe("dragging");

      api.handleTouchMove({ offset: 80 });
      await flush();
      expect(machine.computed("offset")).toBe(80);

      api.handleTouchEnd({ opened: true, side: "left", offset: 80 });
      await flush();

      // State is open on the left
      expect(machine.state.get()).toBe("open");
      expect(machine.computed("openedSide")).toBe("left");
      expect(onOpenChange).toHaveBeenCalledWith({ opened: true, side: "left" });

      // 3. Parent page receives onOpenChange and updates controlled prop to 'left'
      machine.updateProps({ opened: "left" });
      await flush();

      // Cell remains open on left without reverting
      expect(machine.state.get()).toBe("open");
      expect(machine.computed("openedSide")).toBe("left");

      machine.stop();
    });

    it("invokes action click exactly once without duplicate calls", async () => {
      const onActionClick = vi.fn();
      const onClick = vi.fn();
      const itemClick = vi.fn();

      const machine = new MiniappMachine(swipeCellMachine, {
        right: [
          { value: "star", text: "Star", onClick: itemClick },
        ],
        onActionClick,
        onClick,
      });
      machine.start();

      const api = connectSwipeCell(machine.service);
      api.handleActionTap({ side: "right", index: 0 });
      await flush();

      expect(itemClick).toHaveBeenCalledTimes(1);
      expect(onActionClick).toHaveBeenCalledTimes(1);
      expect(onClick).toHaveBeenCalledTimes(1);

      machine.stop();
    });
  });

  describe("Connect Event Delegates & Measurement", () => {
    it("delegates touch events and measurement through connect api", async () => {
      const triggerEvent = vi.fn();
      const mockComponent = { triggerEvent };
      const onActionClick = vi.fn();
      const onClick = vi.fn();

      const machine = new MiniappMachine(swipeCellMachine, {
        component: mockComponent as any,
        left: [{ text: "Pin" }],
        right: [{ text: "Delete" }],
        rightWidth: 80,
        leftWidth: 60,
        onActionClick,
        onClick,
      });
      machine.start();

      const api = connectSwipeCell(machine.service);

      // handleTouchStart
      api.handleTouchStart({ x: 10 });
      await flush();
      expect(machine.state.get()).toBe("dragging");
      expect(triggerEvent).toHaveBeenCalledWith("dragstart", { x: 10 });

      // handleTouchMove
      api.handleTouchMove({ offset: -40 });
      await flush();
      expect(machine.computed("offset")).toBe(-40);
      expect(triggerEvent).toHaveBeenCalledWith("drag", { offset: -40 });

      // handleTouchEnd
      api.handleTouchEnd({ opened: true, side: "right", offset: -80 });
      await flush();
      expect(machine.state.get()).toBe("open");
      expect(triggerEvent).toHaveBeenCalledWith("dragend", {
        opened: true,
        side: "right",
        offset: -80,
      });

      // handleContentTap
      api.handleContentTap();
      await flush();
      expect(machine.state.get()).toBe("closed");
      expect(triggerEvent).toHaveBeenCalledWith("contentTap", undefined);

      // handleActionTap
      api.handleActionTap({ side: "right", index: 0 });
      await flush();
      expect(onActionClick).toHaveBeenCalledWith({
        action: expect.objectContaining({ text: "Delete" }),
        side: "right",
        index: 0,
      });
      expect(onClick).toHaveBeenCalledWith({
        action: expect.objectContaining({ text: "Delete" }),
        side: "right",
        index: 0,
      });
      expect(triggerEvent).toHaveBeenCalledWith(
        "actionClick",
        expect.objectContaining({ side: "right", index: 0 }),
      );

      // measure
      api.measure();
      await flush();

      machine.stop();
    });
  });
});
