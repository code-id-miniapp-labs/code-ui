export const drawerComponent = {
  name: "drawer",
  description: "Native WeChat MiniProgram drawer sheet with 60fps swipe-to-dismiss gesture tracking",
  dependencies: ["@code-ui/miniapp", "@code-ui/drawer", "alien-signals"],
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
      content: `<view id="{{drawer.rootProps.id}}" class="cui-drawer-root" data-scope="drawer" data-part="root" data-state="{{drawer.state}}" data-placement="{{drawer.placement}}" wx:if="{{drawer.state !== 'closed'}}">
  <!-- Backdrop Overlay -->
  <view id="{{drawer.backdropProps.id}}" class="cui-drawer-backdrop {{drawer.open ? 'cui-drawer-backdrop--open' : 'cui-drawer-backdrop--closed'}}" data-scope="drawer" data-part="backdrop" data-state="{{drawer.open ? 'open' : 'closed'}}" aria-hidden="{{drawer.backdropProps['aria-hidden']}}" bindtap="handleBackdropTap" catchtouchmove="noop" />

  <!-- Drawer Sheet Content -->
  <view id="{{drawer.contentProps.id}}" class="cui-drawer-content cui-drawer-content--{{drawer.placement}} {{drawer.open ? 'cui-drawer-content--open' : 'cui-drawer-content--closing'}} {{drawer.dragging ? 'cui-drawer-content--dragging' : ''}}" data-scope="drawer" data-part="content" data-state="{{drawer.state}}" data-placement="{{drawer.placement}}" data-dragging="{{drawer.dragging ? 'true' : 'false'}}" role="{{drawer.contentProps.role}}" aria-modal="{{drawer.contentProps['aria-modal']}}" aria-hidden="{{drawer.contentProps['aria-hidden']}}" style="{{drawer.contentProps.style}}">
    <!-- Grabber Handle for gesture swiping -->
    <view id="{{drawer.grabberProps.id}}" class="cui-drawer-grabber" data-scope="drawer" data-part="grabber" wx:if="{{drawer.placement === 'bottom' || drawer.placement === 'top'}}" bindtouchstart="handleTouchStart" catchtouchmove="handleTouchMove" bindtouchend="handleTouchEnd" bindtouchcancel="handleTouchEnd">
      <view class="cui-drawer-grabber-bar" />
    </view>

    <!-- Header Section -->
    <view class="cui-drawer-header" catchtouchmove="noop">
      <view class="cui-drawer-header-content">
        <slot name="header" />
      </view>
      <view id="{{drawer.closeTriggerProps.id}}" class="cui-drawer-close" data-scope="drawer" data-part="close-trigger" aria-label="{{drawer.closeTriggerProps['aria-label']}}" bindtap="handleCloseTap">
        <text class="cui-drawer-close-icon">✕</text>
      </view>
    </view>

    <!-- Body Section (Scroll View) -->
    <scroll-view scroll-y class="cui-drawer-body" enhanced="{{true}}" bounces="{{false}}" show-scrollbar="{{false}}">
      <slot />
    </scroll-view>

    <!-- Footer Section -->
    <view class="cui-drawer-footer" catchtouchmove="noop">
      <slot name="footer" />
    </view>
  </view>
</view>
`,
    },
    {
      name: "index.wxss",
      content: `.cui-drawer-root {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: var(--cui-drawer-z-index, 1000);
  overflow: hidden;
  touch-action: none;
  overscroll-behavior: contain;
}

.cui-drawer-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--cui-drawer-backdrop-bg, rgba(15, 23, 42, 0.65));
  backdrop-filter: blur(var(--cui-drawer-backdrop-blur, 8px));
  -webkit-backdrop-filter: blur(var(--cui-drawer-backdrop-blur, 8px));
  opacity: 0;
  transition: opacity var(--cui-drawer-transition-duration, 280ms) cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity;
  touch-action: none;
  overscroll-behavior: contain;
}

.cui-drawer-backdrop--open {
  opacity: 1;
}

.cui-drawer-backdrop--closed {
  opacity: 0;
}

.cui-drawer-content {
  position: absolute;
  background: var(--cui-drawer-bg, #1e293b);
  color: var(--cui-drawer-color, #f8fafc);
  box-shadow: var(--cui-drawer-shadow, 0 25px 50px -12px rgba(0, 0, 0, 0.5));
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  z-index: calc(var(--cui-drawer-z-index, 1000) + 1);
  transition: transform var(--cui-drawer-transition-duration, 300ms) cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
  overscroll-behavior: contain;
  overscroll-behavior-y: contain;
}

.cui-drawer-content--dragging {
  transition: none !important;
}

.cui-drawer-content--bottom {
  left: 0;
  right: 0;
  bottom: 0;
  max-height: var(--cui-drawer-max-height, 85vh);
  border-top-left-radius: var(--cui-drawer-radius-top, var(--cui-radius-lg, 24rpx));
  border-top-right-radius: var(--cui-drawer-radius-top, var(--cui-radius-lg, 24rpx));
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  transform: translate3d(0, 100%, 0);
  border-top: 1rpx solid var(--cui-drawer-border, rgba(255, 255, 255, 0.1));
}

.cui-drawer-content--bottom.cui-drawer-content--open {
  transform: translate3d(0, 0, 0);
}

.cui-drawer-content--bottom.cui-drawer-content--closing {
  transform: translate3d(0, 100%, 0);
}

.cui-drawer-content--top {
  left: 0;
  right: 0;
  top: 0;
  max-height: var(--cui-drawer-max-height, 85vh);
  border-bottom-left-radius: var(--cui-drawer-radius-bottom, var(--cui-radius-lg, 24rpx));
  border-bottom-right-radius: var(--cui-drawer-radius-bottom, var(--cui-radius-lg, 24rpx));
  padding-top: calc(24rpx + env(safe-area-inset-top));
  transform: translate3d(0, -100%, 0);
  border-bottom: 1rpx solid var(--cui-drawer-border, rgba(255, 255, 255, 0.1));
}

.cui-drawer-content--top.cui-drawer-content--open {
  transform: translate3d(0, 0, 0);
}

.cui-drawer-content--top.cui-drawer-content--closing {
  transform: translate3d(0, -100%, 0);
}

.cui-drawer-content--left {
  top: 0;
  bottom: 0;
  left: 0;
  width: var(--cui-drawer-side-width, 78vw);
  max-width: var(--cui-drawer-side-max-width, 600rpx);
  transform: translate3d(-100%, 0, 0);
  border-right: 1rpx solid var(--cui-drawer-border, rgba(255, 255, 255, 0.1));
  padding-top: calc(20rpx + env(safe-area-inset-top));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.cui-drawer-content--left.cui-drawer-content--open {
  transform: translate3d(0, 0, 0);
}

.cui-drawer-content--left.cui-drawer-content--closing {
  transform: translate3d(-100%, 0, 0);
}

.cui-drawer-content--right {
  top: 0;
  bottom: 0;
  right: 0;
  width: var(--cui-drawer-side-width, 78vw);
  max-width: var(--cui-drawer-side-max-width, 600rpx);
  transform: translate3d(100%, 0, 0);
  border-left: 1rpx solid var(--cui-drawer-border, rgba(255, 255, 255, 0.1));
  padding-top: calc(20rpx + env(safe-area-inset-top));
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
}

.cui-drawer-content--right.cui-drawer-content--open {
  transform: translate3d(0, 0, 0);
}

.cui-drawer-content--right.cui-drawer-content--closing {
  transform: translate3d(100%, 0, 0);
}

.cui-drawer-grabber {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16rpx 0 8rpx 0;
  touch-action: none;
  overscroll-behavior: contain;
}

.cui-drawer-grabber-bar {
  width: var(--cui-drawer-grabber-w, 72rpx);
  height: var(--cui-drawer-grabber-h, 8rpx);
  border-radius: 4rpx;
  background-color: var(--cui-drawer-grabber-bg, rgba(255, 255, 255, 0.25));
}

.cui-drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 36rpx 16rpx 36rpx;
  touch-action: none;
  overscroll-behavior: contain;
}

.cui-drawer-header-content {
  flex: 1;
  font-size: var(--cui-drawer-title-size, 34rpx);
  font-weight: var(--cui-drawer-title-weight, 700);
  color: var(--cui-drawer-title-color, #f1f5f9);
}

.cui-drawer-close {
  width: var(--cui-drawer-close-size, 56rpx);
  height: var(--cui-drawer-close-size, 56rpx);
  border-radius: 50%;
  background: var(--cui-drawer-close-bg, rgba(255, 255, 255, 0.08));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 16rpx;
}

.cui-drawer-close-icon {
  font-size: var(--cui-drawer-close-icon-size, 26rpx);
  color: var(--cui-drawer-close-icon-color, #94a3b8);
  line-height: 1;
}

.cui-drawer-body {
  flex: 1;
  min-height: 0;
  max-height: var(--cui-drawer-body-max-height, 60vh);
  padding: 20rpx 36rpx;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  overscroll-behavior-y: contain;
  touch-action: pan-y;
  font-size: var(--cui-drawer-body-size, 28rpx);
  color: var(--cui-drawer-body-color, #cbd5e1);
  line-height: 1.6;
  box-sizing: border-box;
}

.cui-drawer-footer {
  padding: 20rpx 36rpx 28rpx 36rpx;
  touch-action: none;
  overscroll-behavior: contain;
}
`,
    },
    {
      name: "index.ts",
      content: `import { createMachineBehavior } from "@code-ui/miniapp";
import { drawerMachine, connectDrawer } from "@code-ui/drawer";

const drawerBehavior = createMachineBehavior({
  machine: drawerMachine,
  connect: connectDrawer,
  key: "drawer",
  syncProps: [
    "open",
    "placement",
    "closeOnBackdropClick",
    "dismissible",
    "threshold",
    "duration",
  ],
  exportApi: true,
});

Component({
  behaviors: [drawerBehavior],

  options: {
    multipleSlots: true,
    addGlobalClass: true,
  },

  data: {
    _keyboardHandler: null as any,
  },

  lifetimes: {
    attached() {
      const handler = (
        res: WechatMiniprogram.OnKeyboardHeightChangeListenerResult,
      ) => {
        this.send({ type: "KEYBOARD_CHANGE", height: res.height });
      };
      (this as any)._keyboardHandler = handler;
      if (typeof wx !== "undefined" && wx.onKeyboardHeightChange) {
        wx.onKeyboardHeightChange(handler);
      }
    },
    detached() {
      const handler = (this as any)._keyboardHandler;
      if (handler && typeof wx !== "undefined" && wx.offKeyboardHeightChange) {
        wx.offKeyboardHeightChange(handler);
      }
    },
  },

  properties: {
    open: {
      type: Boolean,
      value: false,
    },
    placement: {
      type: String,
      value: "bottom",
    },
    closeOnBackdropClick: {
      type: Boolean,
      value: true,
    },
    dismissible: {
      type: Boolean,
      value: true,
    },
    threshold: {
      type: Number,
      value: 80,
    },
    duration: {
      type: Number,
      value: undefined,
    },
  },

  methods: {
    noop() {},

    handleBackdropTap() {
      this.send({ type: "BACKDROP.TAP" });
      this.triggerEvent("backdroptap");
    },

    handleCloseTap() {
      this.send({ type: "CLOSE_TRIGGER.TAP" });
      this.triggerEvent("closetap");
    },

    handleTouchStart(e: any) {
      const touch = e.touches[0];
      if (!touch) return;
      this.send({
        type: "SWIPE_START",
        point: { x: touch.clientX, y: touch.clientY },
      });
    },

    handleTouchMove(e: any) {
      const touch = e.touches[0];
      if (!touch) return;
      this.send({
        type: "SWIPE_MOVE",
        point: { x: touch.clientX, y: touch.clientY },
      });
    },

    handleTouchEnd() {
      this.send({ type: "SWIPE_END" });
    },
  },
});
`,
    },
  ],
};
