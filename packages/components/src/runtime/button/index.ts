import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { wxButtonBehavior } from "./wx-button";
import { useComponentIcons } from "../../utils/component-icons";
import { resolveSlots } from "../../utils/ui";
import {
  buttonMachine,
  connectButton,
  defaultButtonProps,
} from "@code-ui/button";
import themeConfig from "virtual:cui/theme/button";
import { tv } from "../../utils/variants";

const buttonTheme = tv(themeConfig);

const buttonBehavior = createMachineBehavior({
  machine: buttonMachine,
  connect: connectButton,
  key: "button",
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [buttonBehavior, wxButtonBehavior, computedBehavior],

    slots: {
      default: false,
      icon: false,
      leading: false,
      trailing: false,
      loadingIcon: false,
    },

    data: {},
    properties: createProperties(defaultButtonProps, {
      variant: {
        type: String,
        value: "solid",
      },
      color: {
        type: String,
        value: "primary",
      },
      size: {
        type: String,
        value: "md",
      },
      block: {
        type: Boolean,
        value: false,
      },
      label: {
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
      icons() {
        return useComponentIcons({
          icon: this.data.icon,
          leading: this.data.leading,
          leadingIcon: this.data.leadingIcon,
          trailing: this.data.trailing,
          trailingIcon: this.data.trailingIcon,
          loading: Boolean(this.data.button?.loading),
          loadingIcon: this.data.loadingIcon,
          slots: this.data.slots,
        });
      },

      classes() {
        const api = this.data.button;
        const themeFns = buttonTheme({
          variant: this.data.variant,
          size: this.data.size,
          color: this.data.color,
          block: this.data.block,
          disabled: Boolean(api?.disabled),
          loading: Boolean(api?.loading),
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleTap(e: WechatMiniprogram.TouchEvent) {
        const api = getApi(this, "button");
        return api.handleTap(e?.detail);
      },
    },
  }),
);
