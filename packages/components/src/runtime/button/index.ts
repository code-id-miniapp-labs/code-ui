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
      loading() {
        return Boolean(
          this.data.button?.loading || this.data.button?.internalLoading,
        );
      },
      disabled() {
        return Boolean(this.data.button?.disabled ?? this.data.disabled);
      },
      classes(this: any) {
        const variant = this.data.variant;
        const color = this.data.color;
        const size = this.data.size;
        const block = this.data.block;
        const disabled = Boolean(
          this.data.button?.disabled ?? this.data.disabled,
        );
        const loading = Boolean(
          this.data.button?.loading || this.data.button?.internalLoading,
        );

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
        if (
          buttonData?.disabled ||
          buttonData?.loading ||
          (this as any).data.disabled
        )
          return;
        this.send({ type: "TAP", event: e });
      },
    },
  }),
);
