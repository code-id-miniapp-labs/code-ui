import { createMachine } from "@code-ui/core";
import { isMiniApp, isNotNull, queryRect } from "@code-ui/utils";
import type {
  BannerMachine,
  BannerParams,
  BannerSchema,
} from "./banner.types";
import { defaultBannerProps } from "./banner.props";

const DISMISS_ANIMATION_DURATION = 200;

function measureBannerHeight(
  scope: BannerParams["scope"] | undefined,
  context: BannerParams["context"],
): void {
  const comp = scope?.component;
  const canQuery =
    Boolean(
      comp &&
        typeof (comp as { createSelectorQuery?: unknown })
          .createSelectorQuery === "function",
    ) || isMiniApp();
  if (!canQuery) return;

  queryRect(".cui-banner-root", comp)
    .then((res) => {
      if (
        res &&
        typeof res.height === "number" &&
        res.height > 0 &&
        res.height !== context.get("height")
      ) {
        context.set("height", res.height);
      }
    })
    .catch(() => {});
}

export const bannerMachine: BannerMachine = createMachine<BannerSchema>({
  props: ({ props }) => ({
    ...defaultBannerProps,
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
    dismissTimer: undefined,
  }),

  context: ({ bindable }) => ({
    height: bindable<number>(() => ({
      defaultValue: 0,
    })),
  }),

  computed: {
    isOpen: ({ state }) => state.hasTag("open"),
    isVisible: ({ state }) =>
      state.hasTag("open") || state.hasTag("dismissing"),
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
      entry: ["resetHeight"],
      on: {
        "CONTROLLED.OPEN": {
          target: "open",
          actions: ["invokeOnOpenChangeTrue"],
        },
        MEASURE: {
          actions: ["resetHeight"],
        },
      },
    },

    open: {
      tags: ["open"],
      effects: ["measureOnOpen"],
      on: {
        DISMISS: {
          target: "dismissing",
          actions: ["invokeOnDismiss", "invokeOnOpenChangeFalse"],
        },
        "CONTROLLED.CLOSE": {
          target: "dismissing",
          actions: ["invokeOnOpenChangeFalse"],
        },
        MEASURE: {
          actions: ["measureHeightAction"],
        },
        TRIGGER_ACTION: [
          {
            guard: "shouldCloseOnAction",
            target: "dismissing",
            actions: [
              "invokeOnAction",
              "invokeOnDismiss",
              "invokeOnOpenChangeFalse",
            ],
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
        "CONTROLLED.OPEN": {
          target: "open",
          actions: ["invokeOnOpenChangeTrue"],
        },
      },
    },
  },

  implementations: {
    guards: {
      shouldCloseOnAction: ({ event }) =>
        Boolean(event?.type === "TRIGGER_ACTION" && event.action?.closeOnClick),
    },

    effects: {
      measureOnOpen: ({ scope, context }) => {
        measureBannerHeight(scope, context);
        const timer = setTimeout(() => {
          measureBannerHeight(scope, context);
        }, 50);
        return () => clearTimeout(timer);
      },

      waitForDismissAnimation: ({ send }) => {
        const id = setTimeout(() => {
          send({ type: "ANIMATION_END" });
        }, DISMISS_ANIMATION_DURATION);
        return () => clearTimeout(id);
      },
    },

    actions: {
      measureHeightAction: ({ scope, context }) => {
        measureBannerHeight(scope, context);
      },

      resetHeight: ({ context }) => {
        if (context.get("height") !== 0) {
          context.set("height", 0);
        }
      },

      invokeOnDismiss: ({ prop, scope }) => {
        const id = prop("id") || scope?.id;
        prop("onDismiss")?.({ id });
      },

      invokeOnOpenChangeFalse: ({ prop, scope }) => {
        const id = prop("id") || scope?.id;
        prop("onOpenChange")?.({ open: false, id });
      },

      invokeOnOpenChangeTrue: ({ prop, scope }) => {
        const id = prop("id") || scope?.id;
        prop("onOpenChange")?.({ open: true, id });
      },

      invokeOnAction: ({ prop, scope, event }) => {
        if (event?.type !== "TRIGGER_ACTION") return;
        const id = prop("id") || scope?.id;
        const details = {
          action: event.action,
          index: event.index,
          id,
        };
        event.action.onClick?.();
        prop("onAction")?.(details);
      },

      cleanup: ({ refs }) => {
        if (refs.get("dismissTimer")) {
          clearTimeout(refs.get("dismissTimer"));
          refs.set("dismissTimer", undefined);
        }
      },
    },
  },
});
