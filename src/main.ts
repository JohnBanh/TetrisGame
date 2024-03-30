/**
 * Tetris Game written by John Banh:
 * Controls:
 * Left Right Arrows - Movement Keys
 * Up Arrow - Rotation (Clockwise)
 * Down Arrow - Move down
 * C Key - Hold Block (Once per fall)
 * Space - Hard Down
 */

import "./style.css";
import { fromEvent, interval, merge } from "rxjs";
import { map, filter, scan, switchMap } from "rxjs/operators";
import {
  Constants,
  Viewport,
  level$,
  FallingBlock,
  BlockCell,
  State,
  initialState,
  Block,
  Key,
} from "./types";
import {
  rotateBlock,
  moveLeft,
  moveRight,
  moveDown,
  moveHardDown,
  getGhostBlockPosition,
  holdBlock,
  restartGame,
  tick,
} from "./state";
import { show, hide, createSvgElement } from "./view";
/**
 * This is the function called on page load. Your main game loop
 * should be called here.
 */
export function main() {
  // Canvas elements
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
    HTMLElement;
  const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
    HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
    HTMLElement;
  const svgHold = document.querySelector("#svgHold") as SVGGraphicsElement &
    HTMLElement;

  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

  // Text fields
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  /** User input */

  const keyDown$ = fromEvent<KeyboardEvent>(document, "keydown");

  const fromKey = (keyCode: Key) =>
    keyDown$.pipe(filter(({ code }) => code === keyCode));

  const left$ = fromKey("ArrowLeft");
  const right$ = fromKey("ArrowRight");
  const down$ = fromKey("ArrowDown");
  const restart$ = fromKey("KeyR");
  const up$ = fromKey("ArrowUp");
  const space$ = fromKey("Space");
  const hold$ = fromKey("KeyC");

  /** Observables */
  const leftMove$ = left$.pipe(map(() => moveLeft));
  const rightMove$ = right$.pipe(map(() => moveRight));
  const downMove$ = down$.pipe(map(() => moveDown));
  const rotateMove$ = up$.pipe(map(() => rotateBlock));
  const hardDownMove$ = space$.pipe(map(() => moveHardDown));
  const restartMove$ = restart$.pipe(map(() => restartGame));
  const holdMove$ = hold$.pipe(map(() => holdBlock));

  const tick$ = level$.pipe(
    switchMap((level) => {
      const adjustedRate = Constants.TICK_RATE_MS - level * 70;
      return interval(adjustedRate);
    }),
    map(() => tick)
  );

  const updateOrAppendSvgElement = (
    parent: SVGElement,
    id: string,
    attributes: Record<string, string>
  ): SVGElement => {
    const element = document.getElementById(id) as SVGElement | null;
    if (!element) {
      const newElement = createSvgElement(
        parent.namespaceURI,
        "rect",
        attributes
      );
      parent.appendChild(newElement);
      return newElement;
    }

    Object.entries(attributes).reduce((elem, [key, value]) => {
      elem.setAttribute(key, value);
      return elem;
    }, element);

    return element;
  };

  // A helper function that generates the parameters for updateOrAppendSvgElement
  const createSvgParams = (
    block: FallingBlock | BlockCell,
    x: number,
    y: number,
    index: number,
    idPrefix: string,
    styleOverrides: string = ""
  ) => ({
    id: `${idPrefix}-${index}`,
    height: `${Block.HEIGHT}`,
    width: `${Block.WIDTH}`,
    x: `${x}`,
    y: `${y}`,
    style: `fill: ${block.colour}; ${styleOverrides}`, // Include the style overrides
  });

  const renderHeldBlock = (heldBlock: FallingBlock) =>
    heldBlock.cells.map((cell, index) =>
      updateOrAppendSvgElement(
        svgHold,
        `holdCube-${index}`,
        createSvgParams(
          heldBlock,
          cell.x - Block.WIDTH,
          cell.y + Block.HEIGHT,
          index,
          "holdCube"
        )
      )
    );

  const renderNextBlock = (fallingBlock: FallingBlock) =>
    fallingBlock.cells.map((cell, index) =>
      updateOrAppendSvgElement(
        preview,
        `previewCube-${index}`,
        createSvgParams(
          fallingBlock,
          cell.x - Block.WIDTH,
          cell.y + Block.HEIGHT,
          index,
          "previewCube"
        )
      )
    );

  const renderGhostBlock = (s: State) => {
    const ghostBlock = getGhostBlockPosition(s);
    return ghostBlock.cells.map((cell, index) =>
      updateOrAppendSvgElement(
        svg,
        `ghostCube-${index}`,
        createSvgParams(
          s.fallingBlock,
          cell.x,
          cell.y,
          index,
          "ghostCube",
          "opacity: 0.2"
        )
      )
    );
  };

  const cleanupGhostBlock = () =>
    Array.from({ length: 4 }, (_, index) => {
      const ghostCubeElement = document.getElementById(`ghostCube-${index}`);
      return ghostCubeElement?.parentNode?.removeChild(ghostCubeElement);
    });

  /**
   * Renders the game state by updating the SVG elements on the game board and displaying scores.
   *
   * @param s - The current game state.
   */
  const render = (s: State) => {
    // Render the cells of the falling block
    s.fallingBlock.cells.map((cell, index) =>
      updateOrAppendSvgElement(
        svg,
        `fallingCube-${index}`,
        createSvgParams(s.fallingBlock, cell.x, cell.y, index, "fallingCube")
      )
    );

    // Render placed blocks
    s.placedBlocks.map((row, rowIndex) =>
      row.map((cell, colIndex) => {
        if (cell.placed) {
          // Update or append SVG element for placed block
          return updateOrAppendSvgElement(
            svg,
            `block-${rowIndex}-${colIndex}`,
            createSvgParams(
              cell,
              colIndex * Block.WIDTH,
              rowIndex * Block.HEIGHT,
              colIndex,
              `block-${rowIndex}`
            )
          );
        } else {
          // Remove SVG element for empty cell
          const blockElement = document.getElementById(
            `block-${rowIndex}-${colIndex}`
          );
          return blockElement?.parentNode?.removeChild(blockElement);
        }
      })
    );

    // Clean up ghost block and render the new ghost block
    cleanupGhostBlock();
    renderGhostBlock(s);

    // Render the next block
    renderNextBlock(s.nextBlock);

    // Render held block if available
    if (s.heldBlock) {
      renderHeldBlock(s.heldBlock);
    }

    // Update score text
    levelText.textContent = "Insane!!";
    scoreText.textContent = `${s.score}`;
    levelText.textContent = `${s.level}`;
    highScoreText.textContent = `${Math.max(s.score, s.highScore)}`;
  };

  const actions$ = merge(
    leftMove$,
    rightMove$,
    downMove$,
    tick$,
    rotateMove$,
    hardDownMove$,
    restartMove$,
    holdMove$
  );

  const source$ = actions$
    .pipe(
      scan((state: State, action: (s: State) => State) => {
        if (state.gameEnd) {
          // If the game has ended, only allow the restart action
          if (action === restartGame) {
            return action(state);
          }
          // If the game has ended and it's not a restart action, return the current state
          return state;
        }

        // Otherwise, apply the action
        return action(state);
      }, initialState)
    )
    .subscribe((s: State) => {
      render(s);

      if (s.gameEnd) {
        show(gameover);
      } else {
        hide(gameover);
      }
    });
}

// The following simply runs your main function on window load.  Make sure to leave it in place.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}
