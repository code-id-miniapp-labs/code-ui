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

  refs: ({ prop }) => ({
    prevLoading: prop("loading"),
    prevDisabled: prop("disabled"),
  }),

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
    isLoading: ({ context }) =>
      context.get("loading") || context.get("internalLoading"),
    isDisabled: ({ context }) =>
      context.get("disabled") || context.get("loading"),
    isInteractive: ({ context, state }) =>
      !state.matches("loading") &&
      !context.get("disabled") &&
      !context.get("loading"),
  },

  watch: ({ prop, refs, context, send }) => {
    const nextLoading = prop("loading");
    if (nextLoading !== undefined && nextLoading !== refs.get("prevLoading")) {
      refs.set("prevLoading", nextLoading);
      send({ type: "SET_LOADING", loading: nextLoading });
    }

    const nextDisabled = prop("disabled");
    if (
      nextDisabled !== undefined &&
      nextDisabled !== refs.get("prevDisabled")
    ) {
      refs.set("prevDisabled", nextDisabled);
      context.set("disabled", nextDisabled);
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
      isInteractive: ({ context }) =>
        !context.get("disabled") && !context.get("loading"),
      isLoadingTrue: ({ event }) =>
        "loading" in event && event.loading === true,
      isLoadingFalse: ({ event }) =>
        "loading" in event && event.loading === false,
      isInteractiveAndHasAsyncHandler: ({ context, prop }) => {
        if (context.get("disabled") || context.get("loading")) return false;
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

        let capturedPromise: Promise<any> | undefined;
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

        if (isPromise(promise)) {
          Promise.resolve(promise)
            .catch((err) => {
              send({ type: "REJECT", error: err });
            })
            .finally(() => {
              send({ type: "RESOLVE" });
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
