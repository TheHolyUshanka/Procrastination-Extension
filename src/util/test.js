/* global chrome */

export const test = async (key, setter) => {
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
            alert(tmp)
        }
    })
};

export const isCurrentUrlInList = (key) => {
    return new Promise(async (resolve) => {
        let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        chrome.storage.local.get(key, function(List){
            resolve(List[key].includes(tab.url));
      });
    });
}

//does not work :(
export const getIfCurrentInList = () => {
    return new Promise(async (resolve) => {
        let [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

        const productivity = chrome.storage.local.get("productivity")
        if (typeof productivity["productivity"] !== 'undefined') {
            if (productivity["productivity"].includes(tab.url)) {
                resolve("productivity")
            }
        }

        const procrastination = chrome.storage.local.get("procrastination")
        if (typeof procrastination["procrastination"] !== 'undefined') {
            if (procrastination["procrastination"].includes(tab.url)) {
                resolve("procrastination")
            }
        }
        resolve("none")
    });
}

export const getList = (key) => {
    return new Promise(async (resolve) => {
        chrome.storage.local.get(key, function(List){
            resolve(List[key]);
      });
    });
}