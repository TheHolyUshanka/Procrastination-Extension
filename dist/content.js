/* global chrome */



const whiteBox = document.createElement("div");
const globalStyles = document.createElement("style");
const textNode = document.createTextNode("Hello, World!");

let isOn = false;

whiteBox.style.position = "fixed";
whiteBox.style.bottom = "64px";
whiteBox.style.right = "64px";
whiteBox.style.width = "300px";
whiteBox.style.height = "150px";
whiteBox.style.backgroundColor = "white";
whiteBox.style.border = "1px solid #000";
whiteBox.style.zIndex = 999

whiteBox.style.color = "black"




whiteBox.appendChild(textNode);
document.body.appendChild(whiteBox);