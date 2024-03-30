import { Observable } from "rxjs";
import { map, scan } from "rxjs/operators";
import {
  Viewport,
  Block,
  FallingBlock,
  BlockType,
  blockConfigurations,
  BlockCell,
} from "./types";

// RNG for the bag shuffling
export class RNG {
  private static m = 0x80000000;
  private static a = 1738123921;
  private static c = 15959;

  public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

  public static scale = (hash: number) => hash / (RNG.m - 1);
}

export function createRngStreamFromSource<T>(source$: Observable<T>) {
  return function createRngStream(seed: number = 0): Observable<number> {
    return source$.pipe(
      scan((accSeed) => RNG.hash(accSeed), seed), // Accumulate the state
      map(RNG.scale) // Scale the value to [-1, 1]
    );
  };
}

// Draw a random block type
export type DrawResult = {
  drawnBlock: FallingBlock;
  newSeed: number;
  newBag: ReadonlyArray<BlockType>;
};

export const drawFromBag = (
  seed: number,
  currentBag: ReadonlyArray<BlockType>
): DrawResult => {
  if (currentBag.length === 0) {
    // If the bag is empty, reshuffle it
    currentBag = shuffleBag(seed);
    seed = RNG.hash(seed); // Generate a new seed for the next bag
  }

  const randomIndex = Math.floor(RNG.scale(RNG.hash(seed)) * currentBag.length);
  const newSeed = RNG.hash(seed);
  const drawnType = currentBag[randomIndex];

  // Remove the drawn block type from the bag
  const newBag = [
    ...currentBag.slice(0, randomIndex),
    ...currentBag.slice(randomIndex + 1),
  ];

  return {
    drawnBlock: createFallingBlock(drawnType),
    newSeed,
    newBag,
  };
};

export const shuffleBag = (seed: number): ReadonlyArray<BlockType> => {
  // Get all block types as an array
  const blockTypes = Object.values(BlockType).filter(
    (value) => typeof value === "number"
  ) as ReadonlyArray<BlockType>;

  // Shuffle the block types array
  const shuffled = blockTypes.reduce((acc, _, currentIndex) => {
    const remaining = acc.length - currentIndex;
    const randomIndex = Math.floor(RNG.scale(RNG.hash(seed)) * remaining);
    seed = RNG.hash(seed); // Update the seed for future iterations

    // Swap the elements at currentIndex and randomIndex
    return acc.map((item, index) => {
      if (index === remaining - 1) return acc[randomIndex];
      if (index === randomIndex) return acc[remaining - 1];
      return item;
    });
  }, blockTypes);

  return shuffled;
};

export const createFallingBlock = (type: BlockType): FallingBlock => {
  const blockFunction = blockConfigurations[type];
  return blockFunction();
};

/** Utility functions */
export const isValidPosition = (
  block: FallingBlock,
  placedBlocks: ReadonlyArray<ReadonlyArray<BlockCell>>
): boolean => {
  // Check if any of the block's cells are in an invalid position
  const invalidCells = block.cells.filter((cell) => {
    // Check if the cell is outside the horizontal boundaries of the canvas
    if (cell.x < 0 || cell.x >= Viewport.CANVAS_WIDTH) return true;
    // Check if the cell is outside the vertical boundaries of the canvas
    if (cell.y < 0 || cell.y >= Viewport.CANVAS_HEIGHT) return true;
    // Check if the cell is colliding with any already placed blocks
    const yIndex = Math.floor(cell.y / Block.HEIGHT);
    const xIndex = Math.floor(cell.x / Block.WIDTH);
    return (
      placedBlocks[yIndex] &&
      placedBlocks[yIndex][xIndex] &&
      placedBlocks[yIndex][xIndex].placed
    );
  });
  // Return true only if no invalid cells were found
  return invalidCells.length === 0;
};

export const isHorizontalLineBlock = (xCoords: Set<number>): boolean => {
  // If the block spans 4 distinct x-coordinates, it is horizontal
  return xCoords.size === 4;
};

export const generateRotatedCells = (
  cells: { x: number; y: number }[],
  pivot: { x: number; y: number },
  isLineHorizontal: boolean
): { x: number; y: number }[] => {
  // Map over each cell and calculate its new position relative to the pivot point
  return cells.map((cell) => {
    const relativeX = cell.x - pivot.x;
    const relativeY = cell.y - pivot.y;
    // Apply the rotation formula based on the type of block
    const newRelativeCoords = isLineHorizontal
      ? { x: relativeY, y: -relativeX }
      : { x: -relativeY, y: relativeX };
    // Translate back to original coordinate system
    return {
      x: pivot.x + newRelativeCoords.x,
      y: pivot.y + newRelativeCoords.y,
    };
  });
};
