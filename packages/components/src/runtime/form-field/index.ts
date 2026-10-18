import {
  computedBehavior,
  createComponentOptions,
  createMachineBehavior,
  createProperties,
} from "../_shared";
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
  formField: true,
  formFieldWrapper: true,
  nativeFormField: false,
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [formFieldBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      addGlobalClass: true,
      styleIsolation: "apply-shared",
    },

    properties: createProperties(defaultFormFieldProps, {
      class: {
        type: String,
        value: "",
      },
    }),

    computed: {
      displayHelp() {
        return (
          this.data.formField?.displayHelp ||
          this.data.help ||
          this.data.helperText ||
          ""
        );
      },
      displayError() {
        return this.data.formField?.displayError || this.data.error || "";
      },
      classes() {
        const size = this.data.size || this.data.formField?.size || "md";
        const disabled = Boolean(
          this.data.formField?.disabled ?? this.data.disabled,
        );
        const required = Boolean(
          this.data.required ?? this.data.formField?.required,
        );
        const ui = this.data.ui;

        const themeFns = formFieldTheme({
          size,
          disabled,
          required,
        });

        return resolveSlots(themeFns, ui, this.data.class);
      },
    },
  }),
);
