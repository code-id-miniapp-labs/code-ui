import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties } from "../_shared/machine";
import { withFormField, withFormFieldWrapper } from "@code-ui/miniapp/behaviors/form";
import { resolveSlots } from "../../utils/ui";
import themeConfig from "virtual:cui/theme/form-field";
import { tv } from "../../utils/variants";
import {
  connectFormField,
  defaultFormFieldProps,
  formFieldMachine,
} from "@code-ui/form-field";

const formFieldTheme = tv(themeConfig);

const formFieldBehavior = createMachineBehavior({
  machine: formFieldMachine,
  connect: connectFormField,
  key: "formField",
  plugins: [withFormField({ native: false }), withFormFieldWrapper()],
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [formFieldBehavior, computedBehavior],

    properties: createProperties(defaultFormFieldProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const disabled = this.data.formField
          ? this.data.formField.disabled
          : this.data.disabled;

        const themeFns = formFieldTheme({
          size: this.data.size,
          disabled,
          required: this.data.required,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },
  }),
);
