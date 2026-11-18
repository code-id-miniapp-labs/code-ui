import { createMachine } from "@code-id-labs/core";
import type { DrawerMachine, DrawerSchema } from "./drawer.types";
import { defaultDrawerProps } from "./drawer.props";
import * as dom from "./drawer.dom";
import { isMiniApp, isNotNull, queryAnimationDuration } from "@code-id-labs/utils";

const DEFAULT_ANIMATION_DURATION = 300;

interface WxKeyboardApi {
  onKeyboardHeightChange?: (cb: (res: { height: number }) => void) => void;
  offKeyboardHeightChange?: (cb: (res: { height: number }) => void) => void;
}

const closedTransitions = {
  OPEN: {
    target: "open" as const,
    actions: ["invokeOnOpen" as const],
  },
  TOGGLE: {
    target: "open" as const,
    actions: ["invokeOnOpen" as const],
  },
};

export const drawerMachine: DrawerMachine = createMachine<DrawerSchema>({
  props: ({ props }) => ({
    ...defaultDrawerProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    const rawOpen = prop("open");
    const isOpen = isNotNull(rawOpen)
      ? Boolean(rawOpen)
      : prop("defaultOpen");
    return isOpen ? "open" : "closed";
  },

  context: ({ bindable }) => ({
    keyboardHeight: bindable<number>(() => ({
      defaultValue: 0,
    })),
  }),

  computed: {
    isOpen: ({ state }) => state.hasTag("open"),
    isVisible: ({ state }) => state.hasTag("open") || state.hasTag("closing"),
    placement: ({ prop }) => prop("placement"),
  },

  effects: ["listenKeyboardHeight"],

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
      entry: ["resetKeyboardHeight"],
      on: closedTransitions,
    },

    open: {
      tags: ["open"],
      on: {
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
        DRAG_START: {
          target: "dragging",
          guard: "isDismissible",
        },
        KEYBOARD_CHANGE: {
          actions: ["setKeyboardHeight"],
        },
      },
    },

    dragging: {
      tags: ["open", "dragging"],
      on: {
        DRAG_END: [
          {
            target: "closing",
            guard: "dragPassed",
            actions: ["invokeOnClose"],
          },
          {
            target: "open",
          },
        ],
        KEYBOARD_CHANGE: {
          actions: ["setKeyboardHeight"],
        },
        CLOSE: {
          target: "closing",
          actions: ["invokeOnClose"],
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
      closeOnBackdropClick: ({ prop }) => prop("closeOnBackdropClick"),
      isDismissible: ({ prop }) => prop("dismissible"),
      dragPassed: ({ event }) =>
        event.type === "DRAG_END" && event.passed === true,
    },

    actions: {
      invokeOnOpen: ({ prop }) => {
        prop("onOpenChange")?.({ open: true });
      },
      invokeOnClose: ({ prop }) => {
        prop("onOpenChange")?.({ open: false });
        prop("onClose")?.();
      },
      setKeyboardHeight: ({ context, event }) => {
        if (event.type === "KEYBOARD_CHANGE") {
          context.set("keyboardHeight", event.height);
        }
      },
      resetKeyboardHeight: ({ context }) => {
        context.set("keyboardHeight", 0);
      },
    },

    effects: {
      listenKeyboardHeight: ({ send }) => {
        const wxApi = (globalThis as { wx?: WxKeyboardApi }).wx;
        if (!wxApi?.onKeyboardHeightChange) return;

        const handler = (res: { height: number }) => {
          send({ type: "KEYBOARD_CHANGE", height: res.height });
        };
        wxApi.onKeyboardHeightChange(handler);
        return () => {
          wxApi.offKeyboardHeightChange?.(handler);
        };
      },

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
        if (typeof explicitDuration === "number" && explicitDuration >= 0) {
          scheduleEnd(explicitDuration);
          return cleanup;
        }

        const comp = scope.component;
        if (!comp && !isMiniApp()) {
          scheduleEnd(DEFAULT_ANIMATION_DURATION);
          return cleanup;
        }

        queryAnimationDuration(dom.getContentSelector(scope), comp)
          .then((duration) => {
            if (cancelled) return;
            const delay = duration > 0 ? duration : DEFAULT_ANIMATION_DURATION;
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
