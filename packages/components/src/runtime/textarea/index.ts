import { computedBehavior, createComponentOptions } from "../_shared/base";
import type { MiniAppEventLike } from "@code-id-labs/utils";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withFormField } from "@code-id-labs/miniapp/behaviors/form";
import { useComponentIcons } from "../../utils/component-icons";
import { resolveSlots } from "../../utils/ui";
import {
  textareaMachine,
  connectTextarea,
  defaultTextareaProps,
  type TextareaSize,
} from "@code-id-labs/textarea";
import themeConfig from "virtual:cui/theme/textarea";
import { tv } from "../../utils/variants";

const textareaTheme = tv(themeConfig);

const textareaBehavior = createMachineBehavior({
  machine: textareaMachine,
  connect: connectTextarea,
  key: "textarea",
  omitDataKeys: ["inputProps", "hiddenInputProps"],
  plugins: [withFormField()],
  exportApi: true,
  exportApiKeys: [
    "value",
    "characterCount",
    "setValue",
    "clearValue",
    "resetValue",
    "focus",
    "blur",
  ],
});

Component(
  createComponentOptions({
    behaviors: [textareaBehavior, computedBehavior],

    slots: {
      default: false,
      leading: false,
      trailing: false,
      loadingIcon: false,
      count: false,
    },

    properties: createProperties(defaultTextareaProps, {
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
      autoHeight: {
        type: Boolean,
        value: false,
      },
      fixed: {
        type: Boolean,
        value: false,
      },
      maxlength: {
        type: Number,
        value: -1,
      },
      showConfirmBar: {
        type: Boolean,
        value: true,
      },
      cursorSpacing: {
        type: Number,
        value: 0,
      },
      confirmType: {
        type: String,
        value: "return",
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
      disableDefaultPadding: {
        type: Boolean,
        value: true,
      },
      count: {
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
      resolvedSize(): TextareaSize {
        return (this.data.size || this.data.fieldSize || "md") as TextareaSize;
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
        const api = this.data.textarea;
        const icons = this.data.icons;
        const isInvalid = Boolean(api?.invalid);
        const disabled = Boolean(api?.disabled);
        const size = this.data.resolvedSize;
        const variant = this.data.variant;
        const color = this.data.color;
        const highlight = Boolean(this.data.highlight);
        const hasLeading = icons.isLeading;
        const hasTrailing = Boolean(icons.isTrailing || api?.isClearable);
        const hasCount = Boolean(this.data.count || this.data.slots.count);
        const isAutoHeight = Boolean(this.data.autoHeight);
        const ui = this.data.ui;

        const themeFns = textareaTheme({
          variant,
          color,
          size,
          highlight,
          invalid: isInvalid,
          disabled,
          leading: hasLeading,
          trailing: hasTrailing,
          count: hasCount,
          autoHeight: isAutoHeight,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleRootTap() {
        getApi(this, "textarea")?.focus?.();
      },

      handleInput(e: MiniAppEventLike<{ value: string; cursor?: number }>) {
        return getApi(this, "textarea")?.handleInput?.(
          e?.detail?.value ?? "",
          e?.detail?.cursor,
        );
      },

      handleFocus() {
        getApi(this, "textarea")?.handleFocus?.();
      },

      handleBlur() {
        getApi(this, "textarea")?.handleBlur?.();
      },

      handleConfirm(e: MiniAppEventLike<{ value?: string }>) {
        getApi(this, "textarea")?.handleConfirm?.(e?.detail?.value);
      },

      handleLineChange(e: MiniAppEventLike<Record<string, any>>) {
        getApi(this, "textarea")?.handleLineChange?.(e?.detail ?? {});
      },

      handleClear() {
        getApi(this, "textarea")?.handleClear?.();
      },

      handleKeyboardHeightChange(e: MiniAppEventLike<Record<string, any>>) {
        this.triggerEvent("keyboardheightchange", e.detail);
      },
    },
  }),
);
