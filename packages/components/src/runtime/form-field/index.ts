import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties } from "../_shared/machine";
import { withFormField, withFormFieldWrapper } from "@code-id-labs/miniapp/behaviors/form";
import { useComponentIcons } from "../../utils/component-icons";
import { resolveSlots } from "../../utils/ui";
import themeConfig from "virtual:cui/theme/form-field";
import { tv } from "../../utils/variants";
import {
  connectFormField,
  defaultFormFieldProps,
  formFieldMachine,
} from "@code-id-labs/form-field";

const formFieldTheme = tv(themeConfig);

const formFieldBehavior = createMachineBehavior({
  machine: formFieldMachine,
  connect: connectFormField,
  key: "formField",
  plugins: [withFormField({ native: false }), withFormFieldWrapper()],
  exportApi: true,
  exportApiKeys: ["invalid", "displayError"],
});

Component(
  createComponentOptions({
    behaviors: [formFieldBehavior, computedBehavior],
    slots: {
      default: false,
      label: false,
      leading: false,
      trailing: false,
      hint: false,
      description: false,
      error: false,
      help: false,
    },

    properties: createProperties(defaultFormFieldProps, {
      description: {
        type: String,
        value: "",
      },
      help: {
        type: String,
        value: "",
      },
      helperText: {
        type: String,
        value: "",
      },
      hint: {
        type: String,
        value: "",
      },
      icon: {
        type: String,
        value: "",
      },
      leading: {
        type: Boolean,
        value: false,
      },
      leadingIcon: {
        type: String,
        value: "",
      },
      trailing: {
        type: Boolean,
        value: false,
      },
      trailingIcon: {
        type: String,
        value: "",
      },
      size: {
        type: String,
        value: "md",
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
      icons() {
        return useComponentIcons({
          icon: this.data.icon,
          leading: this.data.leading,
          leadingIcon: this.data.leadingIcon,
          trailing: this.data.trailing,
          trailingIcon: this.data.trailingIcon,
          slots: this.data.slots,
        });
      },

      displayHelp() {
        return this.data.help || this.data.helperText;
      },

      classes() {
        const disabled = Boolean(this.data.formField?.disabled);

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
