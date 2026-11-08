import { createMachine } from "@code-ui/core";
import { effect, signal } from "alien-signals";
import { onProvide } from "@code-ui/context";
import { getFormHostKey, injectFormHost } from "@code-ui/form/context";
import type { FormHostContext, FormRule } from "@code-ui/form";
import { isEmpty } from "@code-ui/utils";
import { defaultFormFieldProps } from "./form-field.props";
import type {
  FormFieldParams,
  FormFieldMachine,
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
  if (
    required &&
    !list.some((r: any) => typeof r === "object" && r !== null && r.required)
  ) {
    list.unshift(
      createRequiredRule(`${labelOrName || "This field"} is required`),
    );
  }
  return list;
}

function clearPublishedField(params: FormFieldParams) {
  const host = params.refs.get("publishedHost");
  const name = params.refs.get("publishedName");
  if (host && name) {
    host.setFieldRules(name, () => []);
    host.setFieldState(name, {});
  }
  params.refs.set("publishedHost", undefined);
  params.refs.set("publishedName", "");
}

function setupHostInjection({ prop, refs }: FormFieldParams) {
  refs.get("stopInjection")?.();
  refs.set("stopInjection", undefined);
  const form = prop("form");
  refs.set("injectionForm", form);
  const component = prop("component");
  const update = refs.get("injectedHost");
  update(injectFormHost(component, form));
  if (component) {
    refs.set("stopInjection", onProvide(component, getFormHostKey(form), update));
  }
}

export const formFieldMachine: FormFieldMachine =
  createMachine<FormFieldSchema>({
    props: ({ props }) => ({
      ...defaultFormFieldProps,
      ...props,
    }),

    initialState: ({ prop }) =>
      prop("error")?.trim() ? "invalid" : "valid",

    refs: () => ({
      injectedHost: signal<FormHostContext | undefined>(undefined),
      stopInjection: undefined,
      injectionForm: undefined,
      publishedHost: undefined,
      publishedName: "",
    }),

    context: ({ bindable }) => ({
      innerError: bindable<string>(() => ({ defaultValue: "" })),
    }),

    computed: {
      host: ({ prop, refs }) => {
        const host = prop("formContext");
        return host === undefined ? refs.get("injectedHost")() : host;
      },
      isDisabled: ({ prop, computed }) =>
        Boolean(prop("disabled") || computed("host")?.disabled()),
      isReadOnly: ({ computed }) => computed("host")?.readOnly() ?? false,
      displayError: ({ prop, context, computed }) =>
        prop("error") ||
        computed("host")?.errors(prop("name") ?? "")[0] ||
        context.get("innerError") ||
        "",
      displayHelp: ({ prop }) => prop("help") || prop("helperText") || "",
      invalid: ({ state, computed }) =>
        state.matches("invalid") || Boolean(computed("displayError")),
      effectiveRules: ({ prop, computed }) =>
        getEffectiveFieldRules(
          prop("rules"),
          Boolean(prop("required")),
          computed("isDisabled"),
          prop("label") || prop("name") || "",
        ),
    },

    watch: (params) => {
      if (params.prop("form") !== params.refs.get("injectionForm")) {
        setupHostInjection(params);
      }
      const targetState = params.computed("displayError") ? "invalid" : "valid";
      if (!params.state.matches(targetState)) {
        params.state.set(targetState);
      }
    },

    effects: ["trackFieldProps"],
    entry: ["setupHost"],
    exit: ["cleanupHost"],

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
      valid: { tags: ["valid"] },
      invalid: { tags: ["invalid"] },
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

        setupHost: setupHostInjection,
        cleanupHost: (params) => {
          params.refs.get("stopInjection")?.();
          params.refs.set("stopInjection", undefined);
          clearPublishedField(params);
          params.refs.get("injectedHost")(undefined);
        },
      },

      effects: {
        trackFieldProps: (params) =>
          effect(() => {
            params.prop("rules");
            params.prop("required");
            params.prop("label");
            const host = params.computed("host");
            const name = params.prop("name") ?? "";
            if (
              host !== params.refs.get("publishedHost") ||
              name !== params.refs.get("publishedName")
            ) {
              clearPublishedField(params);
            }
            if (!host || !name) return;
            params.refs.set("publishedHost", host);
            params.refs.set("publishedName", name);
            host.setFieldRules(name, () => params.computed("effectiveRules"));
            host.setFieldState(name, {
              disabled: Boolean(params.prop("disabled")),
              size: params.prop("size") ?? "md",
            });
          }),
      },
    },
  });
