import { useToast } from "@code-ui/composables";

const toast = useToast();

Page({
  data: {
    variants: ["outline", "soft", "subtle", "solid"] as const,
  },

  onCardAction() {
    toast.success("Card action triggered", {
      description: "Buttons inside footer slot dispatch normally.",
    });
  },
});
