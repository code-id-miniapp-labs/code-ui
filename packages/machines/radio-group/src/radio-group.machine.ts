import { createMachine } from "@code-ui/core";
import {
  setupFormFieldSync,
  cleanupFormFieldSync,
} from "@code-ui/form/context";
import { createEventBus, isNotEmpty, isNotNull } from "@code-ui/utils";
import type {
  RadioGroupBusEvents,
  RadioGroupContext,
  RadioGroupMachine,
  RadioGroupProps,
  RadioGroupSchema,
} from "./radio-group.types";
import { defaultRadioGroupProps } from "./radio-group.props";
import {
  dispatchChangeEvent,
  emitGroupChange,
  resolveInitialValue,
} from "./radio-group.utils";

export const radioGroupMachine: RadioGroupMachine =
  createMachine<RadioGroupSchema>({
    props: ({ props }) => ({
      ...defaultRadioGroupProps,
      ...props,
    }),

    initialState: () => "idle",

    refs: ({ prop }) => ({
      initialValue: resolveInitialValue(prop),
      bus: createEventBus<RadioGroupBusEvents>(),
      currentFormBus: prop("formBus"),
      formField: undefined,
      busDisposers: [],
    }),

    context: ({ prop, bindable }) => {
      const propBindable = <
        K extends keyof RadioGroupContext & keyof RadioGroupProps,
      >(
        key: K,
        defaultValue: RadioGroupContext[K],
      ) =>
        bindable<RadioGroupContext[K]>(() => ({
          value: prop(key) as RadioGroupContext[K] | undefined,
          defaultValue,
        }));

      const stateBindable = <K extends keyof RadioGroupContext>(
        _key: K,
        defaultValue: RadioGroupContext[K],
      ) =>
        bindable<RadioGroupContext[K]>(() => ({
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
    },

    watch: ({ prop, context, refs, computed }) => {
      const nextFormBus = prop("formBus");
      if (nextFormBus !== refs.get("currentFormBus")) {
        refs.set("currentFormBus", nextFormBus);
        refs.get("formField")?.rebind(nextFormBus ?? null);
      }

      emitGroupChange({ refs, context, computed });
    },

    entry: ["setupFormField", "setupGroupBus"],
    exit: ["cleanupFormField", "cleanupGroupBus"],

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
        },
      },
    },

    implementations: {
      guards: {
        isInteractive: ({ computed }) => computed("isInteractive"),
      },

      actions: {
        setValue: ({ context, event, prop, refs }) => {
          if ("value" in event) {
            const nextVal = String(event.value);
            context.set("value", nextVal);
            dispatchChangeEvent(prop, refs, nextVal);
          }
        },
        clearValue: ({ context, prop, refs }) => {
          context.set("value", null);
          dispatchChangeEvent(prop, refs, null);
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
        setupGroupBus: ({ refs, send }) => {
          const bus = refs.get("bus");
          if (bus) {
            const unsub = bus.on("radio:select", ({ value }) => {
              send({ type: "SET_VALUE", value });
            });
            const disposers = refs.get("busDisposers") || [];
            disposers.push(unsub);
            refs.set("busDisposers", disposers);
          }
        },
        cleanupGroupBus: ({ refs }) => {
          const disposers = refs.get("busDisposers") || [];
          for (const d of disposers) d?.();
          refs.set("busDisposers", []);
        },
        setupFormField: ({ context, prop, refs, scope, computed }) => {
          setupFormFieldSync(
            {
              component: prop("component"),
              bus: prop("formBus"),
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
      },
    },
  });
