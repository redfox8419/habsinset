// pacman.js
function createPacman() {
    const pacman = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    pacman.setAttribute("viewBox", "0 0 40 40");
    pacman.setAttribute("width", "24");
    pacman.setAttribute("height", "24");
    pacman.id = "pacman";
    pacman.classList.add("pacman");
    
    pacman.innerHTML = `
        <g id="pacman-body">
            <circle cx="20" cy="20" r="20" fill="yellow"/>
            <circle cx="20" cy="12" r="3" fill="black" class="eye"/>
            <path d="M20 20 L40 5 L40 35 Z" fill="black">
                <animate 
                    attributeName="d" 
                    dur="0.3s" 
                    repeatCount="indefinite"
                    values="M20 20 L40 5 L40 35 Z;
                           M20 20 L40 15 L40 25 Z;
                           M20 20 L40 5 L40 35 Z"
                />
            </path>
        </g>
    `;
    pacman.style.position = "absolute";
    pacman.style.left = `${pacmanX * CELL_SIZE}px`;
    pacman.style.top = `${pacmanY * CELL_SIZE}px`;
    document.getElementById("gameContainer").appendChild(pacman);
}

function movePacman(event) {
    if (!gameStarted || questionActive) return;

    let nextX = pacmanX;
    let nextY = pacmanY;
    let newDirection = pacmanDirection; // 0: right, 1: down, 2: left, 3: up

    switch (event.key) {
        case "ArrowLeft":
            nextX--;
            newDirection = 2;
            break;
        case "ArrowRight":
            nextX++;
            newDirection = 0;
            break;
        case "ArrowUp":
            nextY--;
            newDirection = 3;
            break;
        case "ArrowDown":
            nextY++;
            newDirection = 1;
            break;
        default:
            return;
    }

    if (isWalkable(nextX, nextY)) {
        pacmanX = nextX;
        pacmanY = nextY;
        pacmanDirection = newDirection;
        updatePacmanPosition();
        handleDot(pacmanX, pacmanY);
        handlePowerPellet(pacmanX, pacmanY);
        checkGhostCollision();
    }
}

function updatePacmanPosition() {
    const pacman = document.getElementById("pacman");
    const eye = pacman.querySelector(".eye");
    
    // Tunnel wrap-around (for row 14)
    if (pacmanY === 14) {
        if (pacmanX < 0) pacmanX = GRID_WIDTH - 1;
        if (pacmanX >= GRID_WIDTH) pacmanX = 0;
    }
    pacman.style.left = `${pacmanX * CELL_SIZE}px`;
    pacman.style.top = `${pacmanY * CELL_SIZE}px`;

    // Rotate Pac-Man based on direction
    switch(pacmanDirection) {
        case 0:
            pacman.style.transform = "rotate(0deg)";
            eye.setAttribute("cx", "20");
            eye.setAttribute("cy", "12");
            break;
        case 1:
            pacman.style.transform = "rotate(90deg)";
            eye.setAttribute("cx", "28");
            eye.setAttribute("cy", "20");
            break;
        case 2:
            pacman.style.transform = "rotate(180deg)";
            eye.setAttribute("cx", "20");
            eye.setAttribute("cy", "28");
            break;
        case 3:
            pacman.style.transform = "rotate(270deg)";
            eye.setAttribute("cx", "12");
            eye.setAttribute("cy", "20");
            break;
    }
}