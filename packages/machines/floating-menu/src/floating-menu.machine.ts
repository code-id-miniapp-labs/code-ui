import { createMachine } from "@code-ui/core";
import { isEqual, isMiniApp, isNotNull, queryRect } from "@code-ui/utils";
import * as dom from "./floating-menu.dom";
import { computeFloatingPosition, readViewportSize } from "./floating-menu.position";
import { defaultFloatingMenuProps } from "./floating-menu.props";
import type {
  FloatingContentSize,
  FloatingMenuMachine,
  FloatingMenuParams,
  FloatingMenuSchema,
  FloatingRect,
  FloatingViewport,
} from "./floating-menu.types";

const DEFAULT_CLOSE_DURATION = 150;

function toRect(res: {
  left?: number;
  top?: number;
  right?: number;
  bottom?: number;
  width?: number;
  height?: number;
} | null): FloatingRect | null {
  if (!res) return null;
  const width = typeof res.width === "number" ? res.width : 0;
  const height = typeof res.height === "number" ? res.height : 0;
  const left = typeof res.left === "number" ? res.left : 0;
  const top = typeof res.top === "number" ? res.top : 0;
  const right = typeof res.right === "number" ? res.right : left + width;
  const bottom = typeof res.bottom === "number" ? res.bottom : top + height;
  return { left, top, right, bottom, width, height };
}

function runMeasure(
  params: Pick<FloatingMenuParams, "prop" | "scope" | "refs" | "send">,
  isCancelled: () => boolean,
): void {
  const { prop, scope, refs, send } = params;
  if (!prop("portal")) return;

  const comp = scope.component;
  const canQuery =
    Boolean(
      comp &&
        typeof (comp as { createSelectorQuery?: unknown })
          .createSelectorQuery === "function",
    ) || isMiniApp();
  if (!canQuery) return;

  const token = refs.get("measureToken") + 1;
  refs.set("measureToken", token);

  const isStale = () => isCancelled() || refs.get("measureToken") !== token;
  const viewport = readViewportSize();

  queryRect(`#${dom.getTriggerId(scope)}`, comp)
    .then((res) => {
      if (isStale()) return;
      const anchorRect = toRect(res);
      if (!anchorRect) return;

      send({
        type: "MEASURE.DONE",
        anchorRect,
        viewport,
      });

      const matchWidth = prop("matchTriggerWidth");
      if (matchWidth === false || matchWidth === "min") {
        Promise.resolve()
          .then(() => queryRect(`#${dom.getContentId(scope)}`, comp))
          .then((contentRes) => {
            if (isStale() || !contentRes) return;
            if (contentRes.width > 0 || contentRes.height > 0) {
              send({
                type: "MEASURE.DONE",
                anchorRect,
                viewport,
                contentSize: {
                  width: contentRes.width,
                  height: contentRes.height,
                },
              });
            }
          })
          .catch(() => {});
      }
    })
    .catch(() => {});
}

const closedTransitions = {
  OPEN: {
    guard: "isInteractive" as const,
    target: "open" as const,
    actions: ["invokeOnOpen" as const],
  },
  TOGGLE: {
    guard: "isInteractive" as const,
    target: "open" as const,
    actions: ["invokeOnOpen" as const],
  },
  "TRIGGER.TAP": {
    guard: "canTapOpen" as const,
    target: "open" as const,
    actions: ["invokeOnOpen" as const],
  },
};

export const floatingMenuMachine: FloatingMenuMachine =
  createMachine<FloatingMenuSchema>({
    props: ({ props }) => ({
      ...defaultFloatingMenuProps,
      ...props,
    }),

    initialState: ({ prop }) => {
      const rawOpen = prop("open");
      const isOpen = isNotNull(rawOpen)
        ? Boolean(rawOpen)
        : Boolean(prop("defaultOpen"));
      return isOpen ? "open" : "closed";
    },

    refs: () => ({
      measureToken: 0,
    }),

    context: ({ bindable }) => ({
      anchorRect: bindable<FloatingRect | null>(() => ({
        defaultValue: null,
        isEqual,
      })),
      contentSize: bindable<FloatingContentSize | null>(() => ({
        defaultValue: null,
        isEqual,
      })),
      viewport: bindable<FloatingViewport>(() => ({
        defaultValue: readViewportSize(),
        isEqual,
      })),
    }),

    computed: {
      isOpen: ({ state }) => state.hasTag("open"),
      isVisible: ({ state }) =>
        state.hasTag("open") || state.hasTag("closing"),
      isDisabled: ({ prop }) => Boolean(prop("disabled")),
      position: ({ context, prop }) =>
        computeFloatingPosition({
          anchorRect: context.get("anchorRect"),
          viewport: context.get("viewport"),
          contentSize: context.get("contentSize"),
          portal: prop("portal"),
          side: prop("side"),
          align: prop("align"),
          sideOffset: prop("sideOffset"),
          alignOffset: prop("alignOffset"),
          collisionPadding: prop("collisionPadding"),
          avoidCollisions: prop("avoidCollisions"),
          matchTriggerWidth: prop("matchTriggerWidth"),
          maxHeight: prop("maxHeight"),
        }),
    },

    watch: ({ prop, state, track }) => {
      track([() => prop("open")], () => {
        const rawOpen = prop("open");
        if (!isNotNull(rawOpen)) return;

        const shouldBeOpen = Boolean(rawOpen);
        const isCurrentlyOpen = state.hasTag("open");
        if (shouldBeOpen && !isCurrentlyOpen) {
          state.set("open");
        } else if (!shouldBeOpen && isCurrentlyOpen) {
          state.set("closing");
        }
      });
    },

    states: {
      closed: {
        tags: ["closed"],
        entry: ["resetMeasurements"],
        on: closedTransitions,
      },

      open: {
        tags: ["open"],
        effects: ["measureAnchorEffect"],
        exit: ["invalidateMeasure"],
        on: {
          CLOSE: {
            target: "closing",
            actions: ["invokeOnClose"],
          },
          TOGGLE: {
            target: "closing",
            actions: ["invokeOnClose"],
          },
          "TRIGGER.TAP": {
            guard: "isTapTriggerMode",
            target: "closing",
            actions: ["invokeOnClose"],
          },
          "BACKDROP.TAP": {
            target: "closing",
            guard: "closeOnBackdropClick",
            actions: ["invokeOnBackdropTap", "invokeOnClose"],
          },
          REPOSITION: {
            actions: ["remeasureAnchor"],
          },
          "MEASURE.DONE": {
            actions: ["applyMeasurement"],
          },
        },
      },

      closing: {
        tags: ["closing"],
        effects: ["waitForCloseAnimation"],
        on: {
          ANIMATION_END: {
            target: "closed",
          },
          ...closedTransitions,
        },
      },
    },

    implementations: {
      guards: {
        isInteractive: ({ computed }) => !computed("isDisabled"),
        isTapTriggerMode: ({ prop }) => prop("triggerMode") === "tap",
        canTapOpen: ({ prop, computed }) =>
          !computed("isDisabled") && prop("triggerMode") === "tap",
        closeOnBackdropClick: ({ prop }) => prop("closeOnBackdropClick"),
      },

      actions: {
        invokeOnOpen: ({ prop }) => {
          prop("onOpenChange")?.({ open: true });
          prop("onOpen")?.();
        },

        invokeOnClose: ({ prop }) => {
          prop("onOpenChange")?.({ open: false });
          prop("onClose")?.();
        },

        invokeOnBackdropTap: ({ prop }) => {
          prop("onBackdropTap")?.();
        },

        invalidateMeasure: ({ refs }) => {
          refs.set("measureToken", refs.get("measureToken") + 1);
        },

        resetMeasurements: ({ context, refs }) => {
          refs.set("measureToken", refs.get("measureToken") + 1);
          context.set("anchorRect", null);
          context.set("contentSize", null);
        },

        remeasureAnchor: (params) => {
          runMeasure(params, () => !params.state.hasTag("open"));
        },

        applyMeasurement: ({ context, event }) => {
          if (event.type !== "MEASURE.DONE") return;
          context.set("viewport", event.viewport);
          context.set("anchorRect", event.anchorRect);
          if (event.contentSize !== undefined) {
            context.set("contentSize", event.contentSize);
          }
        },
      },

      effects: {
        measureAnchorEffect: (params) => {
          let cancelled = false;
          runMeasure(params, () => cancelled);
          return () => {
            cancelled = true;
          };
        },

        waitForCloseAnimation: ({ send, prop }) => {
          let cancelled = false;
          const explicitDuration = prop("duration");
          const delay =
            typeof explicitDuration === "number" && explicitDuration >= 0
              ? explicitDuration
              : DEFAULT_CLOSE_DURATION;

          const timer = setTimeout(() => {
            if (!cancelled) {
              send({ type: "ANIMATION_END" });
            }
          }, delay);

          return () => {
            cancelled = true;
            clearTimeout(timer);
          };
        },
      },
    },
  });
