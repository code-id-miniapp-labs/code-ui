import { createMachine } from "@code-ui/core";
import { bindFormField } from "@code-ui/form/context";
import { isEmpty, isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  TextareaColor,
  TextareaMachine,
  TextareaSchema,
  TextareaSize,
  TextareaVariant,
} from "./textarea.types";
import { defaultTextareaProps } from "./textarea.props";

export const textareaMachine: TextareaMachine = createMachine<TextareaSchema>({
  props: ({ props }) => ({
    ...defaultTextareaProps,
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

  context: ({ prop, bindable, getRefs }) => ({
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

    variant: bindable<TextareaVariant>(() => ({
      value: prop("variant"),
      defaultValue: "outline",
    })),

    color: bindable<TextareaColor>(() => ({
      value: prop("color"),
      defaultValue: "primary",
    })),

    size: bindable<TextareaSize>(() => ({
      value: prop("size"),
      defaultValue: "md",
    })),

    highlight: bindable<boolean>(() => ({
      value: prop("highlight"),
      defaultValue: false,
    })),

    disabled: bindable<boolean>(() => ({
      value: prop("disabled"),
      defaultValue: false,
    })),

    readOnly: bindable<boolean>(() => ({
      value: prop("readOnly"),
      defaultValue: false,
    })),

    formDisabled: bindable<boolean>(() => ({
      defaultValue: false,
    })),

    formReadOnly: bindable<boolean>(() => ({
      defaultValue: false,
    })),

    fieldDisabled: bindable<boolean>(() => ({
      value: prop("fieldDisabled"),
      defaultValue: false,
    })),

    fieldSize: bindable<any>(() => ({
      value: prop("fieldSize"),
      defaultValue: "",
    })),

    invalid: bindable<boolean>(() => {
      const rawInvalid = prop("invalid");
      return {
        value: isNotEmpty(rawInvalid) ? Boolean(rawInvalid) : undefined,
        defaultValue: false,
      };
    }),

    placeholder: bindable<string>(() => ({
      value: prop("placeholder"),
      defaultValue: "",
    })),

    maxlength: bindable<number>(() => ({
      value: prop("maxlength"),
      defaultValue: 140,
    })),

    autoHeight: bindable<boolean>(() => ({
      value: prop("autoHeight"),
      defaultValue: false,
    })),

    clearable: bindable<boolean>(() => ({
      value: prop("clearable"),
      defaultValue: false,
    })),

    clearIcon: bindable<string>(() => ({
      value: prop("clearIcon"),
      defaultValue: "",
    })),

    loading: bindable<boolean>(() => ({
      value: prop("loading"),
      defaultValue: false,
    })),

    leading: bindable<boolean>(() => ({
      value: prop("leading"),
      defaultValue: false,
    })),

    trailing: bindable<boolean>(() => ({
      value: prop("trailing"),
      defaultValue: false,
    })),

    leadingIcon: bindable<string>(() => ({
      value: prop("leadingIcon"),
      defaultValue: "",
    })),

    trailingIcon: bindable<string>(() => ({
      value: prop("trailingIcon"),
      defaultValue: "",
    })),

    count: bindable<boolean>(() => ({
      value: prop("count"),
      defaultValue: false,
    })),

    form: bindable<string>(() => ({
      value: prop("form"),
      defaultValue: "",
    })),

    name: bindable<string>(() => ({
      value: prop("name"),
      defaultValue: "",
    })),

    ui: bindable<any>(() => ({
      value: prop("ui") ?? {},
      defaultValue: {},
    })),
  }),

  computed: {
    isEmpty: ({ context }) => isEmpty(context.get("value")),
    isFilled: ({ context }) => !isEmpty(context.get("value")),
    characterCount: ({ context }) => (context.get("value") ?? "").length,
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
        "TEXTAREA.FOCUS": {
          target: "focused",
          actions: ["handleFocus"],
        },
        "TEXTAREA.CHANGE": {
          actions: ["handleInputChange"],
        },
        "TEXTAREA.CONFIRM": {
          actions: ["handleConfirm"],
        },
        "TEXTAREA.LINE_CHANGE": {
          actions: ["handleLineChange"],
        },
        "TEXTAREA.CLEAR": {
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
        "TEXTAREA.BLUR": {
          target: "idle",
          actions: ["handleBlur"],
        },
        "TEXTAREA.CHANGE": {
          actions: ["handleInputChange"],
        },
        "TEXTAREA.CONFIRM": {
          actions: ["handleConfirm"],
        },
        "TEXTAREA.LINE_CHANGE": {
          actions: ["handleLineChange"],
        },
        "TEXTAREA.CLEAR": {
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
        refs.get("formField")?.dispose();
        refs.set("currentFormBus", prop("formBus"));

        let suppressEmit = false;

        const bound = bindFormField({
          component: prop("component"),
          bus: prop("formBus"),
          id: scope.id ?? "textarea",
          getFormId: () => context.get("form") || prop("form") || "",
          getName: () => context.get("name") || prop("name") || "",
          getValue: () => context.get("value"),
          setValue: (rawVal: any) => {
            suppressEmit = true;
            try {
              context.set(
                "value",
                rawVal !== undefined && rawVal !== null ? String(rawVal) : "",
              );
            } finally {
              suppressEmit = false;
            }
          },
          resetValue: () => {
            suppressEmit = true;
            try {
              const initial =
                refs.get("initialValue") ??
                (prop("defaultValue") !== undefined
                  ? String(prop("defaultValue"))
                  : "");
              context.set("value", initial);
              context.set("invalid", false);
              state.set("idle");
            } finally {
              suppressEmit = false;
            }
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
          onValidationChange: (valState) => {
            context.set("invalid", !valState.isValid);
          },
          onFormStateChange: ({ disabled, readOnly }) => {
            context.set("formDisabled", disabled);
            context.set("formReadOnly", readOnly);
          },
        });

        const bus = bound.bus;
        const disposers: Array<() => void> = [];
        if (bus) {
          disposers.push(
            bus.on("field:state", (payload: any) => {
              const currentName = context.get("name") || prop("name");
              if (!payload?.name || payload.name === currentName) {
                if (payload.disabled !== undefined) {
                  context.set("fieldDisabled", Boolean(payload.disabled));
                }
                if (payload.size !== undefined) {
                  context.set("fieldSize", payload.size);
                }
              }
            }),
          );

          disposers.push(
            bus.on("form:state", (payload: any) => {
              if (payload?.disabled !== undefined) {
                context.set("formDisabled", Boolean(payload.disabled));
              }
              if (payload?.readOnly !== undefined) {
                context.set("formReadOnly", Boolean(payload.readOnly));
              }
            }),
          );
        }
        refs.set("busDisposers", disposers);

        // Wrap emitInput and emitChange to respect suppressEmit during Form-driven setValue/resetValue
        const origEmitInput = bound.emitInput.bind(bound);
        const origEmitChange = bound.emitChange.bind(bound);
        bound.emitInput = (val: any) => {
          if (!suppressEmit) origEmitInput(val);
        };
        bound.emitChange = (val: any) => {
          if (!suppressEmit) origEmitChange(val);
        };

        refs.set("formField", bound);
      },

      cleanupFormField: ({ refs }) => {
        refs.get("formField")?.dispose();
        refs.set("formField", undefined);
        refs.set("currentFormBus", undefined);
        const disposers = refs.get("busDisposers") ?? [];
        for (let i = 0; i < disposers.length; i++) {
          disposers[i]?.();
        }
        refs.set("busDisposers", []);
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

      handleLineChange: ({ prop, event }) => {
        const details = (event as any).details;
        prop("component")?.triggerEvent?.("linechange", details);
        prop("onLineChange")?.(details);
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
