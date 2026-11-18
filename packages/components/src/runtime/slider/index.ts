import type { MiniAppRect } from "@code-ui/utils";
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
  type SliderPoint,
  type SliderSize,
} from "@code-ui/slider";
import themeConfig from "virtual:cui/theme/slider";
import { tv } from "../../utils/variants";

interface SliderRawPointerEvent {
  x?: number;
  y?: number;
  clientX?: number;
  clientY?: number;
  index?: number;
  rect?: MiniAppRect | null;
  detail?: {
    x?: number;
    y?: number;
    clientX?: number;
    clientY?: number;
    index?: number;
    rect?: MiniAppRect | null;
  };
  touches?: Array<{ clientX?: number; clientY?: number }>;
}

function extractSliderPoint(
  e?: SliderRawPointerEvent,
): SliderPoint | undefined {
  if (!e) return undefined;
  const x =
    e.x ??
    e.clientX ??
    e.detail?.x ??
    e.detail?.clientX ??
    e.touches?.[0]?.clientX;
  const y =
    e.y ??
    e.clientY ??
    e.detail?.y ??
    e.detail?.clientY ??
    e.touches?.[0]?.clientY;
  if (typeof x !== "number" || typeof y !== "number") return undefined;
  return { x, y };
}

const sliderTheme = tv(themeConfig);

const sliderBehavior = createMachineBehavior({
  machine: sliderMachine,
  connect: connectSlider,
  key: "slider",
  plugins: [withFormField()],
  exportApi: true,
  exportApiKeys: ["value", "values", "setValue", "stepUp", "stepDown", "reset"],
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
      color: {
        type: String,
        value: "primary",
      },
      size: {
        type: String,
        value: "",
      },
      label: {
        type: String,
        value: "",
      },
      ui: {
        type: Object,
        value: {},
      },
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
      resolvedSize(): SliderSize {
        return (this.data.size || this.data.fieldSize || "md") as SliderSize;
      },

      classes() {
        const api = this.data.slider;
        const disabled = Boolean(api?.disabled);
        const isInvalid = Boolean(api?.invalid);
        const isDragging = Boolean(api?.dragging);
        const orientation = this.data.orientation;
        const size = this.data.resolvedSize;
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
      handleTouchStart(e?: SliderRawPointerEvent) {
        const rawIndex =
          typeof e?.index === "number" ? e.index : e?.detail?.index;
        const index =
          typeof rawIndex === "number" && rawIndex >= 0 ? rawIndex : undefined;
        const rawRect = e?.rect ?? e?.detail?.rect;
        const rect =
          rawRect && typeof rawRect.width === "number" ? rawRect : undefined;
        getApi(this, "slider")?.handleTouchStart(
          extractSliderPoint(e),
          rect,
          index,
        );
      },
      handleTouchMove(e?: SliderRawPointerEvent) {
        getApi(this, "slider")?.handleTouchMove(extractSliderPoint(e));
      },
      handleTouchEnd() {
        getApi(this, "slider")?.handleTouchEnd();
      },
      handleTap(e?: SliderRawPointerEvent) {
        getApi(this, "slider")?.handleTap(extractSliderPoint(e));
      },
    },
  }),
);
