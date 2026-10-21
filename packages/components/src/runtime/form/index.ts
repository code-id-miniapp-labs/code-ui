import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
} from "../_shared";
import { resolveSlots } from "../../utils/ui";
import {
  formMachine,
  connectForm,
  defaultFormProps,
  type FormErrorBag,
  type FormFieldError,
} from "@code-ui/form";
import themeConfig from "virtual:cui/theme/form";
import { tv } from "../../utils/variants";

const formTheme = tv(themeConfig);

const formBehavior = createMachineBehavior({
  machine: formMachine,
  connect: connectForm,
  key: "form",
  formParent: true,
  exportApi: true,
});

function getApi(ctx: any) {
  return ctx.__codeUiApi ?? ctx.data.form;
}

Component(
  createComponentOptions({
    behaviors: [formBehavior, computedBehavior],

    options: {
      multipleSlots: false,
      addGlobalClass: true,
      styleIsolation: "apply-shared",
    },

    properties: createProperties(defaultFormProps, {
      validateOn: {
        type: Array,
        optionalTypes: [String],
        value: ["input", "change", "blur"],
      },
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.form;
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const ui = this.data.ui;

        const themeFns = formTheme({
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleSubmit(e?: WechatMiniprogram.CustomEvent) {
        return getApi(this)?.handleSubmit?.(e);
      },
      handleReset(e?: WechatMiniprogram.CustomEvent) {
        getApi(this)?.handleReset?.(e);
      },
      validate(name?: string | string[]) {
        return getApi(this)?.validate?.(name);
      },
      submit() {
        return getApi(this)?.submit?.();
      },
      reset(name?: string | string[]) {
        getApi(this)?.reset?.(name);
      },
      resetValidation(name?: string | string[]) {
        getApi(this)?.resetValidation?.(name);
      },
      clearErrors(name?: string | string[]) {
        getApi(this)?.clearErrors?.(name);
      },
      setErrors(
        errors:
          | FormErrorBag
          | Record<string, string | string[]>
          | FormFieldError[],
      ) {
        getApi(this)?.setErrors?.(errors);
      },
      getErrors(name?: string) {
        return getApi(this)?.getErrors?.(name) ?? [];
      },
      getValues() {
        return getApi(this)?.getValues?.() ?? {};
      },
      getFieldValue(name: string) {
        return getApi(this)?.getFieldValue?.(name);
      },
      setValues(values: Record<string, any>, options?: { validate?: boolean }) {
        getApi(this)?.setValues?.(values, options);
      },
      setFieldValue(
        name: string,
        value: any,
        options?: { validate?: boolean },
      ) {
        getApi(this)?.setFieldValue?.(name, value, options);
      },
      focusFirstError() {
        return getApi(this)?.focusFirstError?.() ?? false;
      },
      scrollToFirstError() {
        return getApi(this)?.scrollToFirstError?.() ?? Promise.resolve(false);
      },
    },
  }),
);
