import type { MiniAppBaseEventLike, MiniAppEventLike } from "@code-ui/utils";
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
    slots: {
      label: false,
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
        const variant = this.data.variant;
        const color = this.data.color;
        const highlight = Boolean(this.data.highlight);
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
      handleInput(
        e: MiniAppEventLike<{ value: string }, { index: number }>,
      ) {
        return getApi(this, "pinInput")?.handleInput(e);
      },

      handleFocus(e: MiniAppBaseEventLike<{ index: number }>) {
        getApi(this, "pinInput")?.handleFocus(e);
      },

      handleBlur(e: MiniAppBaseEventLike<{ index: number }>) {
        getApi(this, "pinInput")?.handleBlur(e);
      },

      handleTap(e: MiniAppBaseEventLike<{ index: number }>) {
        getApi(this, "pinInput")?.handleTap?.(e);
      },
    },
  }),
);
