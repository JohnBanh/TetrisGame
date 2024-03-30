import "./style.css";
import { BehaviorSubject } from "rxjs";
import { drawFromBag, shuffleBag } from "./utility";

export type Key =
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "KeyR"
  | "Space"
  | "KeyC";

export const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

export const Constants = {
  TICK_RATE_MS: 500,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
  LEVEL_UP_LINES: 5,
} as const;

export const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

export const level$ = new BehaviorSubject<number>(1);

export type FallingBlock = {
  readonly cells: { x: number; y: number }[];
  readonly colour: string;
  readonly type: BlockType;
};

export enum BlockType {
  SQUARE,
  L_SHAPE1,
  L_SHAPE2,
  T_SHAPE,
  LINE,
  Z_SHAPE1,
  Z_SHAPE2,
}

export const squareBlock = (): FallingBlock => ({
  cells: [
    { x: Viewport.CANVAS_WIDTH / 2, y: 0 },
    { x: Viewport.CANVAS_WIDTH / 2 - Block.WIDTH, y: 0 },
    { x: Viewport.CANVAS_WIDTH / 2, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2 - Block.WIDTH, y: Block.HEIGHT },
  ],
  colour: "#FFFF00",
  type: BlockType.SQUARE,
});

export const lShapeBlock1 = (): FallingBlock => ({
  cells: [
    { x: Viewport.CANVAS_WIDTH / 2 - 2 * Block.WIDTH, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2 - Block.WIDTH, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2 - 2 * Block.WIDTH, y: 0 },
    { x: Viewport.CANVAS_WIDTH / 2, y: Block.HEIGHT },
  ],
  colour: "#0000FF",
  type: BlockType.L_SHAPE1,
});

export const lShapeBlock2 = (): FallingBlock => ({
  cells: [
    { x: Viewport.CANVAS_WIDTH / 2 - 2 * Block.WIDTH, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2 - Block.WIDTH, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2, y: 0 },
    { x: Viewport.CANVAS_WIDTH / 2, y: Block.HEIGHT },
  ],
  colour: "#FFA500",
  type: BlockType.L_SHAPE2,
});

export const tShapeBlock = (): FallingBlock => ({
  cells: [
    { x: Viewport.CANVAS_WIDTH / 2 - 2 * Block.WIDTH, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2 - Block.WIDTH, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2 - Block.WIDTH, y: 0 },
  ],
  colour: "#FF00FF",
  type: BlockType.T_SHAPE,
});

export const zShapeBlock1 = (): FallingBlock => ({
  cells: [
    { x: Viewport.CANVAS_WIDTH / 2 - 2 * Block.WIDTH, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2 - Block.WIDTH, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2, y: 0 },
    { x: Viewport.CANVAS_WIDTH / 2 - Block.WIDTH, y: 0 },
  ],
  colour: "#00FF00",
  type: BlockType.Z_SHAPE1,
});

export const zShapeBlock2 = (): FallingBlock => ({
  cells: [
    { x: Viewport.CANVAS_WIDTH / 2 - 2 * Block.WIDTH, y: 0 },
    { x: Viewport.CANVAS_WIDTH / 2 - Block.WIDTH, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2, y: Block.HEIGHT },
    { x: Viewport.CANVAS_WIDTH / 2 - Block.WIDTH, y: 0 },
  ],
  colour: "#FF0000",
  type: BlockType.Z_SHAPE2,
});

export const lineBlock = (): FallingBlock => ({
  cells: [
    { x: Viewport.CANVAS_WIDTH / 2 - Block.WIDTH, y: 0 },
    { x: Viewport.CANVAS_WIDTH / 2, y: 0 },
    { x: Viewport.CANVAS_WIDTH / 2 + Block.WIDTH, y: 0 },
    { x: Viewport.CANVAS_WIDTH / 2 - 2 * Block.WIDTH, y: 0 },
  ],
  colour: "#00FFFF",
  type: BlockType.LINE,
});

export const blockConfigurations: Readonly<
  Record<BlockType, () => FallingBlock>
> = {
  [BlockType.SQUARE]: squareBlock,
  [BlockType.L_SHAPE1]: lShapeBlock1,
  [BlockType.L_SHAPE2]: lShapeBlock2,
  [BlockType.T_SHAPE]: tShapeBlock,
  [BlockType.Z_SHAPE1]: zShapeBlock1,
  [BlockType.Z_SHAPE2]: zShapeBlock2,
  [BlockType.LINE]: lineBlock,
};

export type BlockCell = {
  readonly placed: boolean;
  readonly colour: string;
};

export type State = Readonly<{
  readonly gameEnd: boolean;
  readonly fallingBlock: FallingBlock;
  readonly placedBlocks: ReadonlyArray<ReadonlyArray<BlockCell>>;
  readonly level: number;
  readonly linesCleared: number;
  readonly score: number;
  readonly highScore: number;
  readonly nextBlock: FallingBlock;
  readonly heldBlock?: FallingBlock;
  readonly blockHeldDuringFall: boolean;
  readonly currentSeed: number;
  readonly currentBag: ReadonlyArray<BlockType>;
}>;

export const emptyGrid: ReadonlyArray<ReadonlyArray<BlockCell>> = new Array(
  Constants.GRID_HEIGHT
)
  .fill(null)
  .map(() =>
    new Array(Constants.GRID_WIDTH).fill({ placed: false, colour: "" })
  );

// Draw initial block and update seed and bag
const {
  drawnBlock: initialFallingBlock,
  newSeed: seed,
  newBag: bag,
} = drawFromBag(159, shuffleBag(159));

// Draw next block and update seed and bag again
const {
  drawnBlock: initialNextBlock,
  newSeed: seed2,
  newBag: bag2,
} = drawFromBag(seed, bag);

export const initialState: State = {
  gameEnd: false,
  fallingBlock: initialFallingBlock,
  placedBlocks: emptyGrid,
  level: 1,
  linesCleared: 0,
  score: 0,
  highScore: 0,
  nextBlock: initialNextBlock,
  blockHeldDuringFall: false,
  currentSeed: seed2,
  currentBag: shuffleBag(seed2),
};
