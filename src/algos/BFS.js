/*

1. Add root node to the queue, and mark it as visited(already explored).
2. Loop on the queue as long as it's not empty.
   1. Get and remove the node at the top of the queue(current).
   2. For every non-visited child of the current node, do the following: 
       1. Mark it as visited.
       2. Check if it's the goal node, If so, then return it.
       3. Otherwise, push it to the queue.
3. If queue is empty, then goal node was not found!
*/

export function BFS(grid, startNode, finishNode) {
    const visitedNodesInOrder = [];
    const queue =[];
    //1. Add root node to the queue, and mark it as visited(already explored).
    startNode.isVisited = true
    visitedNodesInOrder.push(startNode)
    queue.push(startNode);
    //2. Loop on the queue as long as it's not empty.
    while (queue.length) {
        //1. Get and remove the node at the top of the queue(current).
         let i = queue.shift();
        //2. For every non-visited child of the current node, do the following:
            const UnvisitedNeighbors = getUnvisitedNeighbors(i,grid);
            for(const neighbor of UnvisitedNeighbors){
        //1. Mark it as visited.
                if (neighbor.isWall) continue;
                visitedNodesInOrder.push(neighbor)
                neighbor.isVisited = true;
                neighbor.previousNode = i;
        //2. Check if it's the goal node, If so, then return it.
                if (neighbor === finishNode){
                    
                    return visitedNodesInOrder;
                }
        //3. Otherwise, push it to the queue.
                else queue.push(neighbor);

        }}
    return visitedNodesInOrder;
}

function getUnvisitedNeighbors(node, grid) {
    const neighbors = [];
    const {col, row} = node;
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < grid.length - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < grid[0].length - 1) neighbors.push(grid[row][col + 1]);
    return neighbors.filter(neighbor => !neighbor.isVisited);
  }

  export function getNodesInShortestPathOrder(finishNode) {
    const nodesInShortestPathOrder = [];
    let currentNode = finishNode;
    while (currentNode !== undefined) {
      nodesInShortestPathOrder.unshift(currentNode);
      currentNode = currentNode.previousNode;
    }
    return nodesInShortestPathOrder;
  }

 