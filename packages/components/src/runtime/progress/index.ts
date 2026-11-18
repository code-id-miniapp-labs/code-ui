import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { resolveSlots } from "../../utils/ui";
import {
  progressMachine,
  connectProgress,
  defaultProgressProps,
  type ProgressApi,
} from "@code-id-labs/progress";
import themeConfig from "virtual:cui/theme/progress";
import { tv } from "../../utils/variants";

const progressTheme = tv(themeConfig);

const progressBehavior = createMachineBehavior({
  machine: progressMachine,
  connect: connectProgress,
  key: "progress",
  exportApi: true,
  exportApiKeys: [
    "value",
    "percent",
    "isComplete",
    "setValue",
    "setToMin",
    "setToMax",
    "reset",
  ],
});

Component(
  createComponentOptions({
    behaviors: [progressBehavior, computedBehavior],
    slots: {
      default: false,
      label: false,
      valueText: false,
    },

    properties: createProperties(defaultProgressProps, {
      orientation: { type: String, value: "horizontal" },
      type: { type: String, value: "linear" },
      size: { type: String, value: "md" },
      color: { type: String, value: "primary" },
      trackColor: { type: String, value: "#e5e7eb" },
      striped: { type: Boolean, value: false },
      animated: { type: Boolean, value: false },
      animation: { type: String, value: "carousel" },
      inverted: { type: Boolean, value: false },
      circleRadius: { type: Number, value: 42 },
      strokeWidth: { type: Number, value: 8 },
      ui: { type: Object, value: {} },
      className: { type: String, value: "" },
      label: { type: String, value: "" },
      showValue: { type: Boolean, value: false },
    }),

    computed: {
      classes() {
        const api = this.data.progress;
        const indeterminate = api
          ? api.isIndeterminate
          : this.data.indeterminate || this.data.value === null;

        const themeFns = progressTheme({
          color: this.data.color,
          size: this.data.size,
          type: this.data.type,
          orientation: this.data.orientation,
          striped: this.data.striped,
          animated: this.data.animated,
          inverted: this.data.inverted,
          indeterminate,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },

      rangeStyle() {
        const api = this.data.progress;
        const indeterminate = Boolean(api?.isIndeterminate);
        if (indeterminate) return "";
        const percent = api ? api.percent : 0;
        const axis = this.data.orientation === "horizontal" ? "width" : "height";
        return `${axis}: ${percent}%;`;
      },

      circleStyle() {
        const api = this.data.progress;
        const indeterminate = Boolean(api?.isIndeterminate);
        const rawPercent = api ? api.percent : 0;
        const percent = indeterminate
          ? 25
          : Math.max(0, Math.min(100, rawPercent));
        const color = this.data.color;
        const strokeWidth = this.data.strokeWidth;
        const trackColor = this.data.trackColor;
        let style = `--cui-progress-percent: ${percent}%; --cui-progress-stroke-width: ${strokeWidth}px;`;
        if (trackColor) style += ` --cui-progress-track-color: ${trackColor};`;
        if (typeof color === "string" && /^(#|rgb|hsl|oklch)/.test(color)) {
          style += ` color: ${color};`;
        }
        if (this.data.inverted) style += " transform: scaleX(-1);";
        return style;
      },
    },

    methods: {
      setValue(value: number | null) {
        getApi<ProgressApi>(this, "progress")?.setValue(value);
      },
      setToMin() {
        getApi<ProgressApi>(this, "progress")?.setToMin();
      },
      setToMax() {
        getApi<ProgressApi>(this, "progress")?.setToMax();
      },
      reset() {
        getApi<ProgressApi>(this, "progress")?.reset();
      },
    },
  }),
);
