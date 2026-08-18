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
        prop("onOpenChange")?.({ open });
        if (!open) {
          prop("onClose")?.();
        }
      },
    })),
    dragOffset: bindable<number>(() => ({
      defaultValue: 0,
    })),
    startPoint: bindable<{ x: number; y: number } | null>(() => ({
      defaultValue: null,
    })),
    keyboardHeight: bindable<number>(() => ({
      defaultValue: 0,
    })),
  }),

  computed: {
    isOpen: ({ context }) => context.get("open"),
    isDragging: ({ context }) => context.get("dragOffset") > 0,
    placement: ({ prop }) => prop("placement") ?? "bottom",
  },

  watch: ({ prop, state, send }) => {
    const controlledOpen = prop("open");
    if (controlledOpen !== undefined) {
      if (controlledOpen && !state.matches("open", "swiping")) {
        send({ type: "OPEN" });
      } else if (!controlledOpen && state.matches("open", "swiping")) {
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
        SWIPE_START: {
          target: "swiping",
          guard: "isDismissible",
          actions: ["setStartPoint"],
        },
        KEYBOARD_CHANGE: {
          actions: ["setKeyboardHeight"],
        },
      },
    },

    swiping: {
      tags: ["open", "swiping"],
      on: {
        SWIPE_MOVE: {
          actions: ["calculateDragOffset"],
        },
        SWIPE_END: [
          {
            target: "closing",
            guard: "hasPassedThreshold",
            actions: ["setClosedContext", "resetDragOffset"],
          },
          {
            target: "open",
            actions: ["resetDragOffset"],
          },
        ],
        KEYBOARD_CHANGE: {
          actions: ["setKeyboardHeight"],
        },
        CLOSE: {
          target: "closing",
          actions: ["setClosedContext", "resetDragOffset"],
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
      hasPassedThreshold: ({ context, prop }) => {
        const threshold = prop("threshold") ?? 80;
        const dragOffset = context.get("dragOffset");
        return dragOffset >= threshold;
      },
    },

    actions: {
      setOpenContext: ({ context }) => {
        context.set("open", true);
      },
      setClosedContext: ({ context }) => {
        context.set("open", false);
      },
      setStartPoint: ({ context, event }) => {
        if ("point" in event) {
          context.set("startPoint", event.point);
        }
      },
      calculateDragOffset: ({ context, event, prop }) => {
        if (!("point" in event)) return;
        const start = context.get("startPoint");
        if (!start) return;

        const placement = prop("placement") ?? "bottom";
        let delta = 0;

        if (placement === "bottom") {
          delta = event.point.y - start.y;
        } else if (placement === "top") {
          delta = start.y - event.point.y;
        } else if (placement === "right") {
          delta = event.point.x - start.x;
        } else if (placement === "left") {
          delta = start.x - event.point.x;
        }

        // Only positive drag (towards close)
        context.set("dragOffset", Math.max(0, delta));
      },
      resetDragOffset: ({ context }) => {
        context.set("dragOffset", 0);
        context.set("startPoint", null);
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
