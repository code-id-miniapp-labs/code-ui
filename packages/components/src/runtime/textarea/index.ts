import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
} from "../_shared";
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
  formField: true,
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [textareaBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      addGlobalClass: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultTextareaProps, {
      class: {
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
        const hasLeading = Boolean(
          this.data.leading || this.data.leadingIcon,
        );
        const hasTrailing = Boolean(
          this.data.trailing ||
            this.data.trailingIcon ||
            api?.isClearable ||
            this.data.clearable ||
            this.data.loading,
        );
        const hasCount = Boolean(this.data.count);
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
        });

        return resolveSlots(themeFns, ui, this.data.class);
      },
    },

    methods: {
      handleInput(e: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.textarea;
        return api?.handleInput?.(e);
      },

      handleFocus(e: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.textarea;
        api?.handleFocus?.(e);
      },

      handleBlur(e: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.textarea;
        api?.handleBlur?.(e);
      },

      handleConfirm(e: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.textarea;
        api?.handleConfirm?.(e);
      },

      handleLineChange(e: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.textarea;
        api?.handleLineChange?.(e);
      },

      handleClear(e: WechatMiniprogram.CustomEvent) {
        const api = (this as any).__codeUiApi ?? this.data.textarea;
        api?.handleClear?.(e);
      },

      handleKeyboardHeightChange(e: WechatMiniprogram.CustomEvent) {
        this.triggerEvent("keyboardheightchange", e.detail);
      },
    },
  }),
);
