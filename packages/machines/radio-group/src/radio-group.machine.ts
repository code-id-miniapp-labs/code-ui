import { createMachine } from "@code-ui/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-ui/form/context";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  RadioGroupContext,
  RadioGroupMachine,
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
        color: () => prop("color") || "primary",
        size: () => computed("effectiveSize"),
        variant: () => prop("variant") || "outline",
        select: (value) => send({ type: "SET_VALUE", value }),
        setValue: (value) =>
          value === null
            ? send({ type: "CLEAR" })
            : send({ type: "SET_VALUE", value }),
        clear: () => send({ type: "CLEAR" }),
      } satisfies RadioGroupContext,
    }),

    context: ({ prop, bindable, getRefs }) => ({
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
    }),

    computed: {
      ...createFormFieldComputed("radio-group"),
      effectiveSize: ({ prop, computed }) => {
        const size = prop("size");
        return size && size !== "md"
          ? size
          : ((computed("fieldSize") || size || "md") as RadioGroupSize);
      },
      isInvalid: ({ prop, refs, context, scope }) =>
        Boolean(
          context.get("invalid") ||
            hasFormFieldErrors(prop, refs, scope, "radio-group"),
        ),
      isDisabled: ({ prop, computed }) =>
        Boolean(
          computed("formDisabled") ||
            computed("fieldDisabled") ||
            prop("disabled"),
        ),
      isReadOnly: ({ prop, computed }) =>
        Boolean(prop("readOnly") || computed("formReadOnly")),
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
              getFormId: () => prop("form") || "",
              getName: () => prop("name") || "",
              getValue: () => context.get("value"),
              setValue: (rawVal: unknown) => {
                context.set("value", isNotNull(rawVal) ? String(rawVal) : null);
              },
              resetValue: () => {
                context.set(
                  "value",
                  refs.get("initialValue") ?? resolveInitialValue(prop),
                );
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
