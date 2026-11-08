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
} from "@code-ui/progress";
import themeConfig from "virtual:cui/theme/progress";
import { tv } from "../../utils/variants";

const progressTheme = tv(themeConfig);

const progressBehavior = createMachineBehavior({
  machine: progressMachine,
  connect: connectProgress,
  key: "progress",
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [progressBehavior, computedBehavior],

    properties: createProperties(defaultProgressProps, {
      className: { type: String, value: "" },
      label: { type: String, value: "" },
      showValue: { type: Boolean, value: false },
    }),

    computed: {
      classes() {
        const api = this.data.progress;
        const indeterminate = Boolean(
          api
            ? api.isIndeterminate
            : this.data.indeterminate ||
                this.data.value === null ||
                this.data.value === undefined,
        );

        const themeFns = progressTheme({
          color: this.data.color,
          size: this.data.size,
          type: api?.type ?? this.data.type,
          orientation: api?.orientation ?? this.data.orientation,
          striped: Boolean(this.data.striped),
          animated: Boolean(this.data.animated),
          inverted: Boolean(this.data.inverted),
          indeterminate,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
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
