import { createMachine } from "@code-ui/core";
import type { BindableContext, BindableRefs, PropFn } from "@code-ui/core";
import {
  setupFormFieldSync,
  cleanupFormFieldSync,
} from "@code-ui/form/context";
import { isNotEmpty, isNotNull } from "@code-ui/utils";
import type { EventBus } from "@code-ui/utils";
import type {
  CheckboxContext,
  CheckboxGroupBusEvents,
  CheckboxMachine,
  CheckboxParams,
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

function bindGroupBus(
  bus: EventBus<CheckboxGroupBusEvents> | undefined,
  context: BindableContext<CheckboxSchema>,
  state: CheckboxParams["state"],
  refs: BindableRefs<CheckboxSchema>,
): void {
  for (const d of refs.get("busDisposers") ?? []) d?.();
  refs.set("currentGroupBus", bus);
  refs.set(
    "busDisposers",
    bus
      ? [
          bus.on("group:change", (gState: GroupStateSnapshot) => {
            applyGroupState({ context, state }, gState);
          }),
        ]
      : [],
  );
}

function emitChange(
  context: BindableContext<CheckboxSchema>,
  prop: PropFn<CheckboxSchema>,
  refs: BindableRefs<CheckboxSchema>,
  nextChecked: boolean,
): void {
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
}

const toggleToCheckedTransition = [
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
    target: "checked" as const,
    actions: ["emitCheckboxChange"],
  },
];

export const checkboxMachine: CheckboxMachine = createMachine<CheckboxSchema>({
  props: ({ props }) => ({
    ...defaultCheckboxProps,
    ...props,
  }),

  initialState: ({ prop }) => resolveInitialBooleans(prop).initialState,

  refs: ({ prop }) => {
    const { initialChecked, initialIndeterminate } =
      resolveInitialBooleans(prop);

    return {
      initialChecked,
      initialIndeterminate,
      lastChecked: initialChecked,
      currentGroupBus: prop("groupBus"),
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
    isChecked: ({ context, state }) => {
      const gv = context.get("groupValue");
      if (Array.isArray(gv)) {
        return gv.includes(context.get("value"));
      }
      return state.matches("checked");
    },
    isIndeterminate: ({ state }) => state.matches("indeterminate"),
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

  effects: ["trackProps"],
  entry: ["setupFormField", "setupGroupBus"],
  exit: ["cleanupFormField", "cleanupGroupBus"],

  on: {
    RESET_VALUE: [
      {
        guard: "isInitialIndeterminate",
        target: "indeterminate",
        actions: ["resetInvalid"],
      },
      {
        guard: "isInitialChecked",
        target: "checked",
        actions: ["resetInvalid"],
      },
      {
        target: "unchecked",
        actions: ["resetInvalid"],
      },
    ],
    SET_CHECKED: [
      {
        guard: "isEventChecked",
        target: "checked",
      },
      {
        target: "unchecked",
      },
    ],
    SET_INDETERMINATE: [
      {
        guard: "isEventIndeterminate",
        target: "indeterminate",
      },
      {
        guard: "wasChecked",
        target: "checked",
      },
      {
        target: "unchecked",
      },
    ],
  },

  states: {
    unchecked: {
      tags: ["unchecked"],
      entry: ["recordLastChecked"],
      on: {
        TOGGLE: toggleToCheckedTransition,
      },
    },

    checked: {
      tags: ["checked"],
      entry: ["recordLastChecked"],
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
            actions: ["emitCheckboxChange"],
          },
        ],
      },
    },

    indeterminate: {
      tags: ["indeterminate"],
      on: {
        TOGGLE: toggleToCheckedTransition,
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
      wasChecked: ({ refs }) => Boolean(refs.get("lastChecked")),
      isEventChecked: ({ event }) =>
        "checked" in event && Boolean(event.checked),
      isEventIndeterminate: ({ event }) =>
        "indeterminate" in event && Boolean(event.indeterminate),
      isInitialChecked: ({ refs }) => Boolean(refs.get("initialChecked")),
      isInitialIndeterminate: ({ refs }) =>
        Boolean(refs.get("initialIndeterminate")),
    },

    actions: {
      recordLastChecked: ({ refs, state }) => {
        refs.set("lastChecked", state.matches("checked"));
      },

      toggleGroupBus: ({ context, refs, prop }) => {
        const bus = refs.get("currentGroupBus") || prop("groupBus");
        bus?.emit("checkbox:toggle", { value: context.get("value") });
      },

      emitControlledToggle: ({ context, prop, refs, state }) => {
        emitChange(context, prop, refs, !state.matches("checked"));
      },

      emitCheckboxChange: ({ context, prop, refs, state }) => {
        emitChange(context, prop, refs, state.matches("checked"));
      },

      resetInvalid: ({ context }) => {
        context.set("invalid", false);
      },

      setupFormField: ({ context, prop, refs, scope, state, computed }) => {
        setupFormFieldSync(
          {
            component: prop("component"),
            bus: prop("formBus"),
            id: scope.id ?? "checkbox",
            getFormId: () => context.get("form") || prop("form") || "",
            getName: () =>
              refs.get("currentGroupBus") || prop("groupBus")
                ? ""
                : context.get("name") || prop("name") || "",
            getValue: () => computed("isChecked"),
            setValue: (rawVal: unknown) => {
              state.set(rawVal ? "checked" : "unchecked");
            },
            resetValue: () => {
              const initialIndet = Boolean(refs.get("initialIndeterminate"));
              const initialChecked = Boolean(refs.get("initialChecked"));

              context.set("invalid", false);
              state.set(
                initialIndet
                  ? "indeterminate"
                  : initialChecked
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

      setupGroupBus: ({ prop, context, state, refs }) => {
        const bus = prop("groupBus");
        if (bus) {
          bindGroupBus(bus, context, state, refs);
        }
      },

      cleanupGroupBus: ({ context, state, refs }) => {
        bindGroupBus(undefined, context, state, refs);
      },
    },

    effects: {
      trackProps: ({ prop, context, refs, state, track }) => {
        let initial = true;
        track(
          [
            () => Boolean(prop("formBus")),
            () => Boolean(prop("groupBus")),
            () =>
              Array.isArray(prop("groupValue"))
                ? (prop("groupValue") ?? []).join(",")
                : undefined,
            () => prop("groupDisabled"),
            () => prop("groupInvalid"),
            () => prop("groupColor"),
            () => prop("groupSize"),
            () => prop("groupVariant"),
            () => prop("indeterminate"),
            () => prop("checked"),
          ],
          () => {
            if (initial) {
              initial = false;
              return;
            }

            const nextFormBus = prop("formBus");
            if (nextFormBus !== refs.get("currentFormBus")) {
              refs.set("currentFormBus", nextFormBus);
              refs.get("formField")?.rebind(nextFormBus ?? null);
            }

            const nextBus = prop("groupBus");
            if (nextBus !== refs.get("currentGroupBus")) {
              bindGroupBus(nextBus, context, state, refs);
              if (nextBus) {
                applyGroupState(
                  { context, state },
                  {
                    value: prop("groupValue"),
                    disabled: prop("groupDisabled"),
                    invalid: prop("groupInvalid"),
                    color: prop("groupColor"),
                    size: prop("groupSize"),
                    variant: prop("groupVariant"),
                  },
                );
              }
              refs.get("formField")?.rebind();
            }

            if (nextBus) return;

            const groupVal = prop("groupValue");
            if (Array.isArray(groupVal)) {
              context.set("groupValue", groupVal);
              const targetState = groupVal.includes(prop("value") ?? "")
                ? "checked"
                : "unchecked";
              if (!state.matches(targetState)) {
                state.set(targetState);
              }
              return;
            }

            const controlledIndeterminate = prop("indeterminate");
            if (isNotNull(controlledIndeterminate)) {
              if (parseBooleanProp(controlledIndeterminate)) {
                if (state.get() !== "indeterminate") state.set("indeterminate");
              } else if (state.get() === "indeterminate") {
                const chk = isNotNull(prop("checked"))
                  ? parseBooleanProp(prop("checked"))
                  : Boolean(refs.get("lastChecked"));
                state.set(chk ? "checked" : "unchecked");
              }
            }

            const controlledChecked = prop("checked");
            if (
              isNotNull(controlledChecked) &&
              !state.matches("indeterminate")
            ) {
              const targetState = parseBooleanProp(controlledChecked)
                ? "checked"
                : "unchecked";
              if (state.get() !== targetState) state.set(targetState);
            }
          },
        );
      },
    },
  },
});
