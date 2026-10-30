import { computedBehavior, createComponentOptions } from "../_shared/base";
import { resolveSlots } from "../../utils/ui";
import themeConfig from "virtual:cui/theme/avatar";
import { tv } from "../../utils/variants";
import {
  cuiAvatarItemBehavior,
  setupAvatarGroupRelations,
} from "@code-ui/miniapp/behaviors/avatar-group";

const avatarTheme = tv(themeConfig);

const relations: Record<string, WechatMiniprogram.Component.RelationOption> =
  {};
setupAvatarGroupRelations(relations, "child");

Component(
  createComponentOptions({
    options: {
      styleIsolation: "apply-shared",
      virtualHost: true,
    },
    behaviors: [cuiAvatarItemBehavior, computedBehavior],
    relations,
    properties: {
      className: {
        type: String,
        value: "",
      },
      src: {
        type: String,
        value: "",
      },
      alt: {
        type: String,
        value: "",
      },
      mode: {
        type: String,
        value: "aspectFill",
      },
      lazyLoad: {
        type: Boolean,
        value: true,
      },
      color: {
        type: String,
        value: "neutral",
      },
      icon: {
        type: String,
        value: "",
      },
      text: {
        type: String,
        value: "",
      },
      size: {
        type: String,
        value: "md",
      },
      ui: {
        type: Object,
        value: {},
      },
      isGroupCounter: {
        type: Boolean,
        value: false,
      },
    },
    data: {
      imageError: false,
      groupAttached: false,
      groupHidden: false,
      groupOrder: 0,
      groupZIndex: 0,
      groupIsEdge: false,
      groupSize: "",
      groupBaseClass: "",
    },
    computed: {
      classes() {
        const size = this.data.groupSize || this.data.size;
        const ui = this.data.ui;
        const color = this.data.color;
        const theme = avatarTheme({
          size,
          color,
        });

        const resolved = resolveSlots(theme, ui, this.data.className);
        if (this.data.groupAttached && this.data.groupBaseClass) {
          resolved.root = `${this.data.groupBaseClass} ${resolved.root}`.trim();
        }
        return resolved;
      },

      fallbackText() {
        const text = this.data.text || this.data.alt || "";
        if (this.data.isGroupCounter || text.startsWith("+")) {
          return text;
        }

        return text
          .split(" ")
          .map((word) => word.charAt(0))
          .join("")
          .substring(0, 2);
      },

      rootStyle() {
        const styles: string[] = [];
        if (this.data.groupOrder) {
          styles.push(`order: ${this.data.groupOrder};`);
        }
        if (this.data.groupZIndex) {
          styles.push(`z-index: ${this.data.groupZIndex};`);
        }
        if (this.data.groupIsEdge) {
          styles.push("margin-inline-end: 0;");
        }
        return styles.join(" ");
      },
    },
    methods: {
      onImageError() {
        this.setData({ imageError: true });
      },
    },
  }),
);
