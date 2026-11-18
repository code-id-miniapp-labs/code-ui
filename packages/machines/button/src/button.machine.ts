import { createMachine } from "@code-id-labs/core";
import { isPromise } from "@code-id-labs/utils";
import type { ButtonMachine, ButtonSchema } from "./button.types";
import { defaultButtonProps } from "./button.props";

const settledStateTransitions = {
  TAP: [
    {
      guard: "isInteractiveAndHasAsyncHandler" as const,
      target: "loading" as const,
      actions: ["executeAsyncHandler" as const],
    },
    {
      guard: "isInteractive" as const,
      target: "idle" as const,
      actions: ["executeTapHandler" as const],
    },
    {
      target: "idle" as const,
    },
  ],
  SET_LOADING: {
    target: "loading" as const,
    guard: "isLoadingTrue" as const,
    actions: ["setLoadingContext" as const],
  },
  RESET: {
    target: "idle" as const,
  },
};

export const buttonMachine: ButtonMachine = createMachine<ButtonSchema>({
  props: ({ props }) => ({
    ...defaultButtonProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    return prop("loading") ? "loading" : "idle";
  },

  context: ({ prop, bindable }) => ({
    internalLoading: bindable<boolean>(() => ({
      defaultValue: false,
    })),
    loading: bindable<boolean>(() => ({
      value: prop("loading"),
      defaultValue: defaultButtonProps.loading,
    })),
    disabled: bindable<boolean>(() => ({
      value: prop("disabled"),
      defaultValue: defaultButtonProps.disabled,
    })),
  }),

  computed: {
    isLoading: ({ context }) =>
      Boolean(context.get("loading") || context.get("internalLoading")),
    isDisabled: ({ context }) => Boolean(context.get("disabled")),
    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isLoading"),
  },

  watch: ({ prop, state, context, track }) => {
    track([() => prop("loading")], () => {
      const nextLoading = prop("loading");
      if (nextLoading) {
        if (!state.matches("loading")) {
          state.set("loading");
        }
      } else if (state.matches("loading") && !context.get("internalLoading")) {
        state.set("idle");
      }
    });
  },

  on: {
    SET_DISABLED: {
      actions: ["setDisabledContext"],
    },
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
      on: settledStateTransitions,
    },

    error: {
      effects: ["autoResetEffect"],
      on: settledStateTransitions,
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
      isLoadingTrue: ({ event }) =>
        "loading" in event && event.loading === true,
      isLoadingFalse: ({ event }) =>
        "loading" in event && event.loading === false,
      isInteractiveAndHasAsyncHandler: ({ computed, prop }) =>
        computed("isInteractive") &&
        Boolean(prop("loadingAuto") && prop("onTap")),
    },

    actions: {
      setLoadingContext: ({ context }) => {
        context.set("loading", true);
      },
      clearLoadingContext: ({ context }) => {
        context.set("loading", false);
        context.set("internalLoading", false);
      },
      setDisabledContext: ({ context, event }) => {
        if ("disabled" in event) {
          context.set("disabled", event.disabled);
        }
      },
      executeTapHandler: ({ prop, event }) => {
        const detail = "detail" in event ? event.detail : undefined;
        prop("onTap")?.(detail);
      },
      executeAsyncHandler: ({ prop, event, send, context }) => {
        const rawDetail = "detail" in event ? event.detail : undefined;

        context.set("internalLoading", true);

        const detail: Record<string, any> =
          rawDetail && typeof rawDetail === "object" ? { ...rawDetail } : {};
        let capturedPromise: Promise<any> | undefined = detail.promise;
        const origSetPromise =
          typeof detail.setPromise === "function"
            ? (detail.setPromise as (promise: Promise<any>) => void)
            : undefined;
        detail.setPromise = (p: Promise<any>) => {
          capturedPromise = p;
          origSetPromise?.(p);
        };

        const result = prop("onTap")?.(detail);
        const promise = isPromise(result) ? result : capturedPromise;

        if (isPromise(promise)) {
          Promise.resolve(promise)
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
        const duration = prop("autoResetDuration");
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
