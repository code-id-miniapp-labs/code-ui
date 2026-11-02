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

    options: {
      multipleSlots: true,
      styleIsolation: "apply-shared",
      virtualHost: true,
    },

    properties: createProperties(defaultProgressProps, {
      className: {
        type: String,
        value: "",
      },
      label: {
        type: String,
        value: "",
      },
      showValue: {
        type: Boolean,
        value: false,
      },
    }),

    computed: {
      classes() {
        const api = this.data.progress;
        const color = api?.color ?? this.data.color;
        const size = api?.size ?? this.data.size;
        const type = api?.type ?? this.data.type;
        const orientation = api?.orientation ?? this.data.orientation;
        const striped = Boolean(api?.striped ?? this.data.striped);
        const animated = Boolean(api?.animated ?? this.data.animated);
        const inverted = Boolean(api?.inverted ?? this.data.inverted);
        const indeterminate = Boolean(
          api
            ? api.isIndeterminate
            : this.data.value === null || this.data.value === undefined,
        );

        const themeFns = progressTheme({
          color,
          size,
          type,
          orientation,
          striped,
          animated,
          inverted,
          indeterminate,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      setValue(value: number | null) {
        const api = getApi<ProgressApi>(this, "progress");
        api?.setValue(value);
      },

      setToMin() {
        const api = getApi<ProgressApi>(this, "progress");
        api?.setToMin();
      },

      setToMax() {
        const api = getApi<ProgressApi>(this, "progress");
        api?.setToMax();
      },

      reset() {
        const api = getApi<ProgressApi>(this, "progress");
        api?.reset();
      },
    },
  }),
);

