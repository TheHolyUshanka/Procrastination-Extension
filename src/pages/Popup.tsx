import React, { useEffect, useState, useRef } from 'react'
import "./popup.css"
import { setTimerStateListner, 
  redirectToUrlFromPopup, 
  addCurentToList, 
  isCurrentUrlInList, 
  getList, 
  sendMessageToBackground, 
  setTimeListner,
  addToTaskList,
  sendMessageToBackgroundAndReturn,
  setNewDayListnerForTask,
  updateSettings } from "../util/test"

import { render } from '@testing-library/react'
import Task from "./Task"




const Popup = () => {
  const [isProductivity, setIsProductivity] = useState(false);
  const [isProcrastination, setIsProcrastination] = useState(false);

  //get lists to display
  const [listOfProductivity, setListOfProductivity] = useState([]);
  const [listOfProcrastination, setListOfProcrastination] = useState([]);
  const [listOfTasks, setListOfTasks] = useState([]);
  const damnRef = useRef("no");

  //states for pomodoro timer
  const [timer, setTimer] = useState("25:00");
  const [timerState, setTimerState] = useState("none");
  const [prePauseState, setPrePauseState] = useState("none");

  const [taskInput, setTaskInput] = useState("");

  const [listSelectState, setListSelectStatee] = useState("Procrastination");

  const [currentPage, setCurrentPage] = useState("Main");

  //settings
  const [settings, setSettings] = useState({Pomodoro: 25, Break: 5, From: "00.00", To: "23.59", Pomodoros: 0})
  // const [settingsPomodoroTime, setSettingsPomodoroTime] = useState("");
  // const [settingsBreakTime, setSettingsBreakTime] = useState("");

  //set the color during pomodoro
  let color;
  if (timerState === "pomodoro") {
    color = "red"
    damnRef.current = color
  }
  else if(timerState === "break") {
    color = "green"
    damnRef.current = color
  }
  else if(timerState === "pause"){
    if (damnRef.current === "no") {
      if (prePauseState === "pomodoro") {color = "red"}
      else if (prePauseState === "break") {color = "green"}
    }
    else {
      color = damnRef.current
    }
  }

  function sendData() {
    let currentDate = new Date().getDay();
    let test = {"Action": "test", "List": "me", "Name": "EMIL", "Date": currentDate}

    const xhr = new XMLHttpRequest();
    
    //set Back4App headers
    xhr.open("POST", "https://parseapi.back4app.com/classes/" + "ListAction", true);
    xhr.setRequestHeader('X-Parse-Application-Id', "vvgjf1Bl474RrmPDmHKNRPKKy2aU77YVMq75GSv9");
    xhr.setRequestHeader('X-Parse-Javascript-Key', "toTeUoz0Npcu3pDPt9KtRYGF0TzmS5JLC9W5QVu7");
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onerror = function() {
        console.error('Error occurred while sending data to Back4App.');
    };

    xhr.send(JSON.stringify(test));
}


  useEffect(() => {
    const fetchData = async () => {
      setPrePauseState(await sendMessageToBackgroundAndReturn("getPauseState"))
      setIsProductivity(await isCurrentUrlInList("productivity"));
      setIsProcrastination(await isCurrentUrlInList("procrastination"));

      setListOfProductivity(await getList("productivity"))
      setListOfProcrastination(await getList("procrastination"))
      setListOfTasks(await getList("listOfTasks"))

      setTimer(await sendMessageToBackgroundAndReturn("get time"))
      setTimerState(await sendMessageToBackgroundAndReturn("get state"))
    };
    fetchData();
  }, [isProductivity, isProcrastination, listOfTasks]);

  useEffect(() => {
    sendMessageToBackground("openedPopup")
    const fetchData = async () => {
      setTimeListner(setTimer)
      setNewDayListnerForTask(setListOfTasks)
      setTimerStateListner(setTimerState)
      setSettings(await getList("aikiData"))
    };
    fetchData();
  }, []);

  let contentHTML
  let today = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][new Date().getDay()]

  try {
    if (listSelectState === "Productivity") {
      let listHTML = listOfProductivity.map((url: any, index) => (
        <div className='itemContainer' onClick= {async () => {await redirectToUrlFromPopup(url.url);}}>
          <img style={{height: "32px", borderRadius: "8px"}} src={url.icon} alt="Icon" />
          <li key={url.url} style={{flexGrow: 1}}>{url.url}</li>
          <p>{Math.floor(url["today"] / 60)}</p>
        </div>
      ));
      contentHTML = (<ul> {listHTML} </ul>)
    }
    else if (listSelectState === "Procrastination") {
      let listHTML = listOfProcrastination.map((url: any, index) => (
        <div className='itemContainer' onClick= {async () => {await redirectToUrlFromPopup(url.url);}}>
          <img style={{height: "32px", borderRadius: "8px"}} src={url.icon} alt="Icon" />
          <li key={url.url} style={{flexGrow: 1}}>{url.url}</li>
          <p>{Math.floor(url["today"] / 60)}</p>
        </div>
      ));
      contentHTML = (<ul> {listHTML} </ul>)
    }
    else if (listSelectState === "Tasks") {
      let input =
        <div className='TaskInputContainer'>
          <input type="text" id="fname" name="fname" className='taskInputField' value={taskInput} onChange={(event) => setTaskInput(event.target.value)} />
          <button type="button" className='taskInputButton' onClick={async () => {addToTaskList(taskInput, setListOfTasks); setTaskInput("")}}>Add</button>
        </div>

      let listHTML = listOfTasks.map((task: any, index) => (
        <Task key={task.name} {...task} />
      ));

      contentHTML = (<div> <ul> {listHTML} </ul> {input} </div>)
    }
  }
  catch {
    contentHTML = <></>
  }



  //create main window
  let mainWindow;
  if (currentPage === "Main") { //combine list with radio button
    mainWindow = (
      <div>
        <div className='radioButtons'>
          <input className='radioInput' type="radio" value="1" name='radio' id='Procrastination' 
          checked={listSelectState === "Procrastination"} onChange={() => setListSelectStatee( "Procrastination" ) }></input>
          <label htmlFor="Procrastination" className='radioLabel' style={{flexGrow: 2}}>Procrast</label>

          <input className='radioInput' type="radio" value="1" name='radio' id='Productivity' 
          checked={listSelectState === "Productivity"} onChange={() => setListSelectStatee( "Productivity" ) }>
          </input>
          <label htmlFor="Productivity" className='radioLabel' style={{flexGrow: 1}}>Productive</label>

          <input className='radioInput' type="radio" value="1" name='radio' id='Tasks'
          checked={listSelectState === "Tasks"} onChange={() => setListSelectStatee( "Tasks" ) }></input>
          <label htmlFor="Tasks" className='radioLabel' style={{flexGrow: 3}}>Tasks</label>

        </div>
        {contentHTML} 
      </div>)
  }
  else if (currentPage === "Settings") {
    mainWindow = (
      <div className='settingsContainer'>
        <button className='backButton' onClick={() => setCurrentPage("Main")}>&#11176;</button>

        <h3 className="breakSlider">{"Break: " + settings.Break + " min."}</h3>
        <input type="range" min="1" max="15" value={settings.Break} className="slider"
        onChange={(e) => setSettings({...settings, Break: Number(e.target.value)})} id="myRange"></input>

        <h3>{"Pomodoro: " + settings.Pomodoro + " min."}</h3>
        <input type="range" min="1" max="60" value={settings.Pomodoro} className="slider"
        onChange={(e) => setSettings({...settings, Pomodoro: Number(e.target.value)})} id="myRange"></input>

        <label htmlFor="appt-time1" style={{fontSize: "5vh", fontWeight: "bold", marginTop: "1.5vh"}}>Active Time</label>
        <div>
          <input id="appt-time1" type="time" name="appt-time1" value={settings.From}
          onChange={(e) => setSettings({...settings, From: e.target.value})}/>

          <label htmlFor="appt-time2">  To  </label>
          <input id="appt-time2" type="time" name="appt-time2" value={settings.To}
          onChange={(e) => setSettings({...settings, To: e.target.value})}/>
        </div>

        <button className='settingsApplyButton' onClick={() => {updateSettings(settings); setCurrentPage("Main");}}>Apply</button>
      </div>
    )
  }

  let button;
  if (isProductivity) {
    button = <div className='topContainer'>
      <button className='topButton' onClick={() => addCurentToList("productivity", setIsProductivity)}>Remove Productivity</button>
    </div>
  } else if (isProcrastination) {
    button = <div className='topContainer'>
      <button className='topButton' onClick={() => addCurentToList("procrastination", setIsProcrastination)}>Remove Procrastionation</button>
    </div>
  } else {
    button = <div className='topContainer'>
      <button className='topButtons' style={{ backgroundColor: "green" }} onClick={() => addCurentToList("productivity", setIsProductivity)}>Productivity</button>
      <button className='topButtons' style={{ backgroundColor: "red" }} onClick={() => addCurentToList("procrastination", setIsProcrastination)}>Procrastionation</button>
    </div>
  }


  return (
    <div>
      {button}
      <hr style={{ height: "1px", color: "black", background: "black", marginTop: "4px", marginBottom: "8px" }}></hr>


      {mainWindow}

      <hr style={{ height: "1px", color: "black", background: "black", marginTop: "8px", marginBottom: "4px" }}></hr>
      <div className='botContainer' style={{ display: 'flex', flexDirection: "row", gap: "8px" }}>
        <button style={{ width: "92px", height: "37px", borderRadius: "16px", fontSize: "20px", fontFamily: "arial black", color: timerState === "none" ? "white" : "black", cursor: "pointer", backgroundColor: timerState === "none" ? "dodgerblue" : color }} 
        className='PomodoroButton' onClick={async () => sendMessageToBackground("pomodoro")}>{timerState === "none" ? "Start" : timer}</button>
        <button style={{ width: "92px", height: "37px", borderRadius: "16px", fontSize: "16px", fontFamily: "arial black", color: "white", backgroundColor: "dodgerblue", cursor: "pointer"}} 
        className='StatsButton' onClick={ () => currentPage === "Settings" ? setCurrentPage("Main"): setCurrentPage("Settings")}>Settings</button>
        <button className='test' onClick={() => sendMessageToBackground("test")}>test</button>
      </div>
    </div>
  )
}

export default Popup;