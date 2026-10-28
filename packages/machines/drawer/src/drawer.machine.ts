import { createMachine } from "@code-ui/core";
import type { DrawerMachine, DrawerSchema, DrawerUI } from "./drawer.types";
import { defaultDrawerProps } from "./drawer.props";
import * as dom from "./drawer.dom";
import { isNotNull } from "@code-ui/utils";

const DEFAULT_ANIMATION_DURATION = 300;

export const drawerMachine: DrawerMachine = createMachine<DrawerSchema>({
  props: ({ props }) => ({
    ...defaultDrawerProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    const rawOpen = prop("open");
    const isOpen = isNotNull(rawOpen)
      ? Boolean(rawOpen)
      : Boolean(prop("defaultOpen") ?? false);
    return isOpen ? "open" : "closed";
  },

  context: ({ prop, bindable }) => ({
    keyboardHeight: bindable<number>(() => ({
      defaultValue: 0,
    })),
    ui: bindable<DrawerUI>(() => ({
      value: prop("ui") ?? {},
      defaultValue: {},
    })),
  }),

  computed: {
    isOpen: ({ state }) => state.hasTag("open"),
    isVisible: ({ state }) => state.hasTag("open") || state.hasTag("closing"),
    placement: ({ prop }) => prop("placement") ?? "bottom",
  },

  watch: ({ prop, send }) => {
    const rawOpen = prop("open");
    if (!isNotNull(rawOpen)) return;

    send({ type: rawOpen ? "CONTROLLED.OPEN" : "CONTROLLED.CLOSE" });
  },

  states: {
    closed: {
      tags: ["closed"],
      entry: ["resetKeyboardHeight"],
      on: {
        "CONTROLLED.OPEN": {
          target: "open",
        },
        OPEN: {
          target: "open",
          actions: ["invokeOnOpen"],
        },
        TOGGLE: {
          target: "open",
          actions: ["invokeOnOpen"],
        },
      },
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
        "CONTROLLED.CLOSE": {
          target: "closing",
        },
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
        "CONTROLLED.OPEN": {
          target: "open",
        },
        OPEN: {
          target: "open",
          actions: ["invokeOnOpen"],
        },
        TOGGLE: {
          target: "open",
          actions: ["invokeOnOpen"],
        },
      },
    },
  },

  implementations: {
    guards: {
      closeOnBackdropClick: ({ prop }) => prop("closeOnBackdropClick") ?? true,
      isDismissible: ({ prop }) => prop("dismissible") ?? true,
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

        scope.dom
          .animationDuration(dom.getContentSelector(scope))
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
