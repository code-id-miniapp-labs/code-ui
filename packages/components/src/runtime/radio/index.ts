import {
  createMachineBehavior,
  createProperties,
  computedBehavior,
  createComponentOptions,
  getApi,
} from "../_shared";
import { resolveSlots } from "../../utils/ui";
import { radioMachine, connectRadio, defaultRadioProps } from "@code-ui/radio";
import themeConfig from "virtual:cui/theme/radio";
import { tv } from "../../utils/variants";

const radioTheme = tv(themeConfig);

const radioBehavior = createMachineBehavior({
  machine: radioMachine,
  connect: connectRadio,
  key: "cRadio",
  radioItem: true,
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [radioBehavior, computedBehavior],

    options: {
      addGlobalClass: true,
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultRadioProps, {
      class: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.cRadio;
        const checked = Boolean(api?.checked ?? this.data.checked);
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const isInvalid = Boolean(api?.invalid ?? this.data.invalid);
        const size = api?.size ?? this.data.size;
        const color = api?.color ?? this.data.color;
        const variant = api?.variant ?? this.data.variant;
        const ui = this.data.ui;

        const themeFns = radioTheme({
          color,
          size,
          variant,
          disabled,
          checked,
          invalid: isInvalid,
        });

        return resolveSlots(themeFns, ui, this.data.class);
      },
    },

    methods: {
      handleTap(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "cRadio")?.handleTap?.(e);
      },
    },
  }),
);
