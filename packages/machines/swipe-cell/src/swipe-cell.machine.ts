import { createMachine } from "@code-ui/core";
import { isNotNull, type MiniAppRect } from "@code-ui/utils";
import type {
  SwipeCellAction,
  SwipeCellMachine,
  SwipeCellParams,
  SwipeCellSchema,
  SwipeSide,
} from "./swipe-cell.types";
import { defaultSwipeCellProps } from "./swipe-cell.props";

function resolveSide(value: unknown): SwipeSide {
  return value === "left" || value === "right" ? value : "right";
}

function resolveInitialSide(
  rawOpened: unknown,
  rawDefaultOpened: unknown,
): SwipeSide | null {
  if (isNotNull(rawOpened) && rawOpened) return resolveSide(rawOpened);
  if (rawDefaultOpened) return resolveSide(rawDefaultOpened);
  return null;
}

function parseBooleanProp(val: unknown, defaultValue = true): boolean {
  if (val === "" || val === true || val === "true") return true;
  if (val === false || val === "false") return false;
  return (val as boolean | undefined) ?? defaultValue;
}

function measureActionWidths(
  scope: SwipeCellParams["scope"] | undefined,
  context: SwipeCellParams["context"],
  prop: SwipeCellParams["prop"],
): void {
  const explicitLeft = prop("leftWidth");
  const explicitRight = prop("rightWidth");
  const hasExplicitLeft = typeof explicitLeft === "number" && explicitLeft > 0;
  const hasExplicitRight =
    typeof explicitRight === "number" && explicitRight > 0;

  if (hasExplicitLeft && hasExplicitRight) {
    if (context.get("leftWidth") !== explicitLeft) {
      context.set("leftWidth", explicitLeft);
    }
    if (context.get("rightWidth") !== explicitRight) {
      context.set("rightWidth", explicitRight);
    }
    return;
  }

  if (!scope?.dom?.rect) {
    if (hasExplicitLeft && context.get("leftWidth") !== explicitLeft) {
      context.set("leftWidth", explicitLeft);
    }
    if (hasExplicitRight && context.get("rightWidth") !== explicitRight) {
      context.set("rightWidth", explicitRight);
    }
    return;
  }

  const left = prop("left");
  const right = prop("right");
  const hasLeft = (Array.isArray(left) && left.length > 0) || hasExplicitLeft;
  const hasRight =
    (Array.isArray(right) && right.length > 0) || hasExplicitRight;

  const shouldQueryLeft = !hasExplicitLeft && hasLeft;
  const shouldQueryRight = !hasExplicitRight && hasRight;

  if (!shouldQueryLeft && !shouldQueryRight) {
    if (hasExplicitLeft && context.get("leftWidth") !== explicitLeft) {
      context.set("leftWidth", explicitLeft);
    }
    if (hasExplicitRight && context.get("rightWidth") !== explicitRight) {
      context.set("rightWidth", explicitRight);
    }
    return;
  }

  const queries: [
    Promise<MiniAppRect | null> | null,
    Promise<MiniAppRect | null> | null,
  ] = [
    shouldQueryLeft ? scope.dom.rect(".cui-swipe-cell__left") : null,
    shouldQueryRight ? scope.dom.rect(".cui-swipe-cell__right") : null,
  ];

  Promise.all(queries)
    .then(([leftRect, rightRect]) => {
      let leftWidth = hasExplicitLeft
        ? explicitLeft
        : context.get("leftWidth");
      let rightWidth = hasExplicitRight
        ? explicitRight
        : context.get("rightWidth");

      if (
        shouldQueryLeft &&
        leftRect &&
        typeof leftRect.width === "number" &&
        leftRect.width > 0
      ) {
        leftWidth = leftRect.width;
      }
      if (
        shouldQueryRight &&
        rightRect &&
        typeof rightRect.width === "number" &&
        rightRect.width > 0
      ) {
        rightWidth = rightRect.width;
      }

      if (context.get("leftWidth") !== leftWidth) {
        context.set("leftWidth", leftWidth);
      }
      if (context.get("rightWidth") !== rightWidth) {
        context.set("rightWidth", rightWidth);
      }
    })
    .catch(() => {});
}

const openActions: SwipeCellAction[] = [
  "setOpenedSide",
  "invokeOnOpen",
  "emitChange",
];
const closeActions: SwipeCellAction[] = [
  "clearOpenedSide",
  "invokeOnClose",
  "emitChange",
];

const contentTapTransition = [
  {
    guard: "closeOnContentClick" as const,
    target: "closed" as const,
    actions: ["invokeOnContentTap" as const, ...closeActions],
  },
  {
    actions: ["invokeOnContentTap" as const],
  },
];

const actionClickTransition = [
  {
    guard: "closeOnActionClick" as const,
    target: "closed" as const,
    actions: ["invokeOnActionClick" as const, ...closeActions],
  },
  {
    actions: ["invokeOnActionClick" as const],
  },
];

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

    refs: () => ({}),

    context: ({ prop, bindable }) => ({
      openedSide: bindable<SwipeSide | null>(() => ({
        defaultValue: resolveInitialSide(prop("opened"), prop("defaultOpened")),
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
        return (
          (Array.isArray(left) && left.length > 0) ||
          context.get("leftWidth") > 0
        );
      },
      hasRightActions: ({ prop, context }) => {
        const right = prop("right");
        return (
          (Array.isArray(right) && right.length > 0) ||
          context.get("rightWidth") > 0
        );
      },
    },

    watch: ({ prop, state, send }) => {
      const rawOpened = prop("opened");
      if (!isNotNull(rawOpened)) return;

      const shouldBeOpen = Boolean(rawOpened);
      const isCurrentlyOpen = state.hasTag("open");

      if (shouldBeOpen) {
        const side = resolveSide(rawOpened);
        send({ type: "CONTROLLED.OPEN", side });
      } else if (isCurrentlyOpen) {
        send({ type: "CONTROLLED.CLOSE" });
      }
    },

    on: {
      MEASURE: {
        actions: ["measureWidths"],
      },
      SET_WIDTHS: {
        actions: ["setWidths"],
      },
    },

    states: {
      closed: {
        tags: ["closed"],
        on: {
          "CONTROLLED.OPEN": {
            target: "open",
            actions: ["setOpenedSide"],
          },
          DRAG_START: {
            guard: "isInteractive",
            target: "dragging",
            actions: ["setOffsetFromEvent", "invokeOnDragStart"],
          },
          DRAG_MOVE: {
            guard: "isInteractive",
            actions: ["setOffsetFromEvent", "invokeOnDrag"],
          },
          OPEN: {
            guard: "isInteractive",
            target: "open",
            actions: openActions,
          },
          TOGGLE: {
            guard: "isInteractive",
            target: "open",
            actions: openActions,
          },
          ACTION_CLICK: actionClickTransition,
        },
      },

      dragging: {
        tags: ["dragging"],
        on: {
          "CONTROLLED.OPEN": {
            target: "open",
            actions: ["setOpenedSide"],
          },
          "CONTROLLED.CLOSE": {
            target: "closed",
            actions: ["clearOpenedSide"],
          },
          DRAG_MOVE: {
            actions: ["setOffsetFromEvent", "invokeOnDrag"],
          },
          DRAG_END: [
            {
              guard: "isDragOpened",
              target: "open",
              actions: ["invokeOnDragEnd", ...openActions],
            },
            {
              target: "closed",
              actions: ["invokeOnDragEnd", ...closeActions],
            },
          ],
          CLOSE: {
            target: "closed",
            actions: closeActions,
          },
          CONTENT_TAP: contentTapTransition,
          ACTION_CLICK: actionClickTransition,
        },
      },

      open: {
        tags: ["open"],
        on: {
          "CONTROLLED.OPEN": [
            {
              guard: "isDifferentSide",
              actions: ["setOpenedSide"],
            },
          ],
          "CONTROLLED.CLOSE": {
            target: "closed",
            actions: ["clearOpenedSide"],
          },
          DRAG_START: {
            guard: "isInteractive",
            target: "dragging",
            actions: ["setOffsetFromEvent", "invokeOnDragStart"],
          },
          DRAG_MOVE: {
            guard: "isInteractive",
            actions: ["setOffsetFromEvent", "invokeOnDrag"],
          },
          OPEN: [
            {
              guard: "isDifferentSide",
              actions: openActions,
            },
          ],
          TOGGLE: [
            {
              guard: "isDifferentSide",
              actions: openActions,
            },
            {
              guard: "isInteractive",
              target: "closed",
              actions: closeActions,
            },
          ],
          CLOSE: {
            target: "closed",
            actions: closeActions,
          },
          CONTENT_TAP: contentTapTransition,
          ACTION_CLICK: actionClickTransition,
        },
      },
    },

    implementations: {
      guards: {
        isInteractive: ({ computed }) => !computed("isDisabled"),
        closeOnContentClick: ({ prop }) =>
          parseBooleanProp(prop("closeOnContentClick")),
        closeOnActionClick: ({ prop }) =>
          parseBooleanProp(prop("closeOnActionClick")),
        isDragOpened: ({ event }) =>
          event.type === "DRAG_END" && Boolean(event.opened),
        isDifferentSide: ({ context, event, computed }) => {
          if (computed("isDisabled")) return false;
          const targetSide =
            event.type === "OPEN" || event.type === "CONTROLLED.OPEN"
              ? (event.side ?? "right")
              : event.side;
          return Boolean(targetSide && targetSide !== context.get("openedSide"));
        },
      },

      actions: {
        setOpenedSide: ({ context, event }) => {
          if (
            event.type === "OPEN" ||
            event.type === "TOGGLE" ||
            event.type === "DRAG_END" ||
            event.type === "CONTROLLED.OPEN"
          ) {
            context.set("openedSide", event.side ?? "right");
            if (event.type === "DRAG_END") {
              context.set("currentOffset", event.offset);
            } else {
              context.set("currentOffset", 0);
            }
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

        measureWidths: ({ scope, context, prop }) => {
          measureActionWidths(scope, context, prop);
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
          const details = {
            action: event.action,
            side: event.side,
            index: event.index,
          };
          event.action.onClick?.(event.action);
          prop("onActionClick")?.(details);
          prop("onClick")?.(details);
        },

        invokeOnDragStart: ({ prop, event }) => {
          if (event.type === "DRAG_START") {
            prop("onDragStart")?.(event.data ?? {});
          }
        },

        invokeOnDrag: ({ prop, event }) => {
          if (event.type === "DRAG_MOVE") {
            prop("onDrag")?.({ offset: event.offset });
          }
        },

        invokeOnDragEnd: ({ prop, event }) => {
          if (event.type === "DRAG_END") {
            prop("onDragEnd")?.({
              opened: event.opened,
              side: event.side,
              offset: event.offset,
            });
          }
        },

        invokeOnContentTap: ({ prop }) => {
          prop("onContentTap")?.();
        },
      },
    },
  });
