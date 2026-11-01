import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { withFormField } from "@code-ui/miniapp/behaviors/form";
import { resolveSlots } from "../../utils/ui";
import {
  sliderMachine,
  connectSlider,
  defaultSliderProps,
} from "@code-ui/slider";
import themeConfig from "virtual:cui/theme/slider";
import { tv } from "../../utils/variants";

const sliderTheme = tv(themeConfig);

const sliderBehavior = createMachineBehavior({
  machine: sliderMachine,
  connect: connectSlider,
  key: "slider",
  plugins: [withFormField()],
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [sliderBehavior, computedBehavior],

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultSliderProps, {
      showValue: {
        type: Boolean,
        value: false,
      },
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.slider;
        const disabled = Boolean(api?.disabled ?? this.data.disabled);
        const isInvalid = Boolean(api?.invalid ?? this.data.invalid);
        const isDragging = Boolean(api?.dragging);
        const orientation = api?.orientation ?? this.data.orientation;
        const size = api?.size ?? this.data.size;
        const color = api?.color ?? this.data.color;
        const ui = this.data.ui;

        const themeFns = sliderTheme({
          color,
          size,
          orientation,
          disabled,
          invalid: isInvalid,
          dragging: isDragging,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleTouchStart(e: WechatMiniprogram.TouchEvent) {
        return getApi(this, "slider")?.handleTouchStart?.(e);
      },
      handleTouchMove(e: WechatMiniprogram.TouchEvent) {
        getApi(this, "slider")?.handleTouchMove?.(e);
      },
      handleTouchEnd(e: WechatMiniprogram.TouchEvent) {
        getApi(this, "slider")?.handleTouchEnd?.(e);
      },
      handleTap(e: WechatMiniprogram.CustomEvent) {
        return getApi(this, "slider")?.handleTap?.(e);
      },
    },
  }),
);

