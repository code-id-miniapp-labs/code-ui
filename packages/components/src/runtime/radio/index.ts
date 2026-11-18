import { computedBehavior, createComponentOptions } from "../_shared/base";
import { createMachineBehavior, createProperties, getApi } from "../_shared/machine";
import { withRadioItem } from "@code-id-labs/miniapp/behaviors/radio";
import { resolveSlots } from "../../utils/ui";
import {
  radioMachine,
  connectRadio,
  defaultRadioProps,
  type RadioColor,
  type RadioSize,
  type RadioVariant,
} from "@code-id-labs/radio";
import themeConfig from "virtual:cui/theme/radio";
import { tv } from "../../utils/variants";

const radioTheme = tv(themeConfig);

const radioBehavior = createMachineBehavior({
  machine: radioMachine,
  connect: connectRadio,
  key: "cRadio",
  plugins: [withRadioItem()],
  exportApi: true,
  exportApiKeys: ["checked"],
});

Component(
  createComponentOptions({
    behaviors: [radioBehavior, computedBehavior],

    slots: {
      default: false,
      indicator: false,
      label: false,
      description: false,
    },

    properties: createProperties(defaultRadioProps, {
      color: {
        type: String,
        value: "",
      },
      size: {
        type: String,
        value: "",
      },
      variant: {
        type: String,
        value: "",
      },
      label: {
        type: String,
        value: "",
      },
      description: {
        type: String,
        value: "",
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
      resolvedSize(): RadioSize {
        return (this.data.size ||
          this.data.groupSize ||
          "md") as RadioSize;
      },

      resolvedColor(): RadioColor {
        return (this.data.color ||
          this.data.groupColor ||
          "primary") as RadioColor;
      },

      resolvedVariant(): RadioVariant {
        return (this.data.variant ||
          this.data.groupVariant ||
          "outline") as RadioVariant;
      },

      classes() {
        const api = this.data.cRadio;
        const checked = Boolean(api?.checked);
        const disabled = Boolean(api?.disabled);
        const isInvalid = Boolean(api?.invalid);
        const size = this.data.resolvedSize;
        const color = this.data.resolvedColor;
        const variant = this.data.resolvedVariant;
        const ui = this.data.ui;

        const themeFns = radioTheme({
          color,
          size,
          variant,
          disabled,
          checked,
          invalid: isInvalid,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleTap() {
        return getApi(this, "cRadio")?.handleTap?.();
      },
    },
  }),
);
