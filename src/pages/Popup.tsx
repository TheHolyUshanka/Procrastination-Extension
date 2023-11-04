import React, { useEffect, useState } from 'react'
import "./popup.css"
import { test, isCurrentUrlInList, getList } from "../util/test"





function Popup() {
  const [isProductivity, setIsProductivity] = useState(false);
  const [isProcrastination, setIsProcrastination] = useState(false);
  const [listOfProductivity, setListOfProductivity] = useState([]);




  useEffect(() => {
    const fetchData = async () => {
      setIsProductivity(await isCurrentUrlInList("productivity"));
      setIsProcrastination(await isCurrentUrlInList("procrastination"));
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setListOfProductivity(await getList("productivity"))
    };
    fetchData();
  });

  const listHTML = listOfProductivity.map((url, index) => (
    <li key={url}>{url}</li>
  ));


  if (isProductivity) {
    return (
      <div>
          <button className='ProductivityButton' onClick={() => test("productivity", setIsProductivity)}>Remove Productivity</button>
          <ul>
            {listHTML}
          </ul>
      </div>
    )
  }
  else if (isProcrastination) {
    return (
      <div>
          <button className='ProcrastionationButton' onClick={() => test("procrastination", setIsProcrastination)}>Remove Procrastionation</button>
          <ul>
            {listHTML}
          </ul>
      </div>
    )
  }
  else {
    return (
      <div>
          <button className='ProductivityButton' onClick={() => test("productivity", setIsProductivity)}>Add Productivity</button>
          <button className='ProcrastionationButton' onClick={() => test("procrastination", setIsProcrastination)}>Add Procrastionation</button>
          <button className='SettingsButton'>Settings</button>
          <ul>
            {listHTML}
          </ul>
      </div>
    )
  }
}

export default Popup
