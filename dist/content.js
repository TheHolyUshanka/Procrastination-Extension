/* global chrome */
console.log("content")

//fields
let pomodoroState = "none";
let prePomodoroState = pomodoroState
let procrastinating = false

//text nodes
const textNode = document.createTextNode("25:00");
var timerTextBlock = document.createTextNode("25:00");
let timeTextT = document.createTextNode("");

//html elements
const AikiBox = document.createElement("div");
const timerButton = document.createElement("button");
timerButton.textContent = "Start"
let timeContainer = document.createElement("div");
let pomodoroContainer = document.createElement("div");
var t_container = document.createElement("ul");

//css animation (shake/zoom) 3 times
const shakeFrames = `
  @keyframes shake {
    0% { transform: rotate(0deg) scale(1.0);}

    10% { transform: rotate(8deg) scale(1.1);}
    20% { transform: rotate(0eg) scale(1.4);}
    30% { transform: rotate(-8deg) scale(1.1);}

    40% { transform: rotate(8deg) scale(1.1);}
    50% { transform: rotate(0eg) scale(1.4);}
    60% { transform: rotate(-8deg) scale(1.1);}

    70% { transform: rotate(8deg) scale(1.1);}
    80% { transform: rotate(0eg) scale(1.4);}
    90% { transform: rotate(-8deg) scale(1.1);}

    100% { transform: rotate(0deg) scale(1.0);}
  }`;
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = shakeFrames;
document.head.appendChild(styleSheet);

//Ask background if site is procrastination or productivity, and get state for pomodoro
//This will send a message back later to content script later to act on.
(async () => {
  chrome.runtime.sendMessage({message: "giveStateForContent"});
  chrome.runtime.sendMessage({message: "get state"});
})();

//Message handeling  (https://developer.chrome.com/docs/extensions/mv3/messaging/)
chrome.runtime.onMessage.addListener(async function(request, sender, sendResponse) {
  switch (request.message) {
    case "procrastinating": //user on a procrastination website
      pomodoroState = request.text.state
      prePomodoroState = request.text.pre
      procrastinating = true
      if (pomodoroState === "pomodoro") {
        block()
      }
      else {
        unblock()
        createBox()
      }
      break;
    case "notProcrastinating":
      pomodoroState = request.text.state
      prePomodoroState = request.text.pre
      procrastinating = false
      if (pomodoroState === "pomodoro" ||  pomodoroState === "break") {
        createBox()
      }
      break
    case "not": //website is neither procrastination or productivity
      pomodoroState = request.text.state
      prePomodoroState = request.text.pre
      if (pomodoroState === "pomodoro" ||  pomodoroState === "break") {
        createBox();
      }
      break
    case "New State": //new state from background without having to check procrastination again (fx user clicked start button)
      pomodoroState = request.text.state
      prePomodoroState = request.text.pre
      if (procrastinating && pomodoroState === "pomodoro") {
        block()
        updateBox()
      }
      else {
        unblock()
        if (pomodoroState === "pomodoro" ||  pomodoroState === "break" || procrastinating) {
          createBox(); //keep box on screen during pomodoro or break regardless of site
        }
      }
      break
    case "procrastinationTime": //update pomodoro time display
      timeTextT.textContent = Math.floor(request.text/60) + " min. today"
      break
    case "Timer Value": //update pomodoro time on button
      updateTimer(request.text)
      break;
    case "openedPopup": //user opened popup window, show box if it is minimized.
      if (minimized) {minimize()}
      break
    case "completePomodoro":
      pomodoroTextC.textContent = "Pomodoros Today: " + request.text
      pomodoroState = "pause";
      prePomodoroState = "break"
      updateBox()
      break
    case "completeBreak":
      timerButton.textContent = "Start"
      pomodoroState = "pause";
      prePomodoroState = "pomodoro"
      updateBox()
      break
    case "Update Tasks":
      updateTasks();
      break
    case "shake":
      shakeBox(3);
      break
    default:
      //console.log("content script got message:");
      //console.log(request.text);
  }
});


function updateTimer(time) {
  textNode.textContent = time
  timerTextBlock.textContent = time
  timerButton.textContent = time
}

//create full screen block
var IsBlocked = false;
let listOfTasks;

async function createBlock() {
  //Get data from local storage to display on screen

  // let procrastination = await chrome.storage.local.get(["procrastination"])
  // procrastination = procrastination.procrastination

  let productivity = await chrome.storage.local.get(["productivity"])
  productivity = productivity.productivity

  listOfTasks = await chrome.storage.local.get(["listOfTasks"])
  listOfTasks = listOfTasks.listOfTasks


  //main container
  var mainContainer = document.createElement("div");
  mainContainer.setAttribute("id", "AikiBlockContent");
  mainContainer.setAttribute("style", "all: initial; height: 100vh; background-color: #26262b; display: flex; justify-content: center; flex-direction: column; align-items: center");


  //title
  let h1 = document.createElement("h1");
  h1.setAttribute("style", "color: white; font-family: Arial; font-size: 5vh; font-weight: bold;");
  let title = document.createTextNode("Blocked during Pomodoro");
  h1.appendChild(title);
  mainContainer.appendChild(h1);
  

  //outer list container (row)
  var l_container = document.createElement("div");
  l_container.setAttribute("style", "all: initial; display: flex; flex-direction: row; column-gap: 6vh;");


  //productivity container
  var p_container = document.createElement("ul");
  p_container.setAttribute("id", "ProductivityContainer");


  //Create element for each productivity site in local storage
  for (let i = 0; i < productivity.length; i++) { 
    let li = document.createElement("div");
    li.setAttribute("style", "all: initial; cursor: pointer; color: white; font-family: Arial; font-size: 3vh; display: flex; flex-direction: row; align-items: center; gap: 1.6vh; margin: 3vh 0;");

    //icon
    let img = document.createElement("img")
    img.setAttribute("src", productivity[i].icon)
    img.setAttribute("style", "all: initial; cursor: pointer; height: 2vh;")
    li.appendChild(img)

    //name of productivity site
    li.appendChild(document.createTextNode(productivity[i].url));
    li.onclick = (() => window.open("https://" + productivity[i].url, "_blank"))
    
    p_container.appendChild(li)
  }
  l_container.appendChild(p_container);


  //task container
  t_container.setAttribute("id", "ProductivityContainer");
  t_container.setAttribute("style", "list-style-type: circle; display: block;")
  
  updateTasks()
  l_container.appendChild(t_container);

  mainContainer.appendChild(l_container);


  //timer button

  if (!pomodoroState === "none") {
    const time = await chrome.runtime.sendMessage({message: "get time"})
    timerButton.textContent = time
  }
  
  let button = document.createElement("button")
  button.onclick = (() => chrome.runtime.sendMessage({ message: "pomodoro" }))
  button.setAttribute("style", "all: initial; margin-top: 3vh; font-weight: bold; font-family: arial black; font-size: 7vh; width: 25vh; height: 10.5vh; border-radius: 4.5vh; " +
  "color: black; background-color: red; border; border: 0.6vh solid black; cursor: pointer; font-family: calibri; text-align: center;")
  button.appendChild(timerTextBlock)
  mainContainer.appendChild(button);
  

  document.body.appendChild(mainContainer);
}

function removeBlock() {
  const element = document.getElementById("AikiBlockContent");
  if (element) {
    element.remove();
  }
}

var items
async function block() {//hide all elements on page before creating block
  if (!IsBlocked) {
    IsBlocked = true;
    items = document.querySelectorAll("body > *:not(script):not([style*='display:none'])");
    for (let i = 0, len = items.length; i < len; i++) {
      items[i].style.display = "none";
    }
    createBlock()
  }
}

function unblock() {//unhide all elements on page before removing block
  if (IsBlocked) {
    IsBlocked = false;
    if (items !== undefined) {
      for (let i = 0, len = items.length; i < len; i++) {
        if (items[i].id === "AikiBox") {
          items[i].style.display = "flex";
        }
        else {
          items[i].style.display = "initial";
        }
      }
      removeBlock()
      items = undefined
    }
  }
}



//Create pomodoro box
const minimizeButtonDiv = document.createElement("div")
const minimizeButton = document.createElement("button")
const timeTextC = document.createElement("p")
const icon = document.createElement("img")
const pomodoroTextC = document.createElement("p")
const icon2 = document.createElement("img")

async function createBox() {

  //check if it is already present and within settings time (unless in pomodor or break state)
  if (document.getElementById("AikiBox") || (!await checkTime() && !pomodoroState === "pomodoro" && !pomodoroState === "break")) {
    return
  }

  //fields
  let isDragging = false;
  let offsetX;
  let offsetY;

  //create outer box
  AikiBox.id = "AikiBox"
  AikiBox.setAttribute("style", "all: initial; cursor: move; position: fixed; bottom: 8vh; right: 8vh; width: 26vh; min-width: 286px; " +
  "height: fit-content; z-index: 9999; background-color: white; border: 0.5vh solid green; border-radius: 1.8vh; " +
  "display: flex; flex-direction: column; align-items: center; box-sizing: border-box; box-shadow: inset 0 0 0.5vh black, 0 0 0.8vh 0.2vh black;")
  if (minimized) {AikiBox.style.display = "none"}

  //create minimize button
  minimizeButtonDiv.setAttribute("style", "all: initial; min-height: 5px; max-height: 0.4vh; min-width: 32px; " + 
  "max-width: 3.6vh; cursor: pointer; align-self: flex-end; padding: 0.75vh; box-sizing: border-box;")
  minimizeButtonDiv.onclick = (() => minimize())
  //minimizeButtonDiv.onclick = (() => shakeBox(3))

  minimizeButton.textContent = ""
  minimizeButton.setAttribute("style", "all: initial; background-color:	#505050; height: 0.3vh; min-heigh: 4px; " + 
  "width: 100%; border-radius: 0.3vh; cursor: pointer; border: none; box-sizing: border-box; display: flex;")
  minimizeButtonDiv.appendChild(minimizeButton)

  AikiBox.appendChild(minimizeButtonDiv)

  //show procrastination time if on procrastinaton site
  if (procrastinating) {
    //get data from local storage
    let timeProcrast = await chrome.storage.local.get(["procrastination"])
    const currentUrl = formatUrl(window.location.href);
    timeProcrast = timeProcrast["procrastination"].filter((i) => i.url === currentUrl)[0]

    timeContainer.setAttribute("style", "all: initial; cursor: move; display:flex; flex-direction:row; align-items: center; margin-bottom: max(0.25vh, 3px); margin-top: max(-0.5vh, -6px)")

    //add icon left of text
    icon.src = timeProcrast["icon"]
    icon.setAttribute("style", "all: initial; cursor: move; width: 1.75vh; min-width: 18px;")
    timeContainer.appendChild(icon)

    //creaye procrastination text from data
    timeTextT.textContent = Math.floor(timeProcrast["today"]/60) + " min. today"
    //timeTextC.setAttribute("style", "all: initial; cursor: move; color: black; font-size: font-size: 48px; margin-left: 0.75vh; margin-right: 0.75vh; font-family: Trebuchet MS; font-weight: bold")
    timeTextC.setAttribute("style", "all: initial; cursor: move; color: black; font-size: max(2vh, 22px); margin-left: max(0.75vh, 8px); margin-right: max(0.75vh, 8px); font-family: Trebuchet MS; font-weight: bold")
    timeTextC.appendChild(timeTextT)
    timeContainer.appendChild(timeTextC)

    //add icon right of text
    icon2.src = timeProcrast["icon"]
    icon2.setAttribute("style", "all: initial; cursor: move; width: 1.75vh; min-width: 18px;")
    timeContainer.appendChild(icon2)

    AikiBox.appendChild(timeContainer)
  }

  //create timer button
  timerButton.setAttribute("style", "all: initial; cursor: pointer; background-color: red; font-size: max(2.5vh, 26px); color: black; font-family: Arial black; " +
  "margin: max(0.33vh, 4px) 0vh max(0.33vh, 4px) 0vh; padding: max(0.25vh, 3px) max(1vh, 11px) max(0.25vh, 3px) max(1vh, 11px); border-radius: max(1.5vh, 16px); border: max(0.25vh, 3px) solid black;")
  timerButton.onclick = (() => chrome.runtime.sendMessage({ message: "pomodoro" }))
  AikiBox.appendChild(timerButton)

  //create pomodoro counter
  let pomodoroCount = await getPomodoroCount();
  pomodoroTextC.textContent = "Pomodoros Today: " + pomodoroCount
  pomodoroTextC.setAttribute("style", "all: initial; cursor: move; color: black; font-size: max(2vh, 22px); margin-left: max(0.75vh, 8px); margin-right: max(0.75vh, 8px); margin-bottom: max(5vh, 55px); font-family: Trebuchet MS; font-weight: bold")
  pomodoroContainer.setAttribute("style", "margin-bottom: max(0.5vh, 6px)")
  pomodoroContainer.appendChild(pomodoroTextC)
  AikiBox.appendChild(pomodoroContainer)

  //start dragging
  AikiBox.addEventListener("mousedown", function(e) {
    isDragging = true;
    AikiBox.style.zIndex = "9999";
    
    //Calculate the offset between the mouse position and the top-left corner of the box
    offsetX = e.clientX - AikiBox.getBoundingClientRect().left;
    offsetY = e.clientY - AikiBox.getBoundingClientRect().top;
    
    e.preventDefault();
  });
  
  //stop dragging
  document.addEventListener("mouseup", function() {
    isDragging = false;
    //whiteBox.style.zIndex = "auto";
  });

  //dragging
  document.addEventListener("mousemove", function(e) {
    if (isDragging) {
      //calculate new position from mouse position in chrome - mouse position in box 
      let newX = e.clientX - offsetX;
      let newY = e.clientY - offsetY;

      //convert px to vh/vw
      newX = (100 * newX / window.innerWidth)
      newY = (100 * newY / window.innerHeight)

      // Update the box's position
      AikiBox.style.left = newX + "vw";
      AikiBox.style.top = newY + "vh";
    }
  });

  updateBox() //update box based on pomodoro state
  document.body.appendChild(AikiBox);
}

let minimized = false
function minimize() {
  minimized = !minimized
  if (minimized) {
    AikiBox.style.display = "none"
  }
  else {
    AikiBox.style.display = "flex"
  }
}

function formatUrl(text) {
  try {
      return text.match(/(^(?:https?:\/\/)?)((?:[^@\/\n]+@)?)(?:www\.)?([^:\/?\n]+)/)[3]   
  }
  catch {
      return false  
  }
}

async function checkTime() {
  const d = new Date();

  let hours = ('0' + d.getHours()).slice(-2);
  let minutes = ('0' + d.getMinutes()).slice(-2);
  let now = hours + ":" + minutes;

  let settings = await chrome.storage.local.get(["aikiData"])
  let time = [settings.aikiData.From, settings.aikiData.To]

  if (time[0] < time[1]) { //normal if From is before To
    return (time[0] <= now && time[1] >= now)
  }
  else { //if From is after To
    return (time[0] <= now || time[1] >= now)
  }
}

async function getPomodoroCount() {
  let data = await chrome.storage.local.get(["aikiData"])
  return data.aikiData.Pomodoros
}

function updateBox() {
  if (pomodoroState === "pomodoro" || (pomodoroState === "pause" && prePomodoroState === "pomodoro") ) {
    AikiBox.style.border = "0.5vh solid red"
    timerButton.style.backgroundColor = "red"
  }
  else if (pomodoroState === "break" || (pomodoroState === "pause" && prePomodoroState === "break") ) {
    AikiBox.style.border = "0.5vh solid green"
    timerButton.style.backgroundColor = "green"
  }
  else {
    AikiBox.style.border = "0.5vh solid black"
    console.log(pomodoroState + " - " + prePomodoroState)
  }
}

function completeTask(taskName) {
  chrome.runtime.sendMessage({message: "completeTask", text: taskName});
}

async function updateTasks() { //update displayed lsit of tasks
  listOfTasks = await chrome.storage.local.get(["listOfTasks"])
  listOfTasks = listOfTasks.listOfTasks

  t_container.innerHTML = ""

  for (let i = 0; i < listOfTasks.length; i++) {
    let li = document.createElement("li");
    li.id = listOfTasks[i].name
    let text = listOfTasks[i].name
    li.appendChild(document.createTextNode(text));

    //check if task is completed
    if (listOfTasks[i].completed) {li.setAttribute("style", "all: initial; color: white; font-family: Arial; font-size: 3vh; text-decoration:line-through; display: block; margin: 3vh; cursor: pointer;");}
    else {li.setAttribute("style", "all: initial; color: white; font-family: Arial; font-size: 3vh; display: block; margin: 3vh; cursor: pointer;");}

    li.onclick = (() => completeTask(text))

    t_container.appendChild(li)
  }
}

function shakeBox (count) {
  if (count > 0) {
    AikiBox.style.animation = 'shake 1.0s';

    //Remove the animation after it ends
    AikiBox.addEventListener('animationend', () => {
      AikiBox.style.animation = '';
    }, { once: true });

    setTimeout(() => shakeBox(count - 1), 2000)
  }
};
