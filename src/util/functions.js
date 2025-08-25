/* global chrome */



//----------------------------------------MESSAGES----------------------------------------

export const sendMessageToBackground = (text) => {
    //console.log("Popup sending: " + text + " to server.")
    chrome.runtime.sendMessage({ message: text })
}

export const sendMessageToBackgroundAndReturn = async (text) => {
    //console.log("Popup sending: " + text + " to server for response.")
    const  response  = await chrome.runtime.sendMessage({ message: text })
    //console.log(response.response)
    return response.response;
}

export const setTimeListner = (setter) => {
    //listens for message from background script and updates time value with setter

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message=== "Timer Value") {
            setter(request.timer)
        }
    });
}

export const setTimerStateListner = (setter) => {
    //listens for message from background script and updates time state with setter

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message=== "Timer State") {
            setter(request.state)
        }
    });
}



//----------------------------------------URL----------------------------------------

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
    //redirect current tab to new url
    //let id = await getCurrentTab().id
    //chrome.tabs.update(id, { url: redirectURL });
    //chrome.tabs.update({ url: "https://" + redirectURL });

    //open the url in a new tab
    chrome.tabs.create({
        url: "https://" + redirectURL
      });
}

export const redirectToUrlFromPopup = async(redirectURL) => {
    await redirectToURL(redirectURL)
    //window.close() //close the popup
}

export const addCurentUrlToList = async (key, setter) => {
    //key: identifier for which list to add to
    //setter: react hook to update the popup window immidiatly when adding/removing
    
    //get current tab URL and format
    let [tab] = await getCurrentTab()
    let url = formatUrl(tab.url)
    let icon = tab.favIconUrl

    chrome.storage.local.get(key, function(List){

        //if list does not already exist, create it and add to list
        if (typeof List[key] === 'undefined') {
            chrome.storage.local.set({ [key]: [{url: url, icon: icon, today: 0}] }); //create with current tab
        }
        else {
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
                tmp = [...List[key], {url: url, icon: icon, today: 0}]
                chrome.storage.local.set({ [key]: tmp });
                setter(true)
                chrome.runtime.sendMessage({ message: "sendData", class: "ListAction", data: {List: key, Name: url, Action: "Added"}})
            }
        }
    })

    //message background script to message popup with updated info
    chrome.runtime.sendMessage({ message: "giveStateForContent"})
};

export const isCurrentUrlInList = (key) => {
    //returns if the current url is in the specified list

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



//----------------------------------------TASKS----------------------------------------

export const completeTask = async (task) => {
    //tell background script to complete the task
    const response = await chrome.runtime.sendMessage({message: "completeTask", text: task});
    // console.log(response.response);
    // setter(response.response)        (better solution that wont work)
};

export const addToTaskList = async (task, setter) => {
    //let today = new Date().getDay();
    let taskId = Date.now();
    let tmp = []

    if (task.length > 0) {

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

        setter(tmp)
        chrome.runtime.sendMessage({ message: "sendData", class: "Task", data: {Action: "Added", TaskId: taskId}})
    }
};

export const setNewDayListnerForTask = (setter) => {
    //listens for message from background script and updates tasks if new day

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.message=== "newDay") {
            chrome.storage.local.get(["listOfTasks"]).then((result) => {
                setter(result)
            });
        }
    });
}



//----------------------------------------OTHER----------------------------------------

export const updateSettings = async (data) => {
    //console.log(data)
    chrome.storage.local.set({ "aikiData": data });
    sendMessageToBackground("settings")
}

export const getList = (key) => {
    //returns the specified list (procrastionation or productivity)
    return new Promise(async (resolve) => {
        chrome.storage.local.get(key, function(List){
            if (typeof List[key] !== 'undefined') {
                //console.log(List[key])
                resolve(List[key]);
            }
            else {
                resolve([]);
            }
      });
    });
}
