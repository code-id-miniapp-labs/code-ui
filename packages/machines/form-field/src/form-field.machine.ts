import { createMachine } from "@code-ui/core";
import type { FormRule } from "@code-ui/form";
import { isEmpty } from "@code-ui/utils";
import { defaultFormFieldProps } from "./form-field.props";
import type {
  FormFieldContext,
  FormFieldMachine,
  FormFieldProps,
  FormFieldSchema,
} from "./form-field.types";

function createRequiredRule(message: string): FormRule {
  const descriptor = { required: true, message };
  const fn: any = (value: any) => (!isEmpty(value) ? true : message);
  fn.required = true;
  fn.message = message;
  Object.defineProperty(fn, "toJSON", {
    value: () => descriptor,
    enumerable: false,
    configurable: true,
  });
  return fn;
}

function getEffectiveFieldRules(
  rules: FormRule[] | undefined,
  required: boolean,
  disabled: boolean,
  labelOrName: string,
): FormRule[] {
  if (disabled) return [];
  const list: FormRule[] = Array.isArray(rules) ? [...rules] : [];
  if (required) {
    const hasRequired = list.some((r: any) =>
      typeof r === "object" && r !== null ? Boolean(r.required) : false,
    );
    if (!hasRequired) {
      const fallbackLabel = labelOrName || "This field";
      const ruleFn = createRequiredRule(`${fallbackLabel} is required`);
      (ruleFn as any).required = true;
      (ruleFn as any).message = `${fallbackLabel} is required`;
      list.unshift(ruleFn);
    }
  }
  return list;
}

function emitFieldState(params: any) {
  const bus = params.refs.get("currentFormBus") ?? params.prop("formBus");
  if (!bus) return;
  const name = params.context.get("name") || params.prop("name");
  const effectiveDisabled = Boolean(
    params.context.get("disabled") || params.context.get("formDisabled"),
  );
  const size = params.context.get("size");
  bus.emit("field:state", {
    name: name || undefined,
    disabled: effectiveDisabled,
    size,
  });
}

function emitFieldRules(params: any) {
  const bus = params.refs.get("currentFormBus") ?? params.prop("formBus");
  if (!bus) return;
  const name = params.context.get("name") || params.prop("name");

  if (name) {
    bus.emit("field:rules", {
      name,
      getRules: () => params.computed("effectiveRules"),
      required: Boolean(params.context.get("required")),
    });
  }

  emitFieldState(params);
}

function teardownBus(params: any) {
  const disposers = params.refs.get("busDisposers");
  if (disposers && disposers.length > 0) {
    for (let i = 0; i < disposers.length; i++) {
      disposers[i]?.();
    }
    params.refs.set("busDisposers", []);
  }

  const prevBus = params.refs.get("currentFormBus");
  const name = params.context.get("name");
  if (prevBus && name) {
    prevBus.emit("field:rules", {
      name,
      getRules: () => [],
      required: false,
    });
  }

  params.refs.set("currentFormBus", undefined);
}

function bindBus(params: any) {
  teardownBus(params);

  const bus = params.prop("formBus");
  if (!bus) return;

  params.refs.set("currentFormBus", bus);

  const disposers: Array<() => void> = [];

  disposers.push(
    bus.on("field:error", (payload: any) => {
      if (payload?.name === params.context.get("name")) {
        if (!payload.isValid && payload.errors && payload.errors.length > 0) {
          params.send({
            type: "ERROR.SET",
            error: payload.errors[0] || "Invalid value",
          });
        } else {
          params.send({ type: "ERROR.CLEAR" });
        }
      }
    }),
  );

  disposers.push(
    bus.on("reset", (payload: any) => {
      const currentName = params.context.get("name");
      if (
        !payload?.name ||
        payload.name === currentName ||
        (Array.isArray(payload.name) && payload.name.includes(currentName))
      ) {
        params.send({ type: "RESET" });
      }
    }),
  );

  disposers.push(
    bus.on("clear-errors", (payload: any) => {
      const currentName = params.context.get("name");
      if (
        !payload?.name ||
        payload.name === currentName ||
        (Array.isArray(payload.name) && payload.name.includes(currentName))
      ) {
        params.send({ type: "ERROR.CLEAR" });
      }
    }),
  );

  disposers.push(
    bus.on("form:state", (payload: any) => {
      const nextDisabled = Boolean(payload?.disabled);
      const nextReadOnly = Boolean(payload?.readOnly);
      const prevDisabled = Boolean(params.context.get("formDisabled"));
      const prevReadOnly = Boolean(params.context.get("formReadOnly"));

      if (prevDisabled === nextDisabled && prevReadOnly === nextReadOnly) {
        return;
      }

      params.context.set("formDisabled", nextDisabled);
      params.context.set("formReadOnly", nextReadOnly);
      emitFieldState(params);
    }),
  );

  params.refs.set("busDisposers", disposers);
  emitFieldRules(params);
}

export const formFieldMachine: FormFieldMachine =
  createMachine<FormFieldSchema>({
    props: ({ props }) => ({
      ...defaultFormFieldProps,
      ...props,
    }),

    initialState: ({ prop }) => {
      const initialError = prop("error");
      return initialError && initialError.trim().length > 0
        ? "invalid"
        : "valid";
    },

    refs: ({ prop }) => ({
      currentFormBus: prop("formBus"),
      busDisposers: [],
    }),

    context: ({ prop, bindable }) => {
      const propBindable = <
        K extends keyof FormFieldContext & keyof FormFieldProps,
      >(
        key: K,
        defaultValue: FormFieldContext[K],
      ) =>
        bindable<FormFieldContext[K]>(() => ({
          value: prop(key) as FormFieldContext[K] | undefined,
          defaultValue,
        }));

      const stateBindable = <K extends keyof FormFieldContext>(
        _key: K,
        defaultValue: FormFieldContext[K],
      ) =>
        bindable<FormFieldContext[K]>(() => ({
          defaultValue,
        }));

      return {
        name: propBindable("name", ""),
        label: propBindable("label", ""),
        description: propBindable("description", ""),
        help: propBindable("help", ""),
        helperText: propBindable("helperText", ""),
        hint: propBindable("hint", ""),
        error: propBindable("error", ""),
        innerError: stateBindable("innerError", ""),
        required: propBindable("required", false),
        disabled: propBindable("disabled", false),
        formDisabled: stateBindable("formDisabled", false),
        formReadOnly: stateBindable("formReadOnly", false),
        rules: propBindable("rules", []),
        size: propBindable("size", "md"),
        ui: propBindable("ui", {}),
      };
    },

    computed: {
      displayError: ({ context }) =>
        context.get("error") || context.get("innerError") || "",
      displayHelp: ({ context }) =>
        context.get("help") || context.get("helperText") || "",
      invalid: ({ state, computed }) =>
        state.matches("invalid") || Boolean(computed("displayError")),
      effectiveRules: ({ context }) =>
        getEffectiveFieldRules(
          context.get("rules"),
          Boolean(context.get("required")),
          Boolean(context.get("disabled")),
          context.get("label") || context.get("name") || "",
        ),
    },

    watch: (params) => {
      const nextBus = params.prop("formBus");
      if (nextBus !== params.refs.get("currentFormBus")) {
        bindBus(params);
      }

      const targetState = params.computed("displayError") ? "invalid" : "valid";
      if (!params.state.matches(targetState)) {
        params.state.set(targetState);
      }
    },

    effects: ["trackFieldProps"],
    entry: ["setupBus"],
    exit: ["cleanupBus"],

    on: {
      "ERROR.SET": {
        target: "invalid",
        actions: ["setInnerError"],
      },
      "ERROR.CLEAR": {
        target: "valid",
        actions: ["clearInnerError"],
      },
      RESET: {
        target: "valid",
        actions: ["clearInnerError"],
      },
    },

    states: {
      valid: {
        tags: ["valid"],
      },

      invalid: {
        tags: ["invalid"],
      },
    },

    implementations: {
      actions: {
        setInnerError: ({ context, event }) => {
          if ("error" in event && typeof event.error === "string") {
            context.set("innerError", event.error);
          }
        },

        clearInnerError: ({ context }) => {
          context.set("innerError", "");
        },

        setupBus: (params) => {
          bindBus(params);
        },

        cleanupBus: (params) => {
          teardownBus(params);
        },
      },

      effects: {
        trackFieldProps: (params) => {
          let initial = true;
          params.track(
            [
              () => params.prop("name"),
              () => params.prop("rules")?.length,
              () => params.prop("required"),
              () => params.prop("disabled"),
              () => params.prop("size"),
            ],
            () => {
              if (initial) {
                initial = false;
                return;
              }
              emitFieldRules(params);
            },
          );
        },
      },
    },
  });
