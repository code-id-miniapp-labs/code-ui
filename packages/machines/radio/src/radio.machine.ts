import { createMachine } from "@code-ui/core";
import { isNotEmpty } from "@code-ui/utils";
import type {
  RadioColor,
  RadioMachine,
  RadioSchema,
  RadioSize,
  RadioVariant,
} from "./radio.types";
import { defaultRadioProps } from "./radio.props";

export const radioMachine: RadioMachine = createMachine<RadioSchema>({
  props: ({ props }) => ({
    ...defaultRadioProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    const groupVal = prop("groupValue");
    if (groupVal !== undefined) {
      return groupVal === prop("value") ? "checked" : "unchecked";
    }
    const rawChecked = prop("checked");
    const initial =
      rawChecked !== undefined && rawChecked !== null
        ? Boolean(rawChecked)
        : Boolean(prop("defaultChecked"));
    return initial ? "checked" : "unchecked";
  },

  refs: () => ({
    currentGroupBus: undefined,
    busDisposers: [],
  }),

  context: ({ prop, bindable }) => {
    const b = <T>(key: any, defaultValue: T) =>
      bindable<T>(() => ({ value: prop(key), defaultValue }));

    return {
      value: b("value", ""),
      label: b("label", ""),
      description: b("description", ""),
      disabled: b("disabled", false),
      readOnly: b("readOnly", false),

      checked: bindable<boolean>(() => {
        const rawChecked = prop("checked");
        const controlledVal =
          rawChecked !== undefined && rawChecked !== null
            ? Boolean(rawChecked)
            : undefined;
        const initial = controlledVal ?? Boolean(prop("defaultChecked"));

        return {
          value: controlledVal,
          defaultValue: initial,
          onChange: (nextVal) => {
            prop("onChange")?.({
              value: prop("value") ?? "",
              checked: nextVal,
            });
            prop("component")?.triggerEvent?.("change", {
              value: prop("value") ?? "",
              checked: nextVal,
            });
            prop("component")?.setData?.({ checked: nextVal });
          },
        };
      }),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      color: b<RadioColor | "">("color", ""),
      size: b<RadioSize | "">("size", ""),
      variant: b<RadioVariant>("variant", "outline"),

      groupValue: bindable<string | null | undefined>(() => ({
        defaultValue: prop("groupValue"),
      })),
      groupDisabled: bindable<boolean>(() => ({
        defaultValue: Boolean(prop("groupDisabled")),
      })),
      groupInvalid: bindable<boolean>(() => ({
        defaultValue: Boolean(prop("groupInvalid")),
      })),
      groupColor: bindable<RadioColor | "">(() => ({
        defaultValue: prop("groupColor") ?? "",
      })),
      groupSize: bindable<RadioSize | "">(() => ({
        defaultValue: prop("groupSize") ?? "",
      })),
      groupVariant: bindable<RadioVariant | "">(() => ({
        defaultValue: prop("groupVariant") ?? "",
      })),

      ui: b("ui", {}),
    };
  },

  computed: {
    isChecked: ({ context }) => {
      const gv = context.get("groupValue");
      if (gv !== undefined) {
        return gv === context.get("value");
      }
      return Boolean(context.get("checked"));
    },

    isDisabled: ({ context }) => {
      return Boolean(
        context.get("disabled") || context.get("groupDisabled"),
      );
    },

    isInteractive: ({ computed, context }) => {
      return !computed("isDisabled") && !context.get("readOnly");
    },

    isInvalid: ({ context }) => {
      return Boolean(context.get("invalid") || context.get("groupInvalid"));
    },

    effectiveSize: ({ context }) => {
      return (context.get("size") || context.get("groupSize") || "md") as RadioSize;
    },

    effectiveColor: ({ context }) => {
      return (context.get("color") || context.get("groupColor") || "primary") as RadioColor;
    },

    effectiveVariant: ({ context }) => {
      const v = context.get("variant");
      return (v !== "outline" ? v : (context.get("groupVariant") || "outline")) as RadioVariant;
    },
  },

  watch: ({ prop, context, refs, state, computed }) => {
    const bus = prop("groupBus") || refs.get("currentGroupBus");
    if (bus && bus !== refs.get("currentGroupBus")) {
      refs.set("currentGroupBus", bus);
      const prevDisposers = refs.get("busDisposers") || [];
      for (const d of prevDisposers) d?.();
      const unsub = bus.on("group:change", (gState: any) => {
        context.set("groupValue", gState.value);
        context.set("groupDisabled", Boolean(gState.disabled));
        if (gState.invalid !== undefined) context.set("groupInvalid", Boolean(gState.invalid));
        if (gState.size) context.set("groupSize", gState.size);
        if (gState.color) context.set("groupColor", gState.color);
        if (gState.variant) context.set("groupVariant", gState.variant);
      });
      refs.set("busDisposers", [unsub]);

      // Initialize from current prop values when bus is newly wired
      const gv = prop("groupValue");
      if (gv !== undefined) context.set("groupValue", gv);
      const gd = prop("groupDisabled");
      if (gd !== undefined) context.set("groupDisabled", Boolean(gd));
      const gi = prop("groupInvalid");
      if (gi !== undefined) context.set("groupInvalid", Boolean(gi));
      const gc = prop("groupColor");
      if (gc !== undefined) context.set("groupColor", gc);
      const gs = prop("groupSize");
      if (gs !== undefined) context.set("groupSize", gs);
      const gvar = prop("groupVariant");
      if (gvar !== undefined) context.set("groupVariant", gvar);
    }

    if (!refs.get("currentGroupBus")) {
      const gv = prop("groupValue");
      if (gv !== undefined && gv !== context.get("groupValue")) {
        context.set("groupValue", gv);
      }
      const gd = prop("groupDisabled");
      if (gd !== undefined && gd !== context.get("groupDisabled")) {
        context.set("groupDisabled", Boolean(gd));
      }
      const gi = prop("groupInvalid");
      if (gi !== undefined && gi !== context.get("groupInvalid")) {
        context.set("groupInvalid", Boolean(gi));
      }
      const gc = prop("groupColor");
      if (gc !== undefined && gc !== context.get("groupColor")) {
        context.set("groupColor", gc);
      }
      const gs = prop("groupSize");
      if (gs !== undefined && gs !== context.get("groupSize")) {
        context.set("groupSize", gs);
      }
      const gvar = prop("groupVariant");
      if (gvar !== undefined && gvar !== context.get("groupVariant")) {
        context.set("groupVariant", gvar);
      }
    }

    const chk = computed("isChecked");
    const targetState = chk ? "checked" : "unchecked";
    if (state.get() !== targetState) {
      state.set(targetState);
    }
  },

  on: {
    SELECT: {
      guard: "isInteractive",
      actions: ["handleSelect"],
    },
    TOGGLE: {
      guard: "isInteractive",
      actions: ["handleToggle"],
    },
    SET_CHECKED: {
      actions: ["setChecked"],
    },
  },

  states: {
    unchecked: {
      tags: ["unchecked"],
    },
    checked: {
      tags: ["checked"],
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
    },

    actions: {
      handleSelect: ({ context, refs, prop, state }) => {
        const bus = refs.get("currentGroupBus") || prop("groupBus");
        if (bus) {
          bus.emit("radio:select", { value: context.get("value") });
        } else {
          context.set("checked", true);
          state.set("checked");
        }
      },

      handleToggle: ({ context, refs, prop, state }) => {
        const bus = refs.get("currentGroupBus") || prop("groupBus");
        if (bus) {
          bus.emit("radio:select", { value: context.get("value") });
        } else {
          const next = !context.get("checked");
          context.set("checked", next);
          state.set(next ? "checked" : "unchecked");
        }
      },

      setChecked: ({ context, event, state }) => {
        if ("checked" in event) {
          const next = Boolean(event.checked);
          context.set("checked", next);
          state.set(next ? "checked" : "unchecked");
        }
      },

      setupGroupBus: ({ prop, refs, context }) => {
        const bus = prop("groupBus");
        if (bus) {
          refs.set("currentGroupBus", bus);
          const unsub = bus.on("group:change", (gState: any) => {
            context.set("groupValue", gState.value);
            context.set("groupDisabled", Boolean(gState.disabled));
            if (gState.invalid !== undefined) context.set("groupInvalid", Boolean(gState.invalid));
            if (gState.size) context.set("groupSize", gState.size);
            if (gState.color) context.set("groupColor", gState.color);
            if (gState.variant) context.set("groupVariant", gState.variant);
          });
          const disposers = refs.get("busDisposers") || [];
          disposers.push(unsub);
          refs.set("busDisposers", disposers);
        }
      },
    },
  },
});
