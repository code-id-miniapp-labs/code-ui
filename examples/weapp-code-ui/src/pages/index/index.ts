import { useToast } from "@code-ui/composables";
import {
  PRIMARY_COLOR_PRESETS,
  SECONDARY_COLOR_PRESETS,
  normalizeExampleColorInput,
  resetExampleTheme,
  setExampleColorMode,
  setExampleColors,
  syncNavigationBarTheme,
  useTheme,
  type AppColorMode,
  type AppThemeState,
} from "../../utils/theme";

type CategoryId =
  | "all"
  | "form"
  | "display"
  | "navigation"
  | "feedback"
  | "interaction";

interface ComponentCatalogItem {
  id: string;
  name: string;
  path: string;
  category: Exclude<CategoryId, "all">;
  categoryLabel: string;
  desc: string;
  icon: string;
  highlights: string[];
}

interface CategoryTab {
  id: CategoryId;
  label: string;
  count: number;
}

const COMPONENT_CATALOG: ComponentCatalogItem[] = [
  // Form & Input (10)
  {
    id: "button",
    name: "Button",
    path: "/pages/button/index",
    category: "form",
    categoryLabel: "Form",
    desc: "Triggers actions with solid, outline, soft, subtle, ghost & link variants, loadingAuto & openType.",
    icon: "i-lucide-mouse-pointer-click",
    highlights: ["loadingAuto", "openType", "6 variants"],
  },
  {
    id: "input",
    name: "Input",
    path: "/pages/input/index",
    category: "form",
    categoryLabel: "Form",
    desc: "Single-line text input with clearable button, leading/trailing icons, highlight & FormField integration.",
    icon: "i-lucide-text-cursor-input",
    highlights: ["icons", "clearable", "FormField"],
  },
  {
    id: "textarea",
    name: "Textarea",
    path: "/pages/textarea/index",
    category: "form",
    categoryLabel: "Form",
    desc: "Multi-line text field supporting auto-height, max-count indicator, loading state & custom slots.",
    icon: "i-lucide-align-left",
    highlights: ["autoresize", "count slot", "variants"],
  },
  {
    id: "pin-input",
    name: "Pin Input",
    path: "/pages/pin-input/index",
    category: "form",
    categoryLabel: "Form",
    desc: "Segmented OTP / verification code entry with mask, alphanumeric mode, paste handling & states.",
    icon: "i-lucide-key-round",
    highlights: ["OTP", "mask", "alphanumeric"],
  },
  {
    id: "checkbox",
    name: "Checkbox",
    path: "/pages/checkbox/index",
    category: "form",
    categoryLabel: "Form",
    desc: "Single & group selection with indeterminate state, card/list indicators, icons & validation.",
    icon: "i-lucide-check-square",
    highlights: ["indeterminate", "card variant", "group"],
  },
  {
    id: "radio",
    name: "Radio",
    path: "/pages/radio/index",
    category: "form",
    categoryLabel: "Form",
    desc: "Exclusive radio choice & RadioGroup with card, table & indicator positions across all sizes.",
    icon: "i-lucide-circle-dot",
    highlights: ["table", "card", "horizontal/vertical"],
  },
  {
    id: "select",
    name: "Select",
    path: "/pages/select/index",
    category: "form",
    categoryLabel: "Form",
    desc: "Dropdown menu & WeChat picker-view bottom sheet with multiple selection, c-select-item & FormField.",
    icon: "i-lucide-chevrons-up-down",
    highlights: ["dropdown", "picker-view", "c-select-item"],
  },
  {
    id: "switch",
    name: "Switch",
    path: "/pages/switch/index",
    category: "form",
    categoryLabel: "Form",
    desc: "Binary toggle control with custom checked/unchecked icons, async loading & label descriptions.",
    icon: "i-lucide-toggle-right",
    highlights: ["loading", "icons", "slots"],
  },
  {
    id: "slider",
    name: "Slider",
    path: "/pages/slider/index",
    category: "form",
    categoryLabel: "Form",
    desc: "Touch-gesture range & single-value slider with WXS 60fps drag, tooltips, vertical & inverted modes.",
    icon: "i-lucide-sliders-horizontal",
    highlights: ["range", "vertical", "tooltip"],
  },
  {
    id: "file-upload",
    name: "File Upload",
    path: "/pages/file-upload/index",
    category: "form",
    categoryLabel: "Form",
    desc: "Media & file uploader supporting area/button layouts, progress tracking, retry & file limits.",
    icon: "i-lucide-cloud-upload",
    highlights: ["upload progress", "limits", "dropzone"],
  },
  {
    id: "form",
    name: "Form",
    path: "/pages/form/index",
    category: "form",
    categoryLabel: "Form",
    desc: "Full form coordinator with FormField labels/errors, sync/async rules, validateOn & programmatic submit.",
    icon: "i-lucide-clipboard-check",
    highlights: ["validation", "FormField", "disabled"],
  },

  // Data Display (9)
  {
    id: "avatar",
    name: "Avatar",
    path: "/pages/avatar/index",
    category: "display",
    categoryLabel: "Data Display",
    desc: "User profile image with 10 sizes, initials fallback, icon slot, chip indicator & image modes.",
    icon: "i-lucide-user",
    highlights: ["3xs-3xl", "chip", "fallback"],
  },
  {
    id: "avatar-group",
    name: "Avatar Group",
    path: "/pages/avatar-group/index",
    category: "display",
    categoryLabel: "Data Display",
    desc: "Overlapping stack of avatars that shares size context and collapses overflow into +N badges.",
    icon: "i-lucide-users",
    highlights: ["max overflow", "shared size", "ring"],
  },
  {
    id: "badge",
    name: "Badge",
    path: "/pages/badge/index",
    category: "display",
    categoryLabel: "Data Display",
    desc: "Compact status pills with solid, outline, soft & subtle styles, icons, avatars & 5 sizes.",
    icon: "i-lucide-badge-check",
    highlights: ["4 variants", "icons", "5 sizes"],
  },
  {
    id: "card",
    name: "Card",
    path: "/pages/card/index",
    category: "display",
    categoryLabel: "Data Display",
    desc: "Structured surface container featuring header, default & footer slots across 4 card variants.",
    icon: "i-lucide-credit-card",
    highlights: ["header/footer", "subtle/soft", "ui"],
  },
  {
    id: "chip",
    name: "Chip",
    path: "/pages/chip/index",
    category: "display",
    categoryLabel: "Data Display",
    desc: "Floating indicator badge attached to corners of icons, avatars & buttons with inset and standAlone.",
    icon: "i-lucide-circle-alert",
    highlights: ["positions", "inset", "show toggle"],
  },
  {
    id: "icon",
    name: "Icon",
    path: "/pages/icon/index",
    category: "display",
    categoryLabel: "Data Display",
    desc: "Multi-collection vector icons powered by Iconify (Lucide, Tabler) with semantic color & size scaling.",
    icon: "i-lucide-sparkles",
    highlights: ["lucide", "tabler", "sizes"],
  },
  {
    id: "progress",
    name: "Progress",
    path: "/pages/progress/index",
    category: "display",
    categoryLabel: "Data Display",
    desc: "Linear, vertical, circular & indeterminate progress indicators with slots & inverted direction.",
    icon: "i-lucide-loader",
    highlights: ["circular", "vertical", "slots"],
  },
  {
    id: "qr-code",
    name: "QR Code",
    path: "/pages/qr-code/index",
    category: "display",
    categoryLabel: "Data Display",
    desc: "High-precision vector/canvas QR generator with runtime theme colors, overlays, ECC & data URL export.",
    icon: "i-lucide-qr-code",
    highlights: ["canvas export", "overlay", "theme color"],
  },
  {
    id: "skeleton",
    name: "Skeleton",
    path: "/pages/skeleton/index",
    category: "display",
    categoryLabel: "Data Display",
    desc: "Animated shimmer placeholders for composing cards, lists & loaded content transition states.",
    icon: "i-lucide-rectangle-horizontal",
    highlights: ["shimmer", "toggleable", "layouts"],
  },

  // Navigation & Disclosure (4)
  {
    id: "tabs",
    name: "Tabs",
    path: "/pages/tabs/index",
    category: "navigation",
    categoryLabel: "Navigation",
    desc: "Animated pill & underline tabs with declarative or data-driven items, badges, lazy mount & scrolling.",
    icon: "i-lucide-columns-3",
    highlights: ["pill/link", "lazy mount", "icons"],
  },
  {
    id: "stepper",
    name: "Stepper",
    path: "/pages/stepper/index",
    category: "navigation",
    categoryLabel: "Navigation",
    desc: "Multi-step workflow tracker supporting horizontal/vertical orientation, linear guard & custom icons.",
    icon: "i-lucide-list-ordered",
    highlights: ["vertical", "completedIcon", "linear"],
  },
  {
    id: "accordion",
    name: "Accordion",
    path: "/pages/accordion/index",
    category: "navigation",
    categoryLabel: "Navigation",
    desc: "Expandable disclosure panels with single/multiple open modes, disabled items & 5 visual styles.",
    icon: "i-lucide-chevrons-up-down",
    highlights: ["single/multiple", "5 variants", "API"],
  },
  {
    id: "divider",
    name: "Divider",
    path: "/pages/divider/index",
    category: "navigation",
    categoryLabel: "Navigation",
    desc: "Horizontal & vertical content separators with solid/dashed/dotted styles, icons & center labels.",
    icon: "i-lucide-minus",
    highlights: ["vertical", "dashed/dotted", "labels"],
  },

  // Feedback & Overlay (5)
  {
    id: "toast",
    name: "Toast",
    path: "/pages/toast/index",
    category: "feedback",
    categoryLabel: "Feedback",
    desc: "Programmatic notification queue with top/center/bottom placements, progress timer & native fallback.",
    icon: "i-lucide-bell",
    highlights: ["useToast", "placements", "progress"],
  },
  {
    id: "banner",
    name: "Banner",
    path: "/pages/banner/index",
    category: "feedback",
    categoryLabel: "Feedback",
    desc: "Sticky top announcement bar coordinating top page insets seamlessly with <c-app>.",
    icon: "i-lucide-megaphone",
    highlights: ["app inset", "actions", "closable"],
  },
  {
    id: "drawer",
    name: "Drawer",
    path: "/pages/drawer/index",
    category: "feedback",
    categoryLabel: "Feedback",
    desc: "4-direction slide-over modal with WXS swipe dismissal, nested background scale & form support.",
    icon: "i-lucide-panel-bottom",
    highlights: ["scale background", "swipe drag", "4 edges"],
  },
  {
    id: "action-sheet",
    name: "Action Sheet",
    path: "/pages/action-sheet/index",
    category: "feedback",
    categoryLabel: "Feedback",
    desc: "Context menu drawer with destructive actions, sublabels, native openType items & safe-area inset.",
    icon: "i-lucide-list",
    highlights: ["openType", "danger item", "cancel"],
  },
  {
    id: "pull-down-refresh",
    name: "Pull Refresh",
    path: "/pages/pull-down-refresh/index",
    category: "feedback",
    categoryLabel: "Feedback",
    desc: "WXS physics pull-to-refresh container with custom indicator slots & programmatic refresh/close.",
    icon: "i-lucide-arrow-down-circle",
    highlights: ["WXS gesture", "custom slots", "FSM"],
  },

  // Interaction & Hooks (2)
  {
    id: "swipe-cell",
    name: "Swipe Cell",
    path: "/pages/swipe-cell/index",
    category: "interaction",
    categoryLabel: "Interaction",
    desc: "Bi-directional swipeable row revealing contextual actions with WXS spring resistance & auto-close.",
    icon: "i-lucide-move-horizontal",
    highlights: ["left/right actions", "WXS", "onClose"],
  },
  {
    id: "use-child",
    name: "Use Child",
    path: "/pages/use-child/index",
    category: "interaction",
    categoryLabel: "Interaction",
    desc: "Type-safe composable hook connecting page scripts to child component FSM APIs by selector.",
    icon: "i-lucide-cpu",
    highlights: ["useChild()", "FSM API", "type-safe"],
  },
];

function buildCategoryTabs(items: ComponentCatalogItem[]): CategoryTab[] {
  const counts: Record<Exclude<CategoryId, "all">, number> = {
    form: 0,
    display: 0,
    navigation: 0,
    feedback: 0,
    interaction: 0,
  };
  for (const item of items) {
    counts[item.category] += 1;
  }
  return [
    { id: "all", label: "All", count: items.length },
    { id: "form", label: "Form", count: counts.form },
    { id: "display", label: "Data Display", count: counts.display },
    { id: "navigation", label: "Navigation", count: counts.navigation },
    { id: "feedback", label: "Feedback", count: counts.feedback },
    { id: "interaction", label: "Interaction", count: counts.interaction },
  ];
}

function filterCatalog(
  items: ComponentCatalogItem[],
  category: CategoryId,
  query: string,
): ComponentCatalogItem[] {
  const q = query.trim().toLowerCase();
  return items.filter((item) => {
    if (category !== "all" && item.category !== category) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q) ||
      item.highlights.some((h) => h.toLowerCase().includes(q))
    );
  });
}

const CATEGORY_TABS = buildCategoryTabs(COMPONENT_CATALOG);

interface HomePageContext {
  __unsubTheme?: (() => void) | undefined;
}

Page({
  data: {
    colorMode: "system" as AppColorMode,
    isDark: false,
    activePrimary: "stone",
    activeSecondary: "amber",
    customHex: "",
    customTarget: "primary" as "primary" | "secondary",
    hexError: "",
    studioExpanded: true,
    hasCustomTheme: false,
    primaryPresets: PRIMARY_COLOR_PRESETS,
    secondaryPresets: SECONDARY_COLOR_PRESETS,

    categories: CATEGORY_TABS,
    activeCategory: "all" as CategoryId,
    searchQuery: "",
    totalCount: COMPONENT_CATALOG.length,
    filteredComponents: COMPONENT_CATALOG,
  },

  onLoad() {
    const applyState = (state: AppThemeState) => {
      const hasColors = Object.keys(state.colors).length > 0;
      this.setData({
        colorMode: state.colorMode,
        isDark: state.resolvedMode === "dark",
        activePrimary: state.colors.primary || "stone",
        activeSecondary: state.colors.secondary || "amber",
        hasCustomTheme: hasColors || state.colorMode !== "system",
      });
    };

    const self = this as unknown as HomePageContext;
    self.__unsubTheme?.();
    self.__unsubTheme = useTheme().subscribe(applyState, true);
    syncNavigationBarTheme();
  },

  onShow() {
    syncNavigationBarTheme();
  },

  onUnload() {
    const self = this as unknown as HomePageContext;
    self.__unsubTheme?.();
    self.__unsubTheme = undefined;
  },

  toggleStudio() {
    this.setData({ studioExpanded: !this.data.studioExpanded });
  },

  onSelectColorMode(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset?.mode as AppColorMode | undefined;
    if (!mode) return;
    setExampleColorMode(mode);
  },

  onSelectPrimaryColor(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset?.value as string | undefined;
    if (!value) return;
    setExampleColors({ primary: value === "stone" ? "" : value });
  },

  onSelectSecondaryColor(e: WechatMiniprogram.TouchEvent) {
    const value = e.currentTarget.dataset?.value as string | undefined;
    if (!value) return;
    setExampleColors({ secondary: value === "amber" ? "" : value });
  },

  onSelectCustomTarget(e: WechatMiniprogram.TouchEvent) {
    const target = e.currentTarget.dataset?.target as
      | "primary"
      | "secondary"
      | undefined;
    if (!target) return;
    this.setData({ customTarget: target, hexError: "" });
  },

  onCustomHexChange(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({
      customHex: e.detail?.value ?? "",
      hexError: "",
    });
  },

  onCustomHexClear() {
    this.setData({ customHex: "", hexError: "" });
  },

  onApplyCustomHex() {
    const normalized = normalizeExampleColorInput(this.data.customHex);
    if (!normalized) {
      this.setData({
        hexError: "Enter #hex (e.g. #10b981) or palette name (e.g. indigo)",
      });
      return;
    }
    const target = this.data.customTarget;
    setExampleColors({ [target]: normalized });
    this.setData({ hexError: "" });
    useToast(this).add({
      title: `Updated ${target} color`,
      description: `Applied runtime palette: ${normalized}`,
      color: "success",
      variant: "soft",
      icon: "i-lucide-palette",
      duration: 2000,
    });
  },

  onResetTheme() {
    resetExampleTheme();
    this.setData({ customHex: "", hexError: "" });
    useToast(this).add({
      title: "Theme reset",
      description: "Restored default Stone & Amber colors.",
      color: "neutral",
      variant: "soft",
      duration: 1800,
    });
  },

  onSelectCategory(e: WechatMiniprogram.TouchEvent) {
    const category = e.currentTarget.dataset?.category as CategoryId | undefined;
    if (!category) return;
    this.setData({
      activeCategory: category,
      filteredComponents: filterCatalog(
        COMPONENT_CATALOG,
        category,
        this.data.searchQuery,
      ),
    });
  },

  onSearchChange(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const searchQuery = e.detail?.value ?? "";
    this.setData({
      searchQuery,
      filteredComponents: filterCatalog(
        COMPONENT_CATALOG,
        this.data.activeCategory,
        searchQuery,
      ),
    });
  },

  onSearchClear() {
    this.setData({
      searchQuery: "",
      filteredComponents: filterCatalog(
        COMPONENT_CATALOG,
        this.data.activeCategory,
        "",
      ),
    });
  },

  onResetFilters() {
    this.setData({
      activeCategory: "all",
      searchQuery: "",
      filteredComponents: COMPONENT_CATALOG,
    });
  },

  navigateTo(e: WechatMiniprogram.TouchEvent) {
    const url = e.currentTarget.dataset?.path as string | undefined;
    if (url) {
      wx.navigateTo({ url });
    }
  },
});
