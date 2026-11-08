import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { wxButtonBehavior } from "./wx-button";
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

    data: {},
    properties: createProperties(defaultButtonProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.button;
        const themeFns = buttonTheme({
          variant: this.data.variant,
          size: this.data.size,
          color: this.data.color,
          block: this.data.block,
          disabled: Boolean(api?.disabled ?? this.data.disabled),
          loading: Boolean(api?.loading ?? this.data.loading),
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleTap(e: WechatMiniprogram.TouchEvent) {
        const api = getApi(this, "button");
        return api.handleTap(e);
      },
    },
  }),
);
