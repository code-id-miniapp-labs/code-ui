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
  hover-class="{{hoverClass || (button.disabled || button.loading ? 'none' : 'cui-btn--hover')}}"
  hover-start-time="{{hoverStartTime}}"
  hover-stay-time="{{hoverStayTime}}"
  hover-stop-propagation="{{hoverStopPropagation}}"
  lang="{{lang}}"
  session-from="{{sessionFrom}}"
  send-message-title="{{sendMessageTitle}}"
  send-message-path="{{sendMessagePath}}"
  send-message-img="{{sendMessageImg}}"
  show-message-card="{{showMessageCard}}"
  app-parameter="{{appParameter}}"
  catchtap="handleTap"
  bindgetphonenumber="handleGetPhoneNumber"
  bindchooseavatar="handleChooseAvatar"
  bindcontact="handleContact"
  binderror="handleError"
  bindopensetting="handleOpenSetting"
  bindlaunchapp="handleLaunchApp"
  bindagreeprivacyauthorization="handleAgreePrivacyAuthorization"
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
      content: `.cui-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  margin: 0;
  font-family: inherit;
  font-weight: var(--cui-btn-font-weight, 600);
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border-radius: var(--cui-btn-radius, var(--cui-radius-md, 16rpx));
  border: 1rpx solid transparent;
  transition: all var(--cui-transition-duration, 180ms) cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.cui-btn::after {
  display: none;
}

.cui-btn--sm {
  height: var(--cui-btn-h-sm, 64rpx);
  padding: 0 var(--cui-btn-px-sm, 24rpx);
  font-size: var(--cui-btn-font-sm, 24rpx);
  border-radius: var(--cui-btn-radius-sm, var(--cui-radius-sm, 12rpx));
}

.cui-btn--md {
  height: var(--cui-btn-h-md, 84rpx);
  padding: 0 var(--cui-btn-px-md, 36rpx);
  font-size: var(--cui-btn-font-md, 28rpx);
  border-radius: var(--cui-btn-radius-md, var(--cui-radius-md, 16rpx));
}

.cui-btn--lg {
  height: var(--cui-btn-h-lg, 100rpx);
  padding: 0 var(--cui-btn-px-lg, 48rpx);
  font-size: var(--cui-btn-font-lg, 32rpx);
  border-radius: var(--cui-btn-radius-lg, var(--cui-radius-lg, 20rpx));
}

.cui-btn--primary {
  background: var(--cui-btn-primary-bg, var(--cui-primary-gradient, linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)));
  color: var(--cui-btn-primary-color, #ffffff);
  box-shadow: var(--cui-btn-primary-shadow, 0 4rpx 14rpx 0 rgba(99, 102, 241, 0.39));
}

.cui-btn--secondary {
  background: var(--cui-btn-secondary-bg, #334155);
  color: var(--cui-btn-secondary-color, #f8fafc);
  border-color: var(--cui-btn-secondary-border, rgba(255, 255, 255, 0.08));
}

.cui-btn--outline {
  background: var(--cui-btn-outline-bg, transparent);
  color: var(--cui-btn-outline-color, #818cf8);
  border-color: var(--cui-btn-outline-border, #6366f1);
}

.cui-btn--ghost {
  background: var(--cui-btn-ghost-bg, transparent);
  color: var(--cui-btn-ghost-color, #94a3b8);
}

.cui-btn--danger {
  background: var(--cui-btn-danger-bg, var(--cui-danger-gradient, linear-gradient(135deg, #ef4444 0%, #dc2626 100%)));
  color: var(--cui-btn-danger-color, #ffffff);
  box-shadow: var(--cui-btn-danger-shadow, 0 4rpx 14rpx 0 rgba(239, 68, 68, 0.39));
}

.cui-btn--hover {
  opacity: var(--cui-btn-hover-opacity, 0.88);
  transform: var(--cui-btn-hover-transform, scale(0.98));
}

.cui-btn--disabled,
.cui-btn--loading {
  opacity: var(--cui-btn-disabled-opacity, 0.55);
  cursor: not-allowed;
  pointer-events: none;
}

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
  width: var(--cui-btn-spinner-size, 28rpx);
  height: var(--cui-btn-spinner-size, 28rpx);
  border: 3rpx solid var(--cui-btn-spinner-border, rgba(255, 255, 255, 0.3));
  border-top-color: var(--cui-btn-spinner-head, #ffffff);
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
      content: `import { createMachineBehavior, wxButtonBehavior, createProperties } from "@code-ui/miniapp";
import { buttonMachine, connectButton, defaultButtonProps } from "@code-ui/button";

const buttonBehavior = createMachineBehavior({
  machine: buttonMachine,
  connect: connectButton,
  key: "button",
  exportApi: true,
});

Component({
  behaviors: [buttonBehavior, wxButtonBehavior],

  options: {
    multipleSlots: true,
    addGlobalClass: true,
  },

  properties: createProperties(defaultButtonProps),

  methods: {
    handleTap(e: any) {
      const buttonData = (this.data as any).button;
      if (buttonData?.disabled || buttonData?.loading) return;
      this.send({ type: "TAP", event: e });
    },
  },
});
`,
    },
  ],
};
