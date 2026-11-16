import { createMachine } from "@code-ui/core";
import type { PropFn } from "@code-ui/core";
import { isNotNull } from "@code-ui/utils";
import type { StepperStatus } from "@code-ui/stepper";
import type {
  StepperItemMachine,
  StepperItemSchema,
} from "./stepper-item.types";
import { defaultStepperItemProps } from "./stepper-item.props";

const VALID_STATUSES = new Set<StepperStatus>([
  "completed",
  "current",
  "upcoming",
  "disabled",
]);

function resolveIndex(prop: PropFn<StepperItemSchema>): number {
  const raw = prop("index");
  if (isNotNull(raw)) return Number(raw);
  return prop("groupIndex") ?? 0;
}

function resolveCompleted(prop: PropFn<StepperItemSchema>): boolean {
  const explicit = prop("completed");
  if (isNotNull(explicit)) return Boolean(explicit);
  if (prop("status") === "completed") return true;
  const group = prop("groupContext");
  if (!group) return false;
  const step = group.step();
  const count = group.count();
  return (count > 0 && step >= count) || resolveIndex(prop) < step;
}

function resolveCurrent(prop: PropFn<StepperItemSchema>): boolean {
  if (prop("completed")) return false;
  const st = prop("status");
  if (st === "current") return true;
  if (st === "completed" || st === "upcoming" || st === "disabled") {
    return false;
  }
  const group = prop("groupContext");
  if (!group) return resolveIndex(prop) === 0;
  const step = group.step();
  const count = group.count();
  return !(count > 0 && step >= count) && resolveIndex(prop) === step;
}

function resolveDisabled(prop: PropFn<StepperItemSchema>): boolean {
  const group = prop("groupContext");
  if (prop("disabled") || group?.disabled()) return true;
  return Boolean(group?.linear() && resolveIndex(prop) > group.step() + 1);
}

function resolveStatus(prop: PropFn<StepperItemSchema>): StepperStatus {
  const explicitStatus = prop("status");
  if (
    explicitStatus !== "" &&
    VALID_STATUSES.has(explicitStatus as StepperStatus)
  ) {
    return explicitStatus as StepperStatus;
  }
  if (resolveDisabled(prop)) return "disabled";
  if (resolveCompleted(prop)) return "completed";
  if (resolveCurrent(prop)) return "current";
  return "upcoming";
}

const interactiveTapTransition = {
  TAP: {
    actions: ["handleTapAction"],
  },
};

export const stepperItemMachine: StepperItemMachine =
  createMachine<StepperItemSchema>({
    props: ({ props }) => ({
      ...defaultStepperItemProps,
      ...props,
    }),

    initialState: ({ prop }) => resolveStatus(prop),

    computed: {
      resolvedIndex: ({ prop }) => resolveIndex(prop),

      resolvedIsLast: ({ computed, prop }) => {
        const raw = prop("isLast");
        if (isNotNull(raw)) return Boolean(raw);
        const group = prop("groupContext");
        if (!group) return false;
        const count = group.count();
        return count > 0 && computed("resolvedIndex") === count - 1;
      },

      isCompleted: ({ prop }) => resolveCompleted(prop),

      isCurrent: ({ prop }) => resolveCurrent(prop),

      isUpcoming: ({ computed, prop }) => {
        if (prop("status") === "upcoming") return true;
        if (computed("isCompleted") || computed("isCurrent")) return false;
        const group = prop("groupContext");
        return computed("resolvedIndex") > (group ? group.step() : 0);
      },

      isDisabled: ({ prop }) => resolveDisabled(prop),

      status: ({ prop }): StepperStatus => resolveStatus(prop),
    },

    watch({ track, computed, state }) {
      track([() => computed("status")], () => {
        state.set(computed("status"));
      });
    },

    states: {
      completed: {
        tags: ["completed"],
        on: interactiveTapTransition,
      },
      current: {
        tags: ["current"],
        on: interactiveTapTransition,
      },
      upcoming: {
        tags: ["upcoming"],
        on: interactiveTapTransition,
      },
      disabled: {
        tags: ["disabled"],
      },
    },

    implementations: {
      actions: {
        handleTapAction: ({ computed, prop }) => {
          const idx = computed("resolvedIndex");
          const rawVal = prop("value");
          const val = rawVal !== "" ? rawVal : idx;
          prop("onTap")?.({ index: idx, value: val, status: computed("status") });
          prop("groupContext")?.setStep(idx);
        },
      },
    },
  });
