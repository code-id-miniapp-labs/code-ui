import type {
  ActionSheetAction,
  ActionSheetActionDetails,
  ActionSheetItem,
  ActionSheetSelectDetails,
} from "@code-ui/action-sheet";

interface CustomShareOption {
  id: string;
  name: string;
  icon: string;
  bgClass: string;
  iconClass: string;
  openType?: string;
}

Page({
  data: {
    isOpen: false,
    title: "",
    description: "",
    items: [] as ActionSheetItem[],
    actions: [] as ActionSheetAction[],
    close: false,
    closeOnItem: true,
    closeOnBackdropClick: true,
    ui: {} as Record<string, string>,
    isCustomSlot: false,
    activeScenario: "basic",

    lastEvent: "Ready. Tap any scenario below to preview ActionSheet.",
    eventLog: [] as string[],

    // Custom Share Options for declarative slot scenario
    shareOptions: [
      {
        id: "wechat",
        name: "WeChat",
        icon: "i-lucide-message-circle",
        bgClass: "bg-emerald-50 dark:bg-emerald-950/40",
        iconClass: "text-emerald-600 dark:text-emerald-400",
        openType: "share",
      },
      {
        id: "moments",
        name: "Moments",
        icon: "i-lucide-compass",
        bgClass: "bg-green-50 dark:bg-green-950/40",
        iconClass: "text-green-600 dark:text-green-400",
      },
      {
        id: "copy",
        name: "Copy Link",
        icon: "i-lucide-copy",
        bgClass: "bg-blue-50 dark:bg-blue-950/40",
        iconClass: "text-blue-600 dark:text-blue-400",
      },
      {
        id: "poster",
        name: "Save Poster",
        icon: "i-lucide-image",
        bgClass: "bg-purple-50 dark:bg-purple-950/40",
        iconClass: "text-purple-600 dark:text-purple-400",
      },
      {
        id: "qrcode",
        name: "QR Code",
        icon: "i-lucide-qr-code",
        bgClass: "bg-amber-50 dark:bg-amber-950/40",
        iconClass: "text-amber-600 dark:text-amber-400",
      },
      {
        id: "more",
        name: "More",
        icon: "i-lucide-more-horizontal",
        bgClass: "bg-neutral-100 dark:bg-neutral-800",
        iconClass: "text-neutral-600 dark:text-neutral-400",
      },
    ] as CustomShareOption[],
  },

  logEvent(msg: string) {
    const time = new Date().toTimeString().slice(0, 8);
    const line = `[${time}] ${msg}`;
    this.setData({
      lastEvent: line,
      eventLog: [line, ...this.data.eventLog.slice(0, 7)],
    });
  },

  clearLog() {
    this.setData({
      lastEvent: "Event log cleared.",
      eventLog: [],
    });
  },

  closeSheet() {
    (this as any).footerActions = undefined;
    this.setData({ isOpen: false });
  },

  // 1. Basic ActionSheet
  openBasic() {
    this.setData({
      activeScenario: "basic",
      isCustomSlot: false,
      title: "",
      description: "",
      close: false,
      closeOnItem: true,
      closeOnBackdropClick: true,
      ui: {},
      items: [
        { label: "Option 1" },
        { label: "Option 2" },
        { label: "Option 3" },
      ],
      actions: [
        {
          label: "Cancel",
          variant: "ghost",
          color: "neutral",
          className: "text-neutral-900 dark:text-neutral-100 font-normal",
        },
      ],
      isOpen: true,
    });
    this.logEvent("Opened Basic ActionSheet");
  },

  // 2. Header with Title & Description (Mockup Reproduction)
  openWithHeader() {
    this.setData({
      activeScenario: "header",
      isCustomSlot: false,
      title: "DOCUMENT ACTIONS",
      description: "Select what you would like to do with this document.",
      close: false,
      closeOnItem: true,
      closeOnBackdropClick: true,
      ui: {},
      items: [
        {
          label: "Save to Local Files",
          description: "Download a local copy directly to this device",
          icon: "i-lucide-download",
        },
        {
          label: "Print Document",
          description: "Send to network AirPrint printer",
          icon: "i-lucide-printer",
        },
        {
          label: "Send via Email",
          description: "Attach document to an outgoing email message",
          icon: "i-lucide-mail",
        },
      ],
      actions: [
        {
          label: "Dismiss",
          variant: "ghost",
          color: "neutral",
        },
      ],
      isOpen: true,
    });
    this.logEvent("Opened Document Actions ActionSheet");
  },

  // 3. Status Variants (Destructive, Loading, Disabled)
  openStatusVariants() {
    this.setData({
      activeScenario: "status",
      isCustomSlot: false,
      title: "File Operations",
      description: "Different states: loading, disabled, and destructive.",
      close: false,
      closeOnItem: true,
      closeOnBackdropClick: true,
      ui: {},
      items: [
        {
          label: "Rename File",
          icon: "i-lucide-edit-3",
        },
        {
          label: "Syncing Cloud Backup...",
          loading: true,
        },
        {
          label: "Move to Team Vault (Locked)",
          disabled: true,
          description: "Requires administrator permission",
          icon: "i-lucide-lock",
        },
        {
          label: "Delete File Permanently",
          destructive: true,
          description: "This action cannot be undone",
          icon: "i-lucide-trash-2",
        },
      ],
      actions: [
        {
          label: "Cancel",
          variant: "ghost",
          color: "neutral",
          className: "text-neutral-900 dark:text-neutral-100 font-normal",
        },
      ],
      isOpen: true,
    });
    this.logEvent("Opened ActionSheet with Status Variants");
  },

  // 4. Footer Actions via <c-button> (Side-by-side & Async AutoLoading)
  openFooterActionsVariety() {
    const actions: ActionSheetAction[] = [
      {
        label: "Cancel",
        variant: "outline",
        color: "neutral",
        closeOnClick: true,
      },
      {
        label: "Async Save",
        variant: "solid",
        color: "primary",
        loadingAuto: true,
        closeOnClick: false,
        onClick: () => {
          this.logEvent("Async Save started (autoLoading spinner on button)");
          return new Promise<void>((resolve) => {
            setTimeout(() => {
              this.logEvent("Async Save finished!");
              this.setData({ isOpen: false });
              resolve();
            }, 1500);
          });
        },
      },
    ];
    (this as any).footerActions = actions;

    this.setData({
      activeScenario: "actions",
      isCustomSlot: false,
      title: "Footer Actions via <c-button>",
      description:
        "Side-by-side buttons with async autoLoading spinner and variant styling.",
      close: false,
      closeOnItem: true,
      closeOnBackdropClick: true,
      ui: {},
      items: [
        {
          label: "Export as PDF Document",
          description: "Generate high-resolution printable PDF",
          icon: "i-lucide-file-text",
        },
        {
          label: "Export as Excel Spreadsheet",
          description: "Compatible with Microsoft Excel & Numbers",
          icon: "i-lucide-sheet",
        },
      ],
      actions,
      isOpen: true,
    });
    this.logEvent(
      "Opened ActionSheet with Footer Actions (side-by-side + autoLoading)",
    );
  },

  // 5. Modal Mode & Close Trigger Button
  openModalWithClose() {
    this.setData({
      activeScenario: "modal",
      isCustomSlot: false,
      title: "Revoke Access Token",
      description:
        "Strict modal (backdrop tap disabled). Must tap an item, Close ('X'), or Action button.",
      close: true,
      closeOnItem: true,
      closeOnBackdropClick: false,
      ui: {},
      items: [
        {
          label: "Revoke Immediately",
          destructive: true,
          description: "Existing sessions will be terminated immediately",
          icon: "i-lucide-shield-alert",
        },
        {
          label: "Regenerate New Secret Key",
          description: "Issues a replacement key before revoking old one",
          icon: "i-lucide-refresh-cw",
        },
      ],
      actions: [
        {
          label: "Keep Token",
          variant: "ghost",
          color: "neutral",
        },
      ],
      isOpen: true,
    });
    this.logEvent(
      "Opened Strict Modal ActionSheet (closeOnBackdropClick=false)",
    );
  },

  // 6. WeChat Native Open-Type
  openWeChatFeatures() {
    this.setData({
      activeScenario: "wechat",
      isCustomSlot: false,
      title: "WeChat Native Features",
      description:
        "Items configured with native MiniProgram open-type buttons.",
      close: true,
      closeOnItem: true,
      closeOnBackdropClick: true,
      ui: {},
      items: [
        {
          label: "Forward to Friends",
          openType: "share",
          description: "Opens WeChat native card share picker",
          icon: "i-lucide-share-2",
        },
        {
          label: "Choose User Avatar",
          openType: "chooseAvatar",
          description: "Opens WeChat avatar selection modal",
          icon: "i-lucide-user",
        },
        {
          label: "Customer Service Chat",
          openType: "contact",
          description: "Connect to live support agent via WeChat messaging",
          icon: "i-lucide-headphones",
        },
      ],
      actions: [
        {
          label: "Cancel",
          variant: "ghost",
          color: "neutral",
          className: "text-neutral-900 dark:text-neutral-100 font-normal",
        },
      ],
      isOpen: true,
    });
    this.logEvent("Opened ActionSheet with WeChat Open-Type items");
  },

  // 7. Custom Slot (Share Grid)
  openCustomSlot() {
    this.setData({
      activeScenario: "custom",
      isCustomSlot: true,
      title: "Share Content To",
      description: "Custom grid rendered declaratively via default slot.",
      close: true,
      closeOnItem: false,
      closeOnBackdropClick: false,
      ui: {},
      items: [],
      actions: [
        {
          label: "Cancel",
          variant: "ghost",
          color: "neutral",
          className: "text-neutral-900 dark:text-neutral-100 font-normal",
        },
      ],
      isOpen: true,
    });
    this.logEvent("Opened Declarative Slot ActionSheet (Custom Share Grid)");
  },

  // 8. Custom UI Theming
  openCustomTheme() {
    this.setData({
      activeScenario: "themed",
      isCustomSlot: false,
      title: "Themed ActionSheet",
      description: "Custom styling applied via ui prop slots.",
      close: false,
      closeOnItem: true,
      closeOnBackdropClick: true,
      ui: {
        content: "rounded-t-3xl border-t-2 border-primary/20 shadow-2xl",
        backdrop: "bg-neutral-950/60 backdrop-blur-md",
        header: "py-4 bg-neutral-50 dark:bg-neutral-850",
      },
      items: [
        {
          label: "Highlight Brand Feature",
          description: "Custom styled items with primary accents",
          icon: "i-lucide-sparkles",
        },
        {
          label: "Save to Favorites",
          icon: "i-lucide-star",
        },
      ],
      actions: [
        {
          label: "Dismiss",
          variant: "ghost",
          color: "neutral",
        },
      ],
      isOpen: true,
    });
    this.logEvent("Opened Custom Themed ActionSheet (ui prop overrides)");
  },

  // Event Handlers
  onItemSelect(e: WechatMiniprogram.CustomEvent<ActionSheetSelectDetails>) {
    const { item, index } = e.detail;
    this.logEvent(`Selected item: "${item.label}" (index: ${index})`);
    if (this.data.closeOnItem) {
      this.setData({ isOpen: false });
    }
  },

  onFooterAction(e: WechatMiniprogram.CustomEvent<ActionSheetActionDetails>) {
    const { action, index } = e.detail;
    this.logEvent(`Footer action tapped: "${action.label}" (index: ${index})`);

    const storedAction = (this as any).footerActions?.[index];
    if (storedAction?.onClick) {
      return storedAction.onClick();
    }

    if (action.label === "Async Save") {
      this.logEvent("Async Save started (autoLoading spinner on button)");
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          this.logEvent("Async Save finished!");
          this.setData({ isOpen: false });
          resolve();
        }, 1500);
      });
    }

    if (action.closeOnClick !== false) {
      this.setData({ isOpen: false });
    }
  },

  onSheetClose() {
    this.logEvent("ActionSheet closed (bind:close)");
    this.setData({ isOpen: false });
  },

  onBackdropTap() {
    this.logEvent("Backdrop tapped (bind:backdropTap)");
  },

  onCloseTriggerTap() {
    this.logEvent("Close trigger tapped (bind:closeTriggerTap)");
    this.setData({ isOpen: false });
  },

  onChooseAvatar(e: WechatMiniprogram.CustomEvent<{ avatarUrl: string }>) {
    const url = e.detail?.avatarUrl || "Avatar chosen";
    this.logEvent(`WeChat chooseAvatar: ${url}`);
  },

  onCustomShareItemTap(e: WechatMiniprogram.TouchEvent) {
    const item = e.currentTarget.dataset.item as CustomShareOption;
    this.logEvent(`Custom Share Item Tapped: "${item.name}"`);
    if (item.openType !== "share") {
      this.setData({ isOpen: false });
    }
  },
});
