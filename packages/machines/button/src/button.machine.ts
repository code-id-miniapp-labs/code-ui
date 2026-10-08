import { createMachine } from "@code-ui/core";
import { isPromise } from "@code-ui/utils";
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
    internalLoading: bindable<boolean>(() => ({
      defaultValue: false,
    })),
    loading: bindable<boolean>(() => ({
      defaultValue: Boolean(prop("loading")),
    })),
    disabled: bindable<boolean>(() => ({
      defaultValue: Boolean(prop("disabled")),
    })),
    variant: bindable<any>(() => ({
      value: prop("variant"),
      defaultValue: "solid",
    })),
    color: bindable<any>(() => ({
      value: prop("color"),
      defaultValue: "primary",
    })),
    size: bindable<any>(() => ({
      value: prop("size"),
      defaultValue: "md",
    })),
    block: bindable<any>(() => ({
      value: prop("block"),
      defaultValue: false,
    })),
    ui: bindable<any>(() => ({
      value: prop("ui") ?? {},
      defaultValue: {},
    })),
  }),

  computed: {
    isLoading: ({ context, state }) =>
      state.matches("loading") ||
      Boolean(context.get("loading") || context.get("internalLoading")),
    isDisabled: ({ context, computed, state }) =>
      state.matches("loading") ||
      Boolean(context.get("disabled") || computed("isLoading")),
    isInteractive: ({ context, state, computed }) =>
      !state.matches("loading") &&
      !context.get("disabled") &&
      !computed("isLoading"),
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
        TAP: [
          {
            guard: "isInteractiveAndHasAsyncHandler",
            target: "loading",
            actions: ["executeAsyncHandler"],
          },
          {
            guard: "isInteractive",
            target: "idle",
            actions: ["executeTapHandler"],
          },
          {
            target: "idle",
          },
        ],
        RESET: {
          target: "idle",
        },
      },
    },

    error: {
      effects: ["autoResetEffect"],
      on: {
        TAP: [
          {
            guard: "isInteractiveAndHasAsyncHandler",
            target: "loading",
            actions: ["executeAsyncHandler"],
          },
          {
            guard: "isInteractive",
            target: "idle",
            actions: ["executeTapHandler"],
          },
          {
            target: "idle",
          },
        ],
        RESET: {
          target: "idle",
        },
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ context, state, computed }) => {
        if (state.matches("loading")) return false;
        if (
          context.get("disabled") ||
          context.get("loading") ||
          context.get("internalLoading")
        )
          return false;
        if (computed("isLoading") || !computed("isInteractive")) return false;
        return true;
      },
      isLoadingTrue: ({ event }) =>
        "loading" in event && event.loading === true,
      isLoadingFalse: ({ event }) =>
        "loading" in event && event.loading === false,
      isInteractiveAndHasAsyncHandler: ({ context, state, prop, computed }) => {
        if (state.matches("loading")) return false;
        if (
          context.get("disabled") ||
          context.get("loading") ||
          context.get("internalLoading")
        )
          return false;
        if (computed("isLoading") || !computed("isInteractive")) return false;
        return Boolean(
          prop("loadingAuto") && (prop("onTap") || prop("onClick")),
        );
      },
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
        const rawEvent = "event" in event ? event.event : undefined;
        const onTap = prop("onTap");
        const onClick = prop("onClick");
        if (onTap) {
          onTap(rawEvent);
          if (onClick && onClick !== onTap) {
            onClick(rawEvent);
          }
        } else {
          onClick?.(rawEvent);
        }
      },
      executeAsyncHandler: ({ prop, event, send, context }) => {
        const rawEvent = "event" in event ? event.event : undefined;

        context.set("internalLoading", true);

        let capturedPromise: Promise<any> | undefined =
          (rawEvent as any)?.promise ?? (rawEvent as any)?.detail?.promise;
        console.log("[code-ui debug] executeAsyncHandler START. capturedPromise pre-wrap:", !!capturedPromise);
        if (rawEvent && typeof rawEvent === "object") {
          const detail = (rawEvent as any).detail ?? rawEvent;
          if (detail && typeof detail === "object") {
            const origSetPromise = detail.setPromise;
            detail.setPromise = (p: Promise<any>) => {
              capturedPromise = p;
              origSetPromise?.(p);
            };
          }
        }

        const result = prop("onTap")?.(rawEvent) ?? prop("onClick")?.(rawEvent);
        const promise = isPromise(result) ? result : capturedPromise;

        console.log("[code-ui debug] executeAsyncHandler result isPromise:", isPromise(result), "captured:", !!capturedPromise, "final promise:", !!promise);

        if (isPromise(promise)) {
          console.log("[code-ui debug] attaching .then() to promise");
          Promise.resolve(promise)
            .then(() => {
              console.log("[code-ui debug] promise resolved! sending RESOLVE");
              send({ type: "RESOLVE" });
            })
            .catch((err) => {
              console.log("[code-ui debug] promise rejected! sending REJECT", err);
              send({ type: "REJECT", error: err });
            });
        } else {
          console.log("[code-ui debug] promise NOT found! sending RESOLVE sync");
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
