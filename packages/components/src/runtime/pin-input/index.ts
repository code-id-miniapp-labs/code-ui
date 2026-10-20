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
        const api = this.data.pinInput;
        const isInvalid = Boolean(api?.invalid ?? this.data.invalid);
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const size = api?.size ?? this.data.size ?? "md";
        const variant = api?.variant ?? this.data.variant;
        const color = api?.color ?? this.data.color;
        const highlight = Boolean(api?.highlight ?? this.data.highlight);
        const ui = this.data.ui;

        const themeFns = pinInputTheme({
          variant,
          color,
          size,
          highlight,
          invalid: isInvalid,
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
