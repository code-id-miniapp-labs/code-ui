import { useComponentRef } from "@code-ui/composables";
import type { UseComponentRefReturn } from "@code-ui/composables";
import type { PinInputApi } from "@code-ui/pin-input";
import type { InputApi } from "@code-ui/input";

Page({
  data: {
    // Synced automatically via useComponentRef
    otp: {} as Record<string, any>,
    user: {} as Record<string, any>,
    submitResult: "",
  },

  otpRef: null as UseComponentRefReturn<any, PinInputApi> | null,
  userRef: null as UseComponentRefReturn<any, InputApi> | null,

  onReady() {
    this.otpRef = useComponentRef<PinInputApi>(this, "#otpInput", {
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

    this.userRef = useComponentRef<InputApi>(this, "#userInput", {
      key: "user",
    });
  },

  handleClearOtp() {
    if (this.otpRef) {
      this.otpRef.api.clear?.();
    }
  },

  handleClearUser() {
    if (this.userRef) {
      this.userRef.api.clearValue?.();
    }
  },

  handleSubmit() {
    const otpSnap = this.otpRef?.getSnapshot();
    const userSnap = this.userRef?.getSnapshot();

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
