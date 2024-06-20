/* global chrome */

//states
let currentTimer = 0
let timerState = "none"
let timerRunning = false
let currentSiteState = "other"
let prePauseState = timerState
let pauseCount = 0
let streakProcrast = 0

var intervalId //for runTime interval
let convertDay = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

let settings = {}
updateSettings()

//When installed setup defualt local storage
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        let id = Date.now();
        chrome.storage.local.set({ 
            "procrastination": [], 
            "productivity": [],
            "listOfTasks": [],
            "aikiData": {"Pomodoro": 25, "Break": 5, "From": "00:00", "To": "23:59", "Pomodoros": 0, "idd": id}
        });
        updateSettings()
    }
});

//Message handeling (https://developer.chrome.com/docs/extensions/mv3/messaging/)
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
    console.log("background got message: " + request.message)
    //console.log(request)
    switch (request.message) {
        case "pomodoro": //user clicked pomodoro from popup or content
            if (timerState === "none") { //start pomodoro
                startPomodoro(settings.Pomodoro*60)
                chrome.storage.local.get("aikiData", function(List){
                    let tmp = List["aikiData"].Pomodoros
                    sendData("DoPomodoro", {Count: tmp})
                });
            }
            else if (timerState === "pomodoro" || timerState === "break") { //pause pomodoro
                pause()
                pauseCount++
            }
            else {
                resume()
            }
            newState() //notify content scripts about the new state change
            break;
        case "get state":
            sendResponse({response: timerState});
            break;
        case "getPauseState":
            sendResponse({response: prePauseState});
            break
        case "get time":
            sendResponse({response: timeFormatter(currentTimer)});
            break;
        case "giveStateForContent":
            const isProcrastinating = await isCurrentUrlInList("procrastination");
            if (isProcrastinating) {
                sendResponse({response: "procrastinating", text: timerState, preState: prePauseState});
            }
            else {
                const isProductivity = await isCurrentUrlInList("productivity");
                if (isProductivity) {
                    sendResponse({response: "notProcrastinating", text: timerState, preState: prePauseState})
                }
                else {
                    sendResponse({response: "not", text: timerState, preState: prePauseState})
                }
            }
            break;
        case "getBlockContent":
            sendResponse({response: "blockContent", procrastination: localStorage['procrastination']});
            break
        case "settings":
            updateSettings()
            chrome.storage.local.get(["aikiData"]).then((result) => {
                let tmp = result.aikiData
                //console.log(tmp)
                sendData("Settings", tmp)
            });
            break
        case "openStats":
            chrome.tabs.create({ url: chrome.runtime.getURL("stats.html") })
            break
        case "openedPopup":
            sendMessageToCurrentContentScript("openedPopup")
            break
        case "sendData":
            sendData(request.class, request.data)
            break
        case "addTask":
            await addToTaskList(request.text)
            sendMessageToAllContentScripts("newTaskUpdate", "")
            break
        case "completeTask":
            let tmp = await updateTask(request.text, sendResponse)
            // console.log(tmp)
            sendResponse({response: tmp});
            break
        case "test":
            await newDayData()
            newDay("procrastination")
            newDay("productivity")
            newDayTasks()
            resetPomodoroCount()
            //sendData("EndOfDay", {ProcrastinationTime: procrastTime, ProductiveTime: productTime, TaskCount: taskCount, PomodoroCount: pomodorCount})
            break;
        default:
            console.log("..." + request.message + "...");
      }
  });


function startPomodoro(time) {
    console.log(timerState)
    if (timerState === "none" || timerState === "break") {
        currentTimer = time
        timerState = "pomodoro"
        sendMessage({ message: "Timer State", text: timerState })
        //chrome.runtime.sendMessage({ message: "Timer State", text: timerState })
        runTime()
        intervalId = setInterval(runTime, 1000)
    }
};

function startBreak(time) {
    if (timerState === "pomodoro") {
        currentTimer = time
        timerState = "break"
        pause()
    }
};

function pause() {
    if (timerState !== "pause") {
        prePauseState = timerState;
        timerState = "pause"
        sendMessage({ message: "Timer State", text: timerState })
        //chrome.runtime.sendMessage({ message: "Timer State", text: timerState })
        clearInterval(intervalId);
    }
};

function resume() {
    if (timerState === "pause") {
        timerState = prePauseState
        sendMessage({ message: "Timer State", text: timerState }) 
        //chrome.runtime.sendMessage({ message: "Timer State", text: timerState })
        intervalId = setInterval(runTime, 1000)
    }
};

async function runTime() {
    if(currentTimer <= 0) { //check if timer is done
        clearInterval(intervalId);

        if (timerState === "pomodoro") { //finsih pomodoro
            completePomodoro()
            startBreak(settings.Break*60)
            sendMessage({ message: "Timer State", text: timerState })
            //chrome.runtime.sendMessage({ message: "Timer State", text: timerState })
            sendMessageToAllContentScripts("Timer Value", timeFormatter(currentTimer))

            //update pomodoro counter
            chrome.storage.local.get("aikiData", function(List){
                let tmp = List["aikiData"]
                sendData("CompletePomodoro", {Count: tmp.Pomodoros, Pauses: pauseCount, Time: tmp.Pomodoro})
                pauseCount = 0
            });
        }
        else { //finish break -> back to none
            timerState = "none"
            sendMessage({ message: "Timer State", text: timerState })
            //chrome.runtime.sendMessage({ message: "Timer State", text: timerState })
            sendMessageToAllContentScripts("completeBreak")
        }
    }
    else { //else reduce timer and send message to all content scripts and popup
        currentTimer--
        
        sendMessage({ message: "Timer Value", timer: timeFormatter(currentTimer) })
        //chrome.runtime.sendMessage({ message: "Timer Value", timer: timeFormatter(currentTimer) });
        sendMessageToAllContentScripts("Timer Value", timeFormatter(currentTimer))
    }
};

function timeFormatter(time) {
    let min = Math.floor(time/60)
    if(min < 10) {min = "0"+min}
    let sec = time%60
    if(sec < 10) {sec = "0"+sec}
    return min + ":" + sec
}

//get the url of the current active tab
//https://developer.chrome.com/docs/extensions/reference/tabs/
async function getCurrentTab() {
    try {
        let queryOptions = { active: true, lastFocusedWindow: true };
        let [tab] = await chrome.tabs.query(queryOptions);
        return tab.url.match(/(^(?:https?:\/\/)?)((?:[^@\/\n]+@)?)(?:www\.)?([^:\/?\n]+)/)[3]   
    }
    catch (error) {
        return false  
    }
}

//send message to the content script of the currently active tab
async function sendMessageToCurrentContentScript(identifier, text) {
    try {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { message: identifier, text: text });
        });
    } catch (error) {
        console.log("damn")
    }
}

async function sendMessageToAllContentScripts(identifier, text) {

    try {
        chrome.tabs.query({}, function(tabs) {
            tabs.forEach(function(tab) {
              chrome.tabs.sendMessage(tab.id, { message: identifier, text: text });
            });
        });
    } catch (error) {
        console.log("damn")
    }
  }

//get the list from local storage under the given name
function getList(name) {
    chrome.storage.local.get([name])
        .then((result) => {
            console.log(result[name])
            return result[name]
    });
}

//return whether or not the currently active 
//tab is in the specified list in local storage
const isCurrentUrlInList = (key) => {
    return new Promise(async (resolve) => {
        let url = await getCurrentTab()
        chrome.storage.local.get(key, function(List){
            let tmp = false

            List[key].forEach(object => {
                if (object.url === url) {
                    tmp = true
                }
            });
            resolve(tmp);
        });
    });
}

//return if the list is in procrastination/productivity
const isCurrentUrlInListsAndReturn = async() => {
    let tmp = await isCurrentUrlInList("procrastination")
    let tmpp = await isCurrentUrlInList("productivity")
    return [tmp, tmpp];
}

//returns whether or not the current active tab is productivity or procrastination
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

async function checkTab() {
    let tmp = await isCurrentUrlInListsAndReturn()

    if (tmp[0]) {
        currentSiteState = "procrastination"
        sendMessageToCurrentContentScript("procrastinating", {state: timerState, pre: prePauseState})
    }
    else if (tmp[1]) {
        currentSiteState = "productivity"
        sendMessageToCurrentContentScript("notProcrastinating", {state: timerState, pre: prePauseState})
    }
    else {
        currentSiteState = "other"
        sendMessageToCurrentContentScript("not", {state: timerState, pre: prePauseState})
    }
}

async function newState() {
    sendMessageToAllContentScripts("New State", {state: timerState, pre: prePauseState})
}

//---------------------Time Tracking----------------------------

function startTimer() {
    if (!timerRunning) {
        intervalId = setInterval(timer, 1000) //maybe set to a minute instead
        timerRunning = true
    }
}
//start tracking time right away
startTimer();

async function timer() {
    //if (timerState !== "pomodoro" || currentSiteState !== "procrastination") { //update time if not doing pomodoro
        let tmp = await getCurrentTab();
        updateTime(currentSiteState, tmp)
    //}
}

function updateTime(localList, site) {
    let today = new Date().getDay();

    chrome.storage.local.get("date", async function(Date){ //check currently saved date
        //if date is not saved
        if (typeof Date["date"] === 'undefined') {
            chrome.storage.local.set({ "date": today });
        }
        else if (Date["date"] !== today) { //reset if new day
            chrome.storage.local.set({ "date": today });
            await newDayData()
            newDay("procrastination")
            newDay("productivity")
            newDayTasks()
            resetPomodoroCount()
        }
    })

    //update the local saved time data, unless in pomodoro and on blocked procrastination site.
    if (localList !== "procrastination" || timerState !== "pomodoro")
    chrome.storage.local.get(localList, function(List){
        let tmp = List[localList]
        let tmpp = []
        //loop over and create new updated list
        for (let index = 0; index < tmp.length; index++) {
            if (tmp[index]["url"] === site) {
                let time = tmp[index]["today"] + 1
                tmpp.push({...tmp[index], "today": time})

                //send message to update current content script timer
                if (localList === "procrastination") {
                    sendMessageToCurrentContentScript("procrastinationTime", time)
                    streakProcrast++
                    if (streakProcrast >= 5*60) {
                        streakProcrast = 0
                        sendMessageToCurrentContentScript("shake")
                    }
                }
                else {
                    streakProcrast = 0
                }
            }
            else {
                tmpp.push(tmp[index])
            }
        }
        chrome.storage.local.set({ [localList]: tmpp });
    });

}

async function addToTaskList(task) {
    //let today = new Date().getDay();
    let taskId = Date.now();
    let tmp = []

    //if task list is not already created
    chrome.storage.local.get("listOfTasks", function(List){
        if (typeof List["listOfTasks"] === 'undefined') {
            tmp = [{name: task, id: taskId, completed: false}]
            chrome.storage.local.set({ "listOfTasks": tmp });
        }
        else { //add to the task list
            tmp = [...List["listOfTasks"], {name: task, id: taskId, completed: false}]
            chrome.storage.local.set({ "listOfTasks": tmp });
        }
    })

};


async function newDay(list, today) {
    //move the specfied time from day to total and reset day to 0
    var total = 0
    await chrome.storage.local.get(list, function(List){
        let tmp = List[list] //full list of productivity/procrastination
        let updated = []

        //loop over each productivity/procrastination and reset today to 0
        for (let i = 0; i < tmp.length; i++) {
            let item = tmp[i]
            total += item["today"]
            //updated.push({...item, today: 0})
            updated.push({...item, "today": 0})
        }
        chrome.storage.local.set({ [list]: updated });
    })
    return total
}


async function newDayTasks() {
    var total = 0
    await chrome.storage.local.get("listOfTasks", async function(List){
        total = 1
        let tmp = List["listOfTasks"] //full list of productivity/procrastination
        //let updated = tmp.filter((task) => !task.completed);
        let updated = []

        for (let i = 0; i < tmp.length; i++) {
            const task = tmp[i];

            if (task.completed) {
                //let dif = Math.round((Date.now() - task["id"]) / 60000)
                sendData("Task", {Action: "Completed", TaskId: task["id"]})
                total += 1
            }
            else {
                updated.push(task)
            }
        }
        await chrome.storage.local.set({ "listOfTasks": updated });
    })
    return total
}

async function resetPomodoroCount() {
    var total = 0
    await chrome.storage.local.get("aikiData", function(List){
        let tmp = List["aikiData"]
        total = tmp["Pomodoros"]
        chrome.storage.local.set({ "aikiData": {...tmp, "Pomodoros": 0} });
    })
    return total
}


async function updateSettings() {
    chrome.storage.local.get(["aikiData"]).then((result) => {
        settings =  result.aikiData
    });
}


// //Back4App
// Parse.initialize("vvgjf1Bl474RrmPDmHKNRPKKy2aU77YVMq75GSv9", "toTeUoz0Npcu3pDPt9KtRYGF0TzmS5JLC9W5QVu7");
// Parse.serverURL = "https://parseapi.back4app.com/";

// function sendData(className, data) {

//     let currentDate = new Date().getDay();
//     let test = {"Action": "test", "List": "me", "Name": "EMIL", "Date": currentDate}


//     const xhr = new XMLHttpRequest();

//     //set Back4App headers
//     xhr.open("POST", "https://parseapi.back4app.com/classes/" + "ListAction", true);
//     xhr.setRequestHeader('X-Parse-Application-Id', "vvgjf1Bl474RrmPDmHKNRPKKy2aU77YVMq75GSv9");
//     xhr.setRequestHeader('X-Parse-Javascript-Key', "toTeUoz0Npcu3pDPt9KtRYGF0TzmS5JLC9W5QVu7");
//     xhr.setRequestHeader('Content-Type', 'application/json');

//     xhr.onerror = function() {
//         console.error('Error occurred while sending data to Back4App.');
//     };

//     xhr.send(JSON.stringify(test));
// }

function sendData(className, dataObject) {
    //get unique id
    chrome.storage.local.get("aikiData", function(List){
        let tmp = List["aikiData"]
        const d = new Date();
        const timeString = d.getHours() + ":" + d.getMinutes() + ", " + (convertDay[d.getDay()]) + ", " + d.getDate() + "/" + (d.getMonth()+1) + "/" + d.getFullYear()

        fetch("https://parseapi.back4app.com/classes/" + className, {
        method: 'POST',
        headers: {
            'X-Parse-Application-Id': "vvgjf1Bl474RrmPDmHKNRPKKy2aU77YVMq75GSv9",
            'X-Parse-JavaScript-Key': "toTeUoz0Npcu3pDPt9KtRYGF0TzmS5JLC9W5QVu7",
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({...dataObject, "idd": tmp.idd, Date: timeString})
        }).then(res => {
        return console.log(res);
        })
    })
}

function completePomodoro() {
    chrome.storage.local.get("aikiData", function(List){
        let tmp = List["aikiData"]
        chrome.storage.local.set({ "aikiData": {...tmp, "Pomodoros": tmp.Pomodoros+1} });
        sendMessageToAllContentScripts("completePomodoro", tmp.Pomodoros+1)
        sendMessageToAllContentScripts("New State", "break")
    })
}

async function updateTask(taskName) {
    await chrome.storage.local.get("listOfTasks", function(List){
        let tasks = List["listOfTasks"]
        let updated = []
        let returnValue = false

        //loop over and create new updated list
        for (let i = 0; i < tasks.length; i++) {
            const element = tasks[i];
            if (element.name === taskName) {
                let tmp = element
                returnValue = !tmp.completed
                tmp = {...tmp, completed: !tmp.completed}
                updated.push(tmp)
            }
            else {
                updated.push(element)
            }
        }
        chrome.storage.local.set({ "listOfTasks": updated });

        sendMessage({ message: "Update Tasks", text: taskName})
        //chrome.runtime.sendMessage({ message: "Update Tasks", text: taskName})
        sendMessageToAllContentScripts("Update Tasks", taskName)

        return returnValue;
    });
}


async function newDayData() {
    //get data from storage
    let procrastination = await chrome.storage.local.get(["procrastination"])
    let productivity = await chrome.storage.local.get(["productivity"])
    let listOfTasks = await chrome.storage.local.get(["listOfTasks"])
    let aikiData = await chrome.storage.local.get(["aikiData"])


    //calculate needed data
    let taskCount = listOfTasks["listOfTasks"].filter((task) => task.completed);

    let procrastTime = procrastination["procrastination"]
    procrastTime = procrastTime.reduce((sum, task) => {
        return sum + task["today"];
    }, 0);

    let productTime = productivity["productivity"]
    productTime = productTime.reduce((sum, task) => {
        return sum + task["today"];
    }, 0);
    let pomodoros = aikiData["aikiData"].Pomodoros
    
    sendData("EndOfDay", {ProcrastinationTime: procrastTime, ProductiveTime: productTime, TaskCount: taskCount.length, PomodoroCount: pomodoros})
}


//----------------------LISTNERS------------------------------

//listen for change in the active tab to check for procrastination/productivity
chrome.tabs.onUpdated.addListener(async (activeInfo) => {
    console.log("onUpdated")
    checkTab()
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.active) { //check if the switched to tab is still active
        console.log("onActivated")
        checkTab()
    }
});



function sendMessage(object) {
    try {
        chrome.runtime.sendMessage(object)
    } catch (error) {
        console.log("Error for sending message: " + error)
    }
}