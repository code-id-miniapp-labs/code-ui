import { useComponentRef, useToast, type UseComponentRefReturn } from "@code-ui/composables";

const toast = useToast();

type ModalSize = "xs" | "sm" | "md" | "lg" | "xl";
type CloseMode = "default" | "hidden" | "customIcon" | "props";
type AlertScenario = "confirm" | "destructive" | "success" | "strict";

interface ModalApiShape {
  open: boolean;
  visible: boolean;
  state: "open" | "closed" | "closing";
  setOpen: (open: boolean) => void;
  openModal: () => void;
  closeModal: () => void;
  toggle: () => void;
}

interface FormRef {
  submit?: () => Promise<any>;
  reset?: (name?: string | string[]) => void;
  resetValidation?: (name?: string | string[]) => void;
  setValues?: (values: Record<string, any>) => void;
}

const CLOSE_PROPS_PRESET = {
  icon: "i-lucide-x",
  color: "primary",
  variant: "soft",
  size: "xs",
};

function resolveCloseProp(mode: CloseMode) {
  if (mode === "hidden") return false;
  if (mode === "props") return CLOSE_PROPS_PRESET;
  return true;
}

function resolveCloseIcon(mode: CloseMode) {
  return mode === "customIcon" ? "i-lucide-chevron-down" : "";
}

Page({
  data: {
    // 1. Playground Modal state & configuration
    playgroundOpen: false,
    sizes: ["xs", "sm", "md", "lg", "xl"] as ModalSize[],
    durations: [150, 300, 700] as number[],
    closeModes: [
      { id: "default", label: "Default" },
      { id: "hidden", label: "Hidden" },
      { id: "customIcon", label: "Chevron Icon" },
      { id: "props", label: "Styled Props" },
    ] as { id: CloseMode; label: string }[],

    pgSize: "md" as ModalSize,
    pgFullscreen: false,
    pgScrollable: false,
    pgOverlay: true,
    pgDismissible: true,
    pgTransition: true,
    pgDuration: 300,
    pgCloseMode: "default" as CloseMode,
    pgCloseProp: true as boolean | Record<string, any>,
    pgCloseIcon: "",
    pgLongContent: false,
    pgTitle: "Playground Modal",
    pgDescription:
      "Adjust sizes, scroll behavior, transitions & dismissal options.",

    longScrollItems: Array.from({ length: 16 }, (_, idx) => ({
      id: idx + 1,
      title: `Audit Log Entry #${idx + 1}`,
      meta: `Region ap-southeast-${(idx % 3) + 1} · Verified checksum`,
      desc: "Demonstrates inner <scroll-view> vs outer scrollable container behavior.",
    })),

    // 2. Alert Modals state
    alertOpen: false,
    alertScenario: "confirm" as AlertScenario,
    alertSize: "sm" as ModalSize,
    alertDismissible: true,
    alertCloseOnBackdrop: true,
    alertClose: true as boolean,
    alertTitle: "Archive Project?",
    alertDescription:
      "Members will retain read-only access to archived repositories and logs.",
    alertBodyNote: "You can restore archived projects from workspace settings.",
    alertIcon: "i-lucide-archive",
    alertIconBoxClass: "bg-primary/10 text-primary",
    alertIconColor: "primary",
    alertCancelLabel: "Cancel",
    alertConfirmLabel: "Archive",
    alertConfirmColor: "primary",
    alertShowCancel: true,
    alertSubmitting: false,
    alertUi: {
      header: "border-b-0 px-11 pt-6 pb-2 items-center text-center",
      wrapper: "items-center text-center gap-1.5",
      title: "text-center",
      description: "text-center",
      body: "pt-1 pb-5 text-center text-muted",
      footer: "justify-center",
    },

    // 3. Modal Form state
    formModalOpen: false,
    formSubmitting: false,
    pinModalOpen: false,
    pinSubmitting: false,
    lastFormType: "",
    lastFormStatus: "",
    lastFormOutput: "",

    nameRules: [
      { required: true, message: "Full name is required" },
      { minLength: 2, message: "Enter at least 2 characters" },
    ],
    emailRules: [
      { required: true, message: "Work email is required" },
      { email: true, message: "Enter a valid email address" },
    ],
    roleRules: [{ required: true, message: "Select a workspace role" }],
    pinRules: [
      { required: true, message: "Security PIN is required" },
      { exactLength: 4, message: "PIN must be 4 digits" },
      { numeric: true, message: "Digits only" },
    ],

    roleOptions: [
      { label: "Workspace Admin", value: "admin" },
      { label: "Core Engineer", value: "engineer" },
      { label: "Product Designer", value: "designer" },
      { label: "Read-Only Viewer", value: "viewer" },
    ],
    accessOptions: [
      { label: "Editor", value: "editor" },
      { label: "Maintainer", value: "maintainer" },
      { label: "Billing", value: "billing" },
    ],

    // 4. Slots & UI showcase modals
    customContentOpen: false,
    customHeaderOpen: false,
    headerOnlyOpen: false,
    noFooterOpen: false,
    themedOpen: false,

    themedUi: {
      overlay: "bg-black/55 backdrop-blur-md",
      content: "border-2 border-primary/35 shadow-2xl",
      header: "bg-primary/5 border-b border-primary/20",
      title: "text-primary",
      description: "text-toned",
      body: "bg-default",
      footer: "bg-elevated/70 border-t border-primary/15",
      closeTrigger: "bg-primary/15 text-primary",
    },

    // 5. Imperative useComponentRef snapshot & Lifecycle Event Log
    imperativeSnap: {
      state: "closed",
      open: false,
      visible: false,
    } as Record<string, any>,
    eventLogs: ["Modal page ready — tap any demo above."] as string[],
  },

  imperativeChild: null as UseComponentRefReturn<any, ModalApiShape> | null,
  activeTimers: [] as ReturnType<typeof setTimeout>[],

  onReady() {
    this.imperativeChild = useComponentRef<ModalApiShape>(this, "#imperative-modal", {
      key: "imperativeSnap",
    });
  },

  onUnload() {
    this.imperativeChild?.stop();
    this.imperativeChild = null;
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers = [];
  },

  scheduleTimer(fn: () => void, delayMs: number) {
    const timer = setTimeout(() => {
      this.activeTimers = this.activeTimers.filter((t) => t !== timer);
      fn();
    }, delayMs);
    this.activeTimers.push(timer);
  },

  pushLog(msg: string) {
    const time = new Date().toTimeString().slice(0, 8);
    const entry = `[${time}] ${msg}`;
    this.setData({
      eventLogs: [entry, ...this.data.eventLogs].slice(0, 10),
    });
  },

  clearLogs() {
    this.setData({ eventLogs: ["Event log cleared."] });
  },

  // --- Section 1: Playground Controls ---
  selectPgSize(e: WechatMiniprogram.TouchEvent) {
    const size = e.currentTarget.dataset?.size as ModalSize | undefined;
    if (!size) return;
    this.setData({ pgSize: size });
  },

  selectPgDuration(e: WechatMiniprogram.TouchEvent) {
    const duration = Number(e.currentTarget.dataset?.duration);
    if (Number.isNaN(duration)) return;
    this.setData({ pgDuration: duration });
  },

  selectPgCloseMode(e: WechatMiniprogram.TouchEvent) {
    const mode = e.currentTarget.dataset?.mode as CloseMode | undefined;
    if (!mode) return;
    this.setData({
      pgCloseMode: mode,
      pgCloseProp: resolveCloseProp(mode),
      pgCloseIcon: resolveCloseIcon(mode),
    });
  },

  togglePgFullscreen(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ pgFullscreen: Boolean(e.detail?.checked) });
  },

  togglePgScrollable(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ pgScrollable: Boolean(e.detail?.checked) });
  },

  togglePgOverlay(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ pgOverlay: Boolean(e.detail?.checked) });
  },

  togglePgDismissible(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ pgDismissible: Boolean(e.detail?.checked) });
  },

  togglePgTransition(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ pgTransition: Boolean(e.detail?.checked) });
  },

  togglePgLongContent(e: WechatMiniprogram.CustomEvent<{ checked?: boolean }>) {
    this.setData({ pgLongContent: Boolean(e.detail?.checked) });
  },

  openPlayground() {
    this.setData({ playgroundOpen: true });
    this.pushLog(`open(playground: size=${this.data.pgSize})`);
  },

  closePlayground() {
    this.setData({ playgroundOpen: false });
  },

  confirmPlayground() {
    toast.success("Playground action confirmed");
    this.setData({ playgroundOpen: false });
  },

  openPresetFullscreen() {
    this.setData({
      pgSize: "md",
      pgFullscreen: true,
      pgScrollable: false,
      pgOverlay: true,
      pgDismissible: true,
      pgTransition: true,
      pgLongContent: true,
      pgCloseMode: "default",
      pgCloseProp: true,
      pgCloseIcon: "",
      pgTitle: "Fullscreen Modal Sheet",
      pgDescription: "Slide-up transition with safe-area top & bottom insets.",
      playgroundOpen: true,
    });
    this.pushLog("preset(fullscreen)");
  },

  openPresetOuterScroll() {
    this.setData({
      pgSize: "md",
      pgFullscreen: false,
      pgScrollable: true,
      pgOverlay: true,
      pgDismissible: true,
      pgTransition: true,
      pgLongContent: true,
      pgCloseMode: "default",
      pgCloseProp: true,
      pgCloseIcon: "",
      pgTitle: "Scrollable Container (scrollable=true)",
      pgDescription: "Whole overlay scrolls while modal expands past 85vh.",
      playgroundOpen: true,
    });
    this.pushLog("preset(scrollable=true)");
  },

  openPresetNoOverlay() {
    this.setData({
      pgSize: "sm",
      pgFullscreen: false,
      pgScrollable: false,
      pgOverlay: false,
      pgDismissible: true,
      pgTransition: true,
      pgLongContent: false,
      pgCloseMode: "props",
      pgCloseProp: CLOSE_PROPS_PRESET,
      pgCloseIcon: "",
      pgTitle: "No Backdrop Overlay",
      pgDescription:
        "overlay=false renders floating dialog without dimmed scrim.",
      playgroundOpen: true,
    });
    this.pushLog("preset(overlay=false)");
  },

  openPresetInstant() {
    this.setData({
      pgSize: "md",
      pgFullscreen: false,
      pgScrollable: false,
      pgOverlay: true,
      pgDismissible: true,
      pgTransition: false,
      pgLongContent: false,
      pgCloseMode: "customIcon",
      pgCloseProp: true,
      pgCloseIcon: "i-lucide-chevron-down",
      pgTitle: "Instant Modal (transition=false)",
      pgDescription:
        "Skips closing state & enter/leave animations immediately.",
      playgroundOpen: true,
    });
    this.pushLog("preset(transition=false)");
  },

  onPlaygroundOpenChange(e: WechatMiniprogram.CustomEvent<{ open?: boolean }>) {
    const open = Boolean(e.detail?.open);
    this.setData({ playgroundOpen: open });
    this.pushLog(`playground.openChange(${open})`);
  },

  // --- Section 2: Alert Modals ---
  openConfirmAlert() {
    this.setData({
      alertScenario: "confirm",
      alertSize: "sm",
      alertDismissible: true,
      alertCloseOnBackdrop: true,
      alertClose: true,
      alertSubmitting: false,
      alertTitle: "Archive Project?",
      alertDescription:
        "Members keep read-only access to archived repositories and logs.",
      alertBodyNote: "You can restore this project anytime from settings.",
      alertIcon: "i-lucide-archive",
      alertIconBoxClass: "bg-primary/10",
      alertIconColor: "primary",
      alertCancelLabel: "Cancel",
      alertConfirmLabel: "Archive",
      alertConfirmColor: "primary",
      alertShowCancel: true,
      alertOpen: true,
    });
    this.pushLog("open(alert:confirm)");
  },

  openDestructiveAlert() {
    this.setData({
      alertScenario: "destructive",
      alertSize: "xs",
      alertDismissible: false,
      alertCloseOnBackdrop: false,
      alertClose: false,
      alertSubmitting: false,
      alertTitle: "Delete Workspace?",
      alertDescription:
        "Permanently deletes 14 projects, 32 API keys, and billing history.",
      alertBodyNote:
        "Non-dismissible (dismissible=false, close=false) with async confirm.",
      alertIcon: "i-lucide-trash",
      alertIconBoxClass: "bg-danger/10",
      alertIconColor: "danger",
      alertCancelLabel: "Keep",
      alertConfirmLabel: "Delete",
      alertConfirmColor: "danger",
      alertShowCancel: true,
      alertOpen: true,
    });
    this.pushLog("open(alert:destructive)");
  },

  openSuccessAlert() {
    this.setData({
      alertScenario: "success",
      alertSize: "sm",
      alertDismissible: true,
      alertCloseOnBackdrop: true,
      alertClose: false,
      alertSubmitting: false,
      alertTitle: "Deployment Live",
      alertDescription:
        "Release v2.4.0 passed health checks across all production regions.",
      alertBodyNote: "Zero downtime · Rollback snapshot #418 saved.",
      alertIcon: "i-lucide-circle-check",
      alertIconBoxClass: "bg-success/10",
      alertIconColor: "success",
      alertCancelLabel: "",
      alertConfirmLabel: "Done",
      alertConfirmColor: "success",
      alertShowCancel: false,
      alertOpen: true,
    });
    this.pushLog("open(alert:success)");
  },

  openStrictNoticeAlert() {
    this.setData({
      alertScenario: "strict",
      alertSize: "sm",
      alertDismissible: true,
      alertCloseOnBackdrop: false,
      alertClose: true,
      alertSubmitting: false,
      alertTitle: "Session Expiring Soon",
      alertDescription:
        "closeOnBackdropClick=false blocks backdrop taps, while X or button closes.",
      alertBodyNote: "Tap the dimmed backdrop to test bind:closePrevent.",
      alertIcon: "i-lucide-shield-alert",
      alertIconBoxClass: "bg-warning/10",
      alertIconColor: "warning",
      alertCancelLabel: "Log Out",
      alertConfirmLabel: "Stay Signed In",
      alertConfirmColor: "warning",
      alertShowCancel: true,
      alertOpen: true,
    });
    this.pushLog("open(alert:strict-backdrop)");
  },

  onAlertOpenChange(e: WechatMiniprogram.CustomEvent<{ open?: boolean }>) {
    const open = Boolean(e.detail?.open);
    this.setData({ alertOpen: open });
    this.pushLog(`alert.openChange(${open})`);
  },

  closeAlertModal() {
    if (this.data.alertSubmitting) return;
    this.setData({ alertOpen: false });
  },

  confirmAlertModal() {
    if (this.data.alertSubmitting) return;

    if (this.data.alertScenario === "destructive") {
      this.setData({ alertSubmitting: true });
      this.pushLog("alert.asyncDelete(start)");
      this.scheduleTimer(() => {
        this.setData({
          alertSubmitting: false,
          alertOpen: false,
        });
        this.pushLog("alert.asyncDelete(done)");
        toast.success("Workspace deleted", {
          description: "All workspace resources were removed.",
        });
      }, 1100);
      return;
    }

    const messageMap: Record<AlertScenario, string> = {
      confirm: "Project archived",
      destructive: "Workspace deleted",
      success: "Deployment acknowledged",
      strict: "Session extended for 30 minutes",
    };

    this.setData({ alertOpen: false });
    toast.success(messageMap[this.data.alertScenario]);
  },

  // --- Section 3: Modal Form ---
  openInviteFormModal() {
    this.setData({
      formSubmitting: false,
      formModalOpen: true,
    });
    this.pushLog("open(modal-form:invite)");
  },

  onFormModalOpenChange(e: WechatMiniprogram.CustomEvent<{ open?: boolean }>) {
    const open = Boolean(e.detail?.open);
    this.setData({ formModalOpen: open });
    this.pushLog(`inviteFormModal.openChange(${open})`);
  },

  closeInviteFormModal() {
    if (this.data.formSubmitting) return;
    this.setData({ formModalOpen: false });
  },

  getInviteForm(): FormRef | null {
    return this.selectComponent("#modal-invite-form") as FormRef | null;
  },

  fillInviteForm() {
    this.getInviteForm()?.setValues?.({
      fullName: "Alice Wang",
      email: "alice@code-ui.dev",
      role: "engineer",
      access: "maintainer",
      notes: "Welcome to the MiniProgram design systems team!",
      sendInvite: true,
    });
  },

  resetInviteForm() {
    this.getInviteForm()?.reset?.();
  },

  submitInviteForm() {
    if (this.data.formSubmitting) return;
    this.getInviteForm()?.submit?.();
  },

  onInviteFormSubmit(e: WechatMiniprogram.CustomEvent<{ values?: unknown }>) {
    const values = e.detail?.values ?? {};
    this.setData({ formSubmitting: true });
    this.pushLog("inviteForm.submit(valid)");

    this.scheduleTimer(() => {
      this.setData({
        formSubmitting: false,
        formModalOpen: false,
        lastFormType: "Invite Member Form",
        lastFormStatus: "Submitted",
        lastFormOutput: JSON.stringify(values),
      });
      toast.success("Invitation sent", {
        description: "Team member invite dispatched successfully.",
      });
    }, 700);
  },

  onInviteFormError(
    e: WechatMiniprogram.CustomEvent<{ errorBag?: Record<string, unknown> }>,
  ) {
    const fields = Object.keys(e.detail?.errorBag ?? {});
    this.pushLog(`inviteForm.error(${fields.join(",")})`);
    this.setData({
      lastFormType: "Invite Member Form",
      lastFormStatus: "Validation Error",
      lastFormOutput: `Check fields: ${fields.join(", ")}`,
    });
  },

  openPinFormModal() {
    this.setData({
      pinSubmitting: false,
      pinModalOpen: true,
    });
    this.pushLog("open(modal-form:pin)");
  },

  onPinModalOpenChange(e: WechatMiniprogram.CustomEvent<{ open?: boolean }>) {
    const open = Boolean(e.detail?.open);
    this.setData({ pinModalOpen: open });
    this.pushLog(`pinFormModal.openChange(${open})`);
  },

  closePinFormModal() {
    if (this.data.pinSubmitting) return;
    this.setData({ pinModalOpen: false });
  },

  submitPinForm() {
    if (this.data.pinSubmitting) return;
    const form = this.selectComponent("#modal-pin-form") as FormRef | null;
    form?.submit?.();
  },

  onPinFormSubmit(
    e: WechatMiniprogram.CustomEvent<{ values?: { pin?: string } }>,
  ) {
    const values = e.detail?.values ?? {};
    this.setData({ pinSubmitting: true });
    this.pushLog("pinForm.submit(valid)");

    this.scheduleTimer(() => {
      this.setData({
        pinSubmitting: false,
        pinModalOpen: false,
        lastFormType: "Security PIN Form",
        lastFormStatus: "Verified",
        lastFormOutput: JSON.stringify(values),
      });
      toast.success("Security PIN verified");
    }, 500);
  },

  onPinFormError() {
    this.pushLog("pinForm.error(pin)");
  },

  // --- Section 4: Slots & UI Overrides ---
  closeTriggerModalImperative() {
    const modal = this.selectComponent(
      "#trigger-modal",
    ) as unknown as ModalApiShape | null;
    modal?.closeModal?.();
  },

  confirmTriggerModal() {
    toast.success("Uncontrolled modal confirmed");
    this.closeTriggerModalImperative();
  },

  openCustomContentModal() {
    this.setData({ customContentOpen: true });
    this.pushLog("open(slot:content)");
  },

  closeCustomContentModal() {
    this.setData({ customContentOpen: false });
  },

  onCustomContentOpenChange(
    e: WechatMiniprogram.CustomEvent<{ open?: boolean }>,
  ) {
    this.setData({ customContentOpen: Boolean(e.detail?.open) });
  },

  openCustomHeaderModal() {
    this.setData({ customHeaderOpen: true });
    this.pushLog("open(slot:header)");
  },

  closeCustomHeaderModal() {
    this.setData({ customHeaderOpen: false });
  },

  onCustomHeaderOpenChange(
    e: WechatMiniprogram.CustomEvent<{ open?: boolean }>,
  ) {
    this.setData({ customHeaderOpen: Boolean(e.detail?.open) });
  },

  openHeaderOnlyModal() {
    this.setData({ headerOnlyOpen: true });
    this.pushLog("open(hasBody:false)");
  },

  closeHeaderOnlyModal() {
    this.setData({ headerOnlyOpen: false });
  },

  onHeaderOnlyOpenChange(e: WechatMiniprogram.CustomEvent<{ open?: boolean }>) {
    this.setData({ headerOnlyOpen: Boolean(e.detail?.open) });
  },

  openNoFooterModal() {
    this.setData({ noFooterOpen: true });
    this.pushLog("open(fullscreen+hasFooter:false)");
  },

  onNoFooterOpenChange(e: WechatMiniprogram.CustomEvent<{ open?: boolean }>) {
    this.setData({ noFooterOpen: Boolean(e.detail?.open) });
  },

  openThemedModal() {
    this.setData({ themedOpen: true });
    this.pushLog("open(ui-override)");
  },

  closeThemedModal() {
    this.setData({ themedOpen: false });
  },

  onThemedOpenChange(e: WechatMiniprogram.CustomEvent<{ open?: boolean }>) {
    this.setData({ themedOpen: Boolean(e.detail?.open) });
  },

  // --- Section 5: Imperative API & Shared Lifecycle Loggers ---
  callOpenModal() {
    this.imperativeChild?.api.openModal?.();
  },

  callCloseModal() {
    this.imperativeChild?.api.closeModal?.();
  },

  callToggleModal() {
    this.imperativeChild?.api.toggle?.();
  },

  callSetOpenTrue() {
    this.imperativeChild?.api.setOpen?.(true);
  },

  callSetOpenFalse() {
    this.imperativeChild?.api.setOpen?.(false);
  },

  onModalEnter() {
    this.pushLog("event: enter");
  },

  onModalAfterEnter() {
    this.pushLog("event: afterEnter");
  },

  onModalLeave() {
    this.pushLog("event: leave");
  },

  onModalAfterLeave() {
    this.pushLog("event: afterLeave");
  },

  onModalCloseEvent() {
    this.pushLog("event: close");
  },

  onModalClosePrevent() {
    this.pushLog("event: closePrevent (backdrop blocked)");
    toast.warning("Backdrop dismissal blocked", {
      description: "Use the action buttons to close this modal.",
      duration: 1800,
    });
  },

  onModalOverlayTap() {
    this.pushLog("event: overlayTap");
  },

  onModalCloseTriggerTap() {
    this.pushLog("event: closeTriggerTap");
  },

  onUncontrolledOpenChange(
    e: WechatMiniprogram.CustomEvent<{ open?: boolean }>,
  ) {
    this.pushLog(`uncontrolled.openChange(${Boolean(e.detail?.open)})`);
  },
});
