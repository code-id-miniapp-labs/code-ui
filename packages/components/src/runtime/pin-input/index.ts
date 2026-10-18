import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
} from "../_shared";
import { resolveSlots } from "../../utils/ui";
import {
  pinInputMachine,
  connectPinInput,
  defaultPinInputProps,
} from "@code-ui/pin-input";
import themeConfig from "virtual:cui/theme/pin-input";
import { tv } from "../../utils/variants";

const pinInputTheme = tv(themeConfig);

const pinInputBehavior = createMachineBehavior({
  machine: pinInputMachine,
  connect: connectPinInput,
  key: "pinInput",
  formField: true,
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [pinInputBehavior, computedBehavior],

    options: {
      multipleSlots: false,
      addGlobalClass: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultPinInputProps, {
      label: {
        type: String,
        value: "",
      },
      separator: {
        type: Boolean,
        optionalTypes: [Number, Array],
        value: false,
      },
      class: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const isInvalid = Boolean(
          this.data.pinInput?.invalid || this.data.invalid,
        );
        const variant = this.data.variant;
        const color = isInvalid ? "danger" : this.data.color;
        const size = this.data.pinInput?.size || this.data.size || "md";
        const highlight = isInvalid || Boolean(this.data.highlight);
        const disabled = Boolean(
          this.data.pinInput?.disabled || this.data.disabled,
        );
        const ui = this.data.ui;

        const themeFns = pinInputTheme({
          variant,
          color,
          size,
          highlight,
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.class);
      },
    },

    methods: {
      handleInput(e: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.pinInput;
        return api?.handleInput?.(e);
      },

      handleFocus(e: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.pinInput;
        api?.handleFocus?.(e);
      },

      handleBlur(e: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.pinInput;
        api?.handleBlur?.(e);
      },

      handleTap(e: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.pinInput;
        api?.handleTap?.(e);
      },
    },
  }),
);
