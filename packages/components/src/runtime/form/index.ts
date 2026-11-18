import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withFormParent } from "@code-id-labs/miniapp/behaviors/form";
import { resolveSlots } from "../../utils/ui";
import {
  formMachine,
  connectForm,
  defaultFormProps,
  type FormApi,
  type FormErrorBag,
  type FormFieldError,
} from "@code-id-labs/form";
import type { MiniAppEventLike } from "@code-id-labs/utils";
import themeConfig from "virtual:cui/theme/form";
import { tv } from "../../utils/variants";

const formTheme = tv(themeConfig);

const formBehavior = createMachineBehavior({
  machine: formMachine,
  connect: connectForm,
  key: "form",
  plugins: [withFormParent()],
  exportApi: true,
  exportApiKeys: [
    "isValid",
    "validate",
    "submit",
    "reset",
    "resetValidation",
    "clearErrors",
    "setErrors",
    "getErrors",
    "getValues",
    "getFieldValue",
    "setValues",
    "setFieldValue",
    "focusFirstError",
    "scrollToFirstError",
    "handleSubmit",
    "handleReset",
  ],
});

Component(
  createComponentOptions({
    behaviors: [formBehavior, computedBehavior],
    slots: {
      default: false,
    },

    properties: createProperties(defaultFormProps, {
      validateOn: {
        type: Array,
        optionalTypes: [String],
        value: defaultFormProps.validateOn,
      },
      showErrors: {
        type: Boolean,
        value: false,
      },
      ui: {
        type: Object,
        value: {},
      },
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const themeFns = formTheme({
          disabled: this.data.disabled,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleSubmit(e?: MiniAppEventLike<{ value?: Record<string, any> }>) {
        return getApi<FormApi>(this, "form")?.handleSubmit(e?.detail?.value);
      },
      handleReset() {
        getApi<FormApi>(this, "form")?.handleReset();
      },
      validate(name?: string | string[]) {
        return getApi<FormApi>(this, "form")?.validate(name);
      },
      submit() {
        return getApi<FormApi>(this, "form")?.submit();
      },
      reset(name?: string | string[]) {
        getApi<FormApi>(this, "form")?.reset(name);
      },
      resetValidation(name?: string | string[]) {
        getApi<FormApi>(this, "form")?.resetValidation(name);
      },
      clearErrors(name?: string | string[]) {
        getApi<FormApi>(this, "form")?.clearErrors(name);
      },
      setErrors(
        errors:
          | FormErrorBag
          | Record<string, string | string[]>
          | FormFieldError[],
      ) {
        getApi<FormApi>(this, "form")?.setErrors(errors);
      },
      getErrors(name?: string) {
        return getApi<FormApi>(this, "form")?.getErrors(name) ?? [];
      },
      getValues() {
        return getApi<FormApi>(this, "form")?.getValues() ?? {};
      },
      getFieldValue(name: string) {
        return getApi<FormApi>(this, "form")?.getFieldValue(name);
      },
      setValues(values: Record<string, any>, options?: { validate?: boolean }) {
        getApi<FormApi>(this, "form")?.setValues(values, options);
      },
      setFieldValue(
        name: string,
        value: any,
        options?: { validate?: boolean },
      ) {
        getApi<FormApi>(this, "form")?.setFieldValue(name, value, options);
      },
      focusFirstError() {
        return getApi<FormApi>(this, "form")?.focusFirstError() ?? false;
      },
      scrollToFirstError() {
        return (
          getApi<FormApi>(this, "form")?.scrollToFirstError() ??
          Promise.resolve(false)
        );
      },
    },
  }),
);
