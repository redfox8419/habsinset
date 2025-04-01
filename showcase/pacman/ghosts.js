// ghosts.js

function getManhattanDistance(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function getNextDirection(ghost, targetTile) {
    const directions = [
        { dx: 0, dy: -1, name: 'up' },
        { dx: -1, dy: 0, name: 'left' },
        { dx: 0, dy: 1, name: 'down' },
        { dx: 1, dy: 0, name: 'right' }
    ];
    let reverse;
    switch(ghost.direction) {
        case 'up': reverse = 'down'; break;
        case 'down': reverse = 'up'; break;
        case 'left': reverse = 'right'; break;
        case 'right': reverse = 'left'; break;
        default: reverse = null;
    }
    let validDirections = directions.filter(d => {
        if (d.name === reverse) return false;
        const newX = ghost.x + d.dx;
        const newY = ghost.y + d.dy;
        return isWalkable(newX, newY);
    });
    if (validDirections.length === 0) {
        validDirections = directions.filter(d => {
            const newX = ghost.x + d.dx;
            const newY = ghost.y + d.dy;
            return isWalkable(newX, newY);
        });
    }
    let bestDirection = validDirections[0];
    let bestDistance = getManhattanDistance(ghost.x + bestDirection.dx, ghost.y + bestDirection.dy, targetTile.x, targetTile.y);
    for (let d of validDirections) {
        const newX = ghost.x + d.dx;
        const newY = ghost.y + d.dy;
        const dist = getManhattanDistance(newX, newY, targetTile.x, targetTile.y);
        if (dist < bestDistance) {
            bestDistance = dist;
            bestDirection = d;
        }
    }
    return bestDirection;
}

function ghostChaseTarget(ghost) {
    if (ghost.mode === 'scatter') {
        return ghost.scatterTarget;
    }
    // Chase targets based on ghost type:
    if (ghost.name === 'blinky') {
        return { x: pacmanX, y: pacmanY };
    } else if (ghost.name === 'pinky') {
        let targetX = pacmanX;
        let targetY = pacmanY;
        const offset = 4;
        if (pacmanDirection === 0) {
            targetX += offset;
        } else if (pacmanDirection === 1) {
            targetY += offset;
        } else if (pacmanDirection === 2) {
            targetX -= offset;
        } else if (pacmanDirection === 3) {
            targetY -= offset;
            targetX -= offset; // the original game “quirk”
        }
        return { x: targetX, y: targetY };
    } else if (ghost.name === 'inky') {
        let targetX = pacmanX;
        let targetY = pacmanY;
        const offset = 2;
        if (pacmanDirection === 0) {
            targetX += offset;
        } else if (pacmanDirection === 1) {
            targetY += offset;
        } else if (pacmanDirection === 2) {
            targetX -= offset;
        } else if (pacmanDirection === 3) {
            targetY -= offset;
        }
        const blinky = ghosts.find(g => g.name === 'blinky');
        return {
            x: targetX + (targetX - blinky.x),
            y: targetY + (targetY - blinky.y)
        };
    } else if (ghost.name === 'clyde') {
        const dist = getManhattanDistance(ghost.x, ghost.y, pacmanX, pacmanY);
        return dist > 8 ? { x: pacmanX, y: pacmanY } : ghost.scatterTarget;
    }
    return { x: pacmanX, y: pacmanY };
}

function moveGhost(ghost) {
    if (ghost.mode === 'frightened') {
        // In frightened mode, choose a random valid direction.
        const directions = [
            { dx: 0, dy: -1, name: 'up' },
            { dx: -1, dy: 0, name: 'left' },
            { dx: 0, dy: 1, name: 'down' },
            { dx: 1, dy: 0, name: 'right' }
        ];
        const validDirs = directions.filter(d => isWalkable(ghost.x + d.dx, ghost.y + d.dy));
        if (validDirs.length > 0) {
            const choice = validDirs[Math.floor(Math.random() * validDirs.length)];
            ghost.direction = choice.name;
            ghost.x += choice.dx;
            ghost.y += choice.dy;
        }
    } else {
        const targetTile = ghostChaseTarget(ghost);
        const nextDir = getNextDirection(ghost, targetTile);
        ghost.direction = nextDir.name;
        ghost.x += nextDir.dx;
        ghost.y += nextDir.dy;
    }
    updateGhostPosition(ghost);
}

function updateGhostPosition(ghost) {
    const ghostElem = document.getElementById(`ghost${ghost.index}`);
    ghostElem.style.left = `${ghost.x * CELL_SIZE}px`;
    ghostElem.style.top = `${ghost.y * CELL_SIZE}px`;
}

function moveAllGhosts() {
    ghosts.forEach(ghost => moveGhost(ghost));
    checkGhostCollision();
}