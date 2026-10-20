import { createMachine } from "@code-ui/core";
import { setupFormFieldSync, cleanupFormFieldSync } from "@code-ui/form/context";
import { isEmpty, isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  InputColor,
  InputMachine,
  InputSchema,
  InputSize,
  InputType,
  InputVariant,
} from "./input.types";
import { defaultInputProps } from "./input.props";

export const inputMachine: InputMachine = createMachine<InputSchema>({
  props: ({ props }) => ({
    ...defaultInputProps,
    ...props,
  }),

  initialState: ({ prop }) => {
    return prop("autoFocus") ? "focused" : "idle";
  },

  refs: ({ prop }) => {
    const rawVal = prop("value");
    const rawDefault = prop("defaultValue");
    const initial =
      rawVal !== undefined && rawVal !== null
        ? String(rawVal)
        : rawDefault !== undefined && rawDefault !== null
          ? String(rawDefault)
          : "";
    return {
      initialValue: initial,
      formField: undefined,
      busDisposers: [],
    };
  },

  context: ({ prop, bindable, getRefs }) => {
    const b = <T>(key: any, defaultValue: T) =>
      bindable<T>(() => ({ value: prop(key), defaultValue }));

    return {
      value: bindable<string>(() => {
        const rawVal = prop("value");
        const controlledVal = isNotNull(rawVal) ? String(rawVal) : undefined;
        const rawDefault = prop("defaultValue");
        const rawDefaultVal = isNotNull(rawDefault)
          ? String(rawDefault)
          : undefined;
        const initial = (controlledVal ?? rawDefaultVal) || "";

        return {
          value: controlledVal,
          defaultValue: initial,
          onChange: (nextVal) => {
            prop("onValueChange")?.({ value: nextVal });
            prop("component")?.triggerEvent?.("change", { value: nextVal });
            prop("component")?.setData?.({ value: nextVal });

            const formField = getRefs().get("formField");
            if (formField) {
              formField.emitInput(nextVal);
              formField.emitChange(nextVal);
            }
          },
        };
      }),

      variant: b<InputVariant>("variant", "outline"),
      color: b<InputColor>("color", "primary"),
      size: b<InputSize>("size", "md"),
      highlight: b("highlight", false),
      disabled: b("disabled", false),
      readOnly: b("readOnly", false),
      formDisabled: b("formDisabled", false),
      formReadOnly: b("formReadOnly", false),
      fieldDisabled: b("fieldDisabled", false),
      fieldSize: b<InputSize | "">("fieldSize", ""),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      placeholder: b("placeholder", ""),
      type: b<InputType>("type", "text"),
      password: b("password", false),
      maxlength: b("maxlength", 140),
      clearable: b("clearable", false),
      clearIcon: b("clearIcon", ""),
      loading: b("loading", false),
      leading: b("leading", false),
      trailing: b("trailing", false),
      leadingIcon: b("leadingIcon", ""),
      trailingIcon: b("trailingIcon", ""),
      form: b("form", ""),
      name: b("name", ""),
      ui: b("ui", {}),
    };
  },

  computed: {
    isEmpty: ({ context }) => isEmpty(context.get("value")),
    isFilled: ({ context }) => !isEmpty(context.get("value")),
    isClearable: ({ context, computed }) => {
      const isClearableProp = context.get("clearable");
      const isDisabled = Boolean(
        context.get("disabled") ||
        context.get("formDisabled") ||
        context.get("fieldDisabled"),
      );
      const isReadOnly = Boolean(
        context.get("readOnly") || context.get("formReadOnly"),
      );
      return Boolean(
        isClearableProp && !isDisabled && !isReadOnly && computed("isFilled"),
      );
    },
  },

  watch: ({ prop, context, refs }) => {
    const controlledVal = prop("value");
    if (isNotNull(controlledVal)) {
      const stringVal = String(controlledVal);
      if (context.get("value") !== stringVal) {
        context.set("value", stringVal);
      }
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
  },

  entry: ["setupFormField"],
  exit: ["cleanupFormField"],

  on: {
    RESET_VALUE: {
      target: "idle",
      actions: ["resetValue"],
    },
  },

  states: {
    idle: {
      tags: ["idle"],
      on: {
        "INPUT.FOCUS": {
          target: "focused",
          actions: ["handleFocus"],
        },
        "INPUT.CHANGE": {
          actions: ["handleInputChange"],
        },
        "INPUT.CONFIRM": {
          actions: ["handleConfirm"],
        },
        "INPUT.CLEAR": {
          actions: ["clearValue"],
        },
        SET_VALUE: {
          actions: ["setValue"],
        },
        CLEAR_VALUE: {
          actions: ["clearValue"],
        },
      },
    },

    focused: {
      tags: ["focused"],
      on: {
        "INPUT.BLUR": {
          target: "idle",
          actions: ["handleBlur"],
        },
        "INPUT.CHANGE": {
          actions: ["handleInputChange"],
        },
        "INPUT.CONFIRM": {
          actions: ["handleConfirm"],
        },
        "INPUT.CLEAR": {
          actions: ["clearValue"],
        },
        SET_VALUE: {
          actions: ["setValue"],
        },
        CLEAR_VALUE: {
          actions: ["clearValue"],
        },
      },
    },
  },

  implementations: {
    actions: {
      setupFormField: ({ context, prop, refs, scope, state }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            bus: prop("formBus"),
            id: scope.id ?? "input",
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () => context.get("name") || prop("name") || "",
            getValue: () => context.get("value"),
            setValue: (rawVal: any) => {
              context.set(
                "value",
                rawVal !== undefined && rawVal !== null ? String(rawVal) : "",
              );
            },
            resetValue: () => {
              const initial =
                refs.get("initialValue") ??
                (prop("defaultValue") !== undefined
                  ? String(prop("defaultValue"))
                  : "");
              context.set("value", initial);
              context.set("invalid", false);
              state.set("idle");
            },
            focus: () => {
              if (
                context.get("disabled") ||
                context.get("formDisabled") ||
                context.get("fieldDisabled") ||
                context.get("readOnly") ||
                context.get("formReadOnly")
              ) {
                return;
              }
              state.set("focused");
            },
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

      handleInputChange: ({ context, event }) => {
        const isDisabled = Boolean(
          context.get("disabled") ||
          context.get("formDisabled") ||
          context.get("fieldDisabled"),
        );
        const isReadOnly = Boolean(
          context.get("readOnly") || context.get("formReadOnly"),
        );
        if (isDisabled || isReadOnly) return;
        const nextVal = (event as any).value ?? "";
        context.set("value", String(nextVal));
      },

      handleFocus: ({ context, prop, refs }) => {
        const val = context.get("value");
        prop("component")?.triggerEvent?.("focus", { value: val });
        refs.get("formField")?.emitFocus(val);
      },

      handleBlur: ({ context, prop, refs }) => {
        const val = context.get("value");
        prop("component")?.triggerEvent?.("blur", { value: val });
        refs.get("formField")?.emitBlur(val);
      },

      handleConfirm: ({ context, prop }) => {
        const val = context.get("value");
        prop("component")?.triggerEvent?.("confirm", { value: val });
      },

      setValue: ({ context, event }) => {
        const val = (event as any).value;
        context.set(
          "value",
          val !== undefined && val !== null ? String(val) : "",
        );
      },

      clearValue: ({ context, prop }) => {
        context.set("value", "");
        prop("component")?.triggerEvent?.("clear", {});
      },

      resetValue: ({ context, prop, refs, state }) => {
        const initial =
          refs.get("initialValue") ??
          (prop("defaultValue") !== undefined
            ? String(prop("defaultValue"))
            : "");
        context.set("value", initial);
        context.set("invalid", false);
        state.set("idle");
      },
    },
  },
});
