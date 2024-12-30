chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    /^https:\/\/www\.linkedin\.com\/in\//.test(tab.url)
  ) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ["content.js"],
      },
      () => {
        if (chrome.runtime.lastError) {
          console.error(
            "Failed to inject content script:",
            chrome.runtime.lastError.message
          );
        } else {
          console.log("Content script injectediiiiiiiiiiiiiiiiiiiii.");
          chrome.windows.create({
            url: "popup.html",
            type: "popup",
            width: 400, // Adjust the width as needed
            height: 300, // Adjust the height as needed
          });
        }
      }
    );
  }
});

// ... (Your existing background.js code) ...

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openPopup") {
    console.log("Content script injected nowwwwwwwwwwwwwwwwwwwwwwwwww.");
    chrome.windows.create({
      url: "popup.html",
      type: "popup",
      width: 400,
      height: 300,
    });
  }
  // ... (other message handling) ...
});
