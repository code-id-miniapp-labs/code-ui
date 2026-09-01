import { createMachine } from "@code-ui/core";
import type { DrawerMachine, DrawerSchema } from "./drawer.types";
import { defaultDrawerProps } from "./drawer.props";
import * as dom from "./drawer.dom";

export const drawerMachine: DrawerMachine = createMachine<DrawerSchema>({
  props: ({ props }) => ({
    ...defaultDrawerProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    const isOpen = prop("open") ?? prop("defaultOpen") ?? false;
    return isOpen ? "open" : "closed";
  },

  context: ({ prop, bindable }) => ({
    open: bindable<boolean>(() => ({
      value: prop("open"),
      defaultValue: prop("defaultOpen") ?? false,
      onChange: (open) => {
        if (!open) {
          prop("onClose")?.();
        }
      },
    })),
    keyboardHeight: bindable<number>(() => ({
      defaultValue: 0,
    })),
    ui: bindable<any>(() => ({
      value: prop("ui") ?? {},
      defaultValue: {},
    })),
  }),

  computed: {
    isOpen: ({ context }) => context.get("open"),
    placement: ({ prop }) => prop("placement") ?? "bottom",
  },

  watch: ({ prop, state, send }) => {
    const controlledOpen = prop("open");
    if (controlledOpen !== undefined) {
      if (controlledOpen && !state.matches("open", "dragging")) {
        send({ type: "OPEN" });
      } else if (!controlledOpen && state.matches("open", "dragging")) {
        send({ type: "CLOSE" });
      }
    }
  },

  states: {
    closed: {
      tags: ["closed"],
      on: {
        OPEN: {
          target: "open",
          actions: ["setOpenContext"],
        },
        TOGGLE: {
          target: "open",
          actions: ["setOpenContext"],
        },
      },
    },

    open: {
      tags: ["open"],
      on: {
        CLOSE: {
          target: "closing",
          actions: ["setClosedContext"],
        },
        TOGGLE: {
          target: "closing",
          actions: ["setClosedContext"],
        },
        "BACKDROP.TAP": {
          target: "closing",
          guard: "closeOnBackdropClick",
          actions: ["setClosedContext"],
        },
        "CLOSE_TRIGGER.TAP": {
          target: "closing",
          actions: ["setClosedContext"],
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
            actions: ["setClosedContext"],
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
          actions: ["setClosedContext"],
        },
      },
    },

    closing: {
      tags: ["closed"],
      effects: ["waitForCloseAnimation"],
      on: {
        ANIMATION_END: {
          target: "closed",
        },
        OPEN: {
          target: "open",
          actions: ["setOpenContext"],
        },
      },
    },
  },

  implementations: {
    guards: {
      closeOnBackdropClick: ({ prop }) => prop("closeOnBackdropClick") ?? true,
      isDismissible: ({ prop }) => prop("dismissible") ?? true,
      dragPassed: ({ event }) => "passed" in event && (event as any).passed === true,
    },

    actions: {
      setOpenContext: ({ context }) => {
        context.set("open", true);
      },
      setClosedContext: ({ context }) => {
        context.set("open", false);
      },
      setKeyboardHeight: ({ context, event }) => {
        if ("height" in event) {
          context.set("keyboardHeight", event.height);
        }
      },
    },

    effects: {
      waitForCloseAnimation: ({ send, scope, prop }) => {
        let timer: any;
        let cancelled = false;

        const explicitDuration = prop("duration");
        if (typeof explicitDuration === "number" && explicitDuration > 0) {
          timer = setTimeout(() => {
            send({ type: "ANIMATION_END" });
          }, explicitDuration);
          return () => clearTimeout(timer);
        }

        scope.dom
          .animationDuration(dom.getContentSelector(scope))
          .then((duration) => {
            if (cancelled) return;
            const delay = duration > 0 ? duration : 300;
            timer = setTimeout(() => {
              send({ type: "ANIMATION_END" });
            }, delay);
          })
          .catch(() => {
            if (cancelled) return;
            timer = setTimeout(() => {
              send({ type: "ANIMATION_END" });
            }, explicitDuration);
          });

        return () => {
          cancelled = true;
          if (timer) clearTimeout(timer);
        };
      },
    },
  },
});
