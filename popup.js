// Helper functions to interact with Chrome storage

// Function to set the token in localStorage
function setToken(token) {
  localStorage.setItem("salesforceAccessToken", token);
  console.log("Access token saved in localStorage:", token);
}

// Function to get the token from localStorage
function getToken() {
  const token = localStorage.getItem("salesforceAccessToken");
  console.log("Retrieved access token from localStorage:", token);
  return token;
}
// Function to remove tokens (for invalidation handling)
function clearTokens() {
  localStorage.removeItem("salesforceAccessToken");
  localStorage.removeItem("salesforceRefreshToken");
  console.log("Tokens removed from localStorage.");
}

// Function to authenticate and get a Salesforce token
async function getSalesforceToken() {
  return new Promise((resolve, reject) => {
    console.log("Starting Salesforce authentication...");

    const authUrl =
      "https://login.salesforce.com/services/oauth2/authorize?response_type=token&client_id=3MVG9Ijq7vc89psp_EimzqTDeKAK7tPRzO_dSVSKCI1LMiIIakgbB28omiRhF1_ZjVdjk1C1VSCYynx987S3o&redirect_uri=https://glpnkpnbamkekpcmpjppapgdiepekemo.chromiumapp.org/";

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          console.error(
            "Error during authentication:",
            chrome.runtime.lastError || "Redirect URL is empty."
          );
          return reject(
            new Error(
              "Authorization failed: " +
                (chrome.runtime.lastError?.message || "Unknown error")
            )
          );
        }

        try {
          const url = new URL(redirectUrl);
          const hashParams = new URLSearchParams(url.hash.substring(1));
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (!accessToken) {
            console.error("Access token not found in redirect URL.");
            return reject(new Error("Authorization failed: No access token."));
          }

          setToken(accessToken); // Save token in localStorage
          if (refreshToken) setRefreshToken(refreshToken);
          resolve(accessToken);
        } catch (error) {
          console.error("Error parsing redirect URL:", error);
          reject(new Error("Authorization failed: Invalid redirect URL."));
        }
      }
    );
  });
}

/// displaymessages functions
function displaySuccessMessage(message, data = null) {
  const messageContainer = document.getElementById("message-container");
  let dataHtml = "";

  if (data) {
    // Convert lead data to HTML for display
    dataHtml = `<div class="lead-data">
        <p><strong>Lead Data:</strong></p>
        <ul>
          ${Object.entries(data)
            .map(([key, value]) => `<li>${key}: ${value}</li>`)
            .join("")}
        </ul>
      </div>`;
  }

  if (messageContainer) {
    messageContainer.innerHTML = `<div class="success-message">${message}</div>${dataHtml}`;
    setTimeout(() => {
      messageContainer.innerHTML = ""; // Clear message after 5 seconds
    }, 9000);
  } else {
    let fullMessage = message;
    if (data) {
      fullMessage += "\n\nLead Data:\n" + JSON.stringify(data, null, 2);
    }
    alert(fullMessage); // Fallback if no container exists
  }
}

function displayErrorMessage(message) {
  const messageContainer = document.getElementById("message-container");
  if (messageContainer) {
    messageContainer.innerHTML = `<div class="error-message">${message}</div>`;
    setTimeout(() => {
      messageContainer.innerHTML = ""; // Clear message after 5 seconds
    }, 9000);
  } else {
    alert(message); // Fallback if no container exists
  }
}

function displayMessage(message, type = "info") {
  const messageContainer = document.createElement("div");
  messageContainer.style.position = "fixed";
  messageContainer.style.bottom = "20px";
  messageContainer.style.right = "20px";
  messageContainer.style.padding = "10px 15px";
  messageContainer.style.borderRadius = "5px";
  messageContainer.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
  messageContainer.style.zIndex = "1000";
  messageContainer.style.fontFamily = "Arial, sans-serif";
  messageContainer.style.maxWidth = "300px";
  messageContainer.style.textAlign = "center";
  messageContainer.style.color = type === "error" ? "#721c24" : "#155724";
  messageContainer.style.backgroundColor =
    type === "error" ? "#f8d7da" : "#d4edda";
  messageContainer.style.border =
    type === "error" ? "1px solid #f5c6cb" : "1px solid #c3e6cb";

  // Set the message text
  messageContainer.innerHTML = `<p>${message}</p>`;
  document.body.appendChild(messageContainer);

  // Auto-remove the message after 5 seconds
  setTimeout(() => {
    messageContainer.remove();
  }, 5000);
}

async function createLeadInSalesforce(leadData) {
  console.log("Creating lead in Salesforce with data:", leadData);

  const token = getToken(); // Retrieve the token from localStorage
  const url =
    "https://tenetizertechnologioes-dev-ed.develop.my.salesforce.com/services/data/v60.0/sobjects/Lead";

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leadData),
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.warn(
          "Session expired. Clearing tokens and re-authenticating..."
        );
        displayMessage(
          "We are trying to reauthenticate. Please log in again if prompted.",
          "info"
        );
        clearTokens(); // Clear expired tokens from localStorage
        return reauthenticateUser(); // Open login screen
      }
      console.error(
        "Failed to create lead. Response status:",
        response.status,
        response.statusText
      );
      throw new Error("Failed to create lead.");
    }

    const result = await response.json();
    console.log("Lead created successfully:", result);
    displaySuccessMessage("Lead created successfully!", leadData);
    return result;
  } catch (error) {
    console.error("Error during lead creation:", error);
    displayErrorMessage("Failed to create lead. Please try again.");
    throw error;
  }
}

async function reauthenticateUser() {
  console.log("Reauthenticating user...");

  try {
    const newToken = await getSalesforceToken(); // Open Salesforce login screen
    console.log("New token received after reauthentication:", newToken);

    // Optionally retry the lead creation process if needed
    alert("Session renewed! Please try again.");
  } catch (error) {
    console.error("Error during reauthentication:", error);
    alert("Reauthentication failed. Please log in again.");
  }
}

// Function to request data from LinkedIn content script
function fetchLinkedInData() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        return reject(new Error("No active tabs found."));
      }

      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "scrapeLinkedIn" },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            console.error(
              "Error communicating with content script:",
              chrome.runtime.lastError
            );
            return reject(new Error("Failed to fetch LinkedIn data."));
          }
          resolve(response);
        }
      );
    });
  });
}

// // Main function to handle lead creation
// async function handleLeadCreation() {
//   try {
//     console.log("Starting lead creation process...");

//     // Query the active tab and send a message to the content script
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       const activeTab = tabs[0];
//       chrome.tabs.sendMessage(
//         activeTab.id,
//         { action: "scrapeLinkedIn" },
//         (response) => {
//           if (response) {
//             console.log("LinkedIn data received:", response);

//             const leadData = response;

//             // Ensure that leadData has valid properties
//             if (leadData && leadData.FirstName && leadData.LastName) {
//               console.log("Extracted Lead Data:", leadData);

//               // Check if the company name is "Unknown Company"
//               if (
//                 leadData.Company &&
//                 leadData.Company.toLowerCase() === "unknown company"
//               ) {
//                 const confirmProceed = confirm(
//                   "The company name is not available for this account. Do you want to proceed with creating this lead with company name 'Unknown Company'?"
//                 );

//                 if (!confirmProceed) {
//                   console.log("Lead creation aborted by the user.");
//                   displayMessage("Lead creation aborted.", "info");
//                   return; // Abort further functionality
//                 }
//               }

//               // Proceed with lead creation
//               createLeadInSalesforce(leadData);
//             } else {
//               console.error("Invalid LinkedIn data:", leadData);
//               alert("Error: Could not extract valid data from LinkedIn.");
//             }
//           } else {
//             displayErrorMessage(
//               "Invalid data in this profile. Make sure the profile has Company name and First and Last name available."
//             );
//             console.error("Failed to get data from content script.");
//           }
//         }
//       );
//     });
//   } catch (error) {
//     console.error("Error during lead creation process:", error);
//     alert("Failed to create lead. " + error.message);
//   }
// }
async function handleLeadCreation(leadData) {
  try {
    console.log("Starting lead creation process...");
    console.log("Lead Data:", leadData);
    // Validate the provided lead data
    if (!leadData || !leadData.FirstName || !leadData.LastName) {
      console.error("Invalid lead data provided. Missing required fields.");
      alert(
        "Error: Invalid lead data. Please ensure all required fields are present."
      );
      return; // Exit the function if data is invalid
    }

    // Proceed with lead creation using the provided leadData
    createLeadInSalesforce(leadData);
  } catch (error) {
    console.error("Error during lead creation process:", error);
    alert("Failed to create lead. " + error.message);
  }
}
// Add click listener to the button in the popup UI
document
  .getElementById("create-lead-btn")
  .addEventListener("click", handleLeadCreation);
/////333333333333333333333

// // Helper functions to interact with Chrome storage

// // Function to set the token in localStorage
// function setToken(token) {
//   localStorage.setItem("salesforceAccessToken", token);
//   console.log("Access token saved in localStorage:", token);
// }

// // Function to get the token from localStorage
// function getToken() {
//   const token = localStorage.getItem("salesforceAccessToken");
//   console.log("Retrieved access token from localStorage:", token);
//   return token;
// }
// // Function to remove tokens (for invalidation handling)
// function clearTokens() {
//   localStorage.removeItem("salesforceAccessToken");
//   localStorage.removeItem("salesforceRefreshToken");
//   console.log("Tokens removed from localStorage.");
// }

// // Function to authenticate and get a Salesforce token
// async function getSalesforceToken() {
//   return new Promise((resolve, reject) => {
//     console.log("Starting Salesforce authentication...");

//     const authUrl =
//       "https://login.salesforce.com/services/oauth2/authorize?response_type=token&client_id=3MVG9Ijq7vc89psp_EimzqTDeKAK7tPRzO_dSVSKCI1LMiIIakgbB28omiRhF1_ZjVdjk1C1VSCYynx987S3o&redirect_uri=https://glpnkpnbamkekpcmpjppapgdiepekemo.chromiumapp.org/";

//     chrome.identity.launchWebAuthFlow(
//       { url: authUrl, interactive: true },
//       (redirectUrl) => {
//         if (chrome.runtime.lastError || !redirectUrl) {
//           console.error(
//             "Error during authentication:",
//             chrome.runtime.lastError || "Redirect URL is empty."
//           );
//           return reject(
//             new Error(
//               "Authorization failed: " +
//                 (chrome.runtime.lastError?.message || "Unknown error")
//             )
//           );
//         }

//         try {
//           const url = new URL(redirectUrl);
//           const hashParams = new URLSearchParams(url.hash.substring(1));
//           const accessToken = hashParams.get("access_token");
//           const refreshToken = hashParams.get("refresh_token");

//           if (!accessToken) {
//             console.error("Access token not found in redirect URL.");
//             return reject(new Error("Authorization failed: No access token."));
//           }

//           setToken(accessToken); // Save token in localStorage
//           if (refreshToken) setRefreshToken(refreshToken);
//           resolve(accessToken);
//         } catch (error) {
//           console.error("Error parsing redirect URL:", error);
//           reject(new Error("Authorization failed: Invalid redirect URL."));
//         }
//       }
//     );
//   });
// }

// /// displaymessages functions
// function displaySuccessMessage(message, data = null) {
//   const messageContainer = document.getElementById("message-container");
//   let dataHtml = "";

//   if (data) {
//     // Convert lead data to HTML for display
//     dataHtml = `<div class="lead-data">
//       <p><strong>Lead Data:</strong></p>
//       <ul>
//         ${Object.entries(data)
//           .map(([key, value]) => `<li>${key}: ${value}</li>`)
//           .join("")}
//       </ul>
//     </div>`;
//   }

//   if (messageContainer) {
//     messageContainer.innerHTML = `<div class="success-message">${message}</div>${dataHtml}`;
//     setTimeout(() => {
//       messageContainer.innerHTML = ""; // Clear message after 5 seconds
//     }, 9000);
//   } else {
//     let fullMessage = message;
//     if (data) {
//       fullMessage += "\n\nLead Data:\n" + JSON.stringify(data, null, 2);
//     }
//     alert(fullMessage); // Fallback if no container exists
//   }
// }

// function displayErrorMessage(message) {
//   const messageContainer = document.getElementById("message-container");
//   if (messageContainer) {
//     messageContainer.innerHTML = `<div class="error-message">${message}</div>`;
//     setTimeout(() => {
//       messageContainer.innerHTML = ""; // Clear message after 5 seconds
//     }, 9000);
//   } else {
//     alert(message); // Fallback if no container exists
//   }
// }

// function displayMessage(message, type = "info") {
//   const messageContainer = document.createElement("div");
//   messageContainer.style.position = "fixed";
//   messageContainer.style.bottom = "20px";
//   messageContainer.style.right = "20px";
//   messageContainer.style.padding = "10px 15px";
//   messageContainer.style.borderRadius = "5px";
//   messageContainer.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
//   messageContainer.style.zIndex = "1000";
//   messageContainer.style.fontFamily = "Arial, sans-serif";
//   messageContainer.style.maxWidth = "300px";
//   messageContainer.style.textAlign = "center";
//   messageContainer.style.color = type === "error" ? "#721c24" : "#155724";
//   messageContainer.style.backgroundColor =
//     type === "error" ? "#f8d7da" : "#d4edda";
//   messageContainer.style.border =
//     type === "error" ? "1px solid #f5c6cb" : "1px solid #c3e6cb";

//   // Set the message text
//   messageContainer.innerHTML = `<p>${message}</p>`;
//   document.body.appendChild(messageContainer);

//   // Auto-remove the message after 5 seconds
//   setTimeout(() => {
//     messageContainer.remove();
//   }, 5000);
// }

// async function createLeadInSalesforce(leadData) {
//   console.log("Creating lead in Salesforce with data:", leadData);

//   const token = getToken(); // Retrieve the token from localStorage
//   const url =
//     "https://tenetizertechnologioes-dev-ed.develop.my.salesforce.com/services/data/v60.0/sobjects/Lead";

//   try {
//     const response = await fetch(url, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify(leadData),
//     });

//     if (!response.ok) {
//       if (response.status === 401) {
//         console.warn(
//           "Session expired. Clearing tokens and re-authenticating..."
//         );
//         displayMessage(
//           "We are trying to reauthenticate. Please log in again if prompted.",
//           "info"
//         );
//         clearTokens(); // Clear expired tokens from localStorage
//         return reauthenticateUser(); // Open login screen
//       }
//       console.error(
//         "Failed to create lead. Response status:",
//         response.status,
//         response.statusText
//       );
//       throw new Error("Failed to create lead.");
//     }

//     const result = await response.json();
//     console.log("Lead created successfully:", result);
//     displaySuccessMessage("Lead created successfully!", leadData);
//     return result;
//   } catch (error) {
//     console.error("Error during lead creation:", error);
//     displayErrorMessage("Failed to create lead. Please try again.");
//     throw error;
//   }
// }

// async function reauthenticateUser() {
//   console.log("Reauthenticating user...");

//   try {
//     const newToken = await getSalesforceToken(); // Open Salesforce login screen
//     console.log("New token received after reauthentication:", newToken);

//     // Optionally retry the lead creation process if needed
//     alert("Session renewed! Please try again.");
//   } catch (error) {
//     console.error("Error during reauthentication:", error);
//     alert("Reauthentication failed. Please log in again.");
//   }
// }

// // Function to request data from LinkedIn content script
// function fetchLinkedInData() {
//   return new Promise((resolve, reject) => {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       if (tabs.length === 0) {
//         return reject(new Error("No active tabs found."));
//       }

//       chrome.tabs.sendMessage(
//         tabs[0].id,
//         { action: "scrapeLinkedIn" },
//         (response) => {
//           if (chrome.runtime.lastError || !response) {
//             console.error(
//               "Error communicating with content script:",
//               chrome.runtime.lastError
//             );
//             return reject(new Error("Failed to fetch LinkedIn data."));
//           }
//           resolve(response);
//         }
//       );
//     });
//   });
// }

// // Main function to handle lead creation
// async function handleLeadCreation(leadData) {
//   try {
//     console.log("Starting lead creation process with data:", leadData);

//     if (leadData && leadData.FirstName && leadData.LastName) {
//       // Ensure that leadData has valid properties
//       console.log("Extracted Lead Data:", leadData);

//       // Check if the company name is "Unknown Company"
//       if (
//         leadData.Company &&
//         leadData.Company.toLowerCase() === "unknown company"
//       ) {
//         const confirmProceed = confirm(
//           "The company name is not available for this account. Do you want to proceed with creating this lead with company name 'Unknown Company'?"
//         );

//         if (!confirmProceed) {
//           console.log("Lead creation aborted by the user.");
//           displayMessage("Lead creation aborted.", "info");
//           return; // Abort further functionality
//         }
//       }

//       // Proceed with lead creation
//       await createLeadInSalesforce(leadData);
//     } else {
//       console.error("Invalid LinkedIn data:", leadData);
//       displayErrorMessage("Error: Could not extract valid data from LinkedIn.");
//     }
//   } catch (error) {
//     console.error("Error during lead creation process:", error);
//     displayErrorMessage("Failed to create lead. " + error.message);
//   }
// }

// // Add click listener to the button in the popup UI
// document
//   .getElementById("create-lead-btn")
//   .addEventListener("click", handleLeadCreation);

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === "createLead" && message.leadData) {
//     handleLeadCreation(message.leadData);
//     sendResponse({ status: "success", message: "Lead creation initiated." });
//   }
// });
