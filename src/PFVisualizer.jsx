import React, { Component } from "react";
import Node, { nodeTypeClass } from "./Node/Node";
import { BFS, getNodesInShortestPathOrder } from "./algos/BFS";
import { DFS } from "./algos/DFS";
import { Dijkstra } from "./algos/Dijkstra";
import { AStar } from "./algos/AStar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import "./PFVisualizer.css";

const GRID_COL_LENGTH = 30;
const GRID_ROW_LENGTH = 30;
const MAX_ROW = GRID_ROW_LENGTH - 1;
const MAX_COL = GRID_COL_LENGTH - 1;

const MAX_RUNS = 6;
const VISIT_STEP_MS = 10;
const PATH_STEP_MS = 50;

const ALGORITHMS = [
    { key: "bfs", label: "BFS", run: BFS },
    { key: "dfs", label: "DFS", run: DFS },
    { key: "dijkstra", label: "Dijkstra", run: Dijkstra },
    { key: "astar", label: "A*", run: AStar },
];

const LEGEND = [
    { className: "start-node", label: "Start" },
    { className: "finish-node", label: "Finish" },
    { className: "wall-node", label: "Wall" },
    { className: "visited-swatch", label: "Visited" },
    { className: "node-shortest-path", label: "Shortest path" },
];

export default class PFVisualizer extends Component {
    constructor(props) {
        super(props);
        this.state = {
            grid: [],
            mouseIsPressed: false,
            phase: "idle",
            elapsedMs: 0,
            runs: [],
            START_NODE_ROW: 5,
            START_NODE_COL: 5,
            FINISH_NODE_ROW: 10,
            FINISH_NODE_COL: 10,
        };
        this.timeouts = [];
        this.rafHandle = null;
        this.animationStartedAt = 0;
        this.onInputchange = this.onInputchange.bind(this);
        this.onSubmitForm = this.onSubmitForm.bind(this);
        // stable identities so Node's PureComponent check survives the timer's per-frame setState
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseEnter = this.handleMouseEnter.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
    }

    componentDidMount() {
        this.setState({ grid: this.getInitialGrid() });
        window.addEventListener("mouseup", this.handleMouseUp);
    }

    componentWillUnmount() {
        window.removeEventListener("mouseup", this.handleMouseUp);
        this.clearTimeouts();
        this.stopTimer();
    }

    onInputchange(event) {
        const { name, value } = event.target;
        const parsed = parseInt(value, 10);
        if (Number.isNaN(parsed)) return;
        const limit = name.endsWith("_ROW") ? MAX_ROW : MAX_COL;
        this.setState({ [name]: Math.min(Math.max(parsed, 0), limit) });
    }

    onSubmitForm() {
        const grid = this.applyEndpoints(this.state.grid);
        this.restoreGridClasses(grid);
        this.setState({ grid });
    }

    applyEndpoints = (grid) => {
        const {
            START_NODE_ROW,
            START_NODE_COL,
            FINISH_NODE_ROW,
            FINISH_NODE_COL,
        } = this.state;
        return grid.map((row) =>
            row.map((node) => {
                const isStart =
                    node.row === START_NODE_ROW && node.col === START_NODE_COL;
                const isFinish =
                    node.row === FINISH_NODE_ROW &&
                    node.col === FINISH_NODE_COL;
                return {
                    ...node,
                    isStart,
                    isFinish,
                    isWall: isStart || isFinish ? false : node.isWall,
                };
            })
        );
    };

    schedule(callback, delay) {
        this.timeouts.push(setTimeout(callback, delay));
    }

    clearTimeouts() {
        for (const id of this.timeouts) clearTimeout(id);
        this.timeouts = [];
    }

    startTimer() {
        this.stopTimer();
        this.animationStartedAt = performance.now();
        const tick = () => {
            this.setState({
                elapsedMs: performance.now() - this.animationStartedAt,
            });
            this.rafHandle = requestAnimationFrame(tick);
        };
        this.rafHandle = requestAnimationFrame(tick);
    }

    stopTimer() {
        if (this.rafHandle !== null) {
            cancelAnimationFrame(this.rafHandle);
            this.rafHandle = null;
        }
    }

    restoreGridClasses = (grid) => {
        for (const row of grid) {
            for (const node of row) {
                const element = document.getElementById(
                    `node-${node.row}-${node.col}`
                );
                if (element) element.className = `node ${nodeTypeClass(node)}`;
            }
        }
    };

    resetSearchState = (grid) =>
        grid.map((row) =>
            row.map((node) => ({
                ...node,
                isVisited: false,
                // getNodesInShortestPathOrder stops on undefined, so null would loop forever
                previousNode: undefined,
                distance: Infinity,
                f: 0,
                g: 0,
                h: 0,
            }))
        );

    runAlgorithm = (algorithm) => {
        if (this.state.phase === "running") return;

        this.clearTimeouts();
        const grid = this.resetSearchState(this.state.grid);
        this.restoreGridClasses(grid);

        const {
            START_NODE_ROW,
            START_NODE_COL,
            FINISH_NODE_ROW,
            FINISH_NODE_COL,
        } = this.state;
        const startNode = grid[START_NODE_ROW][START_NODE_COL];
        const finishNode = grid[FINISH_NODE_ROW][FINISH_NODE_COL];

        const startedAt = performance.now();
        const result = algorithm.run(grid, startNode, finishNode);
        const computeMs = performance.now() - startedAt;

        const visitedNodesInOrder = result || [];
        const nodesInShortestPathOrder =
            getNodesInShortestPathOrder(finishNode);
        const found = nodesInShortestPathOrder.length > 1;

        const record = {
            key: algorithm.key,
            label: algorithm.label,
            nodesVisited: visitedNodesInOrder.length,
            pathLength: found ? nodesInShortestPathOrder.length : 0,
            computeMs,
            found,
        };

        this.setState((state) => ({
            grid,
            phase: "running",
            elapsedMs: 0,
            runs: [record, ...state.runs].slice(0, MAX_RUNS),
        }));

        this.startTimer();
        this.animate(visitedNodesInOrder, found ? nodesInShortestPathOrder : []);
    };

    animate(visitedNodesInOrder, nodesInShortestPathOrder) {
        for (let i = 0; i < visitedNodesInOrder.length; i++) {
            this.schedule(() => {
                this.paintNode(visitedNodesInOrder[i], "node node-visited");
            }, VISIT_STEP_MS * i);
        }
        this.schedule(() => {
            this.animateShortestPath(nodesInShortestPathOrder);
        }, VISIT_STEP_MS * visitedNodesInOrder.length);
    }

    animateShortestPath(nodesInShortestPathOrder) {
        for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
            this.schedule(() => {
                this.paintNode(
                    nodesInShortestPathOrder[i],
                    "node node-shortest-path"
                );
            }, PATH_STEP_MS * i);
        }
        this.schedule(() => {
            this.finishRun();
        }, PATH_STEP_MS * nodesInShortestPathOrder.length);
    }

    paintNode(node, className) {
        if (node.isStart || node.isFinish) return;
        const element = document.getElementById(`node-${node.row}-${node.col}`);
        if (element) element.className = className;
    }

    finishRun() {
        this.stopTimer();
        this.setState({
            phase: "idle",
            elapsedMs: performance.now() - this.animationStartedAt,
        });
    }

    clearRuns = () => {
        this.setState({ runs: [] });
    };

    handleMouseDown(row, col) {
        if (this.state.phase === "running") return;
        this.setState({
            grid: this.getNewGridWithWallToggled(this.state.grid, row, col),
            mouseIsPressed: true,
        });
    }

    handleMouseEnter(row, col) {
        if (this.state.phase === "running" || !this.state.mouseIsPressed) return;
        this.setState({
            grid: this.getNewGridWithWallToggled(this.state.grid, row, col),
        });
    }

    handleMouseUp() {
        this.setState({ mouseIsPressed: false });
    }

    getInitialGrid = () => {
        const grid = [];
        for (let row = 0; row < GRID_ROW_LENGTH; row++) {
            const currentRow = [];
            for (let col = 0; col < GRID_COL_LENGTH; col++) {
                currentRow.push(this.createNode(col, row));
            }
            grid.push(currentRow);
        }
        return grid;
    };

    getNewGridWithWallToggled = (grid, row, col) => {
        const newGrid = grid.slice();
        const node = newGrid[row][col];
        newGrid[row][col] = { ...node, isWall: !node.isWall };
        return newGrid;
    };

    createNode = (col, row) => {
        const {
            START_NODE_ROW,
            START_NODE_COL,
            FINISH_NODE_ROW,
            FINISH_NODE_COL,
        } = this.state;

        return {
            col,
            row,
            isStart: row === START_NODE_ROW && col === START_NODE_COL,
            isFinish: row === FINISH_NODE_ROW && col === FINISH_NODE_COL,
            isVisited: false,
            previousNode: undefined,
            distance: Infinity,
            isWall: false,
            f: 0,
            g: 0,
            h: 0,
        };
    };

    redoGrid = () => {
        const grid = this.getInitialGrid();
        this.restoreGridClasses(grid);
        this.setState({ grid });
    };

    renderCoordField(name, label) {
        const limit = name.endsWith("_ROW") ? MAX_ROW : MAX_COL;
        return (
            <TextField
                className="coord-field"
                name={name}
                label={label}
                variant="outlined"
                type="number"
                size="small"
                value={this.state[name]}
                onChange={this.onInputchange}
                inputProps={{ min: 0, max: limit }}
            />
        );
    }

    render() {
        const { grid, phase, elapsedMs, runs } = this.state;
        const isRunning = phase === "running";

        return (
            <div className="visualizer">
                <header className="control-bar">
                    <div className="cluster">
                        <span className="cluster-label">Start</span>
                        {this.renderCoordField("START_NODE_ROW", "Row")}
                        {this.renderCoordField("START_NODE_COL", "Col")}
                    </div>
                    <div className="cluster">
                        <span className="cluster-label">Finish</span>
                        {this.renderCoordField("FINISH_NODE_ROW", "Row")}
                        {this.renderCoordField("FINISH_NODE_COL", "Col")}
                    </div>
                    <div className="cluster">
                        <Button
                            variant="outlined"
                            onClick={this.onSubmitForm}
                            disabled={isRunning}
                        >
                            Submit
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={this.redoGrid}
                            disabled={isRunning}
                        >
                            Reset Grid
                        </Button>
                    </div>
                    <div className="cluster">
                        {ALGORITHMS.map((algorithm) => (
                            <Button
                                key={algorithm.key}
                                variant="contained"
                                onClick={() => this.runAlgorithm(algorithm)}
                                disabled={isRunning}
                            >
                                {algorithm.label}
                            </Button>
                        ))}
                    </div>
                    <div className="timer">
                        <span className="timer-value">
                            {(elapsedMs / 1000).toFixed(2)}s
                        </span>
                        <span className="timer-caption">animation</span>
                    </div>
                </header>

                <main className="board">
                    <div className="grid-wrap">
                        <div className="grid">
                            {grid.map((row, rowIdx) => (
                                <div className="grid-row" key={rowIdx}>
                                    {row.map((node, nodeIdx) => (
                                        <Node
                                            key={nodeIdx}
                                            col={node.col}
                                            row={node.row}
                                            isStart={node.isStart}
                                            isFinish={node.isFinish}
                                            isWall={node.isWall}
                                            onMouseDown={this.handleMouseDown}
                                            onMouseEnter={this.handleMouseEnter}
                                            onMouseUp={this.handleMouseUp}
                                        ></Node>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>

                    <aside className="panel">
                        <section className="legend">
                            {LEGEND.map((item) => (
                                <span className="legend-item" key={item.label}>
                                    <span
                                        className={`swatch ${item.className}`}
                                    ></span>
                                    {item.label}
                                </span>
                            ))}
                        </section>

                        <section className="stats">
                            <div className="stats-head">
                                <h2>Runs</h2>
                                <Button
                                    size="small"
                                    onClick={this.clearRuns}
                                    disabled={runs.length === 0}
                                >
                                    Clear
                                </Button>
                            </div>
                            {runs.length === 0 ? (
                                <p className="stats-empty">
                                    Run an algorithm to compare results.
                                </p>
                            ) : (
                                <table className="stats-table">
                                    <thead>
                                        <tr>
                                            <th>Algorithm</th>
                                            <th>Time (ms)</th>
                                            <th>Visited</th>
                                            <th>Path</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {runs.map((run, index) => (
                                            <tr
                                                key={`${run.key}-${index}`}
                                                className={run.found ? "" : "no-path"}
                                            >
                                                <td>
                                                    {run.label}
                                                    {run.found ? null : (
                                                        <span className="tag">
                                                            no path
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{run.computeMs.toFixed(2)}</td>
                                                <td>{run.nodesVisited}</td>
                                                <td>
                                                    {run.found
                                                        ? run.pathLength
                                                        : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            <p className="stats-note">
                                The header timer counts animation wall clock at{" "}
                                {VISIT_STEP_MS}ms per visited node, so it is a
                                visual readout, not a benchmark. Time (ms) above
                                is the real measurement.
                            </p>
                        </section>
                    </aside>
                </main>
            </div>
        );
    }
}
