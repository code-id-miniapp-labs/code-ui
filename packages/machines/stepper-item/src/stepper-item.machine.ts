import { createMachine } from "@code-ui/core";
import { isNotNull } from "@code-ui/utils";
import type {
  StepperColor,
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

export const stepperItemMachine: StepperItemMachine =
  createMachine<StepperItemSchema>({
    props: ({ props }) => ({
      ...defaultStepperItemProps,
      ...props,
    }),

    initialState: () => "idle",

    refs: () => ({
      currentGroupBus: undefined,
      busDisposers: [],
      prevGroupStep: undefined,
      prevGroupCount: undefined,
      prevGroupLinear: undefined,
      prevGroupOrientation: undefined,
      prevGroupDisabled: undefined,
      prevGroupColor: undefined,
      prevGroupSize: undefined,
      prevGroupVariant: undefined,
      prevStepperId: undefined,
    }),

    context: ({ prop, bindable }) => {
      const b = <T>(key: any, defaultValue: T) =>
        bindable<T>(() => ({ value: prop(key), defaultValue }));

      return {
        index: bindable<number | null>(() => {
          const raw = prop("index");
          return {
            value: isNotNull(raw) ? Number(raw) : undefined,
            defaultValue: isNotNull(raw) ? Number(raw) : null,
          };
        }),
        title: b<string>("title", ""),
        description: b<string>("description", ""),
        icon: b<string>("icon", ""),
        completedIcon: b<string>("completedIcon", ""),
        disabled: b<boolean>("disabled", false),
        completed: bindable<boolean | null>(() => {
          const raw = prop("completed");
          return {
            value: isNotNull(raw) ? Boolean(raw) : undefined,
            defaultValue: isNotNull(raw) ? Boolean(raw) : null,
          };
        }),
        status: b<StepperStatus | "">("status", ""),
        value: b<string | number>("value", ""),
        isLast: bindable<boolean | null>(() => {
          const raw = prop("isLast");
          return {
            value: isNotNull(raw) ? Boolean(raw) : undefined,
            defaultValue: isNotNull(raw) ? Boolean(raw) : null,
          };
        }),
        orientation: b<StepperOrientation | "">("orientation", ""),
        color: b<StepperColor | "">("color", ""),
        size: b<StepperSize | "">("size", ""),
        variant: b<StepperVariant | "">("variant", ""),

        stepperId: b<string>("stepperId", ""),
        groupStep: bindable<number>(() => ({
          defaultValue: Number(prop("groupStep") ?? 0),
        })),
        groupCount: bindable<number>(() => ({
          defaultValue: Number(prop("groupCount") ?? 0),
        })),
        groupIndex: bindable<number>(() => ({
          defaultValue: Number(prop("groupIndex") ?? 0),
        })),
        groupIsLast: bindable<boolean>(() => ({
          defaultValue: Boolean(prop("groupIsLast")),
        })),
        groupLinear: bindable<boolean>(() => ({
          defaultValue: Boolean(prop("groupLinear")),
        })),
        groupOrientation: bindable<StepperOrientation | "">(() => ({
          defaultValue: (prop("groupOrientation") ?? "") as StepperOrientation | "",
        })),
        groupDisabled: bindable<boolean>(() => ({
          defaultValue: Boolean(prop("groupDisabled")),
        })),
        groupColor: bindable<StepperColor | "">(() => ({
          defaultValue: (prop("groupColor") ?? "") as StepperColor | "",
        })),
        groupSize: bindable<StepperSize | "">(() => ({
          defaultValue: (prop("groupSize") ?? "") as StepperSize | "",
        })),
        groupVariant: bindable<StepperVariant | "">(() => ({
          defaultValue: (prop("groupVariant") ?? "") as StepperVariant | "",
        })),

        ui: b("ui", {}),
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
      const bus = prop("groupBus") || refs.get("currentGroupBus");
      if (bus && bus !== refs.get("currentGroupBus")) {
        refs.set("currentGroupBus", bus);
        const prevDisposers = refs.get("busDisposers") || [];
        for (const d of prevDisposers) d?.();
        const unsub = bus.on("stepper:change", (gState) => {
          context.set("groupStep", Number(gState.step));
          context.set("groupCount", Number(gState.count));
          context.set("groupLinear", Boolean(gState.linear));
          context.set("groupOrientation", gState.orientation);
          context.set("groupDisabled", Boolean(gState.disabled));
          context.set("groupColor", gState.color);
          context.set("groupSize", gState.size);
          context.set("groupVariant", gState.variant);
        });
        refs.set("busDisposers", [unsub]);

        // Initialize from current prop values when bus is newly wired
        if (prop("groupStep") !== undefined) {
          context.set("groupStep", Number(prop("groupStep")));
        }
        if (prop("groupCount") !== undefined) {
          context.set("groupCount", Number(prop("groupCount")));
        }
        if (prop("groupLinear") !== undefined) {
          context.set("groupLinear", Boolean(prop("groupLinear")));
        }
        if (prop("groupOrientation") !== undefined) {
          context.set(
            "groupOrientation",
            (prop("groupOrientation") ?? "") as StepperOrientation | "",
          );
        }
        if (prop("groupDisabled") !== undefined) {
          context.set("groupDisabled", Boolean(prop("groupDisabled")));
        }
        if (prop("groupColor") !== undefined) {
          context.set("groupColor", (prop("groupColor") ?? "") as StepperColor | "");
        }
        if (prop("groupSize") !== undefined) {
          context.set("groupSize", (prop("groupSize") ?? "") as StepperSize | "");
        }
        if (prop("groupVariant") !== undefined) {
          context.set("groupVariant", (prop("groupVariant") ?? "") as StepperVariant | "");
        }
      }

      if (!refs.get("currentGroupBus")) {
        const gs = prop("groupStep");
        if (gs !== undefined && Number(gs) !== context.get("groupStep")) {
          context.set("groupStep", Number(gs));
        }
        const gc = prop("groupCount");
        if (gc !== undefined && Number(gc) !== context.get("groupCount")) {
          context.set("groupCount", Number(gc));
        }
        const gl = prop("groupLinear");
        if (gl !== undefined && Boolean(gl) !== context.get("groupLinear")) {
          context.set("groupLinear", Boolean(gl));
        }
        const go = prop("groupOrientation");
        if (go !== undefined && go !== context.get("groupOrientation")) {
          context.set("groupOrientation", (go ?? "") as StepperOrientation | "");
        }
        const gd = prop("groupDisabled");
        if (gd !== undefined && Boolean(gd) !== context.get("groupDisabled")) {
          context.set("groupDisabled", Boolean(gd));
        }
        const gcol = prop("groupColor");
        if (gcol !== undefined && gcol !== context.get("groupColor")) {
          context.set("groupColor", (gcol ?? "") as StepperColor | "");
        }
        const gz = prop("groupSize");
        if (gz !== undefined && gz !== context.get("groupSize")) {
          context.set("groupSize", (gz ?? "") as StepperSize | "");
        }
        const gv = prop("groupVariant");
        if (gv !== undefined && gv !== context.get("groupVariant")) {
          context.set("groupVariant", (gv ?? "") as StepperVariant | "");
        }
      }

      const nextStepperId = (prop("stepperId") ?? "") as string;
      if (nextStepperId !== context.get("stepperId")) {
        context.set("stepperId", nextStepperId);
      }

      if (prop("groupIndex") !== undefined && Number(prop("groupIndex")) !== context.get("groupIndex")) {
        context.set("groupIndex", Number(prop("groupIndex")));
      }
      if (prop("groupIsLast") !== undefined && Boolean(prop("groupIsLast")) !== context.get("groupIsLast")) {
        context.set("groupIsLast", Boolean(prop("groupIsLast")));
      }

      const rawIdx = prop("index");
      const nextIdx = isNotNull(rawIdx) ? Number(rawIdx) : null;
      if (nextIdx !== context.get("index")) {
        context.set("index", nextIdx);
      }

      const rawLast = prop("isLast");
      const nextLast = isNotNull(rawLast) ? Boolean(rawLast) : null;
      if (nextLast !== context.get("isLast")) {
        context.set("isLast", nextLast);
      }

      const nextDisabled = Boolean(prop("disabled"));
      if (nextDisabled !== context.get("disabled")) {
        context.set("disabled", nextDisabled);
      }

      const rawCompleted = prop("completed");
      const nextCompleted = isNotNull(rawCompleted) ? Boolean(rawCompleted) : null;
      if (nextCompleted !== context.get("completed")) {
        context.set("completed", nextCompleted);
      }

      const nextStatus = (prop("status") ?? "") as StepperStatus | "";
      if (nextStatus !== context.get("status")) {
        context.set("status", nextStatus);
      }
    },

    exit: ["cleanupGroupBus"],

    on: {
      TAP: {
        guard: "canTap",
        actions: ["handleTapAction"],
      },
      SELECT: {
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
          prop("onClick")?.(details);
          prop("component")?.triggerEvent?.("click", details);

          const bus = refs.get("currentGroupBus") || prop("groupBus");
          if (bus) {
            bus.emit("item:tap", { index: idx, value: val });
          }
        },

        setupGroupBus: ({ prop, refs, context }) => {
          const bus = prop("groupBus");
          if (bus) {
            refs.set("currentGroupBus", bus);
            const unsub = bus.on("stepper:change", (gState) => {
              context.set("groupStep", Number(gState.step));
              context.set("groupCount", Number(gState.count));
              context.set("groupLinear", Boolean(gState.linear));
              context.set("groupOrientation", gState.orientation);
              context.set("groupDisabled", Boolean(gState.disabled));
              context.set("groupColor", gState.color);
              context.set("groupSize", gState.size);
              context.set("groupVariant", gState.variant);
            });
            refs.set("busDisposers", [unsub]);
          }
        },

        cleanupGroupBus: ({ refs }) => {
          const disposers = refs.get("busDisposers") || [];
          for (const d of disposers) d?.();
          refs.set("busDisposers", []);
          refs.set("currentGroupBus", undefined);
        },
      },
    },
  });
