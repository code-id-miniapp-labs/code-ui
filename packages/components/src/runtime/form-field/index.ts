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

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultFormFieldProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      displayHelp() {
        return this.data.formField?.displayHelp ?? "";
      },
      displayError() {
        return this.data.formField?.displayError ?? "";
      },
      classes() {
        const size = this.data.formField?.size;
        const disabled = Boolean(this.data.formField?.disabled);
        const required = Boolean(this.data.formField?.required);
        const ui = this.data.ui;

        const themeFns = formFieldTheme({
          size,
          disabled,
          required,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },
  }),
);
