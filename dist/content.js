/* global chrome */



// Create elements
const whiteBox = document.createElement("div");
const textNode = document.createTextNode("Hello, World!");

//create styles
whiteBox.style.cursor = "move";
whiteBox.style.position = "fixed";
whiteBox.style.bottom = "64px";
whiteBox.style.right = "64px";
whiteBox.style.width = "300px";
whiteBox.style.height = "150px";
whiteBox.style.backgroundColor = "white";
whiteBox.style.border = "1px solid #000";
whiteBox.style.zIndex = "9999";

//append to page
whiteBox.appendChild(textNode);
document.body.appendChild(whiteBox);

let isDragging = false;
let offsetX;
let offsetY;

//start dragging
whiteBox.addEventListener("mousedown", function(e) {
  isDragging = true;
  whiteBox.style.zIndex = "9999";
  
  // Calculate the offset between the mouse position and the top-left corner of the box
  offsetX = e.clientX - whiteBox.getBoundingClientRect().left;
  offsetY = e.clientY - whiteBox.getBoundingClientRect().top;
  
  // Prevent default browser behavior for drag-and-drop
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
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;

    // Update the box's position
    whiteBox.style.left = newX + "px";
    whiteBox.style.top = newY + "px";
  }
});