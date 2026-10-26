import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
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
  plugins: [withFormField()],
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [pinInputBehavior, computedBehavior],

    options: {
      multipleSlots: false,
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
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.pinInput;
        const isInvalid = Boolean(api?.invalid ?? this.data.invalid);
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const size = api?.size ?? this.data.size;
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

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleInput(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "pinInput")?.handleInput?.(e);
      },

      handleFocus(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "pinInput")?.handleFocus?.(e);
      },

      handleBlur(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "pinInput")?.handleBlur?.(e);
      },

      handleTap(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "pinInput")?.handleTap?.(e);
      },
    },
  }),
);
