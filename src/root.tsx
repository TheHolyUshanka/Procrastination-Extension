import React from 'react';
import ReactDOM from 'react-dom/client';
import Inject from "./pages/Inject"


const root = document.createElement("div")
root.className = "container"
document.body.appendChild(root)
const rootDiv = ReactDOM.createRoot(root);
rootDiv.render(
  <React.StrictMode>
    <Inject/>
  </React.StrictMode>
);