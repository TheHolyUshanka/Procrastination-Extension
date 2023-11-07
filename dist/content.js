/* global chrome */



// Create a div element for the white box
const whiteBox = document.createElement("div");

// Set the white box's styles
whiteBox.style.cursor = "move"; // Set cursor style to indicate draggable
whiteBox.style.position = "fixed";
whiteBox.style.bottom = "64px";
whiteBox.style.right = "64px";
whiteBox.style.width = "300px";
whiteBox.style.height = "150px";
whiteBox.style.backgroundColor = "white";
whiteBox.style.border = "1px solid #000";
whiteBox.style.zIndex = 999


// Create a text node with "Hello, World!"
const textNode = document.createTextNode("Hello, World!");

// Append the text node to the white box
whiteBox.appendChild(textNode);

// Append the white box to the body of the page
document.body.appendChild(whiteBox);

let isDragging = false;
let offsetX, offsetY;

// Mouse down event to start dragging
whiteBox.addEventListener("mousedown", function(e) {
    isDragging = true;
  
    // Calculate the offset between the mouse position and the top-left corner of the box
    offsetX = e.clientX - whiteBox.getBoundingClientRect().left;
    offsetY = e.clientY - whiteBox.getBoundingClientRect().top;
  
    // Set a high z-index to bring the box to the front
    whiteBox.style.zIndex = "9999"; // You can adjust this value as needed
  
    // Prevent default browser behavior for drag-and-drop
    e.preventDefault();
  });
  
  // Mouse up event to stop dragging
  document.addEventListener("mouseup", function() {
    isDragging = false;
  
    // Restore the z-index to its original value
    //whiteBox.style.zIndex = "auto";
  });

// Mouse move event to update box position while dragging
document.addEventListener("mousemove", function(e) {
  if (isDragging) {
    const newX = e.clientX - offsetX;
    const newY = e.clientY - offsetY;

    // Update the box's position
    whiteBox.style.left = newX + "px";
    whiteBox.style.top = newY + "px";
  }
});