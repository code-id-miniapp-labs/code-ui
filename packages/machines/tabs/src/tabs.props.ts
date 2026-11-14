import type { TabsResolvedProps } from "./tabs.types";

export const defaultTabsProps: TabsResolvedProps = {
  value: null,
  defaultValue: null,
  orientation: "horizontal",
  variant: "pill",
  color: "primary",
  size: "md",
  disabled: false,
  fitted: false,
  loopFocus: true,
  activationMode: "automatic",
  items: [],
  ui: {},
};
