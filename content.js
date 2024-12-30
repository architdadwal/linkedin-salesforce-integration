console.log("Content script loaded on LinkedIn page.");

function extractDataFromLinkedIn() {
  try {
    // Find the name element on the LinkedIn page
    const nameElement = document.querySelector("h1")?.innerText;
    const companyName =
      document.querySelector("button.text-align-left")?.innerText ||
      "Unknown Company";

    // Check if nameElement is found
    if (!nameElement) {
      console.error("Name element not found on LinkedIn page.");
      return null;
    }

    // Split the name into first name and last name
    const nameParts = nameElement.split(" ");

    // Check if the nameParts array has at least two elements
    if (nameParts.length < 2) {
      console.error("Full name does not contain both first and last names.");
      return null;
    }

    const firstName = nameParts[0]; // First part is the first name
    const lastName = nameParts.slice(1).join(" "); // Join the remaining parts as the last name
    const company = companyName;
    const pageURL = window.location.href;

    // Construct and return the extracted data
    const data = {
      FirstName: firstName,
      LastName: lastName,
      Company: company,
      Description: pageURL,
    };

    // Log the extracted data for debugging
    console.log("Extracted LinkedIn data:", data);

    return data;
  } catch (error) {
    console.error("Error extracting LinkedIn data:", error);
    return null;
  }
}

// Call the function to see what data is being extracted
const extractedData = extractDataFromLinkedIn();
console.log("Response from extractDataFromLinkedIn:", extractedData);

// You can also trigger it when receiving a message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrapeLinkedIn") {
    const data = extractDataFromLinkedIn();
    // console.log("Data sent in response to scrapeLinkedIn:", data);
    sendResponse(data);
  }
});

// Listen for messages from popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "scrapeLinkedIn") {
    const data = extractDataFromLinkedIn();
    console.log("Data sent in response to scrapeLinkedIn:", data);
    sendResponse(data);
  }
});

function injectButton() {
  const button = document.createElement("button");
  button.textContent = "Open Lead Creator";

  const data = {
    FirstName: "John",
    LastName: "Doe",
    Company: "Example Company",
    Description: "https://www.linkedin.com/in/johndoe/",
  };
  console.log("Data sent in response to scrapeLinkedIn:", data);
  button.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openPopup", leadData: data });
  });

  document.body.appendChild(button);
}

injectButton();

// /////2222222222222222
// console.log("Content script loaded on LinkedIn page.");

// function extractDataFromLinkedIn() {
//   try {
//     const nameElement = document.querySelector("h1").innerText;
//     const companyName = document.querySelector("button.text-align-left")
//       ? document.querySelector("button.text-align-left").innerText
//       : "Unknown Company";

//     if (!nameElement) {
//       console.error("Name element not found on LinkedIn page.");
//       return null;
//     }

//     const nameParts = nameElement.split(" ");
//     if (nameParts.length < 2) {
//       console.error("Full name does not contain both first and last names.");
//       return null;
//     }

//     const firstName = nameParts[0];
//     const lastName = nameParts.slice(1).join(" ");
//     const company = companyName;
//     const pageURL = window.location.href;

//     return {
//       FirstName: firstName,
//       LastName: lastName,
//       Company: company,
//       Description: pageURL,
//     };
//   } catch (error) {
//     console.error("Error extracting LinkedIn data:", error);
//     return null;
//   }
// }

// function createPopup(data) {
//   const popup = document.createElement("div");
//   popup.style.position = "fixed";
//   popup.style.top = "50%";
//   popup.style.left = "50%";
//   popup.style.transform = "translate(-50%, -50%)";
//   popup.style.backgroundColor = "#fff";
//   popup.style.padding = "20px";
//   popup.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
//   popup.style.borderRadius = "8px";
//   popup.style.zIndex = "9999";

//   popup.innerHTML = `
//     <h2>LinkedIn Data</h2>
//     <p><strong>First Name:</strong> ${data.FirstName}</p>
//     <p><strong>Last Name:</strong> ${data.LastName}</p>
//     <p><strong>Company:</strong> ${data.Company}</p>
//     <p><strong>Page URL:</strong> <a href="${data.Description}" target="_blank">${data.Description}</a></p>
//     <button id="create-lead-btn" style="margin-top: 10px;">Create Lead</button>
//     <button id="closePopup" style="margin-top: 10px;">Close</button>
//   `;

//   document.body.appendChild(popup);

//   // Close Popup
//   document.getElementById("closePopup").addEventListener("click", () => {
//     popup.remove();
//   });

//   // Handle Lead Creation
//   document.getElementById("create-lead-btn").addEventListener("click", () => {
//     // Send message to popup.js to handle lead creation
//     chrome.runtime.sendMessage(
//       { action: "createLead", leadData: data },
//       (response) => {
//         console.log("Response from lead creation:", response);
//       }
//     );
//   });
// }

// function showPopupOnLoad() {
//   const data = extractDataFromLinkedIn();
//   if (data) {
//     createPopup(data);
//   }
// }

// // Automatically display popup when content script loads
// showPopupOnLoad();

// // Listen for messages from the popup script (optional)
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "scrapeLinkedIn") {
//     const data = extractDataFromLinkedIn();
//     sendResponse(data);
//   }
// });
