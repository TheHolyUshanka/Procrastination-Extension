import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App/App';
import Popup from "./pages/Popup"


const root = document.createElement("div")
root.className = "container"
document.body.appendChild(root)
const rootDiv = ReactDOM.createRoot(root);
rootDiv.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);