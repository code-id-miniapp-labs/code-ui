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
      handleTouchStart(this: any, data?: Record<string, unknown>) {
        return getApi<PullDownRefreshApi>(
          this,
          "pullDownRefresh",
        )?.handleTouchStart?.(data);
      },

      handleTouchMove(this: any, data?: { offset?: number }) {
        return getApi<PullDownRefreshApi>(
          this,
          "pullDownRefresh",
        )?.handleTouchMove?.(data);
      },

      handleTouchEnd(this: any, data?: { offset?: number }) {
        return getApi<PullDownRefreshApi>(
          this,
          "pullDownRefresh",
        )?.handleTouchEnd?.(data);
      },

      handleScroll(this: any, event: WechatMiniprogram.ScrollViewScroll) {
        return getApi<PullDownRefreshApi>(
          this,
          "pullDownRefresh",
        )?.handleScroll?.(event);
      },

      handleScrollToUpper(this: any) {
        return getApi<PullDownRefreshApi>(
          this,
          "pullDownRefresh",
        )?.handleScrollToUpper?.();
      },

      handleScrollToLower(this: any) {
        return getApi<PullDownRefreshApi>(
          this,
          "pullDownRefresh",
        )?.handleScrollToLower?.();
      },

      refresh(this: any) {
        return getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.refresh?.();
      },

      close(this: any) {
        return getApi<PullDownRefreshApi>(this, "pullDownRefresh")?.close?.();
      },
    },
  }),
);
