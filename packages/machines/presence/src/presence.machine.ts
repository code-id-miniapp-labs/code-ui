import { createMachine } from "@code-id-labs/core";
import { scheduleAnimationEnd } from "@code-id-labs/utils";
import * as dom from "./presence.dom";
import { defaultPresenceProps } from "./presence.props";
import type { PresenceMachine, PresenceSchema } from "./presence.types";

const DEFAULT_ANIMATION_DURATION = 300;

const hideTransitions = [
  {
    guard: "isImmediateExit" as const,
    target: "unmounted" as const,
    actions: ["invokeOnExitComplete" as const],
  },
  {
    target: "exiting" as const,
  },
];

export const presenceMachine: PresenceMachine = createMachine<PresenceSchema>({
  props: ({ props }) => ({
    ...defaultPresenceProps,
    ...props,
  }),

  initialState: ({ prop }) => (prop("present") ? "open" : "unmounted"),

  context: ({ bindable, prop }) => ({
    hasMountedOnce: bindable<boolean>(() => ({
      defaultValue: Boolean(prop("present")),
    })),
  }),

  computed: {
    isPresent: ({ state }) => state.matches("open"),
    isExiting: ({ state }) => state.matches("exiting"),
    isVisible: ({ state }) => state.matches("open", "exiting"),
    isMounted: ({ state, prop, context }) =>
      state.matches("open", "exiting") ||
      (!prop("unmountOnExit") &&
        (!prop("lazyMount") || context.get("hasMountedOnce"))),
    dataState: ({ state }) => (state.matches("open") ? "open" : "closed"),
  },

  watch: ({ prop, state, track, action }) => {
    track([() => prop("present")], () => {
      const shouldBePresent = Boolean(prop("present"));
      const currentState = state.get();

      if (shouldBePresent && currentState !== "open") {
        state.set("open");
      } else if (!shouldBePresent && currentState === "open") {
        if (prop("duration") === 0) {
          state.set("unmounted");
          action(["invokeOnExitComplete"]);
        } else {
          state.set("exiting");
        }
      }
    });
  },

  states: {
    unmounted: {
      tags: ["unmounted", "closed"],
      on: {
        PRESENT: { target: "open" },
        OPEN: { target: "open" },
      },
    },

    open: {
      tags: ["open", "present", "mounted"],
      entry: ["markMountedOnce"],
      on: {
        HIDE: hideTransitions,
        CLOSE: hideTransitions,
      },
    },

    exiting: {
      tags: ["exiting", "closing", "mounted"],
      effects: ["waitForExitAnimation"],
      on: {
        ANIMATION_END: {
          target: "unmounted",
          actions: ["invokeOnExitComplete"],
        },
        PRESENT: { target: "open" },
        OPEN: { target: "open" },
      },
    },
  },

  implementations: {
    guards: {
      isImmediateExit: ({ prop }) => prop("duration") === 0,
    },

    actions: {
      markMountedOnce: ({ context }) => {
        if (!context.get("hasMountedOnce")) {
          context.set("hasMountedOnce", true);
        }
      },

      invokeOnExitComplete: ({ prop }) => {
        prop("onExitComplete")?.();
      },
    },

    effects: {
      waitForExitAnimation: ({ send, scope, prop }) => {
        return scheduleAnimationEnd({
          duration: prop("duration"),
          selector: dom.getRootSelector(scope),
          component: scope.component,
          fallbackDuration: DEFAULT_ANIMATION_DURATION,
          onEnd: () => send({ type: "ANIMATION_END" }),
        });
      },
    },
  },
});
