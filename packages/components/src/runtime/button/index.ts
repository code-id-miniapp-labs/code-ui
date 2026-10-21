import {
  createMachineBehavior,
  wxButtonBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
} from "../_shared";
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

    options: {
      multipleSlots: true,
      addGlobalClass: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

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
        const variant = api?.variant ?? this.data.variant;
        const color = api?.color ?? this.data.color;
        const size = api?.size ?? this.data.size;
        const block = api?.block ?? this.data.block;
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const loading = Boolean(api?.loading ?? this.data.loading);

        const ui = this.data.ui;

        const themeFns = buttonTheme({
          variant,
          size,
          color,
          block,
          disabled,
          loading,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleTap(e: WechatMiniprogram.TouchEvent) {
        const api = this.data.button;
        api?.handleTap?.(e);
      },
    },
  }),
);
