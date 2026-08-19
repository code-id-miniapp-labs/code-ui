export const buttonComponent = {
  name: "button",
  description: "Native WeChat MiniProgram button with loading, variants, and FSM machine integration",
  dependencies: ["@code-ui/miniapp", "@code-ui/button", "alien-signals"],
  files: [
    {
      name: "index.json",
      content: `{
  "component": true,
  "usingComponents": {}
}
`,
    },
    {
      name: "index.wxml",
      content: `<button
  id="{{button.rootProps.id}}"
  class="cui-btn cui-btn--{{button.variant || 'primary'}} cui-btn--{{button.size || 'md'}} {{button.loading ? 'cui-btn--loading' : ''}} {{button.disabled ? 'cui-btn--disabled' : ''}}"
  data-scope="button"
  data-part="root"
  data-state="{{button.state}}"
  data-variant="{{button.variant || 'primary'}}"
  data-size="{{button.size || 'md'}}"
  data-loading="{{button.loading ? 'true' : 'false'}}"
  data-disabled="{{button.disabled ? 'true' : 'false'}}"
  disabled="{{button.disabled || button.loading}}"
  open-type="{{openType}}"
  form-type="{{formType}}"
  hover-class="{{button.disabled || button.loading ? 'none' : 'cui-btn--hover'}}"
  bindtap="handleTap"
  bindgetphonenumber="handleGetPhoneNumber"
  bindchooseavatar="handleChooseAvatar"
>
  <!-- Loading Spinner -->
  <view id="{{button.spinnerProps.id}}" class="cui-btn-spinner" data-scope="button" data-part="spinner" wx:if="{{button.loading}}">
    <view class="cui-btn-spinner-icon" />
  </view>

  <!-- Left Icon Slot -->
  <view id="{{button.iconProps.id}}" class="cui-btn-icon" data-scope="button" data-part="icon" wx:if="{{!button.loading}}">
    <slot name="icon" />
  </view>

  <!-- Label Slot -->
  <view id="{{button.labelProps.id}}" class="cui-btn-label" data-scope="button" data-part="label">
    <slot />
  </view>
</button>
`,
    },
    {
      name: "index.wxss",
      content: `/* ==========================================================================
   Code-UI Button Component Styles (cui-button)
   ========================================================================== */

.cui-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin: 0;
  font-family: inherit;
  font-weight: 600;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border-radius: 16rpx;
  border: 1rpx solid transparent;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.cui-btn::after {
  display: none;
}

/* --- Sizes --- */
.cui-btn--sm {
  height: 64rpx;
  padding: 0 24rpx;
  font-size: 24rpx;
  border-radius: 12rpx;
}

.cui-btn--md {
  height: 84rpx;
  padding: 0 36rpx;
  font-size: 28rpx;
  border-radius: 16rpx;
}

.cui-btn--lg {
  height: 100rpx;
  padding: 0 48rpx;
  font-size: 32rpx;
  border-radius: 20rpx;
}

/* --- Variants --- */
.cui-btn--primary {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #ffffff;
  box-shadow: 0 4rpx 14rpx 0 rgba(99, 102, 241, 0.39);
}

.cui-btn--secondary {
  background: #334155;
  color: #f8fafc;
  border-color: rgba(255, 255, 255, 0.08);
}

.cui-btn--outline {
  background: transparent;
  color: #818cf8;
  border-color: #6366f1;
}

.cui-btn--ghost {
  background: transparent;
  color: #94a3b8;
}

.cui-btn--danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: #ffffff;
  box-shadow: 0 4rpx 14rpx 0 rgba(239, 68, 68, 0.39);
}

/* --- Hover State --- */
.cui-btn--hover {
  opacity: 0.88;
  transform: scale(0.98);
}

/* --- Disabled & Loading State --- */
.cui-btn--disabled,
.cui-btn--loading {
  opacity: 0.55;
  cursor: not-allowed;
  pointer-events: none;
}

/* --- Inner Elements --- */
.cui-btn-label {
  display: inline-flex;
  align-items: center;
}

.cui-btn-icon {
  display: inline-flex;
  align-items: center;
  margin-right: 12rpx;
}

.cui-btn-spinner {
  display: inline-flex;
  align-items: center;
  margin-right: 12rpx;
}

.cui-btn-spinner-icon {
  width: 28rpx;
  height: 28rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: cui-spin 0.65s linear infinite;
}

@keyframes cui-spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
`,
    },
    {
      name: "index.ts",
      content: `import { createMachineBehavior } from "@code-ui/miniapp";
import { buttonMachine, connectButton } from "@code-ui/button";

const buttonBehavior = createMachineBehavior({
  machine: buttonMachine,
  connect: connectButton,
  key: "button",
  syncProps: ["loading", "disabled", "variant", "size", "loadingAuto", "autoResetDuration"],
  exportApi: true,
});

Component({
  behaviors: [buttonBehavior],

  options: {
    multipleSlots: true,
    addGlobalClass: true,
  },

  properties: {
    loading: {
      type: Boolean,
      value: false,
    },
    disabled: {
      type: Boolean,
      value: false,
    },
    variant: {
      type: String,
      value: "primary",
    },
    size: {
      type: String,
      value: "md",
    },
    loadingAuto: {
      type: Boolean,
      value: false,
    },
    autoResetDuration: {
      type: Number,
      value: 1500,
    },
    openType: {
      type: String,
      value: "",
    },
    formType: {
      type: String,
      value: "",
    },
  },

  methods: {
    handleTap(e: any) {
      const buttonData = (this.data as any).button;
      if (buttonData?.disabled || buttonData?.loading) return;
      this.send({ type: "TAP", event: e });
      this.triggerEvent("tap", e);
      this.triggerEvent("click", e);
    },

    handleGetPhoneNumber(e: any) {
      this.triggerEvent("getphonenumber", e.detail);
    },

    handleChooseAvatar(e: any) {
      this.triggerEvent("chooseavatar", e.detail);
    },
  },
});
`,
    },
  ],
};
