import { computedBehavior, createComponentOptions } from "../_shared/base";
import type { MiniAppBaseEventLike, MiniAppEventLike } from "@code-ui/utils";
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

    slots: {
      trailing: false,
      leading: false,
      loadingIcon: false,
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
          variant: this.data.variant,
          color: this.data.color,
          size: api?.size ?? (this.data.size || "md"),
          highlight: Boolean(this.data.highlight),
          invalid: Boolean(api?.invalid ?? this.data.invalid),
          disabled: Boolean(api?.disabled ?? this.data.disabled),
          leading: Boolean(this.data.slots.leading || this.data.leadingIcon),
          trailing: Boolean(
            this.data.slots.trailing ||
              this.data.trailingIcon ||
              api?.isClearable ||
              this.data.loading ||
              this.data.slots.loadingIcon,
          ),
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleInput(e: MiniAppEventLike<{ value: string; cursor?: number }>) {
        return getApi(this, "input")?.handleInput?.(e);
      },

      handleFocus(e: MiniAppBaseEventLike) {
        getApi(this, "input")?.handleFocus?.(e);
      },

      handleBlur(e: MiniAppBaseEventLike) {
        getApi(this, "input")?.handleBlur?.(e);
      },

      handleConfirm(e: MiniAppEventLike<{ value?: string }>) {
        getApi(this, "input")?.handleConfirm?.(e);
      },

      handleClear(e: MiniAppBaseEventLike) {
        getApi(this, "input")?.handleClear?.(e);
      },

      handleKeyboardHeightChange(e: MiniAppEventLike<Record<string, any>>) {
        this.triggerEvent("keyboardheightchange", e.detail);
      },
    },
  }),
);
