export default defineBackground(() => {
  console.log('Marx Meter background service worker loaded.');

  // Open side panel on toolbar icon click
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      await browser.sidePanel.open({ tabId: tab.id });
    }
  });
});
