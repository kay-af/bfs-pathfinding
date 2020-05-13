// Size related variables
var canvasSize;
var numGrids;
var gridSize;

// A grid block can have one of these values so that we can represent them with different colors
// 0 - The path can be walked on
// 1 - The path is blocked
// 2 - The source position
// 3 - The destination position
// 4 - The actual traced path
const FREE = 0;
const BLOCK = 1;
const SOURCE = 2;
const DESTINATION = 3;
const SCAN = 4;
const PATH = 5;

// The mapping of the above constants to colors
var COLOR_MAP;

// The logical grid we will be working on
var grids = [];

// The source and destination points will be stored here
var source, destination;

// The simulation will run in steps so we will use Javascript's interval.
// The interval ID will be stored here for reference
var simInterval;

// The chance of randomly generating a blocked path in the grid
var blocksChance = 0.3;

// Entry point of the program
// Refer to p5js for more information
function setup() {
  // Get the canvas size as the width of the drawing div
  // The height is same as the width
  canvasSize = document.getElementById("drawing").clientWidth;
  var cnv = createCanvas(canvasSize, canvasSize);
  // Set the parent of the canvas
  cnv.parent("drawing");

  // Number of grid blocks in the scene
  numGrids = 30;
  // Size of a grid block = the canvasSize / number of grids
  gridSize = canvasSize/numGrids;

  // Initializing the color map
  // We will use these colors to fill the grid blocks according to their values.
  COLOR_MAP = {
    0: color(140),
    1: color(30),
    2: color(255, 40, 40),
    3: color(80, 255, 80),
    4: color(64),
    5: color(128, 182, 80),
  };

  // Randomly place blocks, source and destination in the scene
  randomizeGrids();

  var randomizeBtn = document.getElementById("randomize");
  randomizeBtn.addEventListener('click', randomizeGrids);

  var blocksSlider = document.getElementById("blocks");
  blocksSlider.addEventListener('input', evt => {
    blocksChance = blocksSlider.value;
    document.getElementById("blocks-val").innerHTML = blocksChance;
  });
}

// Function for randomly placing blocks, source and destination in the scene
function randomizeGrids() {
  
  // If the simulation is running, then stop
  if(simInterval) clearInterval(simInterval);

  // Clear the grids
  for (var i = 0; i < numGrids; i++) {
    grids[i] = [];
    for (var j = 0; j < numGrids; j++) {
      grids[i][j] = FREE; // Initially, all grid blocks are marked as Free
    }
  }
  
  // Generate blocks at random locations with a probability = blockChance (A value from 0 - 1)
  generateBlocks(blocksChance);

  // Get random source and destination points
  source = generateRandomPoint();
  do {
    destination = generateRandomPoint();
  } while(source == destination);

  // Mark them respectively
  grids[source.y][source.x] = SOURCE;
  grids[destination.y][destination.x] = DESTINATION;

  // Start our BFS algorithm
  findPathBFS(source, destination);
}

// Generate blocks at random locations with a probability = blockChance (A value from 0 - 1)
function generateBlocks(chance) {
  for (var i = 0; i < numGrids; i++) {
    for (var j = 0; j < numGrids; j++) {
      var r = random(0, 1);
      if (r <= chance) {
        grids[i][j] = BLOCK;
      }
    }
  }
}

// Gives a random grid point
function generateRandomPoint() {
  var x = floor(random(0, numGrids));
  var y = floor(random(0, numGrids));
  return {
    x: x,
    y: y,
  };
}

// The BFS implementation
function findPathBFS(source, destination) {
  var queue = [];
  queue.push(source);

  // Keep track of visited blocks
  var visited = [];
  for (var i = 0; i < numGrids; i++) {
    visited[i] = [];
    for (var j = 0; j < numGrids; j++) {
      visited[i][j] = false;
    }
  }

  // The destination was found
  var found = false;

  var step = function () {
    if (queue.length > 0 && !found) {
      // Each step is a BFS iteration
      var position = queue.shift();

      if (!visited[position.y][position.x]) {
        visited[position.y][position.x] = true;

        // If the position is not source or destination, put it as SCAN to mark it visually
        if (
          !(position == source) &&
          !(position.x == destination.x && position.y == destination.y)
        )
          grids[position.y][position.x] = SCAN;

        // If destination is reached, start tracing the points
        if (position.x == destination.x && position.y == destination.y) {
          markPath(position.parent, source);
          found = true;
          return;
        }

        // The adjacent blocks
        var up = { x: position.x, y: position.y - 1, parent: position };
        var down = { x: position.x, y: position.y + 1, parent: position };
        var left = { x: position.x - 1, y: position.y, parent: position };
        var right = { x: position.x + 1, y: position.y, parent: position };

        if (validPosition(up)) queue.push(up);
        if (validPosition(down)) queue.push(down);
        if (validPosition(left)) queue.push(left);
        if (validPosition(right)) queue.push(right);
      }
    } else {
      // If reached end, clear the interval
      clearInterval(simInterval);
    }
  };

  // Start simulation with 10 ms delay between iterations
  simInterval = setInterval(step, 10);
}

// Given a position with x and y, tells wether the position is in range
function validPosition(position) {
  return (
    position.x >= 0 &&
    position.x < numGrids &&
    position.y >= 0 &&
    position.y < numGrids &&
    grids[position.y][position.x] != BLOCK
  );
}

// Backtrack from -> to.
// Mark the points as PATH to mark them in the scene.
function markPath(from, to) {
  while (!(from.x == to.x && from.y == to.y)) {
    grids[from.y][from.x] = PATH;
    from = from.parent;
  }
}

// Called once per frame (Refer to p5js)
function draw() {
  // Set the background as rgb = (42,42,42)
  background(42);
  noStroke();

  // Fill the blocks according to the color map
  for (var i = 0; i < numGrids; i++) {
    for (var j = 0; j < numGrids; j++) {
      fill(COLOR_MAP[grids[i][j]]);
      rect(j * gridSize, i * gridSize, gridSize, gridSize);
    }
  }

  // Draw grid lines over the screen
  stroke(255, 80);
  strokeWeight(1);
  for (var i = 0; i < numGrids + 1; i++) {
    line(i * gridSize, 0, i * gridSize, canvasSize); // Vertical lines
    line(0, i * gridSize, canvasSize, i * gridSize); // Horizontal lines
  }
}