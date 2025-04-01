// game.js

// Global constants and game variables
const CELL_SIZE = 24;
const GRID_WIDTH = 28;
const GRID_HEIGHT = 31;

let map = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,3,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,3,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,3,0,0,0,0,0,0,0,0,3,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,1,1,1,2,2,1,1,1,0,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,1,0,0,0,0,0,0,1,0,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,0,0,0,1,0,0,0,0,0,0,1,0,0,0,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,1,0,0,0,0,0,0,1,0,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,0,0,0,0,0,0,0,0,0,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
    [1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
    [1,3,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,3,1],
    [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
    [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
    [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,1,1,0,1],
    [1,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

const initialMap = JSON.parse(JSON.stringify(map));

let gameStarted = false;
let currentLevel = 1;
let questionIndex = 0;
let questionsAnsweredCorrectly = 0;
const questionsPerLevel = 8;
const maxLevel = 4;

let pacmanX = 13;
let pacmanY = 23;
let pacmanDirection = 0; // 0: right, 1: down, 2: left, 3: up

let currentQuestion = null;
let score = 0;
let lives = 3;
let gameMode = 'scatter';
let modeDuration = {
    scatter: [7000, 7000, 5000, 5000],
    chase: [20000, 20000, 20000, 20000]
};
let modeIndex = 0;
let frightenedTimer = null;
let frightenedDuration = 10000;
let frightenedPoints = [200, 400, 800, 1600];
let ghostsEatenCount = 0;
let questionActive = false;

// Define ghosts with an added "index" (for element IDs) and using string directions.
let ghosts = [
    { 
        index: 0,
        name: 'blinky', 
        x: 13, 
        y: 14, 
        color: 'red', 
        direction: 'left', 
        startX: 13, 
        startY: 14,
        scatterTarget: { x: GRID_WIDTH - 1, y: 0 },
        mode: 'scatter'
    },
    { 
        index: 1,
        name: 'pinky', 
        x: 14, 
        y: 14, 
        color: 'pink', 
        direction: 'right', 
        startX: 14, 
        startY: 14,
        scatterTarget: { x: 0, y: 0 },
        mode: 'scatter'
    },
    { 
        index: 2,
        name: 'inky', 
        x: 13, 
        y: 15, 
        color: 'cyan', 
        direction: 'up', 
        startX: 13, 
        startY: 15,
        scatterTarget: { x: GRID_WIDTH - 1, y: GRID_HEIGHT - 1 },
        mode: 'scatter'
    },
    { 
        index: 3,
        name: 'clyde', 
        x: 14, 
        y: 15, 
        color: 'orange', 
        direction: 'up', 
        startX: 14, 
        startY: 15,
        scatterTarget: { x: 0, y: GRID_HEIGHT - 1 },
        mode: 'scatter'
    }
];

function createMap() {
    const container = document.getElementById("gameContainer");
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.style.left = `${x * CELL_SIZE}px`;
            cell.style.top = `${y * CELL_SIZE}px`;
            if (map[y][x] === 1) {
                cell.classList.add("wall");
            } else if (map[y][x] === 0) {
                cell.classList.add("dot");
            } else if (map[y][x] === 3) {
                cell.classList.add("power-pellet");
            }
            container.appendChild(cell);
        }
    }
}

function createGhosts() {
    const container = document.getElementById("gameContainer");
    ghosts.forEach(ghost => {
        const ghostElem = document.createElement("div");
        ghostElem.id = `ghost${ghost.index}`;
        ghostElem.classList.add("ghost");
        ghostElem.style.backgroundColor = ghost.color;
        ghostElem.style.left = `${ghost.x * CELL_SIZE}px`;
        ghostElem.style.top = `${ghost.y * CELL_SIZE}px`;
        container.appendChild(ghostElem);
    });
}

function updateScore() {
    document.getElementById("scoreDisplay").textContent = score;
}

function updateLives() {
    document.getElementById("livesDisplay").textContent = lives;
}

function isWalkable(x, y) {
    if (y === 14) {
        if (x < 0) return map[y][GRID_WIDTH - 1] !== 1;
        if (x >= GRID_WIDTH) return map[y][0] !== 1;
    }
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) {
        return false;
    }
    return map[y][x] !== 1;
}

function handleDot(x, y) {
    if (map[y][x] === 0) {
        map[y][x] = 2;
        score++;
        updateScore();
        const cell = document.querySelector(`.cell[style*="left: ${x * CELL_SIZE}px; top: ${y * CELL_SIZE}px;"]`);
        if (cell) cell.classList.remove("dot");
        if (document.querySelectorAll(".dot").length === 0 && document.querySelectorAll(".power-pellet").length === 0) {
            gameOver("You've collected all items! You win!");
        }
    }
}

function handlePowerPellet(x, y) {
    if (map[y][x] === 3) {
        map[y][x] = 2;
        score += 5;
        updateScore();
        const cell = document.querySelector(`.cell[style*="left: ${x * CELL_SIZE}px; top: ${y * CELL_SIZE}px;"]`);
        if (cell) cell.classList.remove("power-pellet");
        makeGhostsVulnerable();
        askQuestion();
    }
}

function makeGhostsVulnerable() {
    ghostsEatenCount = 0;
    clearTimeout(frightenedTimer);
    ghosts.forEach(ghost => {
        ghost.mode = 'frightened';
        document.getElementById(`ghost${ghost.index}`).classList.add('vulnerable');
    });
    setTimeout(() => {
        ghosts.forEach(ghost => {
            if (ghost.mode === 'frightened') {
                document.getElementById(`ghost${ghost.index}`).classList.add('flash');
            }
        });
    }, frightenedDuration - 2000);
    frightenedTimer = setTimeout(() => {
        ghosts.forEach(ghost => {
            ghost.mode = gameMode;
            const ghostElem = document.getElementById(`ghost${ghost.index}`);
            ghostElem.classList.remove('vulnerable', 'flash');
        });
    }, frightenedDuration);
}

function checkGhostCollision() {
    ghosts.forEach(ghost => {
        if (ghost.x === pacmanX && ghost.y === pacmanY) {
            if (ghost.mode === 'frightened') {
                const points = frightenedPoints[ghostsEatenCount];
                score += points;
                ghostsEatenCount++;
                updateScore();
                const pointsDisplay = document.createElement("div");
                pointsDisplay.textContent = points;
                pointsDisplay.style.position = "absolute";
                pointsDisplay.style.left = `${ghost.x * CELL_SIZE}px`;
                pointsDisplay.style.top = `${ghost.y * CELL_SIZE}px`;
                pointsDisplay.style.color = "white";
                pointsDisplay.style.zIndex = "100";
                document.getElementById("gameContainer").appendChild(pointsDisplay);
                setTimeout(() => { pointsDisplay.remove(); }, 1000);
                // Reset ghost to its starting position
                ghost.x = ghost.startX;
                ghost.y = ghost.startY;
                ghost.mode = gameMode;
                updateGhostPosition(ghost);
            } else {
                lives--;
                updateLives();
                if (lives <= 0) {
                    gameOver("Game Over!");
                } else {
                    resetPositions();
                }
            }
        }
    });
}

function resetPositions() {
    pacmanX = 13;
    pacmanY = 23;
    pacmanDirection = 0;
    updatePacmanPosition();
    ghosts.forEach(ghost => {
        ghost.x = ghost.startX;
        ghost.y = ghost.startY;
        ghost.mode = gameMode;
        updateGhostPosition(ghost);
    });
}

function updateGhostPosition(ghost) {
    const ghostElem = document.getElementById(`ghost${ghost.index}`);
    ghostElem.style.left = `${ghost.x * CELL_SIZE}px`;
    ghostElem.style.top = `${ghost.y * CELL_SIZE}px`;
}

function gameOver(message) {
    document.removeEventListener("keydown", movePacman);
    alert(message);
}

function resetLevel() {
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === 2) {
                if (initialMap[y][x] === 0) {
                    map[y][x] = 0;
                } else if (initialMap[y][x] === 3) {
                    map[y][x] = 3;
                }
            }
        }
    }
    resetPositions();
    const cells = document.querySelectorAll(".cell");
    cells.forEach(cell => cell.remove());
    createMap();
}

function askQuestion() {
    questionActive = true;
    const currentLevelQuestions = questionLevels[`level${currentLevel}`];
    currentQuestion = currentLevelQuestions[questionIndex];
    document.getElementById("question").textContent = currentQuestion.question;
    const answerButtons = document.getElementsByClassName("answerButton");
    for (let i = 0; i < answerButtons.length; i++) {
        if (currentQuestion.answers[i]) {
            answerButtons[i].textContent = currentQuestion.answers[i];
            answerButtons[i].style.display = "inline-block";
            answerButtons[i].classList.remove("shake");
        } else {
            answerButtons[i].style.display = "none";
        }
    }
    document.getElementById("overlay").style.display = "block";
    document.getElementById("questionArea").style.display = "block";
}

function checkAnswer(answerIndex) {
    if (!currentQuestion) return;
    if (answerIndex === currentQuestion.correct) {
        score += 10;
        updateScore();
        questionsAnsweredCorrectly++;
        questionIndex = (questionIndex + 1) % questionsPerLevel;
        if (questionsAnsweredCorrectly === questionsPerLevel) {
            if (currentLevel < maxLevel) {
                currentLevel++;
                questionIndex = 0;
                questionsAnsweredCorrectly = 0;
                resetLevel();
                alert(`Congratulations! Moving to Level ${currentLevel}`);
            } else {
                gameOver("Congratulations! You've completed all levels!");
                return;
            }
        }
        document.getElementById("overlay").style.display = "none";
        document.getElementById("questionArea").style.display = "none";
        questionActive = false;
    } else {
        const answerButtons = document.getElementsByClassName("answerButton");
        const button = answerButtons[answerIndex];
        button.classList.add("shake");
        setTimeout(() => { button.classList.remove("shake"); }, 500);
    }
}

function scaleGame() {
    const gameContainer = document.getElementById("gameContainer");
    const scalingContainer = document.getElementById("gameWrapper");
    const availableWidth = scalingContainer.clientWidth;
    const availableHeight = scalingContainer.clientHeight;
    const scaleX = availableWidth / gameContainer.offsetWidth;
    const scaleY = availableHeight / gameContainer.offsetHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    gameContainer.style.transform = `scale(${scale})`;
}

function initializeModeChanges() {
    function switchMode() {
        gameMode = (gameMode === 'scatter') ? 'chase' : 'scatter';
        ghosts.forEach(ghost => {
            if (ghost.mode !== 'frightened') {
                ghost.mode = gameMode;
            }
        });
        modeIndex++;
        if (modeIndex < modeDuration[gameMode].length) {
            setTimeout(switchMode, modeDuration[gameMode][modeIndex]);
        }
    }
    setTimeout(switchMode, modeDuration.scatter[0]);
}

// Prevent arrow keys from scrolling the page.
window.addEventListener("keydown", function(e) {
    if ([37, 38, 39, 40].includes(e.keyCode)) {
        e.preventDefault();
    }
});

// Start button event listener and game initialization.
document.querySelector(".start-button").addEventListener("click", () => {
    gameStarted = true;
    document.getElementById("startScreen").style.display = "none";
    createMap();
    createPacman();
    createGhosts();
    initializeModeChanges();
    document.addEventListener("keydown", movePacman);
    setInterval(moveAllGhosts, 500);
});

window.addEventListener("load", scaleGame);
window.addEventListener("resize", scaleGame);