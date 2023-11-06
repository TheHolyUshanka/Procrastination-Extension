/* global chrome */

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.message === "Procrastinating") {
        console.log("something")
        const div = document.createElement("div");
        div.textContent = "This HTML was injected by the content script.";
        document.body.appendChild(div);
        //alert("procrastinating")
    }
    else {
        console.log("somethingElse")
    }
  });

