/* global chrome */

export const addCurentToList = async (key, setter) => {
    //get current tab URL
    let [tab] = await getCurrentTab()
    console.log(tab)
    let url = formatUrl(tab.url)
    let icon = tab.favIconUrl
    console.log(url)

    chrome.storage.local.get(key, function(List){
        if (typeof List[key] === 'undefined') { //if list does not exist
            chrome.storage.local.set({ [key]: [{url: url, icon: icon, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0, today: 0}] }); //create with current tab
        }

        else { //else add or remove the URL from the list
            let state = false
            let tmp = []

            //check if it already exists
            for (let index = 0; index < List[key].length; index++) {
                if (List[key][index].url === url) {
                    state = true
                }
            }

            if (state) { //remove from list
                tmp = List[key].filter(str => str.url !== url);
                chrome.storage.local.set({ [key]: tmp });
                setter(false)
                chrome.runtime.sendMessage({ message: "sendData", class: "ListAction", data: {List: key, Name: url, Action: "Removed"}})
            }
            else { //add to list
                tmp = [...List[key], {url: url, icon: icon, monday: 0, tuesday: 0, wednesday: 0, thursday: 0, friday: 0, saturday: 0, sunday: 0, today: 0}]
                chrome.storage.local.set({ [key]: tmp });
                setter(true)
                chrome.runtime.sendMessage({ message: "sendData", class: "ListAction", data: {List: key, Name: url, Action: "Added"}})
            }
        }
    })
};


export const isCurrentUrlInList = (key) => {
    return new Promise(async (resolve) => {
        let [tab] = await getCurrentTab()
        let url = formatUrl(tab.url)
        chrome.storage.local.get(key, function(List){
            let tmp = false

            List[key].forEach(object => {
                //console.log(object);
                if (object.url === url) {
                    tmp = true
                }
            });

            resolve(tmp);
      });
    });
}

export const getList = (key) => {
    return new Promise(async (resolve) => {
        chrome.storage.local.get(key, function(List){
            if (typeof List[key] !== 'undefined') {
                console.log(List[key])
                resolve(List[key]);
            }
            else {
                resolve([]);
            }
      });
    });
}

async function getCurrentTab() {
    return await chrome.tabs.query({ active: true, lastFocusedWindow: true });
}

function formatUrl(text) {
    try {
        return text.match(/(^(?:https?:\/\/)?)((?:[^@\/\n]+@)?)(?:www\.)?([^:\/?\n]+)/)[3]   
    }
    catch {
        return false  
    }
}

export const redirectToURL = async(redirectURL) => {
    //let id = await getCurrentTab().id
    //chrome.tabs.update(id, { url: redirectURL });

    //chrome.tabs.update({ url: "https://" + redirectURL });

    chrome.tabs.create({
        url: "https://" + redirectURL
      });
}

export const redirectToUrlFromPopup = async(redirectURL) => {
    await redirectToURL(redirectURL)
    //window.close() //close the popup
}

export const sendMessageToBackground = (text) => {
    console.log("Popup sending: " + text + " to server.")
    chrome.runtime.sendMessage({ message: text })
}

export const sendMessageToBackgroundAndReturn = async (text) => {
    console.log("Popup sending: " + text + " to server for response.")
    const  response  = await chrome.runtime.sendMessage({ message: text })
    console.log(response.response)
    return response.response;
}

export const setTimeListner = (setter) => {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message=== "Timer Value") {
            setter(request.timer)
        }
      });
}


export const setTimerStateListner = (setter) => {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message=== "Timer State") {
            setter(request.state)
        }
    });
}

export const setNewDayListnerForTask = (setter) => {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message=== "newDay") {
            chrome.storage.local.get(["listOfTasks"]).then((result) => {
                setter(result)
            });
        }
    });
}

export const addToTaskList = async (task, setter) => {
    //let today = new Date().getDay();
    let taskId = Date.now();
    let tmp = []

    //if task list is not alreadt created
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
    //console.log("added task: " + task)
    setter(tmp)
    chrome.runtime.sendMessage({ message: "sendData", class: "Task", data: {Action: "Added", TaskId: taskId}})
};

export const completeTask = async (task, setter) => {
    let taskId = Date.now();
    let tmp = []

    chrome.storage.local.get("listOfTasks", function(List){
        for (let i = 0; i < List["listOfTasks"].length; i++) {
            if (List["listOfTasks"][i].name === task) { //set it to completed
                tmp.push({...List["listOfTasks"][i], completed: !List["listOfTasks"][i].completed})
                setter(!List["listOfTasks"][i].completed)
                //chrome.runtime.sendMessage({ message: "sendData", class: "Task", data: {Action: "Completed", TaskId: taskId}})
            }
            else {
                tmp.push(List["listOfTasks"][i])
            }
        }
        chrome.storage.local.set({ "listOfTasks": tmp });
    })
    console.log(tmp)
};

//settings
export const updateSettings = async (data) => {
    //console.log(data)
    chrome.storage.local.set({ "aikiData": data });
    sendMessageToBackground("settings")
}