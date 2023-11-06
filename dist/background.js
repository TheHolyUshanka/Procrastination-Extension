/* global chrome */

let CurrentTimer = 0
let Running = false


function startTimer(time) {
    if (!Running) {
        CurrentTimer = time
        setInterval(runTime, 1000)
        return true
    }
    else {
        return false
    }
};

async function runTime() {
    CurrentTimer--
    //console.log(Math.floor(CurrentTimer/60) +":"+CurrentTimer%60 + await getCurrentTab().url)
    console.log(await getCurrentTab())
};

//https://developer.chrome.com/docs/extensions/reference/tabs/
async function getCurrentTab() {
    let queryOptions = { active: true, lastFocusedWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);

    try {
        return tab.url.match(/(^(?:https?:\/\/)?)((?:[^@\/\n]+@)?)(?:www\.)?([^:\/?\n]+)/)[3]   
    }
    catch {
        return false  
    }
}

async function getCurrentTabUrl() {
    try {
        const tab = await getCurrentTab()
        return tab.url.match(/(^(?:https?:\/\/)?)((?:[^@\/\n]+@)?)(?:www\.)?([^:\/?\n]+)/)[3]   
    }
    catch {
        return false  
    }
}

async function getCurrentTabIcon() {
    try {
        const tab = await getCurrentTab()
        return tab.url.match(/(^(?:https?:\/\/)?)((?:[^@\/\n]+@)?)(?:www\.)?([^:\/?\n]+)/)[3]   
    }
    catch {
        return false  
    }
}

// chrome.tabs.onActivated.addListener(async (activeInfo) => {
    
//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

//     chrome.scripting.executeScript({
//       target: { tabId: tab.id },
//       function: addHTMLToPage
//     });
// });

// function addHTMLToPage() {
//     // Create an HTML element and append it to the page
//     const div = document.createElement('div');
//     div.innerHTML = '<p>This is added by the extension!</p>';
//     document.body.appendChild(div);
//   }
  
async function sendMessageToCurrentContentScript(message) {

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { message: message });
      });

    // const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    // chrome.tabs.sendMessage(tab.id, message);

    //const response = await chrome.tabs.sendMessage(tab.id, message);
    // TODO: Do something with the response.
  }

  const isCurrentUrlInList = (key) => {
    return new Promise(async (resolve) => {
        let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        chrome.storage.local.get(key, function(List){
            let tmp
            try {
                tmp = List[key].includes(tab.url)
            }
            catch {
                tmp = false
            }
            resolve(tmp);
      });
    });
}

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    console.log("listned")
    let tmp = await isCurrentUrlInList("procrastination")
    if (tmp) {
        console.log("sending")
        sendMessageToCurrentContentScript("Procrastinating")
    }
  });



startTimer(25*60)