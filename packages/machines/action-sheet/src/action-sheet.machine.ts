import { createMachine } from "@code-ui/core";
import type {
  ActionSheetMachine,
  ActionSheetSchema,
} from "./action-sheet.types";
import { defaultActionSheetProps } from "./action-sheet.props";
import * as dom from "./action-sheet.dom";
import { isMiniApp, isNotNull, queryAnimationDuration } from "@code-ui/utils";

const DEFAULT_ANIMATION_DURATION = 300;

const closedTransitions = {
  "CONTROLLED.OPEN": {
    target: "open" as const,
  },
  OPEN: {
    target: "open" as const,
    actions: ["invokeOnOpen" as const],
  },
  TOGGLE: {
    target: "open" as const,
    actions: ["invokeOnOpen" as const],
  },
};

export const actionSheetMachine: ActionSheetMachine =
  createMachine<ActionSheetSchema>({
    props: ({ props }) => ({
      ...defaultActionSheetProps,
      ...props,
    }),

    initialState: ({ prop }) => {
      const rawOpen = prop("open");
      const isOpen = isNotNull(rawOpen)
        ? Boolean(rawOpen)
        : Boolean(prop("defaultOpen"));
      return isOpen ? "open" : "closed";
    },

    context: ({ bindable }) => ({
      loadingActionIndex: bindable<number | null>(() => ({
        defaultValue: null,
      })),
    }),

    computed: {
      isOpen: ({ state }) => state.hasTag("open"),
      isVisible: ({ state }) => state.hasTag("open") || state.hasTag("closing"),
    },

    on: {
      ACTION_LOADING: {
        actions: ["setActionLoadingContext"],
      },
      ACTION_SETTLED: {
        actions: ["clearActionLoadingContext"],
      },
    },

    watch: ({ prop, state, send }) => {
      const rawOpen = prop("open");
      if (!isNotNull(rawOpen)) return;

      const shouldBeOpen = Boolean(rawOpen);
      const isCurrentlyOpen = state.hasTag("open");
      if (shouldBeOpen && !isCurrentlyOpen) {
        send({ type: "CONTROLLED.OPEN" });
      } else if (!shouldBeOpen && isCurrentlyOpen) {
        send({ type: "CONTROLLED.CLOSE" });
      }
    },

    states: {
      closed: {
        tags: ["closed"],
        on: closedTransitions,
      },

      open: {
        tags: ["open"],
        on: {
          "CONTROLLED.CLOSE": {
            target: "closing",
          },
          CLOSE: {
            target: "closing",
            actions: ["invokeOnClose"],
          },
          TOGGLE: {
            target: "closing",
            actions: ["invokeOnClose"],
          },
          "BACKDROP.TAP": {
            target: "closing",
            guard: "closeOnBackdropClick",
            actions: ["invokeOnClose"],
          },
          "CLOSE_TRIGGER.TAP": {
            target: "closing",
            actions: ["invokeOnClose"],
          },
          SELECT: [
            {
              target: "closing",
              guard: "shouldCloseOnItem",
              actions: ["invokeOnSelect", "invokeOnClose"],
            },
            {
              guard: "canSelectItem",
              actions: ["invokeOnSelect"],
            },
          ],
          ACTION: [
            {
              target: "closing",
              guard: "shouldCloseOnAction",
              actions: ["invokeOnAction", "invokeOnClose"],
            },
            {
              actions: ["invokeOnAction"],
            },
          ],
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
        closeOnBackdropClick: ({ prop }) => prop("closeOnBackdropClick"),
        canSelectItem: ({ prop, event }) => {
          if (event.type !== "SELECT") return false;
          const items = prop("items");
          const item = items[event.index];
          if (!item) return false;
          return !item.disabled && !item.loading;
        },
        shouldCloseOnItem: ({ prop, event }) => {
          if (event.type !== "SELECT") return false;
          const items = prop("items");
          const item = items[event.index];
          if (!item || item.disabled || item.loading) return false;
          return prop("closeOnItem");
        },
        shouldCloseOnAction: ({ event }) => {
          if (event.type !== "ACTION") return false;
          return event.action.closeOnClick !== false;
        },
      },

      actions: {
        invokeOnOpen: ({ prop }) => {
          prop("onOpenChange")?.({ open: true });
        },
        invokeOnClose: ({ prop, context }) => {
          context.set("loadingActionIndex", null);
          prop("onOpenChange")?.({ open: false });
          prop("onClose")?.();
        },
        setActionLoadingContext: ({ context, event }) => {
          if (event.type === "ACTION_LOADING") {
            context.set("loadingActionIndex", event.index);
          }
        },
        clearActionLoadingContext: ({ context }) => {
          context.set("loadingActionIndex", null);
        },
        invokeOnSelect: ({ prop, event }) => {
          if (event.type !== "SELECT") return;
          const items = prop("items");
          const item = items[event.index];
          if (item && !item.disabled && !item.loading) {
            prop("onSelect")?.({ item, index: event.index });
          }
        },
        invokeOnAction: ({ prop, event }) => {
          if (event.type !== "ACTION") return;
          if ("handled" in event && event.handled) return;
          event.action.onClick?.();
          prop("onAction")?.({ action: event.action, index: event.index });
        },
      },

      effects: {
        waitForCloseAnimation: ({ send, scope, prop }) => {
          let timer: ReturnType<typeof setTimeout> | undefined;
          let cancelled = false;

          const cleanup = () => {
            cancelled = true;
            if (timer !== undefined) {
              clearTimeout(timer);
              timer = undefined;
            }
          };

          const scheduleEnd = (ms: number) => {
            if (cancelled) return;
            timer = setTimeout(() => {
              if (!cancelled) send({ type: "ANIMATION_END" });
            }, ms);
          };

          const explicitDuration = prop("duration");
          if (explicitDuration >= 0) {
            scheduleEnd(explicitDuration);
            return cleanup;
          }

          const comp = scope.component;
          if (!comp && !isMiniApp()) {
            scheduleEnd(DEFAULT_ANIMATION_DURATION);
            return cleanup;
          }

          const selector = `#${dom.getContentId(scope)}`;
          queryAnimationDuration(selector, comp)
            .then((duration) => {
              if (cancelled) return;
              const delay =
                duration > 0 ? duration : DEFAULT_ANIMATION_DURATION;
              scheduleEnd(delay);
            })
            .catch(() => {
              if (cancelled) return;
              scheduleEnd(DEFAULT_ANIMATION_DURATION);
            });

          return cleanup;
        },
      },
    },
  });
