import { createMachine } from "@code-ui/core";
import {
  setupFormFieldSync,
  cleanupFormFieldSync,
} from "@code-ui/form/context";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  RadioGroupContext,
  RadioGroupMachine,
  RadioGroupMachineContext,
  RadioGroupProps,
  RadioGroupSchema,
  RadioGroupSize,
} from "./radio-group.types";
import { defaultRadioGroupProps } from "./radio-group.props";
import { dispatchChangeEvent, resolveInitialValue } from "./radio-group.utils";

export const radioGroupMachine: RadioGroupMachine =
  createMachine<RadioGroupSchema>({
    props: ({ props }) => ({
      ...defaultRadioGroupProps,
      ...props,
    }),

    initialState: () => "idle",

    refs: ({ prop, context, computed, send }) => ({
      initialValue: resolveInitialValue(prop),
      formField: undefined,
      groupContext: {
        value: () => context.get("value"),
        disabled: () => computed("isDisabled"),
        readOnly: () => computed("isReadOnly"),
        invalid: () => computed("isInvalid"),
        color: () => context.get("color") || "primary",
        size: () => computed("effectiveSize"),
        variant: () => context.get("variant") || "outline",
        select: (value) => send({ type: "SET_VALUE", value }),
        setValue: (value) =>
          value === null
            ? send({ type: "CLEAR" })
            : send({ type: "SET_VALUE", value }),
        clear: () => send({ type: "CLEAR" }),
      } satisfies RadioGroupContext,
    }),

    context: ({ prop, bindable, getRefs }) => {
      const propBindable = <
        K extends keyof RadioGroupMachineContext & keyof RadioGroupProps,
      >(
        key: K,
        defaultValue: RadioGroupMachineContext[K],
      ) =>
        bindable<RadioGroupMachineContext[K]>(() => ({
          value: prop(key) as RadioGroupMachineContext[K] | undefined,
          defaultValue,
        }));

      return {
        value: bindable<string | null>(() => {
          const rawVal = prop("value");
          const controlledVal = isNotNull(rawVal) ? String(rawVal) : undefined;
          const initial = controlledVal ?? resolveInitialValue(prop);

          return {
            value: controlledVal,
            defaultValue: initial,
            onChange: (nextVal) => {
              dispatchChangeEvent(prop, getRefs(), nextVal);
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

        name: propBindable("name", ""),
        form: propBindable("form", ""),
        disabled: propBindable("disabled", false),
        readOnly: propBindable("readOnly", false),

        required: propBindable("required", false),
        color: propBindable("color", "primary"),
        size: propBindable("size", "md"),
        orientation: propBindable("orientation", "vertical"),
        variant: propBindable("variant", "outline"),
        legend: propBindable("legend", ""),
        items: propBindable("items", []),
        ui: propBindable("ui", {}),
      };
    },

    computed: {
      effectiveSize: ({ context, computed }) => {
        const size = context.get("size");
        return size && size !== "md"
          ? size
          : ((computed("fieldSize") || size || "md") as RadioGroupSize);
      },
      formDisabled: ({ prop, refs }) => {
        const host = prop("formContext") ?? refs.get("formField")?.host;
        return host?.disabled() ?? false;
      },
      formReadOnly: ({ prop, refs }) => {
        const host = prop("formContext") ?? refs.get("formField")?.host;
        return host?.readOnly() ?? false;
      },
      fieldDisabled: ({ prop, refs, scope }) => {
        const host = prop("formContext") ?? refs.get("formField")?.host;
        return Boolean(
          prop("fieldDisabled") ||
          host?.fieldState(prop("name") || scope.id || "radio-group")?.disabled,
        );
      },
      fieldSize: ({ prop, refs, scope }) => {
        const host = prop("formContext") ?? refs.get("formField")?.host;
        return (
          prop("fieldSize") ||
          host?.fieldState(prop("name") || scope.id || "radio-group")?.size ||
          ""
        );
      },
      isInvalid: ({ prop, refs, context, scope }) => {
        const host = prop("formContext") ?? refs.get("formField")?.host;
        return Boolean(
          context.get("invalid") ||
          host?.errors(prop("name") || scope.id || "radio-group").length,
        );
      },
      isDisabled: ({ context, computed }) =>
        Boolean(
          computed("formDisabled") ||
          computed("fieldDisabled") ||
          context.get("disabled"),
        ),
      isReadOnly: ({ context, computed }) =>
        Boolean(context.get("readOnly") || computed("formReadOnly")),
      isInteractive: ({ computed }) =>
        !computed("isDisabled") && !computed("isReadOnly"),
    },

    entry: ["setupFormField"],
    exit: ["cleanupFormField"],

    on: {
      SET_VALUE: {
        guard: "isInteractive",
        actions: ["setValue"],
      },
      CLEAR: {
        guard: "isInteractive",
        actions: ["clearValue"],
      },
      SET_INVALID: {
        actions: ["setInvalid"],
      },
      RESET_VALUE: {
        target: "idle",
        actions: ["resetValue"],
      },
    },

    states: {
      idle: {
        tags: ["idle"],
      },
    },

    implementations: {
      guards: {
        isInteractive: ({ computed }) => computed("isInteractive"),
      },

      actions: {
        setValue: ({ context, event }) => {
          if ("value" in event) {
            context.set("value", String(event.value));
          }
        },
        clearValue: ({ context }) => {
          context.set("value", null);
        },
        resetValue: ({ context, refs, prop }) => {
          const initial = refs.get("initialValue") ?? resolveInitialValue(prop);
          context.set("value", initial);
          context.set("invalid", false);
        },
        setInvalid: ({ context, event }) => {
          if ("invalid" in event) {
            context.set("invalid", Boolean(event.invalid));
          }
        },
        setupFormField: ({ context, prop, refs, scope, computed }) => {
          setupFormFieldSync(
            {
              component: prop("component"),
              getHost: () => prop("formContext"),
              id: scope.id ?? "radio-group",
              getFormId: () => context.get("form") || prop("form") || "",
              getName: () => context.get("name") || prop("name") || "",
              getValue: () => context.get("value"),
              setValue: (rawVal: unknown) => {
                context.set("value", isNotNull(rawVal) ? String(rawVal) : null);
              },
              resetValue: () => {
                const initial =
                  refs.get("initialValue") ?? resolveInitialValue(prop);
                context.set("value", initial);
                context.set("invalid", false);
              },
              focus: () => {},
              getRules: () => prop("rules") ?? [],
              getValidateOn: () => prop("validateOn"),
              isDisabled: () => computed("isDisabled"),
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
