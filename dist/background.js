/* global chrome */

let CurrentTimer = 0
let Running = false
let timerState = "none"
var intervalId



chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    switch (request.message) {
        case "Start Pomodoro":
        console.log("Do Start Pomodoro");
        startPomodoro(25*60)
          break;
        default:
          console.log("welp");
      }
  });



function startPomodoro(time) {
    console.log(timerState)
    if (timerState === "none") {
        CurrentTimer = time
        timerState = "pomodoro"
        intervalId = setInterval(runTime, 1000)
        return true
    }
    else {
        return false
    }
};

function startBreak(time) {
    if (timerState !== "pomodoro") {
        CurrentTimer = time
        timerState = "break"
        intervalId = setInterval(runTime, 1000)
        return true
    }
    else {
        return false
    }
};

async function runTime() {
    CurrentTimer--
    console.log(Math.floor(CurrentTimer/60) +":"+CurrentTimer%60 + await getCurrentTab().url)
    chrome.runtime.sendMessage({ message: "Timer Value", timer: timeFormatter(CurrentTimer) });

    if(CurrentTimer <= 0) {
        clearInterval(intervalId);
    }
    //let tmp = await isCurrentUrlInList("procrastination")
    //console.log(tmp)
};


function timeFormatter(time) {
    return Math.floor(time/60) +":"+time%60
}



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

async function sendMessageToCurrentContentScript(message) {

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { message: message });
      });
  }


const isCurrentUrlInList = (key) => {
    return new Promise(async (resolve) => {
        let url = await getCurrentTab()

        chrome.storage.local.get(key, function(List){
            let tmp
            try {
                tmp = List[key].includes(url)
            }
            catch {
                console.log("something")
                tmp = false
            }
            resolve(tmp);
      });
    });
}

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    console.log("onActivated")
    let tmp = await isCurrentUrlInList("procrastination")
    if (tmp) {
        console.log("sending")
        sendMessageToCurrentContentScript("Procrastinating")
    }
  });

  chrome.tabs.onUpdated.addListener(async (activeInfo) => {
    console.log("onUpdated")
    let tmp = await isCurrentUrlInList("procrastination")
    if (tmp) {
        console.log("sending")
        sendMessageToCurrentContentScript("Procrastinating")
    }
  });