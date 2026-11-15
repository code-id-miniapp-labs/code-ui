import type { MiniAppEventLike } from "@code-ui/utils";
import { computedBehavior, createComponentOptions } from "../_shared/base";
import {
  createMachineBehavior,
  createProperties,
  getApi,
} from "../_shared/machine";
import { resolveSlots } from "../../utils/ui";
import {
  pullDownRefreshMachine,
  connectPullDownRefresh,
  defaultPullDownRefreshProps,
  type PullDownRefreshApi,
} from "@code-ui/pull-down-refresh";
import themeConfig from "virtual:cui/theme/pull-down-refresh";
import { tv } from "../../utils/variants";

const pullDownRefreshTheme = tv(themeConfig);

const pullDownRefreshBehavior = createMachineBehavior({
  machine: pullDownRefreshMachine,
  connect: connectPullDownRefresh,
  key: "pullDownRefresh",
  exportApi: true,
});

Component(
  createComponentOptions({
    behaviors: [pullDownRefreshBehavior, computedBehavior],
    slots: {
      default: false,
      header: false,
      indicator: false,
    },

    properties: createProperties(defaultPullDownRefreshProps, {
      className: {
        type: String,
        value: "",
      },
    }),

    computed: {
      classes() {
        const api = this.data.pullDownRefresh;
        const status = api?.statusKey ?? "idle";
        const disabled = Boolean(api?.disabled ?? this.data.disabled);

        const themeFns = pullDownRefreshTheme({
          status,
          disabled,
        });

        return resolveSlots(themeFns, this.data.ui, this.data.className);
      },
    },

    methods: {
      handleTouchStart(data?: Record<string, unknown>) {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.handleTouchStart(
          data,
        );
      },

      handleTouchMove(data?: { offset?: number }) {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.handleTouchMove(
          data,
        );
      },

      handleTouchEnd(data?: { offset?: number }) {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.handleTouchEnd(
          data,
        );
      },

      handleScroll(
        event: MiniAppEventLike<{ scrollTop: number; scrollLeft: number }>,
      ) {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.handleScroll(
          event,
        );
      },

      handleScrollToUpper() {
        getApi<PullDownRefreshApi>(
          this,
          "pullDownRefresh",
        )?.handleScrollToUpper();
      },

      handleScrollToLower() {
        getApi<PullDownRefreshApi>(
          this,
          "pullDownRefresh",
        )?.handleScrollToLower();
      },

      refresh() {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.refresh();
      },

      close() {
        getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.close();
      },
    },
  }),
);
