import { computedBehavior, createComponentOptions } from "../_shared/base";
import type { MiniAppBaseEventLike, MiniAppEventLike } from "@code-ui/utils";
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

    slots: {
      default: false,
      leading: false,
      trailing: false,
      loadingIcon: false,
      count: false,
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
        const size = api?.size ?? this.data.size;
        const variant = this.data.variant;
        const color = this.data.color;
        const highlight = Boolean(this.data.highlight);
        const hasLeading = Boolean(
          this.data.slots.leading || this.data.leadingIcon,
        );
        const hasTrailing = Boolean(
          this.data.slots.trailing ||
            this.data.trailingIcon ||
            api?.isClearable ||
            this.data.loading ||
            this.data.slots.loadingIcon,
        );
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
        return getApi(this, "textarea")?.handleInput?.(e);
      },

      handleFocus(e: MiniAppBaseEventLike) {
        getApi(this, "textarea")?.handleFocus?.(e);
      },

      handleBlur(e: MiniAppBaseEventLike) {
        getApi(this, "textarea")?.handleBlur?.(e);
      },

      handleConfirm(e: MiniAppEventLike<{ value?: string }>) {
        getApi(this, "textarea")?.handleConfirm?.(e);
      },

      handleLineChange(e: MiniAppEventLike<Record<string, any>>) {
        getApi(this, "textarea")?.handleLineChange?.(e);
      },

      handleClear(e: MiniAppBaseEventLike) {
        getApi(this, "textarea")?.handleClear?.(e);
      },

      handleKeyboardHeightChange(e: MiniAppEventLike<Record<string, any>>) {
        this.triggerEvent("keyboardheightchange", e.detail);
      },
    },
  }),
);
