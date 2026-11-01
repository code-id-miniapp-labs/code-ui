import type { SwipeActionItem, SwipeSide } from "@code-ui/swipe-cell";

interface MessageItem {
  id: number;
  title: string;
  sender: string;
  time: string;
  starred: boolean;
}

Page({
  data: {
    // 1. Single action (right)
    rightSingle: [
      {
        value: "delete",
        text: "Delete",
        className: "bg-red-500 text-white",
        icon: "trash",
      },
    ] as SwipeActionItem[],

    // 2. Multi action (right)
    rightMulti: [
      {
        value: "star",
        text: "Star",
        className: "bg-amber-500 text-white",
        icon: "star",
      },
      {
        value: "delete",
        text: "Delete",
        className: "bg-red-500 text-white",
        icon: "trash",
      },
    ] as SwipeActionItem[],

    // 3. Left action
    leftActions: [
      {
        value: "archive",
        text: "Archive",
        className: "bg-blue-600 text-white",
        icon: "archive",
      },
    ] as SwipeActionItem[],

    // 4. Both sides actions
    bothLeft: [
      {
        value: "read",
        text: "Mark Read",
        className: "bg-emerald-600 text-white",
        icon: "check",
      },
    ] as SwipeActionItem[],
    bothRight: [
      {
        value: "pin",
        text: "Pin",
        className: "bg-indigo-600 text-white",
        icon: "pin",
      },
      {
        value: "delete",
        text: "Delete",
        className: "bg-red-500 text-white",
        icon: "trash",
      },
    ] as SwipeActionItem[],

    // 5. Controlled state
    controlledOpened: null as SwipeSide | boolean | null,
    controlledStatus: "closed",

    // 6. Interactive Message List
    messageList: [
      {
        id: 1,
        title: "Team sync meeting notes attached",
        sender: "Sarah Jenkins",
        time: "10:24 AM",
        starred: false,
      },
      {
        id: 2,
        title: "Design review: SwipeCell Component",
        sender: "Alex Rivera",
        time: "09:15 AM",
        starred: true,
      },
      {
        id: 3,
        title: "Weekly report submission reminder",
        sender: "System Bot",
        time: "Yesterday",
        starred: false,
      },
    ] as MessageItem[],
  },

  onActionClick(e: WechatMiniprogram.CustomEvent) {
    console.log("testing");
    const { action, side } = e.detail;
    wx.showToast({
      title: `${action.text || "Action"} (${side})`,
      icon: "none",
    });
  },

  onControlledOpenChange(e: WechatMiniprogram.CustomEvent) {
    const { opened, side } = e.detail;
    this.setData({
      controlledOpened: side ?? opened,
      controlledStatus: opened ? `open (${side})` : "closed",
    });
  },

  openControlledLeft() {
    this.setData({
      controlledOpened: "left",
      controlledStatus: "open (left)",
    });
  },

  openControlledRight() {
    this.setData({
      controlledOpened: "right",
      controlledStatus: "open (right)",
    });
  },

  closeControlled() {
    this.setData({
      controlledOpened: false,
      controlledStatus: "closed",
    });
  },

  handleListAction(e: WechatMiniprogram.CustomEvent) {
    const { action } = e.detail;
    const itemId = e.currentTarget.dataset.id as number;

    if (action.value === "delete") {
      const filtered = this.data.messageList.filter((msg) => msg.id !== itemId);
      this.setData({ messageList: filtered });
      wx.showToast({ title: "Deleted", icon: "success" });
    } else if (action.value === "star") {
      const updated = this.data.messageList.map((msg) =>
        msg.id === itemId ? { ...msg, starred: !msg.starred } : msg,
      );
      this.setData({ messageList: updated });
      console.log({
        updated,
      });
      wx.showToast({ title: "Updated Star", icon: "none" });
    }
  },
});
