import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
} from "../_shared";
import { resolveSlots } from "../utils/ui";
import {
  pinInputMachine,
  connectPinInput,
  defaultPinInputProps,
} from "@code-ui/pin-input";
import themeConfig from "virtual:cui/theme/pin-input";
import { tv } from "../utils/variants";

const pinInputTheme = tv(themeConfig);

const pinInputBehavior = createMachineBehavior({
  machine: pinInputMachine,
  connect: connectPinInput,
  key: "pinInput",
  formField: true,
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [pinInputBehavior, computedBehavior],

    options: {
      multipleSlots: false,
      addGlobalClass: true,
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
      class: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const variant = this.data.variant;
        const color = this.data.color;
        const size = this.data.size;
        const highlight = Boolean(this.data.highlight);
        const disabled = Boolean(
          this.data.pinInput?.rootProps?.["data-disabled"] === "true" ||
            this.data.disabled,
        );
        const ui = this.data.ui;

        const themeFns = pinInputTheme({
          variant,
          color,
          size,
          highlight,
          disabled,
        });

        return resolveSlots(themeFns, ui, this.data.class);
      },
    },

    methods: {
      handleInput(e: WechatMiniprogram.CustomEvent) {
        const api = this.data.pinInput;
        api?.handleInput?.(e);
      },

      handleFocus(e: WechatMiniprogram.CustomEvent) {
        const idx = Number(
          e?.currentTarget?.dataset?.index ??
            e?.target?.dataset?.index ??
            0,
        );
        const api = this.data.pinInput;
        if (!api) return;

        const values = api.value ?? [];
        const firstEmptyIndex = values.findIndex(
          (c: string) => !c || c.trim() === "",
        );
        const targetIndex =
          firstEmptyIndex !== -1
            ? firstEmptyIndex
            : Math.max(0, Math.min(api.inputs.length - 1, idx));

        if (idx !== targetIndex) {
          this.setData(
            {
              [`pinInput.inputs[${idx}].inputProps.focus`]: false,
              [`pinInput.inputs[${targetIndex}].inputProps.focus`]: false,
            },
            () => {
              this.setData({
                [`pinInput.inputs[${targetIndex}].inputProps.focus`]: true,
              });
            },
          );
        }

        api.handleFocus?.(e);
      },

      handleBlur(e: WechatMiniprogram.CustomEvent) {
        const api = this.data.pinInput;
        api?.handleBlur?.(e);
      },
    },
  }),
);
