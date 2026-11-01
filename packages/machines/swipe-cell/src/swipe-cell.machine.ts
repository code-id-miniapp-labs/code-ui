import { createMachine } from "@code-ui/core";
import { isNotNull } from "@code-ui/utils";
import type {
  SwipeCellMachine,
  SwipeCellSchema,
  SwipeCellUI,
  SwipeSide,
} from "./swipe-cell.types";
import { defaultSwipeCellProps } from "./swipe-cell.props";

function resolveInitialSide(
  rawOpened: unknown,
  rawDefaultOpened: unknown,
): SwipeSide | null {
  if (rawOpened === "left" || rawOpened === "right") return rawOpened;
  if (rawOpened === true) return "right";
  if (rawDefaultOpened === "left" || rawDefaultOpened === "right")
    return rawDefaultOpened;
  if (rawDefaultOpened === true) return "right";
  return null;
}

export const swipeCellMachine: SwipeCellMachine =
  createMachine<SwipeCellSchema>({
    props: ({ props }) => ({
      ...defaultSwipeCellProps,
      ...props,
    }),

    initialState: ({ prop }) => {
      const rawOpened = prop("opened");
      const isOpened = isNotNull(rawOpened)
        ? Boolean(rawOpened)
        : Boolean(prop("defaultOpened") ?? false);
      return isOpened ? "open" : "closed";
    },

    context: ({ prop, bindable }) => ({
      openedSide: bindable<SwipeSide | null>(() => ({
        defaultValue: resolveInitialSide(
          prop("opened"),
          prop("defaultOpened"),
        ),
      })),
      leftWidth: bindable<number>(() => ({
        value: prop("leftWidth"),
        defaultValue: 0,
      })),
      rightWidth: bindable<number>(() => ({
        value: prop("rightWidth"),
        defaultValue: 0,
      })),
      currentOffset: bindable<number>(() => ({
        defaultValue: 0,
      })),
      ui: bindable<SwipeCellUI>(() => ({
        value: prop("ui"),
        defaultValue: {},
      })),
    }),

    computed: {
      isOpen: ({ state }) => state.hasTag("open"),
      isClosed: ({ state }) => state.hasTag("closed"),
      isDragging: ({ state }) => state.hasTag("dragging"),
      isDisabled: ({ prop }) => Boolean(prop("disabled")),
      openedSide: ({ context, state }) =>
        state.hasTag("open") ? context.get("openedSide") : null,
      offset: ({ context, state }) => {
        if (state.matches("dragging")) {
          return context.get("currentOffset");
        }
        if (state.matches("open")) {
          const side = context.get("openedSide");
          if (side === "left") return context.get("leftWidth");
          if (side === "right") return -context.get("rightWidth");
        }
        return 0;
      },
      hasLeftActions: ({ prop, context }) => {
        const left = prop("left");
        return (Array.isArray(left) && left.length > 0) || context.get("leftWidth") > 0;
      },
      hasRightActions: ({ prop, context }) => {
        const right = prop("right");
        return (Array.isArray(right) && right.length > 0) || context.get("rightWidth") > 0;
      },
    },

    watch: ({ prop, state, send, context }) => {
      const rawOpened = prop("opened");
      if (!isNotNull(rawOpened)) return;

      const shouldBeOpen = Boolean(rawOpened);
      const targetSide: SwipeSide =
        typeof rawOpened === "string" &&
        (rawOpened === "left" || rawOpened === "right")
          ? rawOpened
          : "right";

      if (shouldBeOpen) {
        if (!state.matches("open") || context.get("openedSide") !== targetSide) {
          send({ type: "CONTROLLED.OPEN", side: targetSide });
        }
      } else if (!state.matches("closed")) {
        send({ type: "CONTROLLED.CLOSE" });
      }
    },

    on: {
      SET_WIDTHS: {
        actions: ["setWidths"],
      },
    },

    states: {
      closed: {
        tags: ["closed"],
        on: {
          DRAG_START: {
            guard: "isInteractive",
            target: "dragging",
            actions: ["setOffsetFromEvent"],
          },
          DRAG_MOVE: {
            guard: "isInteractive",
            actions: ["setOffsetFromEvent"],
          },
          OPEN: {
            guard: "isInteractive",
            target: "open",
            actions: ["setOpenedSide", "invokeOnOpen", "emitChange"],
          },
          TOGGLE: {
            guard: "isInteractive",
            target: "open",
            actions: ["setOpenedSide", "invokeOnOpen", "emitChange"],
          },
          "CONTROLLED.OPEN": {
            target: "open",
            actions: ["setOpenedSide"],
          },
        },
      },

      dragging: {
        tags: ["dragging"],
        on: {
          DRAG_MOVE: {
            actions: ["setOffsetFromEvent"],
          },
          DRAG_END: [
            {
              guard: "isDragOpened",
              target: "open",
              actions: [
                "setOpenedSideFromEvent",
                "invokeOnOpen",
                "emitChange",
              ],
            },
            {
              target: "closed",
              actions: ["clearOpenedSide", "invokeOnClose", "emitChange"],
            },
          ],
          CLOSE: {
            target: "closed",
            actions: ["clearOpenedSide", "invokeOnClose", "emitChange"],
          },
          "CONTROLLED.CLOSE": {
            target: "closed",
            actions: ["clearOpenedSide"],
          },
          "CONTROLLED.OPEN": {
            target: "open",
            actions: ["setOpenedSide"],
          },
        },
      },

      open: {
        tags: ["open"],
        on: {
          DRAG_START: {
            guard: "isInteractive",
            target: "dragging",
            actions: ["setOffsetFromEvent"],
          },
          DRAG_MOVE: {
            guard: "isInteractive",
            actions: ["setOffsetFromEvent"],
          },
          CLOSE: {
            target: "closed",
            actions: ["clearOpenedSide", "invokeOnClose", "emitChange"],
          },
          TOGGLE: {
            target: "closed",
            actions: ["clearOpenedSide", "invokeOnClose", "emitChange"],
          },
          CONTENT_TAP: {
            guard: "closeOnContentClick",
            target: "closed",
            actions: ["clearOpenedSide", "invokeOnClose", "emitChange"],
          },
          ACTION_CLICK: [
            {
              guard: "closeOnActionClick",
              target: "closed",
              actions: [
                "invokeOnActionClick",
                "clearOpenedSide",
                "invokeOnClose",
                "emitChange",
              ],
            },
            {
              actions: ["invokeOnActionClick"],
            },
          ],
          "CONTROLLED.CLOSE": {
            target: "closed",
            actions: ["clearOpenedSide"],
          },
          "CONTROLLED.OPEN": {
            actions: ["setOpenedSide"],
          },
        },
      },
    },

    implementations: {
      guards: {
        isInteractive: ({ computed }) => !computed("isDisabled"),
        closeOnContentClick: ({ prop }) => prop("closeOnContentClick") ?? true,
        closeOnActionClick: ({ prop }) => prop("closeOnActionClick") ?? true,
        isDragOpened: ({ event }) =>
          event.type === "DRAG_END" && Boolean(event.opened),
      },

      actions: {
        setOpenedSide: ({ context, event }) => {
          if (event.type === "OPEN" || event.type === "TOGGLE") {
            context.set("openedSide", event.side ?? "right");
          } else if (event.type === "CONTROLLED.OPEN") {
            context.set("openedSide", event.side);
          }
        },

        setOpenedSideFromEvent: ({ context, event }) => {
          if (event.type === "DRAG_END") {
            context.set("openedSide", event.side ?? "right");
            context.set("currentOffset", event.offset);
          }
        },

        clearOpenedSide: ({ context, event }) => {
          context.set("openedSide", null);
          if (event.type === "DRAG_END") {
            context.set("currentOffset", event.offset);
          } else {
            context.set("currentOffset", 0);
          }
        },

        setOffsetFromEvent: ({ context, event }) => {
          if (event.type === "DRAG_MOVE") {
            context.set("currentOffset", event.offset);
          }
        },

        setWidths: ({ context, event }) => {
          if (event.type !== "SET_WIDTHS") return;
          if (event.leftWidth !== undefined) {
            context.set("leftWidth", event.leftWidth);
          }
          if (event.rightWidth !== undefined) {
            context.set("rightWidth", event.rightWidth);
          }
        },

        invokeOnOpen: ({ context, prop }) => {
          const side = context.get("openedSide") ?? "right";
          prop("onOpen")?.({ side });
        },

        invokeOnClose: ({ prop }) => {
          prop("onClose")?.();
        },

        emitChange: ({ context, state, prop }) => {
          const opened = state.hasTag("open");
          const side = opened ? context.get("openedSide") : null;
          prop("onOpenChange")?.({ opened, side });
        },

        invokeOnActionClick: ({ prop, event }) => {
          if (event.type !== "ACTION_CLICK") return;
          event.action.onClick?.(event.action);
          prop("onActionClick")?.({
            action: event.action,
            side: event.side,
            index: event.index,
          });
        },
      },
    },
  });
