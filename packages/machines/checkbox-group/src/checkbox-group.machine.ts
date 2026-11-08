import { createMachine } from "@code-ui/core";
import {
  cleanupFormFieldSync,
  createFormFieldComputed,
  hasFormFieldErrors,
  setupFormFieldSync,
} from "@code-ui/form/context";
import { isEqual, isNotEmpty } from "@code-ui/utils";
import type {
  CheckboxGroupContext,
  CheckboxGroupMachine,
  CheckboxGroupSchema,
  CheckboxGroupSize,
} from "./checkbox-group.types";
import { defaultCheckboxGroupProps } from "./checkbox-group.props";

const toBound = (raw: unknown): number | null =>
  raw !== null && raw !== undefined && !Number.isNaN(Number(raw))
    ? Number(raw)
    : null;

export const checkboxGroupMachine: CheckboxGroupMachine =
  createMachine<CheckboxGroupSchema>({
    props: ({ props }) => ({
      ...defaultCheckboxGroupProps,
      ...props,
    }),

    initialState: () => "idle",

    refs: ({ prop, context, computed, send }) => {
      const rawVal = prop("value");
      const rawDefault = prop("defaultValue");
      const initial: string[] = Array.isArray(rawVal)
        ? rawVal
        : Array.isArray(rawDefault)
          ? rawDefault
          : [];
      return {
        initialValue: initial,
        formField: undefined,
        groupContext: {
          value: () => context.get("value") ?? [],
          disabled: () => computed("isDisabled"),
          readOnly: () => computed("isReadOnly"),
          invalid: () => computed("isInvalid"),
          color: () => prop("color") || "primary",
          size: () => computed("effectiveSize"),
          variant: () => prop("variant") || "outline",
          setValue: (value) => send({ type: "SET_VALUE", value }),
          toggleValue: (value, checked) =>
            send({ type: "TOGGLE_VALUE", value, checked }),
        } satisfies CheckboxGroupContext,
      };
    },

    context: ({ prop, bindable, getRefs }) => ({
      value: bindable<string[]>(() => {
        const rawVal = prop("value");
        const controlledVal = Array.isArray(rawVal) ? rawVal : undefined;
        const rawDefault = prop("defaultValue");
        const initial: string[] =
          controlledVal ?? (Array.isArray(rawDefault) ? rawDefault : []);

        return {
          value: controlledVal,
          defaultValue: initial,
          isEqual,
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
    }),

    computed: {
      ...createFormFieldComputed("checkbox-group"),
      effectiveSize: ({ prop, computed }) => {
        const size = prop("size");
        return size && size !== "md"
          ? size
          : ((computed("fieldSize") || size || "md") as CheckboxGroupSize);
      },
      isInvalid: ({ prop, refs, context, scope }) =>
        Boolean(
          context.get("invalid") ||
            hasFormFieldErrors(prop, refs, scope, "checkbox-group"),
        ),
      isDisabled: ({ prop, computed }) =>
        Boolean(
          prop("disabled") ||
            computed("formDisabled") ||
            computed("fieldDisabled"),
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
      TOGGLE_VALUE: {
        guard: "isInteractive",
        actions: ["toggleValue"],
      },
      SELECT_ALL: {
        guard: "isInteractive",
        actions: ["selectAll"],
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
          if ("value" in event && Array.isArray(event.value)) {
            context.set("value", event.value);
          }
        },
        toggleValue: ({ context, prop, event }) => {
          if (!("value" in event)) return;
          const current = context.get("value") ?? [];
          const target = String(event.value);
          const isSelected = current.includes(target);
          const min = toBound(prop("min"));
          const max = toBound(prop("max"));

          const targetChecked =
            "checked" in event && typeof event.checked === "boolean"
              ? event.checked
              : !isSelected;

          if (targetChecked === isSelected) return;

          if (isSelected) {
            if (min !== null && current.length <= min) return;
            context.set(
              "value",
              current.filter((v: string) => v !== target),
            );
          } else {
            if (max !== null && current.length >= max) return;
            context.set("value", [...current, target]);
          }
        },
        selectAll: ({ context, prop }) => {
          const rawItems = prop("items") ?? [];
          const allValues = rawItems.map((raw) =>
            typeof raw === "string" ? raw : String(raw.value ?? ""),
          );
          const max = toBound(prop("max"));
          context.set(
            "value",
            max !== null ? allValues.slice(0, max) : allValues,
          );
        },
        clearValue: ({ context, prop }) => {
          const min = toBound(prop("min"));
          if (min !== null && min > 0) return;
          context.set("value", []);
        },
        resetValue: ({ context, refs, prop }) => {
          const rawDefault = prop("defaultValue");
          const fallback = Array.isArray(rawDefault) ? rawDefault : [];
          context.set("value", refs.get("initialValue") ?? fallback);
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
              id: scope.id ?? "checkbox-group",
              getFormId: () => prop("form") || "",
              getName: () => prop("name") || "",
              getValue: () => context.get("value"),
              setValue: (rawVal: unknown) => {
                context.set("value", Array.isArray(rawVal) ? rawVal : []);
              },
              resetValue: () => {
                const rawDefault = prop("defaultValue");
                const fallback = Array.isArray(rawDefault) ? rawDefault : [];
                context.set("value", refs.get("initialValue") ?? fallback);
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
