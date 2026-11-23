import {
  usePresence,
  useToast,
  type PresenceSnapshot,
  type UsePresenceReturn,
} from "@code-id-labs/composables";

const toast = useToast();

const INITIAL_PRESENCE: PresenceSnapshot = {
  present: false,
  open: false,
  mounted: false,
  state: "unmounted",
};

interface PresencePageHandles {
  __filterDrawer?: UsePresenceReturn | undefined;
  __confirmModal?: UsePresenceReturn | undefined;
  __actionSheet?: UsePresenceReturn | undefined;
  __interruptTimer?: ReturnType<typeof setTimeout> | undefined;
  __reopenTimer?: ReturnType<typeof setTimeout> | undefined;
}

Page({
  data: {
    panelPresent: false,
    unmountOnExit: true,
    filterDrawer: INITIAL_PRESENCE,
    confirmModal: INITIAL_PRESENCE,
    actionSheet: INITIAL_PRESENCE,
    drawerInstances: 0,
    modalInstances: 0,
    sheetItems: [
      { key: "copy", label: "Copy Link", icon: "i-lucide-link" },
      { key: "share", label: "Share with Team", icon: "i-lucide-share-2" },
    ],
    sheetActions: [{ label: "Cancel", variant: "soft", color: "neutral" }],
    logs: ["Page ready — 0 overlay instances mounted"] as string[],
  },

  onLoad() {
    const self = this as unknown as PresencePageHandles;

    self.__filterDrawer = usePresence({
      target: this,
      key: "filterDrawer",
      onExitComplete: () => {
        this.pushLog("filterDrawer: unmounted after exitcomplete");
      },
    });

    self.__confirmModal = usePresence({
      target: this,
      key: "confirmModal",
      onExitComplete: () => {
        this.pushLog("confirmModal: unmounted after exitcomplete");
      },
    });

    self.__actionSheet = usePresence({
      target: this,
      key: "actionSheet",
      onExitComplete: () => {
        this.pushLog("actionSheet: unmounted after exitcomplete");
      },
    });
  },

  onUnload() {
    const self = this as unknown as PresencePageHandles;
    self.__filterDrawer?.stop();
    self.__confirmModal?.stop();
    self.__actionSheet?.stop();
    if (self.__interruptTimer) clearTimeout(self.__interruptTimer);
    if (self.__reopenTimer) clearTimeout(self.__reopenTimer);
  },

  pushLog(message: string) {
    const now = new Date();
    const ts = `${String(now.getMinutes()).padStart(2, "0")}:${String(
      now.getSeconds(),
    ).padStart(2, "0")}`;
    const logs = [`[${ts}] ${message}`, ...this.data.logs].slice(0, 8);
    this.setData({ logs });
  },

  clearLogs() {
    this.setData({ logs: ["Log cleared"] });
  },

  // 1. Declarative <c-presence>
  togglePanel() {
    const next = !this.data.panelPresent;
    this.setData({ panelPresent: next });
    this.pushLog(`<c-presence> present = ${next}`);
  },

  onUnmountOnExitChange(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ unmountOnExit: Boolean(e.detail?.checked) });
  },

  onPanelExitComplete() {
    this.pushLog("<c-presence> bind:exitcomplete fired");
  },

  // 2. Custom <filter-drawer> (extends <c-drawer>)
  openFilterDrawer() {
    const self = this as unknown as PresencePageHandles;
    self.__filterDrawer?.show();
    this.pushLog("filterDrawer.show() -> mounted=true, open=true");
  },

  closeFilterDrawer() {
    const self = this as unknown as PresencePageHandles;
    self.__filterDrawer?.hide();
    this.pushLog("filterDrawer.hide() -> exiting (still mounted)");
  },

  onFilterDrawerExitComplete() {
    const self = this as unknown as PresencePageHandles;
    self.__filterDrawer?.onExitComplete();
  },

  onFilterDrawerAttached() {
    this.setData({ drawerInstances: this.data.drawerInstances + 1 });
    this.pushLog("<filter-drawer> attached()");
  },

  onFilterDrawerDetached() {
    this.setData({
      drawerInstances: Math.max(0, this.data.drawerInstances - 1),
    });
    this.pushLog("<filter-drawer> detached()");
  },

  onFilterApply(
    e: WechatMiniprogram.CustomEvent<{ keyword?: string; onlyInStock?: boolean }>,
  ) {
    toast.success("Filters applied", {
      description: `keyword="${e.detail?.keyword || ""}", inStock=${Boolean(e.detail?.onlyInStock)}`,
    });
  },

  // 3. Custom <confirm-modal> (extends <c-modal>)
  openConfirmModal() {
    const self = this as unknown as PresencePageHandles;
    self.__confirmModal?.show();
    this.pushLog("confirmModal.show() -> mounted=true, open=true");
  },

  closeConfirmModal() {
    const self = this as unknown as PresencePageHandles;
    self.__confirmModal?.hide();
    this.pushLog("confirmModal.hide() -> exiting");
  },

  onConfirmModalExitComplete() {
    const self = this as unknown as PresencePageHandles;
    self.__confirmModal?.onExitComplete();
  },

  onConfirmModalAttached() {
    this.setData({ modalInstances: this.data.modalInstances + 1 });
    this.pushLog("<confirm-modal> attached()");
  },

  onConfirmModalDetached() {
    this.setData({ modalInstances: Math.max(0, this.data.modalInstances - 1) });
    this.pushLog("<confirm-modal> detached()");
  },

  onConfirmAction() {
    toast.success("Draft deleted");
  },

  // 4. <c-action-sheet> with usePresence
  openActionSheet() {
    const self = this as unknown as PresencePageHandles;
    self.__actionSheet?.show();
    this.pushLog("actionSheet.show()");
  },

  closeActionSheet() {
    const self = this as unknown as PresencePageHandles;
    self.__actionSheet?.hide();
    this.pushLog("actionSheet.hide()");
  },

  onActionSheetExitComplete() {
    const self = this as unknown as PresencePageHandles;
    self.__actionSheet?.onExitComplete();
  },

  // 5. Rapid open -> close -> reopen interruption demo
  testRapidInterrupt() {
    const self = this as unknown as PresencePageHandles;
    if (self.__interruptTimer) clearTimeout(self.__interruptTimer);
    if (self.__reopenTimer) clearTimeout(self.__reopenTimer);

    self.__filterDrawer?.show();
    this.pushLog("Rapid test: show()");

    self.__interruptTimer = setTimeout(() => {
      self.__filterDrawer?.hide();
      this.pushLog("Rapid test: hide() -> exiting");

      self.__reopenTimer = setTimeout(() => {
        self.__filterDrawer?.show();
        this.pushLog("Rapid test: show() mid-exit -> stayed mounted & open");
      }, 100);
    }, 350);
  },
});
