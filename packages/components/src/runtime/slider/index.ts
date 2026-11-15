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
  type SliderPointerEvent,
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
    slots: {
      label: false,
      value: false,
      thumb: false,
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
        const color = this.data.color;
        const ui = this.data.ui;
        const hasMarkers = Boolean(
          (api?.markers && api.markers.length > 0) || this.data.marks,
        );

        const themeFns = sliderTheme({
          color,
          size,
          orientation,
          disabled,
          invalid: isInvalid,
          dragging: isDragging,
          hasMarkers,
        });

        return resolveSlots(themeFns, ui, this.data.className);
      },
    },

    methods: {
      handleTouchStart(e?: SliderPointerEvent) {
        getApi(this, "slider")?.handleTouchStart(e);
      },
      handleTouchMove(e?: SliderPointerEvent) {
        getApi(this, "slider")?.handleTouchMove(e);
      },
      handleTouchEnd(e?: SliderPointerEvent) {
        getApi(this, "slider")?.handleTouchEnd(e);
      },
      handleTap(e?: SliderPointerEvent) {
        getApi(this, "slider")?.handleTap(e);
      },
    },
  }),
);
