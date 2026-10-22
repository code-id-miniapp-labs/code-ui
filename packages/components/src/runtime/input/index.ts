import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
  getApi,
} from "../_shared";
import { resolveSlots } from "../../utils/ui";
import { inputMachine, connectInput, defaultInputProps } from "@code-ui/input";
import themeConfig from "virtual:cui/theme/input";
import { tv } from "../../utils/variants";

const inputTheme = tv(themeConfig);

const inputBehavior = createMachineBehavior({
  machine: inputMachine,
  connect: connectInput,
  key: "input",
  formField: true,
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [inputBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultInputProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.input;
        const isInvalid = Boolean(api?.invalid ?? this.data.invalid);
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const size = api?.size ?? this.data.size;
        const variant = api?.variant ?? this.data.variant;
        const color = api?.color ?? this.data.color;
        const highlight = Boolean(api?.highlight ?? this.data.highlight);
        const hasLeading = Boolean(this.data.leading || this.data.leadingIcon);
        const hasTrailing = Boolean(
          this.data.trailing ||
          this.data.trailingIcon ||
          api?.isClearable ||
          this.data.clearable ||
          this.data.loading,
        );
        const ui = this.data.ui;

        const themeFns = inputTheme({
          variant,
          color,
          size,
          highlight,
          invalid: isInvalid,
          disabled,
          leading: hasLeading,
          trailing: hasTrailing,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleInput(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "input")?.handleInput?.(e);
      },

      handleFocus(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "input")?.handleFocus?.(e);
      },

      handleBlur(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "input")?.handleBlur?.(e);
      },

      handleConfirm(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "input")?.handleConfirm?.(e);
      },

      handleClear(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "input")?.handleClear?.(e);
      },

      handleKeyboardHeightChange(e: WechatMiniprogram.CustomEvent) {
        this.triggerEvent("keyboardheightchange", e.detail);
      },
    },
  }),
);
