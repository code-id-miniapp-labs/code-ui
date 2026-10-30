interface AvatarItem {
  id: number;
  src: string;
  alt: string;
}

const SAMPLE_AVATARS: AvatarItem[] = [
  { id: 1, src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix", alt: "Felix" },
  { id: 2, src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka", alt: "Aneka" },
  { id: 3, src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo", alt: "Milo" },
  { id: 4, src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bella", alt: "Bella" },
  { id: 5, src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver", alt: "Oliver" },
  { id: 6, src: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia", alt: "Sophia" },
];

let nextId = 7;

Page({
  data: {
    interactiveMax: 3,
    interactiveAvatars: SAMPLE_AVATARS.slice(0, 5),
  },

  incrementMax() {
    this.setData({
      interactiveMax: this.data.interactiveMax + 1,
    });
  },

  decrementMax() {
    if (this.data.interactiveMax > 0) {
      this.setData({
        interactiveMax: this.data.interactiveMax - 1,
      });
    }
  },

  setPresetMax(e: WechatMiniprogram.CustomEvent) {
    const max = Number(e.currentTarget.dataset.max);
    this.setData({ interactiveMax: max });
  },

  addAvatar() {
    const id = nextId++;
    const newAvatar: AvatarItem = {
      id,
      src: `https://api.dicebear.com/7.x/avataaars/svg?seed=User${id}`,
      alt: `User ${id}`,
    };
    this.setData({
      interactiveAvatars: [...this.data.interactiveAvatars, newAvatar],
    });
  },

  removeAvatar() {
    if (this.data.interactiveAvatars.length > 1) {
      this.setData({
        interactiveAvatars: this.data.interactiveAvatars.slice(0, -1),
      });
    }
  },
});

