import { useToast } from "@code-ui/composables";

const toast = useToast({
  max: 2,
});

Page({
  data: {},

  showDefaultPrimary() {
    toast.show({
      title: "Event added to calendar",
      description: "This event is scheduled for Mar 19, 2027.",
      icon: "i-lucide-calendar",
      color: "neutral",
      mode: "default",
    });
  },

  showDefaultSuccess() {
    console.log();
    toast.success("Profile saved successfully", {
      description: "Your settings have been synced to the server.",
    });
  },

  showDefaultError() {
    toast.error("Upload failed", {
      description: "File size exceeds 10MB limit.",
    });
  },

  showDefaultWarning() {
    toast.warning("Network connection unstable", {
      description: "Retrying in 5 seconds...",
    });
  },

  showDefaultInfo() {
    toast.info("Scheduled maintenance", {
      description: "Server restart tonight at 02:00 UTC.",
    });
  },

  showWithAction() {
    toast.show({
      title: "Conversation moved to trash",
      mode: "default",
      actions: [
        {
          label: "Undo",
          color: "primary",
          variant: "outline",
          onClick: () => {
            wx.showToast({ title: "Restored", icon: "none" });
          },
        },
      ],
    });
  },

  showNativeSuccess() {
    toast.show({
      title: "Completed",
      icon: "check",
      mode: "native",
      placement: "center",
      duration: 2500,
    });
  },

  showNativeError() {
    toast.show({
      title: "Failed",
      icon: "close",
      mode: "native",
      placement: "center",
      duration: 2500,
    });
  },

  showNativeLoading() {
    const id = toast.show({
      title: "Loading...",
      icon: "loading",
      mode: "native",
      placement: "center",
      duration: 2500,
      ui: {
        icon: "animate-spin",
      },
    });
    setTimeout(() => {
      toast.update(id, {
        title: "Loaded!",
        icon: "check",
        duration: 1500,
        ui: {
          icon: "",
        },
      });
    }, 1500);
  },

  showNativeBottomPill() {
    toast.show({
      title: "Link copied to clipboard",
      icon: "check",
      mode: "native",
      orientation: "horizontal",
      placement: "bottom",
      duration: 2500,
    });
  },

  showNativeTopPill() {
    toast.show({
      title: "Muted notifications",
      icon: "info",
      mode: "native",
      orientation: "horizontal",
      placement: "top",
      duration: 2500,
    });
  },

  clearAllToasts() {
    toast.clear();
  },
});
