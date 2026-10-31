import { createMachine } from "@code-ui/core";
import { setupFormFieldSync, cleanupFormFieldSync } from "@code-ui/form/context";
import { isEmpty, isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  TextareaContext,
  TextareaMachine,
  TextareaProps,
  TextareaSchema,
  TextareaSize,
} from "./textarea.types";
import { defaultTextareaProps } from "./textarea.props";

const toStringValue = (val: unknown): string | undefined =>
  isNotNull(val) ? String(val) : undefined;

export const textareaMachine: TextareaMachine = createMachine<TextareaSchema>({
  props: ({ props }) => ({
    ...defaultTextareaProps,
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
    const propBindable = <
      K extends keyof TextareaContext & keyof TextareaProps,
    >(
      key: K,
      defaultValue: TextareaContext[K],
    ) =>
      bindable<TextareaContext[K]>(() => ({
        value: prop(key) as TextareaContext[K] | undefined,
        defaultValue,
      }));

    const stateBindable = <K extends keyof TextareaContext>(
      _key: K,
      defaultValue: TextareaContext[K],
    ) =>
      bindable<TextareaContext[K]>(() => ({
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

      variant: propBindable("variant", "outline"),
      color: propBindable("color", "primary"),
      size: propBindable("size", "md"),
      highlight: propBindable("highlight", false),
      disabled: propBindable("disabled", false),
      readOnly: propBindable("readOnly", false),
      formDisabled: stateBindable("formDisabled", false),
      formReadOnly: stateBindable("formReadOnly", false),
      fieldDisabled: propBindable("fieldDisabled", false),
      fieldSize: propBindable("fieldSize", ""),

      invalid: bindable<boolean>(() => {
        const rawInvalid = prop("invalid");
        return {
          value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
          defaultValue: false,
        };
      }),

      placeholder: propBindable("placeholder", ""),
      maxlength: propBindable("maxlength", 140),
      autoHeight: propBindable("autoHeight", false),
      clearable: propBindable("clearable", false),
      clearIcon: propBindable("clearIcon", ""),
      loading: propBindable("loading", false),
      leading: propBindable("leading", false),
      trailing: propBindable("trailing", false),
      leadingIcon: propBindable("leadingIcon", ""),
      trailingIcon: propBindable("trailingIcon", ""),
      count: propBindable("count", false),
      form: propBindable("form", ""),
      name: propBindable("name", ""),
      ui: propBindable("ui", {}),
    };
  },

  computed: {
    isEmpty: ({ context }) => isEmpty(context.get("value")),
    isFilled: ({ context }) => !isEmpty(context.get("value")),
    characterCount: ({ context }) => (context.get("value") ?? "").length,
    isDisabled: ({ context }) =>
      Boolean(
        context.get("disabled") ||
        context.get("formDisabled") ||
        context.get("fieldDisabled"),
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
    effectiveSize: ({ context }) => {
      const rawSize = context.get("size");
      const fieldSize = context.get("fieldSize");
      return rawSize && rawSize !== "md"
        ? rawSize
        : ((fieldSize || rawSize || "md") as TextareaSize);
    },
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
    "TEXTAREA.CHANGE": {
      guard: "isInteractive",
      actions: ["setValue"],
    },
    "TEXTAREA.CONFIRM": {
      actions: ["handleConfirm"],
    },
    "TEXTAREA.LINE_CHANGE": {
      actions: ["handleLineChange"],
    },
    "TEXTAREA.CLEAR": {
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
        "TEXTAREA.FOCUS": {
          guard: "isInteractive",
          target: "focused",
          actions: ["handleFocus"],
        },
      },
    },

    focused: {
      tags: ["focused"],
      on: {
        "TEXTAREA.BLUR": {
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
            id: scope.id ?? "textarea",
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

      handleLineChange: ({ prop, event }) => {
        const details = (event as any).details;
        prop("component")?.triggerEvent?.("linechange", details);
        prop("onLineChange")?.(details);
      },

      setValue: ({ context, event }) => {
        const val = toStringValue((event as any).value) ?? "";
        context.set("value", val);
      },

      clearValue: ({ context, prop }) => {
        context.set("value", "");
        prop("component")?.triggerEvent?.("clear", {});
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
