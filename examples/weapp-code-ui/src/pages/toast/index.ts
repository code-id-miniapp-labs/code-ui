import { useToast } from "@code-ui/composables";

const toast = useToast({ max: 2 });

Page({
  data: {
    variants: ["outline", "solid", "soft", "subtle"] as const,
    placements: ["top", "center", "bottom"] as const,
    activeVariant: "outline" as "outline" | "solid" | "soft" | "subtle",
    activePlacement: "top" as "top" | "center" | "bottom",
    lastActionLog: "None",
  },

  onSelectVariant(e: WechatMiniprogram.TouchEvent) {
    const variant = e.currentTarget.dataset?.variant as
      | "outline"
      | "solid"
      | "soft"
      | "subtle"
      | undefined;
    if (!variant) return;
    this.setData({ activeVariant: variant });
    toast.show({
      title: `Variant: ${variant}`,
      description: `Displayed in ${this.data.activePlacement} placement.`,
      color: "primary",
      variant,
      placement: this.data.activePlacement,
      icon: "i-lucide-palette",
    });
  },

  onSelectPlacement(e: WechatMiniprogram.TouchEvent) {
    const placement = e.currentTarget.dataset?.placement as
      | "top"
      | "center"
      | "bottom"
      | undefined;
    if (!placement) return;
    this.setData({ activePlacement: placement });
    toast.show({
      title: `Placement: ${placement}`,
      description: "Toast queue supports stacking & placement alignment.",
      color: "secondary",
      variant: this.data.activeVariant,
      placement,
      icon: "i-lucide-bell",
    });
  },

  showDefaultPrimary() {
    toast.show({
      title: "Event scheduled",
      description: "Added to your workspace calendar.",
      icon: "i-lucide-calendar",
      color: "primary",
      variant: this.data.activeVariant,
      placement: this.data.activePlacement,
    });
  },

  showDefaultSecondary() {
    toast.show({
      title: "Theme synced",
      description: "Secondary accent applied to notifications.",
      icon: "i-lucide-sparkles",
      color: "secondary",
      variant: this.data.activeVariant,
      placement: this.data.activePlacement,
    });
  },

  showDefaultSuccess() {
    toast.success("Profile saved successfully", {
      description: "Your settings have been synced to the server.",
      variant: this.data.activeVariant,
      placement: this.data.activePlacement,
    });
  },

  showDefaultError() {
    toast.error("Upload failed", {
      description: "File size exceeds 10MB limit.",
      variant: this.data.activeVariant,
      placement: this.data.activePlacement,
    });
  },

  showDefaultWarning() {
    toast.warning("Connection unstable", {
      description: "Retrying in 5 seconds...",
      variant: this.data.activeVariant,
      placement: this.data.activePlacement,
    });
  },

  showDefaultInfo() {
    toast.info("Scheduled maintenance", {
      description: "Server restart tonight at 02:00 UTC.",
      variant: this.data.activeVariant,
      placement: this.data.activePlacement,
    });
  },

  showHorizontalPill() {
    toast.show({
      title: "Copied link to clipboard",
      icon: "i-lucide-check",
      color: "success",
      variant: "soft",
      orientation: "horizontal",
      placement: "bottom",
      actions: [
        {
          label: "Open",
          color: "success",
          variant: "outline",
          onClick: () => this.setData({ lastActionLog: "Clicked Open on horizontal pill" }),
        },
      ],
    });
  },

  showWithAction() {
    toast.show({
      title: "Conversation archived",
      description: "Tap Undo to restore this thread.",
      color: "neutral",
      variant: this.data.activeVariant,
      placement: this.data.activePlacement,
      actions: [
        {
          label: "Undo",
          color: "primary",
          variant: "outline",
          onClick: () => this.setData({ lastActionLog: "Undo tapped at " + new Date().toLocaleTimeString() }),
        },
      ],
    });
  },

  showProgressTop() {
    toast.show({
      title: "Top Progress Timer",
      description: "progressPosition=\"top\" counting down.",
      icon: "i-lucide-arrow-down-to-line",
      color: "primary",
      variant: this.data.activeVariant,
      progressPosition: "top",
      duration: 4000,
    });
  },

  showNoProgress() {
    toast.show({
      title: "Clean Notification",
      description: "Timer bar hidden via progress: false.",
      icon: "i-lucide-info",
      color: "info",
      progress: false,
      duration: 3000,
    });
  },

  showPersistentUpdate() {
    const id = toast.show({
      title: "Uploading package (0%)",
      description: "Preparing bundle artifacts...",
      icon: "i-lucide-loader-circle",
      color: "primary",
      duration: 0,
      close: false,
      ui: { icon: "animate-spin" },
    });
    setTimeout(() => {
      toast.update(id, {
        title: "Uploading package (60%)",
        description: "Syncing compressed assets...",
      });
    }, 900);
    setTimeout(() => {
      toast.update(id, {
        title: "Upload complete!",
        description: "All assets published safely.",
        icon: "i-lucide-circle-check",
        color: "success",
        duration: 2000,
        close: true,
        ui: { icon: "" },
      });
    }, 1800);
  },

  showNativeSuccess() {
    toast.show({
      title: "Completed",
      icon: "check",
      mode: "native",
      placement: "center",
      duration: 2200,
    });
  },

  showNativeLoading() {
    const id = toast.show({
      title: "Loading...",
      icon: "loading",
      mode: "native",
      placement: "center",
      duration: 0,
      ui: { icon: "animate-spin" },
    });
    setTimeout(() => {
      toast.update(id, {
        title: "Loaded!",
        icon: "check",
        duration: 1500,
        ui: { icon: "text-success" },
      });
    }, 1400);
  },

  clearAllToasts() {
    toast.clear();
  },
});
