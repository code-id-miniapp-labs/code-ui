import { useToast } from "@code-id-labs/composables";

const toast = useToast();

Page({
  data: {
    drawerOpen: false,
    placement: "bottom" as "bottom" | "top" | "left" | "right",
    shouldScaleBackground: true,
    scaleBackground: "bg-black",
    scaleFactor: 0.94,
    closeOnBackdropClick: true,
    scenario: "standard" as "standard" | "scrollable" | "modal" | "form",
    drawerTitle: "Bottom Sheet",
    drawerDescription: "Gesture-driven modal drawer with backdrop dimming.",
    customCloseProps: {
      label: "Done",
      color: "primary",
      variant: "soft",
      size: "xs",
    },
    useCustomCloseSlot: false,
    eventLogs: ["Drawer ready"] as string[],
    feedbackNote: "",

    scrollItems: Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      title: `Drawer Item #${i + 1}`,
      desc: `Detailed content description for scroll item ${i + 1}`,
    })),

    pageItems: Array.from({ length: 6 }, (_, i) => ({
      id: i + 1,
      title: `Background Item #${i + 1}`,
      desc: "Observe page scroll lock & background scaling when drawer opens.",
    })),
  },

  pushLog(msg: string) {
    const logs = [`${msg}`, ...this.data.eventLogs].slice(0, 6);
    this.setData({ eventLogs: logs });
  },

  openPlacement(e: WechatMiniprogram.CustomEvent) {
    const placement = (e.currentTarget.dataset.placement || "bottom") as
      | "bottom"
      | "top"
      | "left"
      | "right";
    const titles: Record<string, string> = {
      bottom: "Bottom Sheet",
      top: "Top Notification Drawer",
      left: "Left Navigation Drawer",
      right: "Right Filters Drawer",
    };
    this.setData({
      placement,
      scenario: "standard",
      closeOnBackdropClick: true,
      useCustomCloseSlot: false,
      drawerTitle: titles[placement] || "Drawer",
      drawerDescription: `Opened from "${placement}". Swipe grabber or tap close to dismiss.`,
      drawerOpen: true,
    });
    this.pushLog(`open(${placement})`);
  },

  openScrollable() {
    this.setData({
      placement: "bottom",
      scenario: "scrollable",
      closeOnBackdropClick: true,
      useCustomCloseSlot: false,
      drawerTitle: "Scrollable Drawer List",
      drawerDescription: "Smooth inner scroll-view while background stays locked.",
      drawerOpen: true,
    });
    this.pushLog("open(scrollable)");
  },

  openModal() {
    this.setData({
      placement: "bottom",
      scenario: "modal",
      drawerTitle: "Confirm Destructive Action",
      drawerDescription: "Backdrop click disabled (closeOnBackdropClick=false).",
      closeOnBackdropClick: false,
      useCustomCloseSlot: false,
      drawerOpen: true,
    });
    this.pushLog("open(modal)");
  },

  openFormDrawer() {
    this.setData({
      placement: "bottom",
      scenario: "form",
      drawerTitle: "Quick Feedback Form",
      drawerDescription: "Keyboard height aware form inside bottom drawer.",
      closeOnBackdropClick: true,
      useCustomCloseSlot: true,
      drawerOpen: true,
    });
    this.pushLog("open(form)");
  },

  onScaleBackgroundChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ shouldScaleBackground: Boolean(e.detail.checked) });
  },

  onSelectScaleColor(e: WechatMiniprogram.CustomEvent) {
    const color = e.currentTarget.dataset.color || "bg-black";
    this.setData({ scaleBackground: color });
  },

  onBackdropCloseChange(e: WechatMiniprogram.CustomEvent) {
    this.setData({ closeOnBackdropClick: Boolean(e.detail.checked) });
  },

  onOpenChange(e: WechatMiniprogram.CustomEvent<{ open?: boolean }>) {
    this.pushLog(`onOpenChange(${Boolean(e.detail?.open)})`);
  },

  closeDrawer() {
    this.setData({ drawerOpen: false, closeOnBackdropClick: true });
    this.pushLog("closeDrawer()");
  },

  onDrawerClose() {
    this.setData({ drawerOpen: false, closeOnBackdropClick: true });
    this.pushLog("onClose");
  },

  onConfirmAction() {
    toast.success("Action confirmed");
    this.closeDrawer();
  },

  onFormSubmit(e: WechatMiniprogram.CustomEvent) {
    toast.success("Feedback submitted", {
      description: JSON.stringify(e.detail.values),
    });
    this.closeDrawer();
  },
});
