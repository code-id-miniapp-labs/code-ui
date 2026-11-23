import { createMachine } from "@code-id-labs/core";
import { isNotNull, scheduleAnimationEnd } from "@code-id-labs/utils";
import * as dom from "./modal.dom";
import { defaultModalProps } from "./modal.props";
import type { ModalMachine, ModalSchema } from "./modal.types";

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

  watch: ({ prop, state, track }) => {
    track([() => prop("open")], () => {
      const rawOpen = prop("open");
      if (!isNotNull(rawOpen)) return;

      const shouldBeOpen = Boolean(rawOpen);
      const isCurrentlyOpen = state.hasTag("open");
      if (shouldBeOpen && !isCurrentlyOpen) {
        state.set("open");
      } else if (!shouldBeOpen && isCurrentlyOpen) {
        if (prop("transition") === false) {
          state.set("closed");
          prop("onAfterLeave")?.();
          prop("onExitComplete")?.();
        } else {
          state.set("closing");
        }
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
      effects: ["listenKeyboardHeight", "waitForEnterAnimation"],
      on: {
        CLOSE: openCloseTransitions,
        TOGGLE: openCloseTransitions,
        "CLOSE_TRIGGER.TAP": [
          {
            guard: "isInstantClose" as const,
            target: "closed" as const,
            actions: [
              "invokeOnCloseTriggerTap" as const,
              "invokeOnClose" as const,
              "invokeOnAfterLeave" as const,
            ],
          },
          {
            target: "closing" as const,
            actions: [
              "invokeOnCloseTriggerTap" as const,
              "invokeOnClose" as const,
            ],
          },
        ],
        "OVERLAY.TAP": [
          {
            guard: "cannotDismissOnOverlay",
            actions: ["invokeOnOverlayTap", "invokeOnClosePrevent"],
          },
          {
            guard: "isInstantClose" as const,
            target: "closed" as const,
            actions: [
              "invokeOnOverlayTap" as const,
              "invokeOnClose" as const,
              "invokeOnAfterLeave" as const,
            ],
          },
          {
            target: "closing" as const,
            actions: ["invokeOnOverlayTap" as const, "invokeOnClose" as const],
          },
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
        prop("onExitComplete")?.();
      },
      invokeOnClosePrevent: ({ prop }) => {
        prop("onClosePrevent")?.();
      },
      invokeOnOverlayTap: ({ prop }) => {
        prop("onOverlayTap")?.();
      },
      invokeOnCloseTriggerTap: ({ prop }) => {
        prop("onCloseTriggerTap")?.();
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

        return scheduleAnimationEnd({
          duration: prop("duration"),
          selector: dom.getContentSelector(scope),
          component: scope.component,
          fallbackDuration: DEFAULT_ANIMATION_DURATION,
          onEnd: () => {
            prop("onAfterEnter")?.();
          },
        });
      },

      waitForCloseAnimation: ({ send, scope, prop }) => {
        return scheduleAnimationEnd({
          duration: prop("duration"),
          selector: dom.getContentSelector(scope),
          component: scope.component,
          fallbackDuration: DEFAULT_ANIMATION_DURATION,
          onEnd: () => {
            send({ type: "ANIMATION_END" });
          },
        });
      },
    },
  },
});
