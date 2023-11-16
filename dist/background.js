/* global chrome */
console.log("background")

let CurrentTimer = 0
let timerState = "none"
var intervalId

// When installed, show settings page
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.storage.local.set({ "procrastination": [], "productivity": [] });
    }
});


//https://developer.chrome.com/docs/extensions/mv3/messaging/
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    console.log("background got message:")
    console.log(request)
    
    switch (request.message) {
        case "start pomodoro":
            console.log("Do Start Pomodoro");
            startPomodoro(25*60)
            break;
        case "get state":
            sendResponse({response: timerState});
            break;
        case "get time":
            sendResponse({response: timeFormatter(CurrentTimer)});
            break;
        case "get is current tab":
            sendResponse({response: isCurrentUrlInLists()});
            break;
        case "pause":
            timerState==="pause"? resume() : pause();
            break;
        case "resume":
            resume()
            break;
        case "giveStateForContent":
            isCurrentUrlInList("procrastination").then(i => {
            if(i) {sendResponse({response: "procrastinating"});}
            else {sendResponse({response: "something"});}
            })
            break;
        default:
            console.log("..." + request.message + "...");
      }
  });



function startPomodoro(time) {
    console.log(timerState)
    if (timerState === "none" || timerState === "break") {
        CurrentTimer = time
        timerState = "pomodoro"
        intervalId = setInterval(runTime, 1000)
    }
};

function startBreak(time) {
    if (timerState === "pomodoro") {
        CurrentTimer = time
        timerState = "break"
        intervalId = setInterval(runTime, 1000)
    }
};

function pause() {
    if (timerState === "pomodoro") {
        timerState = "pause"
        clearInterval(intervalId);
    }
};

function resume() {
    if (timerState === "pause") {
        timerState = "pomodoro"
        intervalId = setInterval(runTime, 1000)
    }
};

async function runTime() {
    CurrentTimer--
    chrome.runtime.sendMessage({ message: "Timer Value", timer: timeFormatter(CurrentTimer) });

    if(CurrentTimer <= 0) { //check if done
        clearInterval(intervalId);

        if (timerState === "pomodoro") {startBreak(5*60)}
        else {timerState = "none"}
    }

    console.log(Math.floor(CurrentTimer/60) +":"+CurrentTimer%60)
    //let tmp = await isCurrentUrlInList("procrastination")
    //console.log(tmp)
};


function timeFormatter(time) {
    //return Math.floor(time/60) +":"+time%60

    let min = Math.floor(time/60)
    if(min < 10) {min = "0"+min}
    let sec = time%60
    if(sec < 10) {sec = "0"+sec}

    return min + ":" + sec
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
    try {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { message: message });
        });
    } catch (error) {
        console.log("damn")
    }
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

const isCurrentUrlInLists = async () => {
    let tmp = await isCurrentUrlInList("procrastination")

    if(tmp) {
        return tmp
    }
    else {
        tmp = isCurrentUrlInList("productivity")
    }

    return tmp;
}

  chrome.tabs.onActivated.addListener(async (activeInfo) => {
    console.log("onActivated")
    let tmp = await isCurrentUrlInList("procrastination")
    if (tmp) {
        //console.log("sending")
        //sendMessageToCurrentContentScript("addContent")
    }
  });

  chrome.tabs.onUpdated.addListener(async (activeInfo) => {
    console.log("onUpdated")
    let tmp = await isCurrentUrlInList("procrastination")
    if (tmp) {
        sendMessageToCurrentContentScript("procrastinating") 
    }
    else {
        sendMessageToCurrentContentScript("not") 
    }
  });

