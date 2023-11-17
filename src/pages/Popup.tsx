import React, { useEffect, useState } from 'react'
import "./popup.css"
import { setTimerStateListner, redirectToUrlFromPopup, addCurentToList, isCurrentUrlInList, getList, sendMessageToBackground, setTimeListner, sendMessageToBackgroundAndReturn } from "../util/test"


function convertStateToColor(state: string) {
  if(state === "pomodoro") {return "red"}
  else if(state === "break") {return "green"}
  else {return "black"}
}


function Popup() {
  console.log("content")
  const [isProductivity, setIsProductivity] = useState(false);
  const [isProcrastination, setIsProcrastination] = useState(false);
  const [listOfProductivity, setListOfProductivity] = useState([]);
  const [timer, setTimer] = useState("25:00");
  const [timerState, setTimerState] = useState("none");
  const stateColoring = {"pomodoro":"red", "break":"green", "pause":"black", "none":"black", "default": "black"}

  let color: string = "black"
  if (timerState === "pomodoro") {color = "red"}
  else if (timerState === "break") {color = "green"}


  useEffect(() => {
    const fetchData = async () => {
      setIsProductivity(await isCurrentUrlInList("productivity"));
      setIsProcrastination(await isCurrentUrlInList("procrastination"));
      setListOfProductivity(await getList("productivity"))
      setTimer(await sendMessageToBackgroundAndReturn("get time"))
      setTimerState(await sendMessageToBackgroundAndReturn("get state"))
    };
    fetchData();
  }, [isProductivity, isProcrastination]);

  useEffect(() => {
    const fetchData = async () => {
      setTimeListner(setTimer)
      setTimerStateListner(setTimerState)
    };
    fetchData();
  }, []);



  let listHTML
  try {
    listHTML = listOfProductivity.map((url, index) => (
      <>
        <li key={url}>{url}</li>
        <img src="https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png"alt="Icon"/>
        <button onClick={async() => {await redirectToUrlFromPopup(url); sendMessageToBackground("start pomodoro")}}>Start</button>
      </>
    ));
  }
  catch {
    listHTML = <></>
  }




  if (isProductivity) {
    return (
      <div>
          <h1 style={{color: convertStateToColor(timerState)}} onClick={() => sendMessageToBackground("pause")}>{timerState + ": " + timer}</h1>
          <button className='ProductivityButton' onClick={() => addCurentToList("productivity", setIsProductivity)}>Remove Productivity</button>
          <ul>
            {listHTML}
          </ul>
      </div>
    )
  }
  else if (isProcrastination) {
    return (
      <div>
          <button className='ProcrastionationButton' onClick={() => addCurentToList("procrastination", setIsProcrastination)}>Remove Procrastionation</button>
          <ul>
            {listHTML}
          </ul>
      </div>
    )
  }
  else {
    return (
      <div>
          <button className='ProductivityButton' onClick={() => addCurentToList("productivity", setIsProductivity)}>Add Productivity</button>
          <button className='ProcrastionationButton' onClick={() => addCurentToList("procrastination", setIsProcrastination)}>Add Procrastionation</button>
          <button className='SettingsButton'>Settings</button>
          <ul>
            {listHTML}
          </ul>
      </div>
    )
  }
}

export default Popup
