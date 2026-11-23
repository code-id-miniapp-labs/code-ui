import { createMachine } from "@code-id-labs/core";
import { isNotNull, scheduleAnimationEnd } from "@code-id-labs/utils";
import type {
  ToastMachine,
  ToastParams,
  ToastSchema,
} from "./toast.types";
import { defaultToastProps } from "./toast.props";

const DISMISS_ANIMATION_DURATION = 200;

function scheduleDismissTimer(
  refs: ToastParams["refs"],
  prop: ToastParams["prop"],
  send: ToastParams["send"],
): void {
  clearAutoDismissTimer(refs);
  const duration = prop("duration");
  if (duration <= 0) return;

  const remaining = refs.get("remainingTime") ?? duration;
  refs.set("startedAt", Date.now());

  const timer = setTimeout(() => {
    send({ type: "DISMISS" });
  }, remaining);

  refs.set("timer", timer);
}

function clearAutoDismissTimer(refs: ToastParams["refs"]): void {
  const timer = refs.get("timer");
  if (timer !== undefined) {
    clearTimeout(timer);
    refs.set("timer", undefined);
  }
}

const activeToastTransitions = {
  DISMISS: {
    target: "dismissing" as const,
    actions: ["invokeOnClose" as const],
  },
  TRIGGER_ACTION: [
    {
      guard: "shouldCloseOnAction" as const,
      target: "dismissing" as const,
      actions: ["invokeOnAction" as const, "invokeOnClose" as const],
    },
    {
      actions: ["invokeOnAction" as const],
    },
  ],
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
      : prop("defaultOpen");
    return isOpen ? "open" : "closed";
  },

  refs: () => ({
    timer: undefined,
    dismissTimer: undefined,
    remainingTime: undefined,
    startedAt: undefined,
  }),

  context: () => ({}),

  computed: {
    isOpen: ({ state }) => state.hasTag("open"),
    isVisible: ({ state }) =>
      state.hasTag("open") || state.hasTag("dismissing"),
    isPaused: ({ state }) => state.hasTag("paused"),
    isDismissing: ({ state }) => state.hasTag("dismissing"),
  },

  watch: ({ prop, state, track, refs, send }) => {
    track([() => prop("duration")], () => {
      refs.set("remainingTime", undefined);
      refs.set("startedAt", undefined);
      clearAutoDismissTimer(refs);
      if (state.matches("open")) {
        scheduleDismissTimer(refs, prop, send);
      }
    });
    track([() => prop("open")], () => {
      const controlledOpen = prop("open");
      if (!isNotNull(controlledOpen)) return;

      if (controlledOpen && (state.matches("closed") || state.matches("dismissing"))) {
        prop("onOpenChange")?.({
          open: true,
          id: prop("id"),
        });
        state.set("open");
      } else if (!controlledOpen && state.hasTag("open")) {
        state.set("dismissing");
      }
    });
  },

  exit: ["cleanup"],

  states: {
    closed: {
      tags: ["closed"],
      entry: ["resetTimers"],
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
        ANIMATION_END: {
          target: "closed",
          actions: ["invokeOnDismiss"],
        },
      },
    },
  },

  implementations: {
    guards: {
      shouldCloseOnAction: ({ prop, event }) =>
        event.type === "TRIGGER_ACTION" &&
        Boolean(prop("actions")[event.index]?.closeOnClick),
    },

    actions: {
      invokeOnClose: ({ prop }) => {
        prop("onOpenChange")?.({ open: false, id: prop("id") });
      },
      invokeOnDismiss: ({ prop, scope }) => {
        const id = prop("id") || scope.id;
        prop("onDismiss")?.({ id });
        prop("onExitComplete")?.();
      },
      invokeOnAction: ({ prop, event }) => {
        if (event.type !== "TRIGGER_ACTION") return;
        const action = prop("actions")[event.index];
        if (!action) return;
        action.onClick?.();
        prop("onAction")?.({ action, index: event.index, id: prop("id") });
      },
      pauseTimer: ({ refs, prop }) => {
        const duration = prop("duration");
        const startedAt = refs.get("startedAt");
        if (startedAt !== undefined) {
          const elapsed = Date.now() - startedAt;
          const currentRemaining = refs.get("remainingTime") ?? duration;
          refs.set("remainingTime", Math.max(0, currentRemaining - elapsed));
        }
        clearAutoDismissTimer(refs);
      },
      resetTimers: ({ refs }) => {
        clearAutoDismissTimer(refs);
        refs.set("remainingTime", undefined);
        refs.set("startedAt", undefined);
      },
      cleanup: ({ refs }) => {
        clearAutoDismissTimer(refs);
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
        scheduleDismissTimer(refs, prop, send);

        return () => {
          clearAutoDismissTimer(refs);
        };
      },

      waitForDismissAnimation: ({ send }) => {
        return scheduleAnimationEnd({
          duration: DISMISS_ANIMATION_DURATION,
          onEnd: () => send({ type: "ANIMATION_END" }),
        });
      },
    },
  },
});
