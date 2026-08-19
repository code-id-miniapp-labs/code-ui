import { createMachine } from "@code-ui/core";
import type { ButtonMachine, ButtonSchema } from "./button.types";
import { defaultButtonProps } from "./button.props";

export const buttonMachine: ButtonMachine = createMachine<ButtonSchema>({
  props: ({ props }) => ({
    ...defaultButtonProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    return prop("loading") ? "loading" : "idle";
  },

  context: ({ prop, bindable }) => ({
    loading: bindable<boolean>(() => ({
      value: prop("loading"),
      defaultValue: false,
    })),
    disabled: bindable<boolean>(() => ({
      value: prop("disabled"),
      defaultValue: false,
    })),
    variant: bindable<any>(() => ({
      value: prop("variant"),
      defaultValue: "primary",
    })),
    size: bindable<any>(() => ({
      value: prop("size"),
      defaultValue: "md",
    })),
    ui: bindable<any>(() => ({
      value: prop("ui") ?? {},
      defaultValue: {},
    })),

  }),


  computed: {
    isLoading: ({ context }) => context.get("loading"),
    isDisabled: ({ context }) =>
      context.get("disabled") || context.get("loading"),
    isInteractive: ({ context }) =>
      !context.get("disabled") && !context.get("loading"),
  },

  watch: ({ prop, state, send }) => {
    const controlledLoading = prop("loading");
    if (controlledLoading !== undefined) {
      if (controlledLoading && !state.matches("loading")) {
        send({ type: "SET_LOADING", loading: true });
      } else if (!controlledLoading && state.matches("loading")) {
        send({ type: "SET_LOADING", loading: false });
      }
    }
  },

  states: {
    idle: {
      on: {
        TAP: [
          {
            guard: "isInteractiveAndHasAsyncHandler",
            target: "loading",
            actions: ["executeAsyncHandler"],
          },
          {
            guard: "isInteractive",
            actions: ["executeTapHandler"],
          },
        ],
        SET_LOADING: {
          target: "loading",
          guard: "isLoadingTrue",
          actions: ["setLoadingContext"],
        },
        SET_DISABLED: {
          actions: ["setDisabledContext"],
        },
      },
    },

    loading: {
      tags: ["loading", "disabled"],
      on: {
        RESOLVE: {
          target: "success",
          actions: ["clearLoadingContext"],
        },
        REJECT: {
          target: "error",
          actions: ["clearLoadingContext"],
        },
        SET_LOADING: {
          target: "idle",
          guard: "isLoadingFalse",
          actions: ["clearLoadingContext"],
        },
        RESET: {
          target: "idle",
          actions: ["clearLoadingContext"],
        },
      },
    },

    success: {
      effects: ["autoResetEffect"],
      on: {
        TAP: {
          target: "idle",
        },
        RESET: {
          target: "idle",
        },
      },
    },

    error: {
      effects: ["autoResetEffect"],
      on: {
        TAP: {
          target: "idle",
        },
        RESET: {
          target: "idle",
        },
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ context }) =>
        !context.get("disabled") && !context.get("loading"),
      isLoadingTrue: ({ event }) =>
        "loading" in event && event.loading === true,
      isLoadingFalse: ({ event }) =>
        "loading" in event && event.loading === false,
      isInteractiveAndHasAsyncHandler: ({ context, prop }) => {
        if (context.get("disabled") || context.get("loading")) return false;
        return Boolean(prop("loadingAuto") && prop("onTap"));
      },
    },

    actions: {
      setLoadingContext: ({ context }) => {
        context.set("loading", true);
      },
      clearLoadingContext: ({ context }) => {
        context.set("loading", false);
      },
      setDisabledContext: ({ context, event }) => {
        if ("disabled" in event) {
          context.set("disabled", event.disabled);
        }
      },
      executeTapHandler: ({ prop, event }) => {
        const rawEvent = "event" in event ? event.event : undefined;
        prop("onTap")?.(rawEvent);
      },
      executeAsyncHandler: ({ prop, event, send }) => {
        const rawEvent = "event" in event ? event.event : undefined;
        const result = prop("onTap")?.(rawEvent);
        if (result && typeof (result as any).then === "function") {
          Promise.resolve(result)
            .then(() => {
              send({ type: "RESOLVE" });
            })
            .catch((err) => {
              send({ type: "REJECT", error: err });
            });
        } else {
          send({ type: "RESOLVE" });
        }
      },
    },

    effects: {
      autoResetEffect: ({ prop, send }) => {
        const duration = prop("autoResetDuration") ?? 1500;
        if (duration <= 0) {
          send({ type: "RESET" });
          return;
        }
        const timer = setTimeout(() => {
          send({ type: "RESET" });
        }, duration);
        return () => clearTimeout(timer);
      },
    },
  },
});
