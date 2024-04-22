import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from "./pages/Popup"


const root = document.createElement("div")
root.style.width = "100%"
root.style.height = "100%"
root.style.padding = "0px"
document.body.appendChild(root)
const rootDiv = ReactDOM.createRoot(root);
rootDiv.render(
  <Popup/>
);