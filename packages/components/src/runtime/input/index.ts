import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
import { resolveSlots } from "../../utils/ui";
import { inputMachine, connectInput, defaultInputProps } from "@code-ui/input";
import themeConfig from "virtual:cui/theme/input";
import { tv } from "../../utils/variants";

const inputTheme = tv(themeConfig);

const inputBehavior = createMachineBehavior({
  machine: inputMachine,
  connect: connectInput,
  key: "input",
  plugins: [withFormField()],
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
        const themeFns = inputTheme({
          variant: api?.variant,
          color: api?.color,
          size: api?.size,
          highlight: api?.highlight,
          invalid: api?.invalid,
          disabled: api?.disabled,
          leading: Boolean(this.data.leading || this.data.leadingIcon),
          trailing: Boolean(
            this.data.trailing ||
              this.data.trailingIcon ||
              api?.isClearable ||
              this.data.loading,
          ),
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
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
