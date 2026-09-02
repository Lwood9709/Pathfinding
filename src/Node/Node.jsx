import React, { PureComponent } from "react";

import "./Node.css";

export function nodeTypeClass({ isFinish, isStart, isWall }) {
    if (isFinish) return "finish-node";
    if (isStart) return "start-node";
    if (isWall) return "wall-node";
    return "";
}

export default class Node extends PureComponent {
    render() {
        const {
            col,
            isFinish,
            isStart,
            isWall,
            row,
            onMouseDown,
            onMouseEnter,
            onMouseUp,
        } = this.props;

        return (
            <div
                id={`node-${row}-${col}`}
                className={`node ${nodeTypeClass({ isFinish, isStart, isWall })}`}
                onMouseDown={() => onMouseDown(row, col)}
                onMouseEnter={() => onMouseEnter(row, col)}
                onMouseUp={() => onMouseUp()}
            ></div>
        );
    }
}
