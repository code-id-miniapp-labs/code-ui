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
  StepperItemMachine,
  StepperItemSchema,
} from "./stepper-item.types";
import { defaultStepperItemProps } from "./stepper-item.props";

const VALID_STATUSES = new Set([
  "completed",
  "current",
  "upcoming",
  "disabled",
]);

export const stepperItemMachine: StepperItemMachine =
  createMachine<StepperItemSchema>({
    props: ({ props }) => ({
      ...defaultStepperItemProps,
      ...props,
    }),

    initialState: () => "idle",

    computed: {
      resolvedIndex: ({ prop }) => {
        const raw = prop("index");
        if (isNotNull(raw)) return Number(raw);
        return Number(prop("groupIndex") ?? 0);
      },

      resolvedIsLast: ({ computed, prop }) => {
        const raw = prop("isLast");
        if (isNotNull(raw)) return Boolean(raw);
        const group = prop("groupContext") as StepperGroupContext | undefined;
        if (!group) return false;
        const count = group.count();
        return count > 0 && computed("resolvedIndex") === count - 1;
      },

      isCompleted: ({ computed, prop }) => {
        const explicit = prop("completed");
        if (isNotNull(explicit)) return Boolean(explicit);
        if (prop("status") === "completed") return true;
        const group = prop("groupContext") as StepperGroupContext | undefined;
        if (!group) return false;
        const step = group.step();
        const count = group.count();
        return (count > 0 && step >= count) || computed("resolvedIndex") < step;
      },

      isCurrent: ({ computed, prop }) => {
        if (prop("completed")) return false;
        const st = prop("status");
        if (st === "current") return true;
        if (st === "completed" || st === "upcoming" || st === "disabled") {
          return false;
        }
        const group = prop("groupContext") as StepperGroupContext | undefined;
        if (!group) return computed("resolvedIndex") === 0;
        const step = group.step();
        const count = group.count();
        return !(count > 0 && step >= count) && computed("resolvedIndex") === step;
      },

      isUpcoming: ({ computed, prop }) => {
        if (prop("status") === "upcoming") return true;
        if (computed("isCompleted") || computed("isCurrent")) return false;
        const group = prop("groupContext") as StepperGroupContext | undefined;
        return computed("resolvedIndex") > (group ? group.step() : 0);
      },

      isDisabled: ({ computed, prop }) => {
        const group = prop("groupContext") as StepperGroupContext | undefined;
        if (prop("disabled") || group?.disabled()) return true;
        return Boolean(
          group?.linear() && computed("resolvedIndex") > group.step() + 1,
        );
      },

      status: ({ computed, prop }): StepperStatus => {
        const explicitStatus = prop("status") as StepperStatus | "" | undefined;
        if (explicitStatus && VALID_STATUSES.has(explicitStatus)) {
          return explicitStatus;
        }
        if (computed("isDisabled")) return "disabled";
        if (computed("isCompleted")) return "completed";
        if (computed("isCurrent")) return "current";
        return "upcoming";
      },

      effectiveOrientation: ({ prop }): StepperOrientation => {
        const group = prop("groupContext") as StepperGroupContext | undefined;
        return (prop("orientation") ||
          group?.orientation() ||
          "horizontal") as StepperOrientation;
      },

      effectiveColor: ({ prop }): StepperColor => {
        const group = prop("groupContext") as StepperGroupContext | undefined;
        return (prop("color") || group?.color() || "primary") as StepperColor;
      },

      effectiveSize: ({ prop }): StepperSize => {
        const group = prop("groupContext") as StepperGroupContext | undefined;
        return (prop("size") || group?.size() || "md") as StepperSize;
      },

      effectiveVariant: ({ prop }): StepperVariant => {
        const group = prop("groupContext") as StepperGroupContext | undefined;
        return (prop("variant") ||
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
        handleTapAction: ({ computed, prop }) => {
          const idx = computed("resolvedIndex");
          const rawVal = prop("value");
          const val = rawVal !== "" && rawVal !== undefined ? rawVal : idx;
          prop("onTap")?.({ index: idx, value: val, status: computed("status") });
          (prop("groupContext") as StepperGroupContext | undefined)?.setStep(idx);
        },
      },
    },
  });
