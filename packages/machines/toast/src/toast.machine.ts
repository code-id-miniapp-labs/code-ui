import { createMachine } from "@code-ui/core";
import { isNotNull } from "@code-ui/utils";
import type {
  ToastAction,
  ToastMachine,
  ToastSchema,
  ToastUI,
} from "./toast.types";
import { defaultToastProps } from "./toast.props";

const DISMISS_ANIMATION_DURATION = 200;

const activeToastTransitions = {
  "CONTROLLED.CLOSE": {
    target: "dismissing" as const,
  },
  DISMISS: {
    target: "dismissing" as const,
    actions: ["invokeOnClose" as const],
  },
  TRIGGER_ACTION: {
    target: "dismissing" as const,
    actions: ["invokeOnAction" as const, "invokeOnClose" as const],
  },
};

export const toastMachine: ToastMachine = createMachine<ToastSchema>({
  props: ({ props }) => ({
    ...defaultToastProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    const rawOpen = prop("open");
    const isOpen = isNotNull(rawOpen)
      ? Boolean(rawOpen)
      : Boolean(prop("defaultOpen") ?? true);
    return isOpen ? "open" : "closed";
  },

  refs: () => ({
    timer: undefined,
    dismissTimer: undefined,
    remainingTime: undefined,
    startedAt: undefined,
  }),

  context: ({ prop, bindable }) => ({
    ui: bindable<ToastUI>(() => ({
      value: prop("ui"),
      defaultValue: {},
    })),
  }),

  computed: {
    isOpen: ({ state }) => state.hasTag("open"),
    isVisible: ({ state }) =>
      state.hasTag("open") || state.hasTag("dismissing"),
    isPaused: ({ state }) => state.hasTag("paused"),
    isDismissing: ({ state }) => state.hasTag("dismissing"),
  },

  watch: ({ prop, state, send }) => {
    const controlledOpen = prop("open");
    if (!isNotNull(controlledOpen)) return;

    if (controlledOpen && state.matches("closed")) {
      send({ type: "CONTROLLED.OPEN" });
    } else if (!controlledOpen && state.hasTag("open")) {
      send({ type: "CONTROLLED.CLOSE" });
    }
  },

  exit: ["cleanup"],

  states: {
    closed: {
      tags: ["closed"],
      entry: ["resetTimers"],
      on: {
        "CONTROLLED.OPEN": {
          target: "open",
          actions: ["invokeOnOpen"],
        },
      },
    },

    open: {
      tags: ["open"],
      effects: ["manageDismissTimer"],
      on: {
        ...activeToastTransitions,
        PAUSE: {
          target: "paused",
          actions: ["pauseTimer"],
        },
      },
    },

    paused: {
      tags: ["open", "paused"],
      on: {
        ...activeToastTransitions,
        RESUME: {
          target: "open",
        },
      },
    },

    dismissing: {
      tags: ["dismissing"],
      effects: ["waitForDismissAnimation"],
      on: {
        "CONTROLLED.OPEN": {
          target: "open",
          actions: ["invokeOnOpen"],
        },
        ANIMATION_END: {
          target: "closed",
          actions: ["invokeOnDismiss"],
        },
      },
    },
  },

  implementations: {
    actions: {
      invokeOnOpen: ({ prop }) => {
        prop("onOpenChange")?.({ open: true, id: prop("id") });
      },
      invokeOnClose: ({ prop }) => {
        prop("onOpenChange")?.({ open: false, id: prop("id") });
      },
      invokeOnDismiss: ({ prop, scope }) => {
        const id = prop("id") || scope.id;
        prop("onDismiss")?.({ id });
      },
      invokeOnAction: ({ prop, event }) => {
        if (event.type === "TRIGGER_ACTION") {
          const action = event.action as ToastAction;
          action.onClick?.();
          prop("onAction")?.({ action, index: event.index, id: prop("id") });
        }
      },
      pauseTimer: ({ refs, prop }) => {
        const duration = prop("duration") ?? defaultToastProps.duration ?? 4000;
        const startedAt = refs.get("startedAt");
        if (startedAt !== undefined) {
          const elapsed = Date.now() - startedAt;
          const currentRemaining = refs.get("remainingTime") ?? duration;
          refs.set("remainingTime", Math.max(0, currentRemaining - elapsed));
        }
        const timer = refs.get("timer");
        if (timer !== undefined) {
          clearTimeout(timer);
          refs.set("timer", undefined);
        }
      },
      resetTimers: ({ refs }) => {
        const timer = refs.get("timer");
        if (timer !== undefined) {
          clearTimeout(timer);
          refs.set("timer", undefined);
        }
        refs.set("remainingTime", undefined);
        refs.set("startedAt", undefined);
      },
      cleanup: ({ refs }) => {
        const timer = refs.get("timer");
        if (timer !== undefined) {
          clearTimeout(timer);
          refs.set("timer", undefined);
        }
        const dismissTimer = refs.get("dismissTimer");
        if (dismissTimer !== undefined) {
          clearTimeout(dismissTimer);
          refs.set("dismissTimer", undefined);
        }
        refs.set("remainingTime", undefined);
        refs.set("startedAt", undefined);
      },
    },

    effects: {
      manageDismissTimer: ({ send, prop, refs }) => {
        const duration = prop("duration") ?? defaultToastProps.duration ?? 4000;
        if (duration <= 0) return () => {};

        const remaining = refs.get("remainingTime") ?? duration;
        refs.set("startedAt", Date.now());

        const timer = setTimeout(() => {
          send({ type: "DISMISS" });
        }, remaining);

        refs.set("timer", timer);

        return () => {
          const t = refs.get("timer");
          if (t !== undefined) {
            clearTimeout(t);
            refs.set("timer", undefined);
          }
        };
      },

      waitForDismissAnimation: ({ send, refs }) => {
        const timer = setTimeout(() => {
          send({ type: "ANIMATION_END" });
        }, DISMISS_ANIMATION_DURATION);

        refs.set("dismissTimer", timer);

        return () => {
          clearTimeout(timer);
          refs.set("dismissTimer", undefined);
        };
      },
    },
  },
});
