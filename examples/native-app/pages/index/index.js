"use strict";
/// <reference types="miniprogram-api-typings" />
Object.defineProperty(exports, "__esModule", { value: true });
Page({
    data: {
        isDrawerOpen: false,
        placement: "bottom",
        threshold: 80,
        closeOnBackdrop: true,
        isLoadingBtn: false,
        dismissible: true,
        placements: ["bottom", "top", "left", "right"],
    },
    handleButtonTap(e) {
        const variant = e.currentTarget.dataset.variant || "button";
        wx.showToast({
            title: `${variant} tapped`,
            icon: "none",
            duration: 1200,
        });
    },
    handleAsyncAction() {
        this.setData({
            isLoadingBtn: true,
        });
        return new Promise((resolve) => {
            setTimeout(() => {
                wx.showToast({
                    title: "Async action resolved!",
                    icon: "success",
                    duration: 1500,
                });
                resolve();
                this.setData({
                    isLoadingBtn: false,
                });
            }, 2000);
        });
    },
    handleSelectPlacement(e) {
        const placement = e.currentTarget.dataset.placement;
        this.setData({
            placement,
            isDrawerOpen: true,
        });
    },
    handleSelectThreshold(e) {
        const threshold = Number(e.currentTarget.dataset.threshold);
        this.setData({ threshold });
    },
    handleToggleBackdrop(e) {
        this.setData({ closeOnBackdrop: e.detail.value });
    },
    handleToggleDismissible(e) {
        this.setData({ dismissible: e.detail.value });
    },
    handleOpenDrawer() {
        this.setData({ isDrawerOpen: true });
    },
    handleDrawerClose() {
        this.setData({ isDrawerOpen: false });
    },
});
