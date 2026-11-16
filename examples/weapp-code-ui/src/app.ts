import { initExampleTheme, syncNavigationBarTheme } from "./utils/theme";

App({
  globalData: {},
  onLaunch() {
    initExampleTheme();
  },
  onShow() {
    syncNavigationBarTheme();
  },
});
