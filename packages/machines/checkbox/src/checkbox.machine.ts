import { createMachine } from "@code-ui/core";
import { setupFormFieldSync, cleanupFormFieldSync } from "@code-ui/form/context";
import { isEqual, isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  CheckboxColor,
  CheckboxMachine,
  CheckboxSchema,
  CheckboxSize,
} from "./checkbox.types";
import { defaultCheckboxProps } from "./checkbox.props";

export const checkboxMachine: CheckboxMachine = createMachine<CheckboxSchema>({
  props: ({ props }) => ({
    ...defaultCheckboxProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    const groupVal = prop("groupValue");
    if (Array.isArray(groupVal)) {
      return groupVal.includes(prop("value") ?? "") ? "checked" : "unchecked";
    }
    const rawIndeterminate = prop("indeterminate");
    const initialIndeterminate = isNotNull(rawIndeterminate)
      ? Boolean(rawIndeterminate)
      : Boolean(prop("defaultIndeterminate"));
    if (initialIndeterminate) {
      return "indeterminate";
    }
    const rawChecked = prop("checked");
    const initial = isNotNull(rawChecked)
      ? Boolean(rawChecked)
      : Boolean(prop("defaultChecked"));
    return initial ? "checked" : "unchecked";
  },

  refs: ({ prop }) => {
    const rawChecked = prop("checked");
    const initialChecked = isNotNull(rawChecked)
      ? Boolean(rawChecked)
      : Boolean(prop("defaultChecked"));
    const rawIndeterminate = prop("indeterminate");
    const initialIndeterminate = isNotNull(rawIndeterminate)
      ? Boolean(rawIndeterminate)
      : Boolean(prop("defaultIndeterminate"));

    return {
      initialChecked,
      initialIndeterminate,
      prevControlledChecked: isNotNull(rawChecked)
        ? Boolean(rawChecked)
        : undefined,
      prevControlledIndeterminate: isNotNull(rawIndeterminate)
        ? Boolean(rawIndeterminate)
        : undefined,
      currentGroupBus: undefined,
      formField: undefined,
      busDisposers: [],
    };
  },

  context: ({ prop, bindable, getRefs }) => {
    const b = <T>(key: any, defaultValue: T) =>
      bindable<T>(() => ({ value: prop(key), defaultValue }));

    return {
      checked: bindable<boolean>(() => {
        const rawChecked = prop("checked");
        const controlledVal = isNotNull(rawChecked)
          ? Boolean(rawChecked)
          : undefined;
        const initial = controlledVal ?? Boolean(prop("defaultChecked"));

        return {
          value: controlledVal,
          defaultValue: initial,
          onChange: (nextVal) => {
            const itemVal = prop("value") || nextVal;
            prop("onCheckedChange")?.({ value: itemVal, checked: nextVal });
            prop("onChange")?.({ value: itemVal, checked: nextVal });
            prop("component")?.triggerEvent?.("change", {
              value: itemVal,
              checked: nextVal,
            });
            if (!isNotNull(prop("checked"))) {
              prop("component")?.setData?.({ checked: nextVal });
            }

            const formField = getRefs().get("formField");
            if (formField) {
              formField.emitInput(nextVal);
              formField.emitChange(nextVal);
            }
          },
        };
      }),

      indeterminate: bindable<boolean>(() => {
        const rawIndeterminate = prop("indeterminate");
        const controlledVal = isNotNull(rawIndeterminate)
          ? Boolean(rawIndeterminate)
          : undefined;
        const initial =
          controlledVal ?? Boolean(prop("defaultIndeterminate"));

        return {
          value: controlledVal,
          defaultValue: initial,
          onChange: (nextVal) => {
            if (!isNotNull(prop("indeterminate"))) {
              prop("component")?.setData?.({ indeterminate: nextVal });
            }
          },
        };
      }),

      disabled: b("disabled", false),
      readOnly: b("readOnly", false),
      formDisabled: b("formDisabled", false),
      formReadOnly: b("formReadOnly", false),
      fieldDisabled: b("fieldDisabled", false),
      fieldSize: b<CheckboxSize | "">("fieldSize", ""),

      groupValue: bindable<string[] | undefined>(() => ({
        defaultValue: prop("groupValue"),
      })),
      groupDisabled: bindable<boolean>(() => ({
        defaultValue: Boolean(prop("groupDisabled")),
      })),
      groupInvalid: bindable<boolean>(() => ({
        defaultValue: Boolean(prop("groupInvalid")),
      })),
      groupColor: bindable<CheckboxColor | "">(() => ({
        defaultValue: prop("groupColor") ?? "",
      })),
      groupSize: bindable<CheckboxSize | "">(() => ({
        defaultValue: prop("groupSize") ?? "",
      })),
      groupVariant: bindable<string>(() => ({
        defaultValue: prop("groupVariant") ?? "",
      })),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      required: b("required", false),
      color: b<CheckboxColor>("color", "primary"),
      size: b<CheckboxSize>("size", "md"),
      value: b("value", ""),
      name: b("name", ""),
      form: b("form", ""),
      label: b("label", ""),
      description: b("description", ""),
      icon: b("icon", "check"),
      indeterminateIcon: b("indeterminateIcon", "minus"),
      ui: b("ui", {}),
    };
  },

  computed: {
    isChecked: ({ context }) => {
      const gv = context.get("groupValue");
      if (Array.isArray(gv)) {
        return gv.includes(context.get("value"));
      }
      return Boolean(context.get("checked"));
    },
    isIndeterminate: ({ context }) => Boolean(context.get("indeterminate")),
    isDisabled: ({ context }) => {
      return Boolean(
        context.get("disabled") ||
          context.get("formDisabled") ||
          context.get("fieldDisabled") ||
          context.get("groupDisabled"),
      );
    },
    isInteractive: ({ computed, context }) => {
      if (computed("isDisabled")) {
        return false;
      }
      if (context.get("readOnly") || context.get("formReadOnly")) {
        return false;
      }
      return true;
    },
    isInvalid: ({ context }) => {
      return Boolean(context.get("invalid") || context.get("groupInvalid"));
    },
    effectiveSize: ({ context }) => {
      return (
        context.get("size") ||
        context.get("fieldSize") ||
        context.get("groupSize") ||
        "md"
      ) as CheckboxSize;
    },
    effectiveColor: ({ context }) => {
      return (
        context.get("color") ||
        context.get("groupColor") ||
        "primary"
      ) as CheckboxColor;
    },
  },

  watch: ({ prop, context, refs, state, computed }) => {
    const controlledChecked = prop("checked");
    if (isNotNull(controlledChecked)) {
      const boolVal = Boolean(controlledChecked);
      const isIndet = Boolean(
        prop("indeterminate") ?? context.get("indeterminate"),
      );
      if (!isIndet) {
        const targetState = boolVal ? "checked" : "unchecked";
        if (state.get() !== targetState) {
          state.set(targetState);
        }
      }
      refs.set("prevControlledChecked", boolVal);
    }

    const controlledIndeterminate = prop("indeterminate");
    if (isNotNull(controlledIndeterminate)) {
      const boolVal = Boolean(controlledIndeterminate);
      if (boolVal && state.get() !== "indeterminate") {
        state.set("indeterminate");
      } else if (!boolVal && state.get() === "indeterminate") {
        const chk = Boolean(prop("checked") ?? context.get("checked"));
        state.set(chk ? "checked" : "unchecked");
      }
      refs.set("prevControlledIndeterminate", boolVal);
    }

    const controlledInvalid = prop("invalid");
    if (isNotNull(controlledInvalid)) {
      context.set("invalid", Boolean(controlledInvalid));
    }
    const controlledFieldDisabled = prop("fieldDisabled");
    if (controlledFieldDisabled !== undefined) {
      context.set("fieldDisabled", controlledFieldDisabled);
    }
    const controlledFieldSize = prop("fieldSize");
    if (controlledFieldSize !== undefined) {
      context.set("fieldSize", controlledFieldSize);
    }
    const nextForm = prop("form") ?? "";
    const nextName = prop("name") ?? "";
    if (nextForm !== context.get("form") || nextName !== context.get("name")) {
      context.set("form", nextForm);
      context.set("name", nextName);
      refs.get("formField")?.rebind();
    }
    const nextFormBus = prop("formBus");
    const prevFormBus = refs.get("currentFormBus");
    if (nextFormBus !== prevFormBus) {
      refs.set("currentFormBus", nextFormBus);
      refs.get("formField")?.rebind(nextFormBus ?? null);
    }

    const bus = prop("groupBus") || refs.get("currentGroupBus");
    if (bus && bus !== refs.get("currentGroupBus")) {
      refs.set("currentGroupBus", bus);
      const prevDisposers = refs.get("busDisposers") || [];
      for (const d of prevDisposers) d?.();
      const unsub = bus.on("group:change", (gState: any) => {
        if (Array.isArray(gState.value)) context.set("groupValue", gState.value);
        context.set("groupDisabled", Boolean(gState.disabled));
        if (gState.invalid !== undefined) context.set("groupInvalid", Boolean(gState.invalid));
        if (gState.size) context.set("groupSize", gState.size);
        if (gState.color) context.set("groupColor", gState.color);
        if (gState.variant) context.set("groupVariant", gState.variant);
      });
      refs.set("busDisposers", [unsub]);

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
      if (gv !== undefined && !isEqual(gv, context.get("groupValue"))) {
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

    const isGroupMode =
      Array.isArray(context.get("groupValue")) ||
      Boolean(refs.get("currentGroupBus"));
    if (isGroupMode) {
      const chk = computed("isChecked");
      const targetState = chk ? "checked" : "unchecked";
      if (state.get() !== targetState) {
        state.set(targetState);
      }
    }
  },

  entry: ["setupFormField"],
  exit: ["cleanupFormField"],

  on: {
    RESET_VALUE: [
      {
        guard: "isInitialIndeterminate",
        target: "indeterminate",
        actions: ["resetIndeterminate"],
      },
      {
        guard: "isInitialChecked",
        target: "checked",
        actions: ["resetChecked"],
      },
      {
        target: "unchecked",
        actions: ["resetChecked"],
      },
    ],
    SET_CHECKED: [
      {
        guard: "isEventChecked",
        target: "checked",
        actions: ["setCheckedTrue"],
      },
      {
        target: "unchecked",
        actions: ["setCheckedFalse"],
      },
    ],
    SET_INDETERMINATE: [
      {
        guard: "isEventIndeterminate",
        target: "indeterminate",
        actions: ["setIndeterminateTrue"],
      },
      {
        guard: "isChecked",
        target: "checked",
        actions: ["setIndeterminateFalse"],
      },
      {
        target: "unchecked",
        actions: ["setIndeterminateFalse"],
      },
    ],
  },

  states: {
    unchecked: {
      tags: ["unchecked"],
      on: {
        TOGGLE: [
          {
            guard: "hasGroupBus",
            actions: ["toggleGroupBus"],
          },
          {
            guard: "isControlled",
            actions: ["emitControlledToggle"],
          },
          {
            guard: "isInteractive",
            target: "checked",
            actions: ["setCheckedTrue"],
          },
        ],
        CHECK: [
          {
            guard: "hasGroupBus",
            actions: ["toggleGroupBus"],
          },
          {
            guard: "isControlled",
            actions: ["emitControlledToggle"],
          },
          {
            guard: "isInteractive",
            target: "checked",
            actions: ["setCheckedTrue"],
          },
        ],
      },
    },

    checked: {
      tags: ["checked"],
      on: {
        TOGGLE: [
          {
            guard: "hasGroupBus",
            actions: ["toggleGroupBus"],
          },
          {
            guard: "isControlled",
            actions: ["emitControlledToggle"],
          },
          {
            guard: "isInteractive",
            target: "unchecked",
            actions: ["setCheckedFalse"],
          },
        ],
        UNCHECK: [
          {
            guard: "hasGroupBus",
            actions: ["toggleGroupBus"],
          },
          {
            guard: "isControlled",
            actions: ["emitControlledToggle"],
          },
          {
            guard: "isInteractive",
            target: "unchecked",
            actions: ["setCheckedFalse"],
          },
        ],
      },
    },

    indeterminate: {
      tags: ["indeterminate"],
      on: {
        TOGGLE: [
          {
            guard: "hasGroupBus",
            actions: ["toggleGroupBus"],
          },
          {
            guard: "isControlled",
            actions: ["emitControlledToggle"],
          },
          {
            guard: "isInteractive",
            target: "checked",
            actions: ["setCheckedTrue"],
          },
        ],
        CHECK: [
          {
            guard: "hasGroupBus",
            actions: ["toggleGroupBus"],
          },
          {
            guard: "isControlled",
            actions: ["emitControlledToggle"],
          },
          {
            guard: "isInteractive",
            target: "checked",
            actions: ["setCheckedTrue"],
          },
        ],
        UNCHECK: [
          {
            guard: "hasGroupBus",
            actions: ["toggleGroupBus"],
          },
          {
            guard: "isControlled",
            actions: ["emitControlledToggle"],
          },
          {
            guard: "isInteractive",
            target: "unchecked",
            actions: ["setCheckedFalse"],
          },
        ],
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
      hasGroupBus: ({ refs, prop, computed }) =>
        computed("isInteractive") &&
        Boolean(refs.get("currentGroupBus") || prop("groupBus")),
      isControlled: ({ prop, computed }) =>
        computed("isInteractive") && isNotNull(prop("checked")),
      isChecked: ({ computed }) => computed("isChecked"),
      isEventChecked: ({ event }) =>
        "checked" in event && Boolean(event.checked),
      isEventIndeterminate: ({ event }) =>
        "indeterminate" in event && Boolean(event.indeterminate),
      isInitialChecked: ({ refs }) => Boolean(refs.get("initialChecked")),
      isInitialIndeterminate: ({ refs }) =>
        Boolean(refs.get("initialIndeterminate")),
    },

    actions: {
      toggleGroupBus: ({ context, refs, prop }) => {
        const bus = refs.get("currentGroupBus") || prop("groupBus");
        bus?.emit("checkbox:toggle", { value: context.get("value") });
      },
      emitControlledToggle: ({ context, prop, computed, refs }) => {
        const isIndet = computed("isIndeterminate");
        const currentChecked = computed("isChecked");
        const nextChecked = isIndet ? true : !currentChecked;
        const itemVal = prop("value") || context.get("value") || nextChecked;

        prop("onCheckedChange")?.({ value: itemVal, checked: nextChecked });
        prop("onChange")?.({ value: itemVal, checked: nextChecked });
        prop("component")?.triggerEvent?.("change", {
          value: itemVal,
          checked: nextChecked,
        });

        const formField = refs.get("formField");
        if (formField) {
          formField.emitInput(nextChecked);
          formField.emitChange(nextChecked);
        }
      },
      setCheckedTrue: ({ context }) => {
        context.set("indeterminate", false);
        context.set("checked", true);
      },
      setCheckedFalse: ({ context }) => {
        context.set("indeterminate", false);
        context.set("checked", false);
      },
      setIndeterminateTrue: ({ context }) => {
        context.set("indeterminate", true);
      },
      setIndeterminateFalse: ({ context }) => {
        context.set("indeterminate", false);
      },
      resetChecked: ({ context, refs }) => {
        const initial = Boolean(refs.get("initialChecked"));
        context.set("checked", initial);
        context.set("indeterminate", false);
      },
      resetIndeterminate: ({ context, refs }) => {
        const initialIndeterminate = Boolean(
          refs.get("initialIndeterminate"),
        );
        const initialChecked = Boolean(refs.get("initialChecked"));
        context.set("checked", initialChecked);
        context.set("indeterminate", initialIndeterminate);
      },
      setupFormField: ({ context, prop, refs, scope, state }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            bus: prop("formBus"),
            id: scope.id ?? "checkbox",
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () => context.get("name") || prop("name") || "",
            getValue: () => context.get("checked"),
            setValue: (rawVal: any) => {
              const nextChecked = Boolean(rawVal);
              context.set("checked", nextChecked);
              context.set("indeterminate", false);
              state.set(nextChecked ? "checked" : "unchecked");
            },
            resetValue: () => {
              const initial =
                refs.get("initialChecked") ??
                (prop("defaultChecked") !== undefined
                  ? Boolean(prop("defaultChecked"))
                  : false);
              context.set("checked", initial);
              context.set("indeterminate", Boolean(refs.get("initialIndeterminate")));
              context.set("invalid", false);
              state.set(
                refs.get("initialIndeterminate")
                  ? "indeterminate"
                  : initial
                    ? "checked"
                    : "unchecked",
              );
            },
            focus: () => {},
            getValidateOn: () => prop("validateOn"),
            isDisabled: () =>
              Boolean(
                context.get("disabled") ||
                  context.get("formDisabled") ||
                  context.get("fieldDisabled"),
              ),
            onValidationChange: (isValid) => {
              context.set("invalid", !isValid);
            },
            onStateChange: (s) => {
              if (s.fieldDisabled !== undefined) {
                context.set("fieldDisabled", Boolean(s.fieldDisabled));
              }
              if (s.fieldSize !== undefined) {
                context.set("fieldSize", s.fieldSize);
              }
              if (s.formDisabled !== undefined) {
                context.set("formDisabled", Boolean(s.formDisabled));
              }
              if (s.formReadOnly !== undefined) {
                context.set("formReadOnly", Boolean(s.formReadOnly));
              }
            },
          },
          refs,
        );
      },

      cleanupFormField: ({ refs }) => {
        cleanupFormFieldSync(refs);
      },
    },
  },
});
