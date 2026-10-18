import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
} from "../_shared";
import { resolveSlots } from "../utils/ui";
import {
  formMachine,
  connectForm,
  defaultFormProps,
  type FormErrorBag,
  type FormFieldError,
} from "@code-ui/form";
import themeConfig from "virtual:cui/theme/form";
import { tv } from "../utils/variants";

const formTheme = tv(themeConfig);

const formBehavior = createMachineBehavior({
  machine: formMachine,
  connect: connectForm,
  key: "form",
  formParent: true,
  exportApi: true,
});

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
      class: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const disabled = Boolean(this.data.disabled);
        const ui = this.data.ui;

        const themeFns = formTheme({
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.class);
      },
    },

    methods: {
      handleSubmit(e?: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.form;
        return api?.handleSubmit?.(e);
      },

      handleReset(e?: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.form;
        api?.handleReset?.(e);
      },

      validate(name?: string | string[]) {
        const api = (this as any).__codeUiApi ?? this.data.form;
        return api?.validate?.(name);
      },

      submit() {
        const api = (this as any).__codeUiApi ?? this.data.form;
        return api?.submit?.();
      },

      reset(name?: string | string[]) {
        const api = (this as any).__codeUiApi ?? this.data.form;
        api?.reset?.(name);
      },

      resetValidation(name?: string | string[]) {
        const api = (this as any).__codeUiApi ?? this.data.form;
        api?.resetValidation?.(name);
      },

      clearErrors(name?: string | string[]) {
        const api = (this as any).__codeUiApi ?? this.data.form;
        api?.clearErrors?.(name);
      },

      setErrors(
        errors:
          | FormErrorBag
          | Record<string, string | string[]>
          | FormFieldError[],
      ) {
        const api = (this as any).__codeUiApi ?? this.data.form;
        api?.setErrors?.(errors);
      },

      getErrors(name?: string) {
        const api = (this as any).__codeUiApi ?? this.data.form;
        return api?.getErrors?.(name) ?? [];
      },

      getValues() {
        const api = (this as any).__codeUiApi ?? this.data.form;
        return api?.getValues?.() ?? {};
      },

      getFieldValue(name: string) {
        const api = (this as any).__codeUiApi ?? this.data.form;
        return api?.getFieldValue?.(name);
      },

      setValues(
        values: Record<string, any>,
        options?: { validate?: boolean },
      ) {
        const api = (this as any).__codeUiApi ?? this.data.form;
        api?.setValues?.(values, options);
      },

      setFieldValue(
        name: string,
        value: any,
        options?: { validate?: boolean },
      ) {
        const api = (this as any).__codeUiApi ?? this.data.form;
        api?.setFieldValue?.(name, value, options);
      },

      focusFirstError() {
        const api = (this as any).__codeUiApi ?? this.data.form;
        return api?.focusFirstError?.() ?? false;
      },

      scrollToFirstError() {
        const api = (this as any).__codeUiApi ?? this.data.form;
        return api?.scrollToFirstError?.() ?? Promise.resolve(false);
      },
    },
  }),
);
