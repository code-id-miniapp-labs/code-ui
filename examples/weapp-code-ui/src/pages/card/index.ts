import { useToast } from "@code-ui/composables";

Page({
  data: {
    variants: ["outline", "soft", "subtle", "solid"] as const,
  },

  onCardAction() {
    useToast(this).success("Card action triggered", {
      description: "Buttons inside footer slot dispatch normally.",
    });
  },
});
