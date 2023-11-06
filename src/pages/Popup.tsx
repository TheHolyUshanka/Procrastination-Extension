import React, { useEffect, useState } from 'react'
import "./popup.css"
import { redirectToUrlFromPopup, addCurentToList, isCurrentUrlInList, getList } from "../util/test"





function Popup() {
  const [isProductivity, setIsProductivity] = useState(false);
  const [isProcrastination, setIsProcrastination] = useState(false);
  const [listOfProductivity, setListOfProductivity] = useState([]);




  useEffect(() => {
    const fetchData = async () => {
      setIsProductivity(await isCurrentUrlInList("productivity"));
      setIsProcrastination(await isCurrentUrlInList("procrastination"));
      setListOfProductivity(await getList("productivity"))
    };
    fetchData();
  }, [isProductivity, isProcrastination]);


  let listHTML
  try {
    listHTML = listOfProductivity.map((url, index) => (
      <>
        <li key={url}>{url}</li>
        <img src="https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png"alt="Icon"/>
        <button onClick={async() => {await redirectToUrlFromPopup(url)}}>Start</button>
      </>
    ));
  }
  catch {
    listHTML = <></>
  }




  if (isProductivity) {
    return (
      <div>
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
