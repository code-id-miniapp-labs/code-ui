Page({
  data: {
    loadingTexts: [
      "Pull to refresh",
      "Release to refresh",
      "Refreshing...",
      "Refresh complete",
    ],
    items: Array.from({ length: 20 }, (_, index) => ({
      id: index + 1,
      title: `List item ${index + 1}`,
      description: "Pull down from the top of the list to refresh.",
    })),
  },
  onRefresh() {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        console.log("refreshed");
        resolve();
      }, 1500);
    });
  },
});
