import type { MiniAppBaseEventLike, MiniAppEventLike } from "@code-ui/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
import { resolveSlots } from "../../utils/ui";
import {
  pinInputMachine,
  connectPinInput,
  defaultPinInputProps,
  type PinInputSize,
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
      separator: {
        type: Boolean,
        optionalTypes: [Number, Array],
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
      resolvedSize(): PinInputSize {
        return (this.data.size || this.data.fieldSize || "md") as PinInputSize;
      },

      classes() {
        const api = this.data.pinInput;
        const isInvalid = Boolean(api?.invalid);
        const disabled = Boolean(api?.disabled);
        const size = this.data.resolvedSize;
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
        e: MiniAppEventLike<{ value: string }, { index: number | string }>,
      ) {
        const raw = e?.currentTarget?.dataset?.index;
        const index = raw !== undefined ? Number(raw) : 0;
        return getApi(this, "pinInput")?.handleInput(
          e?.detail?.value ?? "",
          Number.isNaN(index) ? 0 : index,
        );
      },

      handleFocus(e: MiniAppBaseEventLike<{ index: number | string }>) {
        const raw = e?.currentTarget?.dataset?.index;
        const index = raw !== undefined ? Number(raw) : 0;
        getApi(this, "pinInput")?.handleFocus(Number.isNaN(index) ? 0 : index);
      },

      handleBlur(e: MiniAppBaseEventLike<{ index: number | string }>) {
        const raw = e?.currentTarget?.dataset?.index;
        const index = raw !== undefined ? Number(raw) : -1;
        getApi(this, "pinInput")?.handleBlur(Number.isNaN(index) ? -1 : index);
      },

      handleTap(e: MiniAppBaseEventLike<{ index: number | string }>) {
        const raw = e?.currentTarget?.dataset?.index;
        const index = raw !== undefined ? Number(raw) : 0;
        getApi(this, "pinInput")?.handleTap?.(Number.isNaN(index) ? 0 : index);
      },
    },
  }),
);
