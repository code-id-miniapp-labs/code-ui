import { computedBehavior, createPageOptions } from "@code-ui/components";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  icon: string;
}

Page(
  createPageOptions({
    behaviors: [computedBehavior],

    data: {
      items: [
        {
          id: "1",
          name: "Mechanical Keyboard",
          price: 129,
          quantity: 1,
          icon: "⌨️",
        },
        {
          id: "2",
          name: "Wireless Gaming Mouse",
          price: 79,
          quantity: 2,
          icon: "🖱️",
        },
        {
          id: "3",
          name: "4K IPS Monitor",
          price: 399,
          quantity: 1,
          icon: "🖥️",
        },
      ] as CartItem[],
      couponCode: "SAVE20",
      couponApplied: true,
      couponDiscountRate: 0.2, // 20% off
      taxRate: 0.08, // 8% tax
      shippingCost: 15,
      freeShippingThreshold: 500,
    },

    computed: {
      // 1. Total items count
      itemCount() {
        console.log("render");
        return (this.data.items as CartItem[]).reduce(
          (acc, item) => acc + item.quantity,
          0,
        );
      },

      // 2. Subtotal before discounts
      subtotal() {
        return (this.data.items as CartItem[]).reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        );
      },

      // 3. Discount calculation
      discountAmount() {
        if (!this.data.couponApplied) return 0;
        const sub = (this.data.items as CartItem[]).reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        );
        return Number((sub * this.data.couponDiscountRate).toFixed(2));
      },

      // 4. Effective shipping fee
      effectiveShipping() {
        const sub = (this.data.items as CartItem[]).reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        );
        return sub >= this.data.freeShippingThreshold
          ? 0
          : this.data.shippingCost;
      },

      // 5. Tax calculation on post-discount amount
      taxAmount() {
        const sub = (this.data.items as CartItem[]).reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        );
        const discount = this.data.couponApplied
          ? sub * this.data.couponDiscountRate
          : 0;
        const taxable = Math.max(0, sub - discount);
        return Number((taxable * this.data.taxRate).toFixed(2));
      },

      // 6. Grand total
      grandTotal() {
        const sub = (this.data.items as CartItem[]).reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        );
        const discount = this.data.couponApplied
          ? sub * this.data.couponDiscountRate
          : 0;
        const shipping =
          sub >= this.data.freeShippingThreshold ? 0 : this.data.shippingCost;
        const taxable = Math.max(0, sub - discount);
        const tax = taxable * this.data.taxRate;
        return Number((taxable + shipping + tax).toFixed(2));
      },

      // 7. Free shipping progress helper
      freeShippingProgress() {
        const sub = (this.data.items as CartItem[]).reduce(
          (acc, item) => acc + item.price * item.quantity,
          0,
        );
        const remaining = Math.max(0, this.data.freeShippingThreshold - sub);
        return {
          qualified: sub >= this.data.freeShippingThreshold,
          remaining: remaining.toFixed(2),
          percentage: Math.min(
            100,
            Math.round((sub / this.data.freeShippingThreshold) * 100),
          ),
        };
      },
    },

    onLoad() {
      console.log("[Skyline Page] Loaded with computedBehavior");
    },

    handleIncreaseQuantity(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
      const id = e.currentTarget.dataset.id;
      const updated = this.data.items.map((item: CartItem) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      );
      this.setData({ items: updated });
    },

    handleDecreaseQuantity(e: WechatMiniprogram.CustomEvent<{ id: string }>) {
      const id = e.currentTarget.dataset.id;
      const updated = this.data.items
        .map((item: CartItem) =>
          item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item: CartItem) => item.quantity > 0);
      this.setData({ items: updated });
    },

    handleToggleCoupon() {
      this.setData({
        couponApplied: !this.data.couponApplied,
      });
    },

    handleAddItem() {
      const newItems = [
        ...this.data.items,
        {
          id: String(Date.now()),
          name: "Noise-Cancelling Headphones",
          price: 199,
          quantity: 1,
          icon: "🎧",
        },
      ];
      this.setData({ items: newItems });
    },
  }),
);
