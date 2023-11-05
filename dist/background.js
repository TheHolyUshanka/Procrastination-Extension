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

startTimer(25*60)