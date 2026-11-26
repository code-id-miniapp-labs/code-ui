import {
  useToast,
  useTour,
  type TourStepDetails,
  type UseTourReturn,
} from "@code-id-labs/composables";

const toast = useToast();

const MAIN_STEPS: TourStepDetails[] = [
  {
    id: "welcome",
    type: "dialog",
    badge: "Welcome",
    title: "Meet Code UI Tour",
    description:
      "Guide users step by step across your MiniProgram with centered dialogs, spotlight tooltips, floating cards, and interactive wait steps.",
    actions: [
      { label: "Skip", action: "skip", variant: "ghost", color: "neutral" },
      { label: "Start Tour", action: "next", trailingIcon: "i-lucide-arrow-right" },
    ],
  },
  {
    id: "hero",
    type: "tooltip",
    target: "#tour-hero-cta",
    badge: "Step 2",
    title: "Launch with useTour()",
    description:
      "Drive tours cleanly from page scripts with useTour({ target: this, selector: '#main-tour' }) — no manual selectComponent boilerplate.",
    placement: "bottom",
  },
  {
    id: "search",
    type: "tooltip",
    target: "#tour-search-box",
    badge: "Step 3",
    title: "Spotlight Cutout",
    description:
      "The spotlight auto-detects each target's border-radius so cards stay rounded and sharp boxes stay crisp.",
    placement: "bottom",
  },
  {
    id: "quick-stats",
    type: "tooltip",
    target: "#tour-quick-stats",
    badge: "Step 4",
    title: "Smart Placement",
    description:
      "Tooltips support top, bottom, left, right, and start/end alignments with automatic viewport collision handling.",
    placement: "top",
  },
  {
    id: "floating-tip",
    type: "floating",
    badge: "Floating Card",
    title: "Viewport-Docked Tips",
    description:
      "Use type: 'floating' for non-anchored tips docked cleanly above the safe-area edge without spotlighting a specific node.",
    placement: "bottom",
  },
  {
    id: "finish-target",
    type: "tooltip",
    target: "#tour-finish-card",
    badge: "Final Step",
    title: "Auto-Scroll & Flip",
    description:
      "Off-screen elements scroll smoothly into view and flip placement automatically so the card never clips.",
    placement: "bottom",
  },
];

const WAIT_STEPS: TourStepDetails[] = [
  {
    id: "wait-tap",
    type: "wait",
    target: "#tour-wait-btn",
    badge: "Action Required",
    title: "Tap the Highlighted Button",
    description:
      "This wait step keeps the target interactive. Tap the blue button inside the spotlight to advance.",
    placement: "bottom",
    preventInteraction: false,
    actions: [{ label: "Cancel", action: "dismiss", variant: "ghost", color: "neutral" }],
  },
  {
    id: "wait-done",
    type: "dialog",
    badge: "Nice!",
    title: "Interactive Step Completed",
    description:
      "Calling waitTour.next() from your page handler seamlessly advances wait steps to the next stage.",
    actions: [{ label: "Done", action: "next" }],
  },
];

interface TourPageContext {
  mainTour?: UseTourReturn | undefined;
  waitTour?: UseTourReturn | undefined;
}

Page({
  data: {
    mainTourState: {
      steps: MAIN_STEPS,
      status: "idle",
      completed: false,
    },
    waitSteps: WAIT_STEPS,
    tourColor: "primary",
    colorOptions: ["primary", "secondary", "info", "success", "warning", "neutral"],
    progressVariant: "dots" as "dots" | "text",
    preventInteraction: false,
    query: "",
    tapCount: 0,
  },

  onLoad() {
    const self = this as unknown as TourPageContext;

    self.mainTour = useTour({
      target: this,
      selector: "#main-tour",
      key: "mainTourState",
      steps: MAIN_STEPS,
      storageKey: "code_ui_demo_tour_completed",
      onComplete: () => {
        toast.add({
          title: "Tour completed!",
          description: "Saved completion state via useTour storageKey.",
          color: "success",
          variant: "soft",
          icon: "i-lucide-check-circle-2",
          duration: 2200,
        });
      },
      onSkip: () => {
        toast.add({
          title: "Tour skipped",
          description: "You can restart the walkthrough anytime.",
          color: "neutral",
          variant: "soft",
          duration: 1800,
        });
      },
    });

    self.waitTour = useTour({
      target: this,
      selector: "#wait-tour",
      steps: WAIT_STEPS,
    });
  },

  onUnload() {
    const self = this as unknown as TourPageContext;
    self.mainTour?.stop();
    self.waitTour?.stop();
  },

  startMainTour() {
    (this as unknown as TourPageContext).mainTour?.start();
  },

  startOnceTour() {
    const started = (this as unknown as TourPageContext).mainTour?.startOnce();
    if (!started) {
      toast.add({
        title: "Already completed",
        description: "startOnce() skipped because completion is saved. Tap Reset to test again.",
        color: "info",
        variant: "soft",
        duration: 2400,
      });
    }
  },

  resetTourStorage() {
    (this as unknown as TourPageContext).mainTour?.resetCompleted();
    toast.add({
      title: "Completion reset",
      description: "startOnce() will launch the tour again.",
      color: "neutral",
      variant: "soft",
      duration: 1800,
    });
  },

  startFromStats() {
    (this as unknown as TourPageContext).mainTour?.start("quick-stats");
  },

  startWaitTour() {
    (this as unknown as TourPageContext).waitTour?.start();
  },

  onWaitTargetTap() {
    this.setData({ tapCount: this.data.tapCount + 1 });
    const waitTour = (this as unknown as TourPageContext).waitTour;
    if (waitTour?.open && waitTour.stepId === "wait-tap") {
      waitTour.next();
    }
  },

  onSelectColor(e: WechatMiniprogram.TouchEvent) {
    const color = e.currentTarget.dataset?.color as string | undefined;
    if (color) {
      this.setData({ tourColor: color });
    }
  },

  onToggleProgressVariant(e: WechatMiniprogram.CustomEvent<{ checked: boolean }>) {
    this.setData({
      progressVariant: e.detail?.checked ? "text" : "dots",
    });
  },

  onTogglePreventInteraction(e: WechatMiniprogram.CustomEvent<{ checked: boolean }>) {
    this.setData({
      preventInteraction: Boolean(e.detail?.checked),
    });
  },

  onQueryChange(e: WechatMiniprogram.CustomEvent<{ value: string }>) {
    this.setData({ query: e.detail?.value ?? "" });
  },

  onQueryClear() {
    this.setData({ query: "" });
  },
});
