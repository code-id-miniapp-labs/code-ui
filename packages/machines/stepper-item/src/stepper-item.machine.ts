import { createMachine } from "@code-ui/core";
import type { BindableContext, BindableRefs } from "@code-ui/core";
import { isNotNull } from "@code-ui/utils";
import type { EventBus } from "@code-ui/utils";
import type {
  StepperBusEvents,
  StepperColor,
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

interface GroupStateSnapshot {
  step?: number | undefined;
  count?: number | undefined;
  linear?: boolean | undefined;
  orientation?: StepperOrientation | "" | undefined;
  disabled?: boolean | undefined;
  color?: StepperColor | "" | undefined;
  size?: StepperSize | "" | undefined;
  variant?: StepperVariant | "" | undefined;
}

function applyGroupState(
  context: BindableContext<StepperItemSchema>,
  g: GroupStateSnapshot,
) {
  if (g.step !== undefined) context.set("groupStep", Number(g.step));
  if (g.count !== undefined) context.set("groupCount", Number(g.count));
  if (g.linear !== undefined) context.set("groupLinear", Boolean(g.linear));
  if (g.orientation !== undefined) {
    context.set(
      "groupOrientation",
      (g.orientation ?? "") as StepperOrientation | "",
    );
  }
  if (g.disabled !== undefined) {
    context.set("groupDisabled", Boolean(g.disabled));
  }
  if (g.color !== undefined) {
    context.set("groupColor", (g.color ?? "") as StepperColor | "");
  }
  if (g.size !== undefined) {
    context.set("groupSize", (g.size ?? "") as StepperSize | "");
  }
  if (g.variant !== undefined) {
    context.set("groupVariant", (g.variant ?? "") as StepperVariant | "");
  }
}

function bindGroupBus(
  bus: EventBus<StepperBusEvents> | undefined,
  context: BindableContext<StepperItemSchema>,
  refs: BindableRefs<StepperItemSchema>,
): void {
  for (const d of refs.get("busDisposers") ?? []) d?.();
  refs.set("currentGroupBus", bus);
  refs.set(
    "busDisposers",
    bus
      ? [
          bus.on("stepper:change", (gState) => {
            applyGroupState(context, gState);
          }),
        ]
      : [],
  );
}

export const stepperItemMachine: StepperItemMachine =
  createMachine<StepperItemSchema>({
    props: ({ props }) => ({
      ...defaultStepperItemProps,
      ...props,
    }),

    initialState: () => "idle",

    refs: ({ prop }) => ({
      currentGroupBus: prop("groupBus"),
      busDisposers: [],
    }),

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
        groupStep: propBindable("groupStep", Number(prop("groupStep") ?? 0)),
        groupCount: propBindable(
          "groupCount",
          Number(prop("groupCount") ?? 0),
        ),
        groupIndex: propBindable(
          "groupIndex",
          Number(prop("groupIndex") ?? 0),
        ),
        groupIsLast: propBindable("groupIsLast", Boolean(prop("groupIsLast"))),
        groupLinear: propBindable(
          "groupLinear",
          Boolean(prop("groupLinear")),
        ),
        groupOrientation: propBindable(
          "groupOrientation",
          (prop("groupOrientation") ?? "") as StepperOrientation | "",
        ),
        groupDisabled: propBindable(
          "groupDisabled",
          Boolean(prop("groupDisabled")),
        ),
        groupColor: propBindable(
          "groupColor",
          (prop("groupColor") ?? "") as StepperColor | "",
        ),
        groupSize: propBindable(
          "groupSize",
          (prop("groupSize") ?? "") as StepperSize | "",
        ),
        groupVariant: propBindable(
          "groupVariant",
          (prop("groupVariant") ?? "") as StepperVariant | "",
        ),

        ui: propBindable("ui", {}),
      };
    },

    computed: {
      resolvedIndex: ({ context }) => {
        const explicitIdx = context.get("index");
        if (explicitIdx !== null && explicitIdx !== undefined) {
          return Number(explicitIdx);
        }
        return Number(context.get("groupIndex") ?? 0);
      },

      resolvedIsLast: ({ context, computed }) => {
        const explicitLast = context.get("isLast");
        if (explicitLast !== null && explicitLast !== undefined) {
          return Boolean(explicitLast);
        }
        const gCount = context.get("groupCount");
        if (gCount > 0) {
          return computed("resolvedIndex") === gCount - 1;
        }
        return Boolean(context.get("groupIsLast"));
      },

      isCompleted: ({ context, computed }) => {
        const explicit = context.get("completed");
        if (explicit !== null && explicit !== undefined) {
          return Boolean(explicit);
        }
        if (context.get("status") === "completed") {
          return true;
        }
        const gStep = context.get("groupStep");
        const gCount = context.get("groupCount");
        if (gCount > 0 && gStep >= gCount) {
          return true;
        }
        return computed("resolvedIndex") < gStep;
      },

      isCurrent: ({ context, computed }) => {
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
        const gStep = context.get("groupStep");
        const gCount = context.get("groupCount");
        if (gCount > 0 && gStep >= gCount) {
          return false;
        }
        return computed("resolvedIndex") === gStep;
      },

      isUpcoming: ({ context, computed }) => {
        if (context.get("status") === "upcoming") {
          return true;
        }
        if (computed("isCompleted") || computed("isCurrent")) return false;
        return computed("resolvedIndex") > context.get("groupStep");
      },

      isDisabled: ({ context, computed }) => {
        if (context.get("disabled") || context.get("groupDisabled")) {
          return true;
        }
        if (
          context.get("groupLinear") &&
          computed("resolvedIndex") > context.get("groupStep") + 1
        ) {
          return true;
        }
        return false;
      },

      status: ({ context, computed }): StepperStatus => {
        const explicitStatus = context.get("status") as StepperStatus | "";
        if (explicitStatus && ["completed", "current", "upcoming", "disabled"].includes(explicitStatus)) {
          return explicitStatus as StepperStatus;
        }
        if (computed("isDisabled")) return "disabled";
        if (computed("isCompleted")) return "completed";
        if (computed("isCurrent")) return "current";
        return "upcoming";
      },

      effectiveOrientation: ({ context }): StepperOrientation => {
        return (context.get("orientation") ||
          context.get("groupOrientation") ||
          "horizontal") as StepperOrientation;
      },

      effectiveColor: ({ context }): StepperColor => {
        return (context.get("color") ||
          context.get("groupColor") ||
          "primary") as StepperColor;
      },

      effectiveSize: ({ context }): StepperSize => {
        return (context.get("size") ||
          context.get("groupSize") ||
          "md") as StepperSize;
      },

      effectiveVariant: ({ context }): StepperVariant => {
        return (context.get("variant") ||
          context.get("groupVariant") ||
          "subtle") as StepperVariant;
      },
    },

    watch: ({ prop, context, refs }) => {
      const nextBus = prop("groupBus");
      if (nextBus !== refs.get("currentGroupBus")) {
        bindGroupBus(nextBus, context, refs);
      }
    },

    entry: ["setupGroupBus"],
    exit: ["cleanupGroupBus"],

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
        handleTapAction: ({ context, computed, refs, prop }) => {
          const idx = computed("resolvedIndex");
          const val = context.get("value") !== "" ? context.get("value") : idx;
          const status = computed("status");

          const details = { index: idx, value: val, status };
          (prop("onClick") ?? prop("onTap"))?.(details);

          const bus = refs.get("currentGroupBus") || prop("groupBus");
          if (bus) {
            bus.emit("item:tap", { index: idx, value: val });
          }
        },

        setupGroupBus: ({ prop, context, refs }) => {
          const bus = prop("groupBus");
          if (bus) {
            bindGroupBus(bus, context, refs);
          }
        },

        cleanupGroupBus: ({ context, refs }) => {
          bindGroupBus(undefined, context, refs);
        },
      },
    },
  });
