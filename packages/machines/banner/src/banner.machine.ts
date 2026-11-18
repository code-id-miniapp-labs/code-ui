import { createMachine } from "@code-id-labs/core";
import { isNotNull } from "@code-id-labs/utils";
import type {
  BannerMachine,
  BannerParams,
  BannerSchema,
} from "./banner.types";
import { defaultBannerProps } from "./banner.props";

const DISMISS_ANIMATION_DURATION = 200;

function resolveId(
  prop: BannerParams["prop"],
  scope: BannerParams["scope"],
): string | undefined {
  return prop("id") || scope?.id;
}

export const bannerMachine: BannerMachine = createMachine<BannerSchema>({
  props: ({ props }) => ({
    ...defaultBannerProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    const rawOpen = prop("open");
    return (isNotNull(rawOpen) ? Boolean(rawOpen) : prop("defaultOpen"))
      ? "open"
      : "closed";
  },

  context: () => ({}),

  computed: {
    isOpen: ({ state }) => state.hasTag("open"),
    isVisible: ({ state }) =>
      state.hasTag("open") || state.hasTag("dismissing"),
    isDismissing: ({ state }) => state.hasTag("dismissing"),
  },

  watch: ({ prop, state, track }) => {
    track([() => prop("open")], () => {
      const controlledOpen = prop("open");
      if (!isNotNull(controlledOpen)) return;

      if (controlledOpen) {
        if (!state.matches("open")) state.set("open");
      } else if (state.matches("open")) {
        state.set("dismissing");
      }
    });
  },

  on: {
    MORE: { actions: ["invokeOnMore"] },
    TAP: { actions: ["invokeOnTap"] },
  },

  states: {
    closed: {
      tags: ["closed"],
    },

    open: {
      tags: ["open"],
      on: {
        DISMISS: {
          target: "dismissing",
          actions: ["invokeOnDismiss", "emitOpenChange"],
        },
        TRIGGER_ACTION: [
          {
            guard: "shouldCloseOnAction",
            target: "dismissing",
            actions: ["invokeOnAction", "invokeOnDismiss", "emitOpenChange"],
          },
          {
            actions: ["invokeOnAction"],
          },
        ],
      },
    },

    dismissing: {
      tags: ["dismissing"],
      effects: ["waitForDismissAnimation"],
      on: {
        ANIMATION_END: {
          target: "closed",
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

    effects: {
      waitForDismissAnimation: ({ send }) => {
        const id = setTimeout(() => {
          send({ type: "ANIMATION_END" });
        }, DISMISS_ANIMATION_DURATION);
        return () => clearTimeout(id);
      },
    },

    actions: {
      invokeOnTap: ({ prop, scope }) => {
        prop("onTap")?.({ id: resolveId(prop, scope) });
      },

      invokeOnMore: ({ prop, scope }) => {
        prop("onMore")?.({ id: resolveId(prop, scope) });
      },

      invokeOnDismiss: ({ prop, scope }) => {
        prop("onDismiss")?.({ id: resolveId(prop, scope) });
      },

      emitOpenChange: ({ prop, scope, state }) => {
        prop("onOpenChange")?.({
          open: state.matches("open"),
          id: resolveId(prop, scope),
        });
      },

      invokeOnAction: ({ prop, scope, event }) => {
        if (event.type !== "TRIGGER_ACTION") return;
        const action = prop("actions")[event.index];
        if (!action) return;
        const id = resolveId(prop, scope);
        action.onClick?.();
        prop("onAction")?.({
          action,
          index: event.index,
          id,
        });
      },
    },
  },
});
