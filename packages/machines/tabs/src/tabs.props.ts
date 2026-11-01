import type { TabsProps } from "./tabs.types";

export const defaultTabsProps: TabsProps = {
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
