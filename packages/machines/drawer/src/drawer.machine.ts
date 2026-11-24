import { createMachine } from "@code-id-labs/core";
import type { DrawerMachine, DrawerSchema } from "./drawer.types";
import { defaultDrawerProps } from "./drawer.props";
import * as dom from "./drawer.dom";
import { isNotNull, scheduleAnimationEnd } from "@code-id-labs/utils";

const DEFAULT_ANIMATION_DURATION = 300;

interface WxKeyboardApi {
  onKeyboardHeightChange?: (cb: (res: { height?: number }) => void) => void;
  offKeyboardHeightChange?: (cb: (res: { height?: number }) => void) => void;
  hideKeyboard?: () => void;
}

declare const wx: WxKeyboardApi | undefined;

function getWx(): WxKeyboardApi | undefined {
  if (typeof wx !== "undefined" && wx) return wx;
  return (globalThis as { wx?: WxKeyboardApi }).wx;
}

type KeyboardDispatch = (height: number) => void;
const activeKeyboardStack: KeyboardDispatch[] = [];
let sharedKeyboardHandler: ((res: { height?: number }) => void) | null = null;
let lastKnownKeyboardHeight = 0;

function registerTopmostKeyboardListener(
  dispatch: KeyboardDispatch,
): () => void {
  const wxApi = getWx();
  if (!wxApi?.onKeyboardHeightChange) {
    return () => {};
  }

  // If an underlying drawer was lifted by the keyboard, reset it so only the
  // newly opened topmost drawer tracks keyboard height changes.
  const prevTop = activeKeyboardStack[activeKeyboardStack.length - 1];
  if (prevTop && prevTop !== dispatch && lastKnownKeyboardHeight > 0) {
    prevTop(0);
  }

  const existingIdx = activeKeyboardStack.indexOf(dispatch);
  if (existingIdx !== -1) {
    activeKeyboardStack.splice(existingIdx, 1);
  }
  activeKeyboardStack.push(dispatch);

  if (!sharedKeyboardHandler) {
    sharedKeyboardHandler = (res: { height?: number }) => {
      const height = Math.max(0, Number(res?.height) || 0);
      lastKnownKeyboardHeight = height;
      const top = activeKeyboardStack[activeKeyboardStack.length - 1];
      top?.(height);
    };
    wxApi.onKeyboardHeightChange(sharedKeyboardHandler);
  }

  return () => {
    const idx = activeKeyboardStack.indexOf(dispatch);
    if (idx !== -1) {
      activeKeyboardStack.splice(idx, 1);
    }
    if (activeKeyboardStack.length === 0 && sharedKeyboardHandler) {
      getWx()?.offKeyboardHeightChange?.(sharedKeyboardHandler);
      sharedKeyboardHandler = null;
      lastKnownKeyboardHeight = 0;
    }
  };
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
      effects: ["listenKeyboardHeight"],
      on: {
        CLOSE: {
          target: "closing",
          actions: ["invokeOnClose"],
        },
        TOGGLE: {
          target: "closing",
          actions: ["invokeOnClose"],
        },
        "BACKDROP.TAP": [
          {
            target: "closing",
            guard: "closeOnBackdropClick",
            actions: ["invokeOnBackdropTap", "invokeOnClose"],
          },
          {
            actions: ["invokeOnBackdropTap"],
          },
        ],
        "CLOSE_TRIGGER.TAP": {
          target: "closing",
          actions: ["invokeOnCloseTriggerTap", "invokeOnClose"],
        },
        DRAG_START: [
          {
            target: "dragging",
            guard: "isDismissible",
            actions: ["invokeOnDragStart"],
          },
          {
            actions: ["invokeOnDragStart"],
          },
        ],
        DRAG_MOVE: {
          actions: ["invokeOnDrag"],
        },
        KEYBOARD_CHANGE: {
          actions: ["setKeyboardHeight"],
        },
      },
    },

    dragging: {
      tags: ["open", "dragging"],
      effects: ["listenKeyboardHeight"],
      on: {
        DRAG_MOVE: {
          actions: ["invokeOnDrag"],
        },
        DRAG_END: [
          {
            target: "closing",
            guard: "dragPassed",
            actions: ["invokeOnDragEnd", "invokeOnClose"],
          },
          {
            target: "open",
            actions: ["invokeOnDragEnd"],
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
          actions: ["invokeOnExitComplete"],
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
      invokeOnClose: ({ context, prop }) => {
        if (context.get("keyboardHeight") > 0) {
          getWx()?.hideKeyboard?.();
        }
        prop("onOpenChange")?.({ open: false });
        prop("onClose")?.();
      },
      invokeOnExitComplete: ({ prop }) => {
        prop("onExitComplete")?.();
      },
      invokeOnBackdropTap: ({ prop }) => {
        prop("onBackdropTap")?.();
      },
      invokeOnCloseTriggerTap: ({ prop }) => {
        prop("onCloseTriggerTap")?.();
      },
      invokeOnDragStart: ({ prop, event }) => {
        if (event.type === "DRAG_START") {
          prop("onDragStart")?.(event.data ?? {});
        }
      },
      invokeOnDrag: ({ prop, event }) => {
        if (event.type === "DRAG_MOVE") {
          prop("onDrag")?.(event.data ?? {});
        }
      },
      invokeOnDragEnd: ({ prop, event }) => {
        if (event.type === "DRAG_END") {
          prop("onDragEnd")?.(event.data ?? { passed: event.passed });
        }
      },
      setKeyboardHeight: ({ context, event }) => {
        if (event.type === "KEYBOARD_CHANGE") {
          const next = Math.max(0, Number(event.height) || 0);
          if (context.get("keyboardHeight") !== next) {
            context.set("keyboardHeight", next);
          }
        }
      },
      resetKeyboardHeight: ({ context }) => {
        if (context.get("keyboardHeight") !== 0) {
          context.set("keyboardHeight", 0);
        }
      },
    },

    effects: {
      listenKeyboardHeight: ({ send }) => {
        return registerTopmostKeyboardListener((height) => {
          send({
            type: "KEYBOARD_CHANGE",
            height,
          });
        });
      },

      waitForCloseAnimation: ({ send, scope, prop }) => {
        return scheduleAnimationEnd({
          duration: prop("duration"),
          selector: dom.getContentSelector(scope),
          component: scope.component,
          fallbackDuration: DEFAULT_ANIMATION_DURATION,
          onEnd: () => send({ type: "ANIMATION_END" }),
        });
      },
    },
  },
});
