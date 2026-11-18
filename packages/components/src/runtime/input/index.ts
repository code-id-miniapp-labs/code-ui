import { computedBehavior, createComponentOptions } from "../_shared/base";
import type { MiniAppEventLike } from "@code-ui/utils";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
import { useComponentIcons } from "../../utils/component-icons";
import { resolveSlots } from "../../utils/ui";
import {
  inputMachine,
  connectInput,
  defaultInputProps,
  type InputSize,
} from "@code-ui/input";
import themeConfig from "virtual:cui/theme/input";
import { tv } from "../../utils/variants";

const inputTheme = tv(themeConfig);

const inputBehavior = createMachineBehavior({
  machine: inputMachine,
  connect: connectInput,
  key: "input",
  plugins: [withFormField()],
  exportApi: true,
  exportApiKeys: ["value", "setValue", "clearValue", "resetValue", "focus", "blur"],
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
      type: {
        type: String,
        value: "text",
      },
      variant: {
        type: String,
        value: "outline",
      },
      color: {
        type: String,
        value: "primary",
      },
      size: {
        type: String,
        value: "",
      },
      highlight: {
        type: Boolean,
        value: false,
      },
      password: {
        type: Boolean,
        value: false,
      },
      placeholder: {
        type: String,
        value: "",
      },
      placeholderClass: {
        type: String,
        value: "",
      },
      placeholderStyle: {
        type: String,
        value: "",
      },
      clearIcon: {
        type: String,
        value: "close",
      },
      loading: {
        type: Boolean,
        value: false,
      },
      loadingIcon: {
        type: String,
        value: "loading",
      },
      leadingIcon: {
        type: String,
        value: "",
      },
      trailingIcon: {
        type: String,
        value: "",
      },
      maxlength: {
        type: Number,
        value: 140,
      },
      cursorSpacing: {
        type: Number,
        value: 0,
      },
      confirmType: {
        type: String,
        value: "done",
      },
      confirmHold: {
        type: Boolean,
        value: false,
      },
      cursor: {
        type: Number,
        value: -1,
      },
      selectionStart: {
        type: Number,
        value: -1,
      },
      selectionEnd: {
        type: Number,
        value: -1,
      },
      adjustPosition: {
        type: Boolean,
        value: true,
      },
      holdKeyboard: {
        type: Boolean,
        value: false,
      },
      ui: {
        type: Object,
        value: {},
      },
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      resolvedSize(): InputSize {
        return (this.data.size || this.data.fieldSize || "md") as InputSize;
      },

      icons() {
        return useComponentIcons({
          leadingIcon: this.data.leadingIcon,
          trailingIcon: this.data.trailingIcon,
          loading: Boolean(this.data.loading),
          loadingIcon: this.data.loadingIcon,
          loadingPlacement: "trailing",
          slots: this.data.slots,
        });
      },

      classes() {
        const api = this.data.input;
        const icons = this.data.icons;
        const themeFns = inputTheme({
          variant: this.data.variant,
          color: this.data.color,
          size: this.data.resolvedSize,
          highlight: Boolean(this.data.highlight),
          invalid: Boolean(api?.invalid),
          disabled: Boolean(api?.disabled),
          leading: icons.isLeading,
          trailing: Boolean(icons.isTrailing || api?.isClearable),
        });
        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleInput(e: MiniAppEventLike<{ value: string; cursor?: number }>) {
        return getApi(this, "input")?.handleInput?.(
          e?.detail?.value ?? "",
          e?.detail?.cursor,
        );
      },

      handleFocus() {
        getApi(this, "input")?.handleFocus?.();
      },

      handleBlur() {
        getApi(this, "input")?.handleBlur?.();
      },

      handleConfirm(e: MiniAppEventLike<{ value?: string }>) {
        getApi(this, "input")?.handleConfirm?.(e?.detail?.value);
      },

      handleClear() {
        getApi(this, "input")?.handleClear?.();
      },

      handleKeyboardHeightChange(e: MiniAppEventLike<Record<string, any>>) {
        this.triggerEvent("keyboardheightchange", e.detail);
      },
    },
  }),
);
