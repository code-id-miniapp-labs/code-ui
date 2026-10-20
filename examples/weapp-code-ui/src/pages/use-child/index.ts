import { useChild } from "@code-ui/composables";
import type { UseChildReturn } from "@code-ui/composables";
import type { PinInputApi } from "@code-ui/pin-input";
import type { InputApi } from "@code-ui/input";

Page({
  data: {
    // Synced automatically via useChild
    otp: {} as Record<string, any>,
    user: {} as Record<string, any>,
    submitResult: "",
  },

  otpChild: null as UseChildReturn<any, PinInputApi> | null,
  userChild: null as UseChildReturn<any, InputApi> | null,

  onReady() {
    this.otpChild = useChild<PinInputApi>(this, "#otpInput", {
      key: "otp",
      onChange: (snapshot) => {
        if (snapshot.isValueComplete) {
          wx.showToast({
            title: "Code Complete!",
            icon: "success",
            duration: 1500,
          });
        }
      },
    });

    this.userChild = useChild<InputApi>(this, "#userInput", {
      key: "user",
    });
  },

  handleClearOtp() {
    if (this.otpChild) {
      this.otpChild.api.clear?.();
    }
  },

  handleClearUser() {
    if (this.userChild) {
      this.userChild.api.clearValue?.();
    }
  },

  handleSubmit() {
    const otpSnap = this.otpChild?.getSnapshot();
    const userSnap = this.userChild?.getSnapshot();

    const otpValue = Array.isArray(otpSnap?.value)
      ? otpSnap?.value.join("")
      : String(otpSnap?.value ?? "");

    const username = String(userSnap?.value ?? "");

    if (!username) {
      wx.showToast({ title: "Enter username", icon: "none" });
      return;
    }

    if (!otpSnap?.isValueComplete) {
      wx.showToast({ title: "Complete 4-digit OTP", icon: "none" });
      return;
    }

    console.log(this.data.submitResult);

    this.setData({
      submitResult: `Verified: User "${username}" with PIN: ${otpValue}`,
    });
  },
});
