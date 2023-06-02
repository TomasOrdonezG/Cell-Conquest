// ! DEFINE GLOBAL CONSTANTS
const root = getComputedStyle(document.documentElement);

// Colours
const COLOUR = {
  white: "white",
  black: "black",
  red: "red",
  blue: "rgb(57, 57, 234)",
  orange: "orange",
  yellow: "yellow",
};

function randInt(max) {
  // * Gets a random int from 1 up to a specified number inclusive
  const randInt = Math.floor(Math.random() * max) + 1;
  return randInt;
}

function randChoiceArray(array) {
  // Generate a random index within the range of the array length
  var randomIndex = randInt(array.length) - 1;

  // Return the random element from the array
  return array[randomIndex];
}

class Square {
  constructor(type, x, y) {
    this.colour = COLOUR[type];
    this.type = type;
    this.x = x;
    this.y = y;
    this.age = 0;
  }
}

class Grid {
  constructor(gridW, gridH, id) {
    this.gridContainer = document.getElementById(id);
    this.gridW = gridW;
    this.gridH = gridH;

    // Object containing objects of all colour squares
    this.squareDict = {
      black: {},
      red: {},
      blue: {},
      green: {},
      yellow: {},
      orange: {},
      white: {},
    };
    // grid of all squares
    this.squareMatrix = this.createSquareMatrixAndDivs();

    this.initialize();
  }

  initialize() {
    // * What runs before the game starts: Set up of the board
    this.style();
    this.initialBlackZone(10);
  }

  frame() {
    let win = false;

    // * Check win or lose
    win = this.checkEnd();

    if (!win) {
      // * REACTIONS
      this.executeReactions();

      // * Black always spreads at the end
      this.spreadBlackBy(1);
    } else {
      this.win();
    }
  }

  handleClick(x, y) {
    // * Handle click with given position
    if (!this.isColour("blue", x, y) && !this.isColour("red", x, y)) {
      // * Don't update when click a blue
      this.changeSquare("blue", x, y);

      // * Run a single frame per click
      if (isPaused) {
        this.frame();
      }
    }
  }

  executeReactions() {
    // ! REACTION METHODS ARE EXECUTED IN A VERY SPECIFIC ORDER
    this.updateRed();
    this.bornRed();

    this.updateYellow();

    this.bornOrange();
    this.updateOrange();
  }

  // * EXECUTE REACTION METHODS
  updateYellow() {
    // * Yellow moves randomly and spreads blue 6 times, it can destroy reds too
    for (var yellowSq of Object.values(this.squareDict["yellow"])) {
      // Constants
      const { x, y } = yellowSq;
      const newAge = yellowSq.age - 1;

      // * Destroy at age 0
      if (newAge == 0) {
        this.changeSquare("blue", x, y);
      } else {
        // * Jump
        const jumpToAvailable = this.getNeighbouringSquares(x, y, [
          "black",
          "white",
          "red",
          "blue",
        ]);
        if (jumpToAvailable.legnth != 0) {
          const jumpTo = randChoiceArray(jumpToAvailable);

          const { x: jumpX, y: jumpY } = jumpTo;
          this.changeSquare(jumpTo.type, x, y);
          this.changeSquare("yellow", jumpX, jumpY);
          yellowSq = this.getSquare(jumpX, jumpY);
        }

        // * Spread
        const spreadTo = this.getRandomNeighbours(x, y, 6, ["black", "red"]);
        if (spreadTo.length != 0) {
          for (var sq of spreadTo) {
            this.changeSquare("blue", sq.x, sq.y);
          }
        }

        yellowSq.age = newAge;
        this.getDiv(yellowSq.x, yellowSq.y).textContent = newAge;
      }
    }
  }

  bornYellow(x, y) {
    // * Creates yellow
    const randomNeighbour = this.getRandomNeighbours(x, y, 1)[0];
    const { x: yellowX, y: yellowY } = randomNeighbour;
    this.changeSquare("yellow", yellowX, yellowY);
    const yellowSq = this.getSquare(yellowX, yellowY);
    const yellowDiv = this.getDiv(yellowX, yellowY);

    // * Points
    yellowSq.age = 10;
    yellowDiv.textContent = yellowSq.age;
  }

  updateRed() {
    // * Red turns two blue and orange neighbours black and moves to a random black neighbour afterwards
    for (var redSq of Object.values(this.squareDict["red"])) {
      // Constants
      const { x, y } = redSq;

      const jumpTo = randChoiceArray(
        this.getNeighbouringSquares(x, y, ["white", "blue", "orange", "black"])
      );
      const spreadTo = this.getRandomNeighbours(x, y, 3, ["blue", "orange"]);

      // * Spread
      for (var sq of spreadTo) {
        this.changeSquare("black", sq.x, sq.y);
      }

      // * Jump
      const { x: jumpX, y: jumpY } = jumpTo;
      this.changeSquare(jumpTo.type, x, y);
      this.changeSquare("red", jumpX, jumpY);
    }
  }

  bornRed() {
    // * Blue between 2 Black -> Blue turns Red
    for (var blueSq of Object.values(this.squareDict["blue"])) {
      const { x: targetX, y: targetY } = blueSq;

      // * Check horizontal
      if (targetX != 1 && targetX != this.gridW) {
        // * Blue has squares of both the right and the left
        if (
          this.isColour("black", targetX - 1, targetY) &&
          this.isColour("black", targetX + 1, targetY)
        ) {
          // * If blue is sandwitched by black horizontally
          this.changeSquare("red", targetX, targetY);
        }
      }

      // * Check vertical
      if (targetY != 1 && targetY != this.gridH) {
        // * Blue has squares of both the top and the bottom
        if (
          this.isColour("black", targetX, targetY - 1) &&
          this.isColour("black", targetX, targetY + 1)
        ) {
          // * If blue is sandwitched by black vertically
          this.changeSquare("red", targetX, targetY);
        }
      }
    }
  }

  bornOrange() {
    // * Black between 2 blues -> black turns orange
    for (var blackSq of Object.values(this.squareDict["black"])) {
      const { x: targetX, y: targetY } = blackSq;

      // * Check horizontal
      if (targetX != 1 && targetX != this.gridW) {
        // * Black has squares of both the right and the left
        if (
          this.isColour("blue", targetX - 1, targetY) &&
          this.isColour("blue", targetX + 1, targetY)
        ) {
          // * If black is sandwitched by blue horizontally
          this.changeSquare("orange", targetX, targetY);
        }
      }

      // * Check vertical
      if (targetY != 1 && targetY != this.gridH) {
        // * Black has squares of both the top and the bottom
        if (
          this.isColour("blue", targetX, targetY - 1) &&
          this.isColour("blue", targetX, targetY + 1)
        ) {
          // * If black is sandwitched by blue vertically
          this.changeSquare("orange", targetX, targetY);
        }
      }
    }
  }

  updateOrange() {
    for (var orangeSq of Object.values(this.squareDict["orange"])) {
      const { x, y } = orangeSq;

      // * Spawn yellow square
      if (orangeSq.age % 5 == 0) {
        if (orangeSq.age != 0) {
          this.bornYellow(x, y);
        }
      }

      this.getDiv(x, y).textContent = orangeSq.age;

      // * Destroy orange sq at age 15 and turn it red
      if (orangeSq.age == 10) {
        this.changeSquare("red", x, y);
      }

      // * Update age of orange squares
      orangeSq.age += 1;
    }
  }

  // ! CHECK METHODS
  checkEnd() {
    if (
      Object.values(this.squareDict["black"]).length === 0 &&
      Object.values(this.squareDict["red"]).length === 0
    ) {
      console.log("win");
      isPaused = true;
      return true;
    }

    return false;
  }

  win() {
    null;
  }

  isColour(type, x, y) {
    // * Checks if a position is a given type
    return this.getSquare(x, y).type == type;
  }

  // ! BLACK ZONE AND SPREAD METHODS
  initialBlackZone(n) {
    // * First
    const rx = randInt(this.gridW);
    const ry = randInt(this.gridH);
    this.changeSquare("black", rx, ry);

    // * Spread
    this.spreadBlackBy(n - 1);
    this.changeSquare("red", rx, ry);
  }

  spreadBlackBy(n) {
    for (let i = 0; i < n; i++) {
      // * Find neighbours that aren't black
      let pivotNeighbours = [];
      while (pivotNeighbours.length === 0) {
        let pivotSquare = this.getRandomSquare("black");
        pivotNeighbours = this.getNeighbouringSquares(
          pivotSquare.x,
          pivotSquare.y,
          ["white", "blue", "orange"]
        );
      }

      // * Spread
      var targetSq = randChoiceArray(pivotNeighbours);
      this.changeSquare("black", targetSq.x, targetSq.y);
    }
  }

  spreadBlueBy(n) {
    for (let i = 0; i < n; i++) {
      // * Find neighbours that aren't blue
      let pivotNeighbours = [];
      while (pivotNeighbours.length === 0) {
        let pivotSquare = this.getRandomSquare("blue");
        pivotNeighbours = this.getNeighbouringSquares(
          pivotSquare.x,
          pivotSquare.y,
          ["white", "black"]
        );
      }

      // * Spread
      var targetSq = randChoiceArray(pivotNeighbours);
      this.changeSquare("blue", targetSq.x, targetSq.y);
    }
  }

  //
  getRandomSquare(type) {
    // * Random square from a type
    const squareObj = this.squareDict[type];

    // Get all keys of the object
    var keys = Object.keys(squareObj);

    // Generate a random index
    var randomIndex = Math.floor(Math.random() * keys.length);

    // Get a random key
    var randomKey = keys[randomIndex];

    // Get the corresponding value from the object
    var randomSquare = squareObj[randomKey];

    return randomSquare;
  }

  changeSquare(newType, x, y) {
    // * Changes a position's square

    // * constants
    const sq = this.getSquare(x, y);
    const oldType = this.getSquare(x, y).type;
    this.getDiv(x, y).textContent = "";

    if (oldType !== newType) {
      // * Reset age and text
      sq.age = 0;

      sq.type = newType;
      sq.colour = COLOUR[newType];
      const posKey = `${x}-${y}`;

      // * remove old sq from set
      delete this.squareDict[oldType][posKey];

      // * add new sq to set
      this.squareDict[newType][posKey] = sq;

      // * Style the div
      this.getDiv(x, y).style.backgroundColor = sq.colour;
    }
  }

  createSquareMatrixAndDivs() {
    // * Creates a div and square matrix
    let squareMatrix = [];
    for (let y = 1; y <= this.gridW; y++) {
      let row = [];
      for (let x = 1; x <= this.gridW; x++) {
        const idxy = `${x}-${y}`;
        // * Create square
        const sq = new Square("white", x, y);
        this.squareDict["white"][idxy] = sq; // Add sq to set

        // * Create div
        const aDiv = document.createElement("div");
        aDiv.id = idxy;
        aDiv.classList.add("grid-item");
        aDiv.style.backgroundColor = sq.colour;
        this.gridContainer.appendChild(aDiv);
        aDiv.addEventListener("click", () => {
          this.handleClick(x, y);
        });

        row.push(sq);
      }
      squareMatrix.push(row);
    }
    return squareMatrix;
  }

  getDiv(x, y) {
    // * Gets the div at the targeted location
    return document.getElementById(`${x}-${y}`);
  }

  getSquare(x, y) {
    // * Subscribes to the square matrix using position
    return this.squareMatrix[y - 1][x - 1];
  }

  getNeighbouringSquares(
    x,
    y,
    filterIn = ["white", "black", "red", "blue", "orange", "yellow"]
  ) {
    x--;
    y--;
    const isOutOfBounds = (row, col) => {
      return row < 0 || col < 0 || row >= this.gridH || col >= this.gridW;
    };

    const neighbors = [];

    // Iterate over the neighboring cells
    for (let i = y - 1; i <= y + 1; i++) {
      for (let j = x - 1; j <= x + 1; j++) {
        if (!isOutOfBounds(i, j) && (i !== y || j !== x)) {
          if (filterIn.includes(this.squareMatrix[i][j].type)) {
            // Filter
            neighbors.push(this.squareMatrix[i][j]);
          }
        }
      }
    }
    return neighbors;
  }

  getRandomNeighbours(
    x,
    y,
    n,
    filterIn = ["white", "black", "red", "blue", "orange", "yellow"]
  ) {
    const neighbours = this.getNeighbouringSquares(x, y, (filterIn = filterIn));

    // Fisher-Yates (Knuth) shuffle
    for (let i = neighbours.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [neighbours[i], neighbours[j]] = [neighbours[j], neighbours[i]];
    }

    if (neighbours.length <= n) {
      return neighbours; // Return all neighbors if there are fewer than or equal to n
    } else {
      return neighbours.slice(0, n); // Return the first n shuffled neighbors
    }
  }

  filterSquares(arrayOfSquares, filterIn) {
    // * Filters out squares of specified types
    let arrayOfSquaresOut = [];
    for (var sq of arrayOfSquares) {
      if (filterIn.includes(sq.type)) {
        arrayOfSquaresOut.push(sq);
      }
    }
    return arrayOfSquaresOut;
  }

  style() {
    // * Styles the grid container
    this.gridContainer.style.gridTemplateColumns = `repeat(${this.gridW}, 1fr)`;
    this.gridContainer.style.gridTemplateRows = `repeat(${this.gridH}, 1fr)`;
  }
}

let isPaused = true;
function gameLoop(grid) {
  if (!isPaused) {
    grid.frame();

    if (Object.values(grid.squareDict["blue"]).length != 0) {
      grid.spreadBlueBy(1);
    }
  }

  setTimeout(() => gameLoop(grid), 300); // * Runs loop every half a second
}

function main() {
  const gridW = 20;
  const gridH = 20;
  const grid = new Grid(gridW, gridH, "grid-container");

  gameLoop(grid);

  // Event listener for the spacebar
  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      isPaused = !isPaused; // Toggle pause state
    }
  });
}

main();
