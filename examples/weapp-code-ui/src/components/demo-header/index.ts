import { useTheme, type AppThemeState } from "@code-ui/composables";
import {
  PRIMARY_COLOR_PRESETS,
  resetExampleTheme,
  setExampleColors,
  syncNavigationBarTheme,
  toggleExampleColorMode,
} from "../../utils/theme";

interface DemoHeaderInstance
  extends WechatMiniprogram.Component.InstanceProperties {
  __unsubTheme?: (() => void) | undefined;
}

const COMPACT_PRESETS = PRIMARY_COLOR_PRESETS.slice(0, 7);

Component({
  options: {
    styleIsolation: "apply-shared",
  },

  properties: {
    title: {
      type: String,
      value: "",
    },
    subtitle: {
      type: String,
      value: "",
    },
    badge: {
      type: String,
      value: "",
    },
  },

  data: {
    isDark: false,
    activePrimary: "stone",
    hasCustomTheme: false,
    presets: COMPACT_PRESETS,
  },

  lifetimes: {
    attached(this: DemoHeaderInstance) {
      const applyState = (state: AppThemeState) => {
        const hasColors = Object.keys(state.colors).length > 0;
        this.setData({
          isDark: state.resolvedMode === "dark",
          activePrimary: state.colors.primary || "stone",
          hasCustomTheme: hasColors || state.colorMode !== "system",
        });
      };

      const theme = useTheme();
      this.__unsubTheme?.();
      this.__unsubTheme = theme.subscribe(applyState, true);
      syncNavigationBarTheme();
    },

    detached(this: DemoHeaderInstance) {
      this.__unsubTheme?.();
      this.__unsubTheme = undefined;
    },
  },

  pageLifetimes: {
    show() {
      syncNavigationBarTheme();
    },
  },

  methods: {
    onToggleMode() {
      toggleExampleColorMode();
    },

    onSelectPreset(e: WechatMiniprogram.TouchEvent) {
      const value = e.currentTarget.dataset?.value as string | undefined;
      if (!value) return;
      if (value === "stone") {
        setExampleColors({ primary: "" });
        return;
      }
      setExampleColors({ primary: value });
    },

    onResetTheme() {
      resetExampleTheme();
    },
  },
});
