import { initPerfLogger } from "./utils/logs";
import { initExampleTheme, syncNavigationBarTheme } from "./utils/theme";

initPerfLogger({
  label: "v2",
  enabled: true,
});

App({
  globalData: {},
  onLaunch() {
    initExampleTheme();
  },
  onShow() {
    syncNavigationBarTheme();
  },
});
