import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withFormField } from "@code-id-labs/miniapp/behaviors/form";
import { useComponentIcons } from "../../utils/component-icons";
import { resolveSlots } from "../../utils/ui";
import {
  switchMachine,
  connectSwitch,
  defaultSwitchProps,
  type SwitchSize,
} from "@code-id-labs/switch";
import themeConfig from "virtual:cui/theme/switch";
import { tv } from "../../utils/variants";

const switchTheme = tv(themeConfig);

const switchBehavior = createMachineBehavior({
  machine: switchMachine,
  connect: connectSwitch,
  key: "cSwitch",
  plugins: [withFormField()],
  exportApi: true,
  exportApiKeys: ["checked", "setChecked", "toggle", "resetChecked"],
});

Component(
  createComponentOptions({
    behaviors: [switchBehavior, computedBehavior],
    slots: {
      default: false,
      thumb: false,
      label: false,
      description: false,
      loadingIcon: false,
    },

    properties: createProperties(defaultSwitchProps, {
      color: {
        type: String,
        value: "primary",
      },
      size: {
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
      checkedIcon: {
        type: String,
        value: "",
      },
      uncheckedIcon: {
        type: String,
        value: "",
      },
      loadingIcon: {
        type: String,
        value: "loading",
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
      resolvedSize(): SwitchSize {
        return (this.data.size || this.data.fieldSize || "md") as SwitchSize;
      },

      icons() {
        return useComponentIcons({
          loading: Boolean(this.data.loading),
          loadingIcon: this.data.loadingIcon,
          slots: this.data.slots,
        });
      },

      classes() {
        const api = this.data.cSwitch;
        const isInvalid = Boolean(api?.invalid);
        const disabled = Boolean(api?.disabled);
        const loading = Boolean(this.data.loading);
        const checked = Boolean(api?.checked);
        const size = this.data.resolvedSize;
        const color = this.data.color;
        const required = Boolean(this.data.required);
        const ui = this.data.ui;

        const themeFns = switchTheme({
          color,
          size,
          disabled,
          loading,
          checked,
          required,
          invalid: isInvalid,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleTap() {
        return getApi(this, "cSwitch")?.handleTap?.();
      },
    },
  }),
);
