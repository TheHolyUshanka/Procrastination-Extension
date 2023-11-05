/* global chrome */

export const addCurentToList = async (key, setter) => {
    //get current tab URL
    let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

    chrome.storage.local.get(key, function(List){
        if (typeof List[key] === 'undefined') { //if list does not exist
            chrome.storage.local.set({ [key]: [tab.url] }); //create with current tab
        }

        else { //else add or remove the URL from the list
            let tmp
            if (List[key].includes(tab.url)) { //remove from list
                tmp = List[key].filter(str => str !== tab.url);
                chrome.storage.local.set({ [key]: tmp });
                setter(false)
            }
            else { //add to list
                tmp = [...List[key], tab.url]
                chrome.storage.local.set({ [key]: tmp });
                setter(true)
            }
            //alert(tmp)
        }
    })
};

export const isCurrentUrlInList = (key) => {
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


export const getList = (key) => {
    return new Promise(async (resolve) => {
        chrome.storage.local.get(key, function(List){
            if (typeof List[key] !== 'undefined') { //if list does not exist
                resolve(List[key]);
            }
            else {
                resolve([]);
            }
      });
    });
}

async function getCurrentTab() {
    let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

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