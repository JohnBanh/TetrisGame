# Tetris Game by John Banh

## Introduction
This Tetris game is a modern implementation of the classic, with a focus on functional reactive programming (FRP), effective state management, and the implementation of game logic using observables for advanced features such as rotations, wall kicks, ghost blocks, and collision detection.

## Getting Started
Before running the game, make sure you have Node.js installed on your system. You can download Node.js from [the official site](https://nodejs.org/). Node.js includes npm (Node Package Manager), which is essential to manage the project dependencies.

## Installation
Clone the repository to your local machine:

```sh
git clone https://github.com/JohnBanh/TetrisGame.git
cd TetrisGame

```

Then install the project dependencies:
```sh
npm install
```

## Running the Game
To start the game, run:
```sh
npm run dev
```
This command will start the development server. Once the server is running, open your web browser and go to http://localhost:3000 to play the game.

## Controls
Move Left/Right: Use the Left and Right arrow keys.
Rotate: Up-arrow key.
Soft Drop: Down arrow key for faster descent.
Hard Drop: Space bar for immediate placement.
Hold Block: 'C' key to hold a block for future use.

## Features
Rotations Using the Nintendo Rotation System: Adheres to the Nintendo Rotation System (NRS) with pure functional implementations.
Wall Kicks: Integrated within the rotation logic, following standard tests to avoid collisions.
Ghost Blocks: Visual preview of where the block will land.
Move Hard Down: Function for immediate placement of the block in the lowest possible position.
Hold Block: Ability to hold and swap a block for strategic gameplay.
Collision System: Comprehensive collision detection that ensures valid movements and rotations.
Bag of Blocks: "Bag" model employed for the random generation of Tetris blocks with seed-based random hashing.
Level Tracking: BehaviorSubject used to reactively track and update game levels.

## Architecture
The game leverages FRP throughout, representing state changes as a stream of immutable states. Observables are extensively used to manage user inputs, game ticks, and asynchronous events, culminating in a unified game loop that ensures a highly modular and maintainable codebase.

## Conclusion
This implementation stands out by handling complex features and game mechanics with a clean, functional approach. The project is not only an ode to the classic game but also a testament to the robustness and elegance of FRP in modern web game development.
