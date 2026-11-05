import { createMachine } from "@code-ui/core";
import { isNotNull } from "@code-ui/utils";
import type {
  StepperColor,
  StepperGroupContext,
  StepperOrientation,
  StepperSize,
  StepperStatus,
  StepperVariant,
} from "@code-ui/stepper";
import type {
  StepperItemContext,
  StepperItemMachine,
  StepperItemProps,
  StepperItemSchema,
} from "./stepper-item.types";
import { defaultStepperItemProps } from "./stepper-item.props";

export const stepperItemMachine: StepperItemMachine =
  createMachine<StepperItemSchema>({
    props: ({ props }) => ({
      ...defaultStepperItemProps,
      ...props,
    }),

    initialState: () => "idle",

    context: ({ prop, bindable }) => {
      const propBindable = <
        K extends keyof StepperItemContext & keyof StepperItemProps,
      >(
        key: K,
        defaultValue: StepperItemContext[K],
      ) =>
        bindable<StepperItemContext[K]>(() => ({
          value: prop(key) as StepperItemContext[K] | undefined,
          defaultValue,
        }));

      return {
        index: bindable<number | null>(() => {
          const raw = prop("index");
          return {
            value: isNotNull(raw) ? Number(raw) : undefined,
            defaultValue: isNotNull(raw) ? Number(raw) : null,
          };
        }),
        title: propBindable("title", ""),
        description: propBindable("description", ""),
        icon: propBindable("icon", ""),
        completedIcon: propBindable("completedIcon", ""),
        disabled: propBindable("disabled", false),
        completed: bindable<boolean | null>(() => {
          const raw = prop("completed");
          return {
            value: isNotNull(raw) ? Boolean(raw) : undefined,
            defaultValue: isNotNull(raw) ? Boolean(raw) : null,
          };
        }),
        status: propBindable("status", ""),
        value: propBindable("value", ""),
        isLast: bindable<boolean | null>(() => {
          const raw = prop("isLast");
          return {
            value: isNotNull(raw) ? Boolean(raw) : undefined,
            defaultValue: isNotNull(raw) ? Boolean(raw) : null,
          };
        }),
        orientation: propBindable("orientation", ""),
        color: propBindable("color", ""),
        size: propBindable("size", ""),
        variant: propBindable("variant", ""),

        stepperId: propBindable("stepperId", ""),

        ui: propBindable("ui", {}),
      };
    },

    computed: {
      resolvedIndex: ({ context, prop }) => {
        const explicitIdx = context.get("index");
        if (explicitIdx !== null && explicitIdx !== undefined) {
          return Number(explicitIdx);
        }
        return Number(prop("groupIndex") ?? 0);
      },

      resolvedIsLast: ({ context, computed, prop }) => {
        const explicitLast = context.get("isLast");
        if (explicitLast !== null && explicitLast !== undefined) {
          return Boolean(explicitLast);
        }
        const group = prop("groupContext") as
          | StepperGroupContext
          | undefined;
        if (!group) return false;
        const count = group.count();
        return count > 0 && computed("resolvedIndex") === count - 1;
      },

      isCompleted: ({ context, computed, prop }) => {
        const explicit = context.get("completed");
        if (explicit !== null && explicit !== undefined) {
          return Boolean(explicit);
        }
        if (context.get("status") === "completed") {
          return true;
        }
        const group = prop("groupContext") as
          | StepperGroupContext
          | undefined;
        if (!group) return false;
        const step = group.step();
        const count = group.count();
        if (count > 0 && step >= count) {
          return true;
        }
        return computed("resolvedIndex") < step;
      },

      isCurrent: ({ context, computed, prop }) => {
        const explicitCompleted = context.get("completed");
        if (explicitCompleted) return false;
        if (context.get("status") === "current") {
          return true;
        }
        if (
          context.get("status") === "completed" ||
          context.get("status") === "upcoming" ||
          context.get("status") === "disabled"
        ) {
          return false;
        }
        const group = prop("groupContext") as
          | StepperGroupContext
          | undefined;
        if (!group) {
          return computed("resolvedIndex") === 0;
        }
        const step = group.step();
        const count = group.count();
        if (count > 0 && step >= count) {
          return false;
        }
        return computed("resolvedIndex") === step;
      },

      isUpcoming: ({ context, computed, prop }) => {
        if (context.get("status") === "upcoming") {
          return true;
        }
        if (computed("isCompleted") || computed("isCurrent")) return false;
        const group = prop("groupContext") as
          | StepperGroupContext
          | undefined;
        const step = group ? group.step() : 0;
        return computed("resolvedIndex") > step;
      },

      isDisabled: ({ context, computed, prop }) => {
        const group = prop("groupContext") as
          | StepperGroupContext
          | undefined;
        if (context.get("disabled") || group?.disabled()) {
          return true;
        }
        if (
          group?.linear() &&
          computed("resolvedIndex") > group.step() + 1
        ) {
          return true;
        }
        return false;
      },

      status: ({ context, computed }): StepperStatus => {
        const explicitStatus = context.get("status") as StepperStatus | "";
        if (
          explicitStatus &&
          ["completed", "current", "upcoming", "disabled"].includes(
            explicitStatus,
          )
        ) {
          return explicitStatus as StepperStatus;
        }
        if (computed("isDisabled")) return "disabled";
        if (computed("isCompleted")) return "completed";
        if (computed("isCurrent")) return "current";
        return "upcoming";
      },

      effectiveOrientation: ({ context, prop }): StepperOrientation => {
        const group = prop("groupContext") as
          | StepperGroupContext
          | undefined;
        return (context.get("orientation") ||
          group?.orientation() ||
          "horizontal") as StepperOrientation;
      },

      effectiveColor: ({ context, prop }): StepperColor => {
        const group = prop("groupContext") as
          | StepperGroupContext
          | undefined;
        return (context.get("color") ||
          group?.color() ||
          "primary") as StepperColor;
      },

      effectiveSize: ({ context, prop }): StepperSize => {
        const group = prop("groupContext") as
          | StepperGroupContext
          | undefined;
        return (context.get("size") || group?.size() || "md") as StepperSize;
      },

      effectiveVariant: ({ context, prop }): StepperVariant => {
        const group = prop("groupContext") as
          | StepperGroupContext
          | undefined;
        return (context.get("variant") ||
          group?.variant() ||
          "subtle") as StepperVariant;
      },
    },

    on: {
      TAP: {
        guard: "canTap",
        actions: ["handleTapAction"],
      },
    },

    states: {
      idle: {
        tags: ["idle"],
      },
    },

    implementations: {
      guards: {
        canTap: ({ computed }) => !computed("isDisabled"),
      },

      actions: {
        handleTapAction: ({ context, computed, prop }) => {
          const idx = computed("resolvedIndex");
          const val = context.get("value") !== "" ? context.get("value") : idx;
          const status = computed("status");

          const details = { index: idx, value: val, status };
          prop("onTap")?.(details);

          const group = prop("groupContext") as
            | StepperGroupContext
            | undefined;
          group?.setStep(idx);
        },
      },
    },
  });
