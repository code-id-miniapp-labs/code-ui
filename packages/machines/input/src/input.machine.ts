import { createMachine } from "@code-ui/core";
import {
  setupFormFieldSync,
  cleanupFormFieldSync,
} from "@code-ui/form/context";
import { isEmpty, isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  InputContext,
  InputMachine,
  InputProps,
  InputSchema,
} from "./input.types";
import { defaultInputProps } from "./input.props";

const toStringValue = (val: unknown): string | undefined =>
  isNotNull(val) ? String(val) : undefined;

export const inputMachine: InputMachine = createMachine<InputSchema>({
  props: ({ props }) => ({
    ...defaultInputProps,
    ...props,
  }),

  initialState: ({ prop }) => (prop("autoFocus") ? "focused" : "idle"),

  refs: ({ prop }) => {
    const initial =
      toStringValue(prop("value")) ?? toStringValue(prop("defaultValue")) ?? "";

    return {
      initialValue: initial,
      formField: undefined,
      currentFormBus: prop("formBus"),
    };
  },

  context: ({ prop, bindable, getRefs }) => {
    const propBindable = <K extends keyof InputContext & keyof InputProps>(
      key: K,
      defaultValue: InputContext[K],
    ) =>
      bindable<InputContext[K]>(() => ({
        value: prop(key) as InputContext[K] | undefined,
        defaultValue,
      }));

    const stateBindable = <K extends keyof InputContext>(
      _key: K,
      defaultValue: InputContext[K],
    ) =>
      bindable<InputContext[K]>(() => ({
        defaultValue,
      }));

    return {
      value: bindable<string>(() => {
        const controlledVal = toStringValue(prop("value"));
        const defaultVal = toStringValue(prop("defaultValue"));

        return {
          value: controlledVal,
          defaultValue: controlledVal ?? defaultVal ?? "",
          onChange: (nextVal) => {
            prop("onChange")?.({ value: nextVal });

            const formField = getRefs().get("formField");
            if (formField) {
              formField.emitInput(nextVal);
              formField.emitChange(nextVal);
            }
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
      formDisabled: stateBindable("formDisabled", false),
      formReadOnly: stateBindable("formReadOnly", false),

      fieldDisabled: propBindable("fieldDisabled", false),
      fieldSize: propBindable("fieldSize", ""),
      variant: propBindable("variant", "outline"),
      color: propBindable("color", "primary"),
      size: propBindable("size", "md"),
      highlight: propBindable("highlight", false),
      disabled: propBindable("disabled", false),
      readOnly: propBindable("readOnly", false),
      placeholder: propBindable("placeholder", ""),
      type: propBindable("type", "text"),
      password: propBindable("password", false),
      maxlength: propBindable("maxlength", 140),
      clearable: propBindable("clearable", false),
      clearIcon: propBindable("clearIcon", ""),
      loading: propBindable("loading", false),
      leading: propBindable("leading", false),
      trailing: propBindable("trailing", false),
      leadingIcon: propBindable("leadingIcon", ""),
      trailingIcon: propBindable("trailingIcon", ""),
      form: propBindable("form", ""),
      name: propBindable("name", ""),
      ui: propBindable("ui", {}),
    };
  },

  computed: {
    isEmpty: ({ context }) => isEmpty(context.get("value")),
    isFilled: ({ context }) => !isEmpty(context.get("value")),
    isDisabled: ({ context }) =>
      Boolean(
        context.get("formDisabled") ||
        context.get("fieldDisabled") ||
        context.get("disabled"),
      ),
    isReadOnly: ({ context }) =>
      Boolean(context.get("readOnly") || context.get("formReadOnly")),
    isInteractive: ({ computed }) =>
      !computed("isDisabled") && !computed("isReadOnly"),
    isClearable: ({ context, computed }) =>
      Boolean(
        context.get("clearable") &&
        computed("isInteractive") &&
        computed("isFilled"),
      ),
    effectiveSize: ({ context }) =>
      context.get("fieldSize") || context.get("size") || "md",
  },

  watch: ({ prop, refs }) => {
    const nextFormBus = prop("formBus");
    if (nextFormBus !== refs.get("currentFormBus")) {
      refs.set("currentFormBus", nextFormBus);
      refs.get("formField")?.rebind(nextFormBus ?? null);
    }
  },

  entry: ["setupFormField"],
  exit: ["cleanupFormField"],

  on: {
    "INPUT.CHANGE": {
      guard: "isInteractive",
      actions: ["setValue"],
    },
    "INPUT.CONFIRM": {
      actions: ["handleConfirm"],
    },
    "INPUT.CLEAR": {
      guard: "isInteractive",
      actions: ["clearValue"],
    },
    SET_VALUE: {
      actions: ["setValue"],
    },
    CLEAR_VALUE: {
      actions: ["clearValue"],
    },
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
          guard: "isInteractive",
          target: "focused",
          actions: ["handleFocus"],
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
      },
    },
  },

  implementations: {
    guards: {
      isInteractive: ({ computed }) => computed("isInteractive"),
    },

    actions: {
      setupFormField: ({ context, prop, refs, scope, state, computed }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            bus: prop("formBus"),
            id: scope.id ?? "input",
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () => context.get("name") || prop("name") || "",
            getValue: () => context.get("value"),
            setValue: (rawVal: unknown) => {
              context.set("value", toStringValue(rawVal) ?? "");
            },
            resetValue: () => {
              const initial =
                refs.get("initialValue") ??
                toStringValue(prop("defaultValue")) ??
                "";
              context.set("value", initial);
              context.set("invalid", false);
              state.set("idle");
            },
            focus: () => {
              if (!computed("isInteractive")) return;
              state.set("focused");
            },
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

      handleFocus: ({ context, prop, refs }) => {
        const val = context.get("value");
        prop("onFocus")?.({ value: val });
        refs.get("formField")?.emitFocus(val);
      },

      handleBlur: ({ context, prop, refs }) => {
        const val = context.get("value");
        prop("onBlur")?.({ value: val });
        refs.get("formField")?.emitBlur(val);
      },

      handleConfirm: ({ context, prop }) => {
        const val = context.get("value");
        prop("onConfirm")?.({ value: val });
      },

      setValue: ({ context, event }) => {
        const val = toStringValue((event as any).value) ?? "";
        context.set("value", val);
      },

      clearValue: ({ context, prop }) => {
        context.set("value", "");
        prop("onClear")?.({});
      },

      resetValue: ({ context, prop, refs }) => {
        const initial =
          refs.get("initialValue") ?? toStringValue(prop("defaultValue")) ?? "";
        context.set("value", initial);
        context.set("invalid", false);
      },
    },
  },
});
