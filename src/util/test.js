/* global chrome */

export const addCurentToList = async (key, setter) => {
    //get current tab URL
    let [tab] = await getCurrentTab()
    let url = formatUrl(tab.url)
    console.log(url)


    chrome.storage.local.get(key, function(List){
        if (typeof List[key] === 'undefined') { //if list does not exist
            chrome.storage.local.set({ [key]: [url] }); //create with current tab
        }

        else { //else add or remove the URL from the list
            let tmp
            if (List[key].includes(url)) { //remove from list
                tmp = List[key].filter(str => str !== url);
                chrome.storage.local.set({ [key]: tmp });
                setter(false)
            }
            else { //add to list
                tmp = [...List[key], url]
                chrome.storage.local.set({ [key]: tmp });
                setter(true)
            }
            //alert(tmp)
        }
    })
};

export const isCurrentUrlInList = (key) => {
    return new Promise(async (resolve) => {
        let [tab] = await getCurrentTab()
        let url = formatUrl(tab.url)
        chrome.storage.local.get(key, function(List){
            let tmp
            try {
                tmp = List[key].includes(url)
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

// chrome.webNavigation.onBeforeNavigate.addListener((details) => {
//     if (details.url.includes("example.com")) {
//       const redirectUrl = "https://new-website.com";
//       chrome.webNavigation.onBeforeNavigate.removeListener(); // Remove the listener
//       chrome.tabs.update(details.tabId, { url: redirectUrl });
//     }
//   });


// function redirect(tab) {
//     let params = new URLSearchParams();
//     params.append('page', 'intercepted');
//     params.append('url', tab.url);

//     let extensionUrl = chrome.runtime.getURL('index.html');
//     let url = `${extensionUrl}?${params.toString()}`;

//     chrome.tabs.update(tab.id, { url });
// }

export const redirectToURL = async(redirectURL) => {
    //let id = await getCurrentTab().id
    //chrome.tabs.update(id, { url: redirectURL });
    chrome.tabs.update({ url: "https://" + redirectURL });
}

export const redirectToUrlFromPopup = async(redirectURL) => {
    await redirectToURL(redirectURL)
    window.close() //close the popup
}