# Live site
https://lwood9709.github.io/Pathfinding/

# Pathfinding Visualizer

This project was built to experiment with implementation of various pathfinding algorithms

## Available Algorithms

Breadth First Search, Depth First Search, Dijkstra, A\*

## Comparing algorithms

Each run records how long the algorithm itself took, how many nodes it
visited, and how long the resulting path is. The last six runs stay in the
Runs table so you can compare algorithms without reloading. The big timer in
the header counts animation wall clock, which is fixed at 10ms per visited
node, so it is a visual readout rather than a benchmark.

Moving the start or finish and pressing Submit keeps your walls. Reset Grid
clears everything.

### Tech stack

Built using react, and class components with vanilla css. MaterialUI for interaction, etc.

#### Next steps

1. Innacuricies with walls added.
2. Add weights for Dijkstra and a\* (BFS and DFS cannot factor in weights).
3. Diagonal movement for the a\* algorithm.
4. Maze generation, so there is something harder than hand-drawn walls to solve.
