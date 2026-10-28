import { createMachine } from "@code-ui/core";
import {
  setupFormFieldSync,
  cleanupFormFieldSync,
} from "@code-ui/form/context";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  CheckboxContext,
  CheckboxMachine,
  CheckboxProps,
  CheckboxSchema,
  GroupStateSnapshot,
} from "./checkbox.types";
import { defaultCheckboxProps } from "./checkbox.props";
import {
  applyGroupState,
  parseBooleanProp,
  resolveInitialBooleans,
} from "./checkbox.utils";

export const checkboxMachine: CheckboxMachine = createMachine<CheckboxSchema>({
  props: ({ props }) => ({
    ...defaultCheckboxProps,
    ...props,
  }),

  initialState: ({ prop }) => resolveInitialBooleans(prop).initialState,

  refs: ({ prop }) => {
    const { initialChecked, initialIndeterminate } =
      resolveInitialBooleans(prop);
    const rawChecked = prop("checked");
    const rawIndeterminate = prop("indeterminate");

    return {
      initialChecked,
      initialIndeterminate,
      prevControlledChecked: isNotNull(rawChecked)
        ? parseBooleanProp(rawChecked)
        : undefined,
      prevControlledIndeterminate: isNotNull(rawIndeterminate)
        ? parseBooleanProp(rawIndeterminate)
        : undefined,
      currentGroupBus: undefined,
      currentFormBus: prop("formBus"),
      formField: undefined,
      busDisposers: [],
    };
  },

  context: ({ prop, bindable }) => {
    const propBindable = <
      K extends keyof CheckboxContext & keyof CheckboxProps,
    >(
      key: K,
      defaultValue: CheckboxContext[K],
    ) =>
      bindable<CheckboxContext[K]>(() => ({
        value: prop(key) as CheckboxContext[K] | undefined,
        defaultValue,
      }));

    const stateBindable = <K extends keyof CheckboxContext>(
      _key: K,
      defaultValue: CheckboxContext[K],
    ) =>
      bindable<CheckboxContext[K]>(() => ({
        defaultValue,
      }));

    return {
      checked: bindable<boolean>(() => {
        const rawChecked = prop("checked");
        const controlledVal = isNotNull(rawChecked)
          ? parseBooleanProp(rawChecked)
          : undefined;
        const initial =
          controlledVal ?? parseBooleanProp(prop("defaultChecked"));

        return {
          value: controlledVal,
          defaultValue: initial,
        };
      }),

      indeterminate: bindable<boolean>(() => {
        const rawIndeterminate = prop("indeterminate");
        const controlledVal = isNotNull(rawIndeterminate)
          ? parseBooleanProp(rawIndeterminate)
          : undefined;
        const initial =
          controlledVal ?? parseBooleanProp(prop("defaultIndeterminate"));

        return {
          value: controlledVal,
          defaultValue: initial,
        };
      }),

      formDisabled: stateBindable("formDisabled", false),
      formReadOnly: stateBindable("formReadOnly", false),
      fieldDisabled: propBindable("fieldDisabled", false),
      fieldSize: propBindable("fieldSize", ""),

      groupValue: stateBindable("groupValue", prop("groupValue")),
      groupDisabled: stateBindable(
        "groupDisabled",
        Boolean(prop("groupDisabled")),
      ),
      groupInvalid: stateBindable(
        "groupInvalid",
        Boolean(prop("groupInvalid")),
      ),
      groupColor: stateBindable("groupColor", prop("groupColor") ?? ""),
      groupSize: stateBindable("groupSize", prop("groupSize") ?? ""),
      groupVariant: stateBindable("groupVariant", prop("groupVariant") ?? ""),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      disabled: propBindable("disabled", false),
      readOnly: propBindable("readOnly", false),
      required: propBindable("required", false),
      color: propBindable("color", "primary"),
      size: propBindable("size", "md"),
      value: propBindable("value", ""),
      name: propBindable("name", ""),
      form: propBindable("form", ""),
      label: propBindable("label", ""),
      description: propBindable("description", ""),
      icon: propBindable("icon", "check"),
      indeterminateIcon: propBindable("indeterminateIcon", "minus"),
      ui: propBindable("ui", {}),
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
    isDisabled: ({ context }) =>
      Boolean(
        context.get("formDisabled") ||
        context.get("groupDisabled") ||
        context.get("fieldDisabled") ||
        context.get("disabled"),
      ),
    isReadOnly: ({ context }) =>
      Boolean(context.get("readOnly") || context.get("formReadOnly")),
    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isReadOnly"),
    isInvalid: ({ context }) =>
      Boolean(context.get("groupInvalid") || context.get("invalid")),
    effectiveSize: ({ context }) =>
      context.get("groupSize") ||
      context.get("fieldSize") ||
      context.get("size"),
    effectiveColor: ({ context }) =>
      context.get("groupColor") || context.get("color"),
  },

  watch: ({ prop, context, refs, state, computed }) => {
    const controlledChecked = prop("checked");
    if (isNotNull(controlledChecked)) {
      const boolVal = parseBooleanProp(controlledChecked);
      if (context.get("checked") !== boolVal) {
        context.set("checked", boolVal);
      }
      const isIndet = Boolean(
        prop("indeterminate") ?? context.get("indeterminate"),
      );
      if (!isIndet) {
        const targetState = boolVal ? "checked" : "unchecked";
        if (state.get() !== targetState) state.set(targetState);
      }
      refs.set("prevControlledChecked", boolVal);
    }

    const controlledIndeterminate = prop("indeterminate");
    if (isNotNull(controlledIndeterminate)) {
      const boolVal = parseBooleanProp(controlledIndeterminate);
      if (context.get("indeterminate") !== boolVal) {
        context.set("indeterminate", boolVal);
      }
      if (boolVal && state.get() !== "indeterminate") {
        state.set("indeterminate");
      } else if (!boolVal && state.get() === "indeterminate") {
        const chk = Boolean(prop("checked") ?? context.get("checked"));
        state.set(chk ? "checked" : "unchecked");
      }
      refs.set("prevControlledIndeterminate", boolVal);
    }

    const nextFormBus = prop("formBus");
    if (nextFormBus !== refs.get("currentFormBus")) {
      refs.set("currentFormBus", nextFormBus);
      refs.get("formField")?.rebind(nextFormBus ?? null);
    }

    const readGroupProps = (): GroupStateSnapshot => ({
      value: prop("groupValue"),
      disabled: prop("groupDisabled"),
      invalid: prop("groupInvalid"),
      color: prop("groupColor"),
      size: prop("groupSize"),
      variant: prop("groupVariant"),
    });

    const bus = prop("groupBus");
    if (bus && bus !== refs.get("currentGroupBus")) {
      refs.set("currentGroupBus", bus);
      const prevDisposers = refs.get("busDisposers") || [];
      for (const d of prevDisposers) d?.();

      const unsub = bus.on("group:change", (gState: GroupStateSnapshot) => {
        applyGroupState({ context, state }, gState);
      });

      refs.set("busDisposers", [unsub]);
      applyGroupState({ context, state }, readGroupProps());
    } else if (!refs.get("currentGroupBus")) {
      applyGroupState({ context, state }, readGroupProps());
    }

    const isGroupMode =
      Array.isArray(context.get("groupValue")) ||
      Boolean(refs.get("currentGroupBus"));
    if (isGroupMode) {
      const targetState = computed("isChecked") ? "checked" : "unchecked";
      if (state.get() !== targetState) {
        state.set(targetState);
      }
    }
  },

  entry: ["setupFormField"],
  exit: ["cleanupFormField", "cleanupGroupBus"],

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
    CHECK: [
      {
        guard: "hasGroupBus",
        actions: ["toggleGroupBus"],
      },
      {
        guard: "isControlled",
        actions: ["emitControlledCheck"],
      },
      {
        guard: "isInteractive",
        target: "checked",
        actions: ["setCheckedTrue", "emitCheckboxChange"],
      },
    ],
    UNCHECK: [
      {
        guard: "hasGroupBus",
        actions: ["toggleGroupBus"],
      },
      {
        guard: "isControlled",
        actions: ["emitControlledUncheck"],
      },
      {
        guard: "isInteractive",
        target: "unchecked",
        actions: ["setCheckedFalse", "emitCheckboxChange"],
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
            actions: ["emitControlledCheck"],
          },
          {
            guard: "isInteractive",
            target: "checked",
            actions: ["setCheckedTrue", "emitCheckboxChange"],
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
            actions: ["emitControlledUncheck"],
          },
          {
            guard: "isInteractive",
            target: "unchecked",
            actions: ["setCheckedFalse", "emitCheckboxChange"],
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
            actions: ["emitControlledCheck"],
          },
          {
            guard: "isInteractive",
            target: "checked",
            actions: ["setCheckedTrue", "emitCheckboxChange"],
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

      emitControlledCheck: ({ context, prop, refs }) => {
        const nextChecked = true;
        const itemVal = context.get("value") || prop("value") || nextChecked;

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

      emitControlledUncheck: ({ context, prop, refs }) => {
        const nextChecked = false;
        const itemVal = context.get("value") || prop("value") || nextChecked;

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

      emitCheckboxChange: ({ context, prop, refs }) => {
        const nextChecked = Boolean(context.get("checked"));
        const itemVal = context.get("value") || prop("value") || nextChecked;

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
        context.set("invalid", false);
      },

      resetIndeterminate: ({ context, refs }) => {
        const initialIndeterminate = Boolean(refs.get("initialIndeterminate"));
        const initialChecked = Boolean(refs.get("initialChecked"));
        context.set("checked", initialChecked);
        context.set("indeterminate", initialIndeterminate);
        context.set("invalid", false);
      },

      setupFormField: ({ context, prop, refs, scope, state, computed }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            bus: prop("formBus"),
            id: scope.id ?? "checkbox",
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () => context.get("name") || prop("name") || "",
            getValue: () => context.get("checked"),
            setValue: (rawVal: unknown) => {
              const nextChecked = Boolean(rawVal);
              context.set("checked", nextChecked);
              context.set("indeterminate", false);
              state.set(nextChecked ? "checked" : "unchecked");
            },
            resetValue: () => {
              const rawDefaultChecked = prop("defaultChecked");
              const initial =
                refs.get("initialChecked") ??
                (rawDefaultChecked !== undefined
                  ? parseBooleanProp(rawDefaultChecked)
                  : false);
              const initialIndet = Boolean(refs.get("initialIndeterminate"));

              context.set("checked", initial);
              context.set("indeterminate", initialIndet);
              context.set("invalid", false);
              state.set(
                initialIndet
                  ? "indeterminate"
                  : initial
                    ? "checked"
                    : "unchecked",
              );
            },
            focus: () => {},
            getValidateOn: () => prop("validateOn"),
            isDisabled: () => computed("isDisabled"),
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

      cleanupGroupBus: ({ refs }) => {
        const disposers = refs.get("busDisposers") || [];
        for (const d of disposers) d?.();
        refs.set("busDisposers", []);
        refs.set("currentGroupBus", undefined);
      },
    },
  },
});
