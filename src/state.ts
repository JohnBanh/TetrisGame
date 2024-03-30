import {
  drawFromBag,
  createFallingBlock,
  generateRotatedCells,
  isHorizontalLineBlock,
  isValidPosition,
} from "./utility";
import {
  Viewport,
  Constants,
  Block,
  level$,
  FallingBlock,
  initialState,
  BlockCell,
  State,
  Key,
} from "./types";

export const rotateBlock = (s: State): State => {
  // Collect distinct x and y coordinates of the block
  const xCoords = new Set(s.fallingBlock.cells.map((cell) => cell.x));
  const yCoords = new Set(s.fallingBlock.cells.map((cell) => cell.y));
  // Set the pivot cell as the 2nd cell in the array
  const pivot = s.fallingBlock.cells[1];
  // Check if the block is a horizontal line
  const isLineBlockHorizontal = isHorizontalLineBlock(xCoords);
  // If the block is a square, return early as squares don't rotate
  if (xCoords.size === 2 && yCoords.size === 2) return s;
  // Generate the new cells after rotation
  const newCells = generateRotatedCells(
    s.fallingBlock.cells,
    pivot,
    isLineBlockHorizontal
  );
  // Create a theoretical rotated block
  const rotatedBlock: FallingBlock = { ...s.fallingBlock, cells: newCells };
  // Check if this theoretical rotated block is valid
  if (isValidPosition(rotatedBlock, s.placedBlocks))
    return { ...s, fallingBlock: rotatedBlock };
  // If not, try wall kicks without actually applying them

  // Wall kick tests for the I-block
  const lineBlockWallKickTests = [
    // Standard kicks
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 0 },
    { x: -2, y: 0 },
    // Specific kicks for I-block
    { x: 0, y: 1 },
    { x: 0, y: -1 },
    { x: -1, y: 2 },
    { x: 1, y: -2 },
  ];

  // Standard kick tests for all other blocks
  const standardWallKickTests = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 0 },
    { x: -2, y: 0 },
  ];

  // Determine which set of wall kick tests to use
  const testsToUse = isLineBlockHorizontal
    ? lineBlockWallKickTests
    : standardWallKickTests;

  const validKick = testsToUse.find((test) => {
    const kicked: FallingBlock = {
      ...rotatedBlock,
      cells: rotatedBlock.cells.map((cell) => ({
        x: cell.x + test.x * Block.WIDTH,
        y: cell.y + test.y * Block.HEIGHT,
      })),
    };
    return isValidPosition(kicked, s.placedBlocks);
  });

  if (validKick) {
    const kicked: FallingBlock = {
      ...rotatedBlock,
      cells: rotatedBlock.cells.map((cell) => ({
        x: cell.x + validKick.x * Block.WIDTH,
        y: cell.y + validKick.y * Block.HEIGHT,
      })),
    };
    return { ...s, fallingBlock: kicked };
  }

  // If none of the wall kicks result in a valid position, return the original state
  return s;
};

// Check if the falling block can move in the specified direction ("left" or "right").
export const canMove = (direction: "left" | "right") => (s: State) => {
  // Calculate the horizontal offset based on the direction.
  const offsetX = direction === "left" ? -Block.WIDTH : Block.WIDTH;

  // Identify cells that would be invalid after the move.
  const invalidCells = s.fallingBlock.cells.filter((cell) => {
    // Calculate new X position based on the direction.
    const newX = cell.x + offsetX;
    // Check for collision with canvas edges.
    if (newX < 0 || newX >= Viewport.CANVAS_WIDTH) return true;

    const yIndex = Math.floor(cell.y / Block.HEIGHT);
    const xIndex = Math.floor(newX / Block.WIDTH);

    // Check for collision with already placed blocks.
    return s.placedBlocks[yIndex] && s.placedBlocks[yIndex][xIndex].placed;
  });

  // Can move if no invalid cells found.
  return invalidCells.length === 0;
};

const move = (direction: "left" | "right") => (s: State) => {
  const offsetX = direction === "left" ? -Block.WIDTH : Block.WIDTH;

  return canMove(direction)(s)
    ? {
        ...s,
        fallingBlock: {
          ...s.fallingBlock,
          cells: s.fallingBlock.cells.map((cell) => ({
            x: cell.x + offsetX,
            y: cell.y,
          })),
        },
      }
    : s;
};

export const moveLeft = move("left");
export const moveRight = move("right");

export const moveDown = (s: State) => tick(s);

// Check if the falling block can move downward.
export const canMoveDown = (state: State): boolean => {
  const invalidDownCells = state.fallingBlock.cells.filter((cell) => {
    const newY = cell.y + Block.HEIGHT;
    // Check for collision with canvas bottom.
    if (newY >= Viewport.CANVAS_HEIGHT) return true;

    const yIndex = Math.floor(newY / Block.HEIGHT);
    const xIndex = Math.floor(cell.x / Block.WIDTH);

    // Check for collision with placed blocks.
    return (
      state.placedBlocks[yIndex] && state.placedBlocks[yIndex][xIndex].placed
    );
  });

  // Can move down if no invalid cells found.
  return invalidDownCells.length === 0;
};

// Move the falling block downward by one step.
export const moveBlockDown = (state: State): State => ({
  ...state,
  fallingBlock: {
    ...state.fallingBlock,
    cells: state.fallingBlock.cells.map((cell) => ({
      x: cell.x,
      y: cell.y + Block.HEIGHT,
    })),
  },
});

// Move the falling block all the way down.
export const moveHardDown = (s: State): State => {
  if (canMoveDown(s)) {
    // Move the block down and repeat.
    return moveHardDown(moveBlockDown(s));
  }
  // If can't move down, lock the block.
  return handleBlockLocking(s);
};

// Move the ghost block to its lowest possible position.
export const moveGhostBlockToGround = (
  state: State,
  ghostBlock: FallingBlock
): FallingBlock => {
  if (canMoveDown({ ...state, fallingBlock: ghostBlock })) {
    // Move the ghost block down and repeat.
    return moveGhostBlockToGround(
      { ...state, fallingBlock: ghostBlock },
      moveBlockDown({ ...state, fallingBlock: ghostBlock }).fallingBlock
    );
  }
  // Return final position of the ghost block.
  return ghostBlock;
};

// Get the position where the ghost block would land.
export const getGhostBlockPosition = (state: State): FallingBlock => {
  // Clone the current falling block.
  const initialGhostBlock = { ...state.fallingBlock };
  // Find and return the ground position of the ghost block.
  return moveGhostBlockToGround(state, initialGhostBlock);
};

export const holdBlock = (s: State): State => {
  // Check if the block has already been held during its fall.
  // If so, return the current state unchanged to prevent another hold.
  if (s.blockHeldDuringFall) {
    return s;
  }

  // Determine if we should use the currently held block or draw a new one.
  // We use the held block if it exists.
  const shouldUseHeldBlock = Boolean(s.heldBlock);

  // Determine the type of the next falling block.
  // If a block is currently held, it will become the new falling block.
  // Otherwise, the next block in queue will become the new falling block.
  const newFallingBlockType = shouldUseHeldBlock
    ? s.heldBlock!.type
    : s.nextBlock.type;

  // Create the new falling block based on the determined type.
  const newFallingBlock = createFallingBlock(newFallingBlockType);

  // If a block was held, the next falling block comes from the queue (s.nextBlock).
  // Otherwise, draw a new block from the bag.
  const { drawnBlock, newSeed, newBag } = shouldUseHeldBlock
    ? { drawnBlock: s.nextBlock, newSeed: s.currentSeed, newBag: s.currentBag }
    : drawFromBag(s.currentSeed, s.currentBag);

  return {
    ...s,
    fallingBlock: newFallingBlock,
    heldBlock: createFallingBlock(s.fallingBlock.type),
    blockHeldDuringFall: true,
    nextBlock: drawnBlock,
    currentSeed: newSeed,
    currentBag: newBag,
  };
};

export const restartGame = (s: State): State => {
  const cleanupHeldBlock = () => {
    Array.from({ length: 4 }).map((_, index) => {
      const holdCubeElement = document.getElementById(`holdCube-${index}`);
      if (holdCubeElement) {
        holdCubeElement.parentNode!.removeChild(holdCubeElement);
      }
    });
  };

  // Reset to initial state
  if (s.gameEnd) {
    level$.next(1);
    cleanupHeldBlock();

    // Draw initial block and update seed and bag
    const {
      drawnBlock: initialFallingBlock,
      newSeed: seed,
      newBag: bag,
    } = drawFromBag(s.currentSeed, s.currentBag);

    // Draw next block and update seed and bag again
    const {
      drawnBlock: initialNextBlock,
      newSeed: seed2,
      newBag: bag2,
    } = drawFromBag(seed, bag);

    return {
      ...initialState,
      highScore: Math.max(s.score, s.highScore),
      fallingBlock: initialFallingBlock, // Assuming drawnBlock is already of type FallingBlock, no need to call createFallingBlock
      nextBlock: initialNextBlock, // Assuming drawnBlock is already of type FallingBlock, no need to call createFallingBlock
      blockHeldDuringFall: false,
      heldBlock: undefined,
      currentSeed: seed2,
      currentBag: bag2,
    };
  }
  return s;
};

/**
 * Simulates one game tick by moving the falling block down and checking for collisions.
 * If a collision is detected, handles block locking; otherwise, updates the falling block's position.
 *
 * @param s - The current game state.
 * @returns The updated game state after the tick.
 */
export const tick = (s: State) => {
  // Check for collisions for each cell of the falling block
  const collisions = s.fallingBlock.cells
    .map((cell) => {
      const newY = cell.y + Block.HEIGHT;
      const yIndex = Math.floor(newY / Block.HEIGHT);
      const xIndex = Math.floor(cell.x / Block.WIDTH);

      // Check if the cell is below the canvas or colliding with placed blocks
      return (
        newY >= Viewport.CANVAS_HEIGHT ||
        (s.placedBlocks[yIndex] && s.placedBlocks[yIndex][xIndex].placed)
      );
    })
    .filter((collision) => collision === true);

  const collisionDetected = collisions.length > 0;

  // If collision detected, handle block locking; otherwise, update falling block position
  return collisionDetected
    ? handleBlockLocking(s)
    : {
        ...s,
        fallingBlock: {
          ...s.fallingBlock,
          cells: s.fallingBlock.cells.map((cell) => ({
            x: cell.x,
            y: cell.y + Block.HEIGHT,
          })),
        },
      };
};

export const clearFullRows = (s: State): State => {
  // Filter out full rows from the placed blocks.
  const filteredPlacedBlocks = s.placedBlocks.filter(
    (row) => row.filter((cell) => cell.placed).length !== row.length
  );

  // Calculate how many lines were cleared.
  const reducedLinesCleared =
    s.placedBlocks.length - filteredPlacedBlocks.length;

  // Create new empty rows to replace the cleared lines.
  const emptyRows = new Array(reducedLinesCleared)
    .fill(null)
    .map(() =>
      new Array(Constants.GRID_WIDTH).fill({ placed: false, colour: "" })
    );

  // Combine new empty rows with remaining rows.
  const updatedPlacedBlocks = [...emptyRows, ...filteredPlacedBlocks];

  // Update lines cleared and check for level up.
  const newLinesCleared = s.linesCleared + reducedLinesCleared;
  const levelUp = newLinesCleared >= Constants.LEVEL_UP_LINES;

  // Update level if needed.
  if (levelUp) {
    level$.next(Math.min(s.level + 1, 6));
  }

  // Return new state.
  return {
    ...s,
    placedBlocks: updatedPlacedBlocks,
    score: s.score + reducedLinesCleared * 100,
    level: levelUp ? Math.min(s.level + 1, 6) : s.level,
    linesCleared: levelUp ? 0 : newLinesCleared,
  };
};

export const handleBlockLocking = (s: State): State => {
  // Create a new copy of placed blocks.
  const newPlacedBlocks = s.placedBlocks.map((row) =>
    row.map((cell) => ({ ...cell }))
  );

  // Merge the falling block into the placed blocks.
  const updatedPlacedBlocks = s.fallingBlock.cells.reduce((acc, cell) => {
    const yIndex = Math.floor(cell.y / Block.HEIGHT);
    const xIndex = Math.floor(cell.x / Block.WIDTH);
    acc[yIndex][xIndex] = { placed: true, colour: s.fallingBlock.colour };
    return acc;
  }, newPlacedBlocks);

  // Check for game over condition.
  const gameEnd = s.fallingBlock.cells.some(
    (cell) => Math.floor(cell.y / Block.HEIGHT) === 0
  );

  // Draw new falling block.
  const {
    drawnBlock: newFallingBlock,
    newSeed: seed,
    newBag: bag,
  } = drawFromBag(s.currentSeed, s.currentBag);

  // Update state.
  const newState = {
    ...s,
    gameEnd: gameEnd,
    fallingBlock: s.nextBlock,
    placedBlocks: updatedPlacedBlocks,
    nextBlock: newFallingBlock,
    blockHeldDuringFall: false,
    currentSeed: seed,
    currentBag: bag,
  };

  // Clear full rows and return the updated state.
  return clearFullRows(newState);
};
