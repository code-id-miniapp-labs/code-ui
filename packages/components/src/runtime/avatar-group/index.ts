import { computedBehavior, createComponentOptions } from "../_shared/base";
import { resolveSlots } from "../../utils/ui";
import themeConfig from "virtual:cui/theme/avatar-group";
import { tv } from "../../utils/variants";
import {
  cuiAvatarGroupBehavior,
  setupAvatarGroupRelations,
} from "@code-ui/miniapp/behaviors/avatar-group";

const avatarGroupTheme = tv(themeConfig);

const relations: Record<string, WechatMiniprogram.Component.RelationOption> = {};
setupAvatarGroupRelations(relations, "parent");

Component(
  createComponentOptions({
    options: {
      styleIsolation: "apply-shared",
      virtualHost: true,
    },
    behaviors: [cuiAvatarGroupBehavior, computedBehavior],
    relations,
    properties: {
      className: {
        type: String,
        value: "",
      },
      size: {
        type: String,
        value: "md",
      },
      max: {
        type: Number,
        value: 0,
      },
      ui: {
        type: Object,
        value: {},
      },
    },
    data: {
      totalCount: 0,
      overflowCount: 0,
    },
    computed: {
      classes() {
        return resolveSlots(
          avatarGroupTheme({
            size: this.data.size,
          }),
          this.data.ui,
          this.data.className,
        );
      },
      counterUi() {
        return {
          fallback: this.classes?.counter || "",
        };
      },
    },
  }),
);
