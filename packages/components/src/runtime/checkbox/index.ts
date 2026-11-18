import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withCheckboxItem } from "@code-ui/miniapp/behaviors/checkbox";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
import { resolveSlots } from "../../utils/ui";
import {
  checkboxMachine,
  connectCheckbox,
  defaultCheckboxProps,
  type CheckboxColor,
  type CheckboxSize,
  type CheckboxVariant,
} from "@code-ui/checkbox";
import themeConfig from "virtual:cui/theme/checkbox";
import { tv } from "../../utils/variants";

const checkboxTheme = tv(themeConfig);

const checkboxBehavior = createMachineBehavior({
  machine: checkboxMachine,
  connect: connectCheckbox,
  key: "cCheckbox",
  plugins: [withFormField(), withCheckboxItem()],
  exportApi: true,
  exportApiKeys: [
    "checked",
    "indeterminate",
    "setChecked",
    "setIndeterminate",
    "toggle",
    "resetChecked",
  ],
});

Component(
  createComponentOptions({
    behaviors: [checkboxBehavior, computedBehavior],

    slots: {
      default: false,
      indicator: false,
      label: false,
      description: false,
    },

    properties: createProperties(defaultCheckboxProps, {
      color: {
        type: String,
        value: "",
      },
      size: {
        type: String,
        value: "",
      },
      variant: {
        type: String,
        value: "",
      },
      label: {
        type: String,
        value: "",
      },
      description: {
        type: String,
        value: "",
      },
      icon: {
        type: String,
        value: "check",
      },
      indeterminateIcon: {
        type: String,
        value: "minus",
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
      resolvedSize(): CheckboxSize {
        return (this.data.size ||
          this.data.groupSize ||
          this.data.fieldSize ||
          "md") as CheckboxSize;
      },

      resolvedColor(): CheckboxColor {
        return (this.data.color ||
          this.data.groupColor ||
          "primary") as CheckboxColor;
      },

      resolvedVariant(): CheckboxVariant {
        return (this.data.variant ||
          this.data.groupVariant ||
          "outline") as CheckboxVariant;
      },

      classes() {
        const api = this.data.cCheckbox;
        const checked = Boolean(api?.checked);
        const indeterminate = Boolean(api?.indeterminate);
        const disabled = Boolean(api?.disabled);
        const isInvalid = Boolean(api?.invalid);
        const size = this.data.resolvedSize;
        const color = this.data.resolvedColor;
        const variant = this.data.resolvedVariant;
        const required = Boolean(this.data.required);
        const ui = this.data.ui;

        const themeFns = checkboxTheme({
          color,
          size,
          variant,
          disabled,
          checked,
          indeterminate,
          required,
          invalid: isInvalid,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleTap() {
        return getApi(this, "cCheckbox")?.handleTap?.();
      },
    },
  }),
);
