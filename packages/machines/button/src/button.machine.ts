import { createMachine } from "@code-ui/core";
import { isPromise } from "@code-ui/utils";
import type {
  ButtonContext,
  ButtonMachine,
  ButtonProps,
  ButtonSchema,
} from "./button.types";
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

  context: ({ prop, bindable }) => {
    const propBindable = <K extends keyof ButtonContext & keyof ButtonProps>(
      key: K,
      defaultValue: ButtonContext[K],
    ) =>
      bindable<ButtonContext[K]>(() => ({
        value: prop(key) as ButtonContext[K] | undefined,
        defaultValue,
      }));

    return {
      internalLoading: bindable<boolean>(() => ({
        defaultValue: false,
      })),
      loading: propBindable("loading", Boolean(defaultButtonProps.loading)),
      disabled: propBindable("disabled", Boolean(defaultButtonProps.disabled)),
      variant: propBindable("variant", defaultButtonProps.variant ?? "solid"),
      color: propBindable("color", defaultButtonProps.color ?? "primary"),
      size: propBindable("size", defaultButtonProps.size ?? "md"),
      block: propBindable("block", false),
      ui: propBindable("ui", {}),
    };
  },

  computed: {
    isLoading: ({ context }) =>
      Boolean(context.get("loading") || context.get("internalLoading")),
    isDisabled: ({ context }) => Boolean(context.get("disabled")),
    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isLoading"),
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
        Boolean(prop("loadingAuto") && (prop("onTap") || prop("onClick"))),
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
