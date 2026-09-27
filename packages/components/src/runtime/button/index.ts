import {
  createMachineBehavior,
  wxButtonBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
} from "../_shared";
import { getResolvedTheme, resolveSlots } from "../utils/ui";
import {
  buttonMachine,
  connectButton,
  defaultButtonProps,
} from "@code-ui/button";
import { buttonTheme } from "./theme";

const buttonBehavior = createMachineBehavior({
  machine: buttonMachine,
  connect: connectButton,
  key: "button",
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [buttonBehavior, wxButtonBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      addGlobalClass: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    data: {},
    properties: createProperties(defaultButtonProps),

    computed: {
      classes() {
        const variant = this.data.variant;
        const color = this.data.color;
        const size = this.data.size;
        const block = this.data.block;
        const disabled = this.data.disabled;
        const loading = this.data.loading;
        const ui = this.data.ui;

        const theme = getResolvedTheme("button", buttonTheme);
        const themeFns = theme({
          variant,
          size,
          color,
          block,
          disabled,
          loading,
        });

        return resolveSlots(themeFns, ui);
      },
    },

    methods: {
      handleTap(e: WechatMiniprogram.TouchEvent) {
        const buttonData = (this as any).data.button;
        if (buttonData?.disabled || buttonData?.loading) return;
        this.send({ type: "TAP", event: e });
      },
    },
  }),
);
