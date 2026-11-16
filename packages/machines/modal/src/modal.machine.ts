import { createMachine } from "@code-ui/core";
import { isMiniApp, isNotNull, queryAnimationDuration } from "@code-ui/utils";
import * as dom from "./modal.dom";
import { defaultModalProps } from "./modal.props";
import type { ModalMachine, ModalParams, ModalSchema } from "./modal.types";

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
  "TRIGGER.TAP": {
    target: "open" as const,
    actions: ["invokeOnOpen" as const],
  },
};

const openCloseTransitions = [
  {
    guard: "isInstantClose" as const,
    target: "closed" as const,
    actions: ["invokeOnClose" as const, "invokeOnAfterLeave" as const],
  },
  {
    target: "closing" as const,
    actions: ["invokeOnClose" as const],
  },
];

function scheduleTransitionEffect(
  prop: ModalParams["prop"],
  scope: ModalParams["scope"],
  onComplete: () => void,
): VoidFunction {
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
      if (!cancelled) onComplete();
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
}

export const modalMachine: ModalMachine = createMachine<ModalSchema>({
  props: ({ props }) => ({
    ...defaultModalProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    const rawOpen = prop("open");
    const isOpen = isNotNull(rawOpen) ? Boolean(rawOpen) : prop("defaultOpen");
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
        state.set(prop("transition") === false ? "closed" : "closing");
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
      effects: ["waitForEnterAnimation"],
      on: {
        CLOSE: openCloseTransitions,
        TOGGLE: openCloseTransitions,
        "CLOSE_TRIGGER.TAP": openCloseTransitions,
        "OVERLAY.TAP": [
          {
            guard: "cannotDismissOnOverlay",
            actions: ["invokeOnClosePrevent"],
          },
          ...openCloseTransitions,
        ],
        KEYBOARD_CHANGE: {
          actions: ["setKeyboardHeight"],
        },
      },
    },

    closing: {
      tags: ["closing"],
      effects: ["waitForCloseAnimation"],
      on: {
        ANIMATION_END: {
          target: "closed",
          actions: ["invokeOnAfterLeave"],
        },
        ...closedTransitions,
      },
    },
  },

  implementations: {
    guards: {
      cannotDismissOnOverlay: ({ prop }) =>
        prop("dismissible") === false || prop("closeOnBackdropClick") === false,
      isInstantClose: ({ prop }) => prop("transition") === false,
    },

    actions: {
      invokeOnOpen: ({ prop }) => {
        prop("onOpenChange")?.({ open: true });
        prop("onEnter")?.();
      },
      invokeOnClose: ({ prop }) => {
        prop("onOpenChange")?.({ open: false });
        prop("onClose")?.();
        prop("onLeave")?.();
      },
      invokeOnAfterLeave: ({ prop }) => {
        prop("onAfterLeave")?.();
      },
      invokeOnClosePrevent: ({ prop }) => {
        prop("onClosePrevent")?.();
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

      waitForEnterAnimation: ({ prop, scope }) => {
        const onAfterEnter = prop("onAfterEnter");
        if (!onAfterEnter) return;

        if (prop("transition") === false) {
          onAfterEnter();
          return;
        }

        return scheduleTransitionEffect(prop, scope, () => {
          prop("onAfterEnter")?.();
        });
      },

      waitForCloseAnimation: ({ send, scope, prop }) => {
        return scheduleTransitionEffect(prop, scope, () => {
          send({ type: "ANIMATION_END" });
        });
      },
    },
  },
});
