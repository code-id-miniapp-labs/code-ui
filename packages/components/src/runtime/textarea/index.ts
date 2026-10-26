import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
import { resolveSlots } from "../../utils/ui";
import {
  textareaMachine,
  connectTextarea,
  defaultTextareaProps,
} from "@code-ui/textarea";
import themeConfig from "virtual:cui/theme/textarea";
import { tv } from "../../utils/variants";

const textareaTheme = tv(themeConfig);

const textareaBehavior = createMachineBehavior({
  machine: textareaMachine,
  connect: connectTextarea,
  key: "textarea",
  plugins: [withFormField()],
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [textareaBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultTextareaProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.textarea;
        const isInvalid = Boolean(api?.invalid ?? this.data.invalid);
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const size = api?.size ?? this.data.size ?? "md";
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
        const hasCount = Boolean(this.data.count);
        const isAutoHeight = Boolean(api?.autoHeight ?? this.data.autoHeight);
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

      handleInput(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "textarea")?.handleInput?.(e);
      },

      handleFocus(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "textarea")?.handleFocus?.(e);
      },

      handleBlur(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "textarea")?.handleBlur?.(e);
      },

      handleConfirm(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "textarea")?.handleConfirm?.(e);
      },

      handleLineChange(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "textarea")?.handleLineChange?.(e);
      },

      handleClear(e: WechatMiniprogram.CustomEvent) {
        getApi(this, "textarea")?.handleClear?.(e);
      },

      handleKeyboardHeightChange(e: WechatMiniprogram.CustomEvent) {
        this.triggerEvent("keyboardheightchange", e.detail);
      },
    },
  }),
);
