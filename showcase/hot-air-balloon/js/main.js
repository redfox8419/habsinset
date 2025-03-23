import { gameState } from './gameState.js';
import { setupEvents } from './events.js';
import { createTerrain } from './terrain.js';
import { createSkybox } from './environment.js';
import { createBalloon, updateBalloonPhysics } from './balloon.js';
import { setupLights } from './lighting.js';
import { createKnowledgeOrbs, checkOrbCollisions, animateKnowledgeOrbs } from './knowledge.js';
import { setupMinimap, updateCamera, updateCompass } from './ui.js';
import { updateClouds } from './environment.js';
import { updateBurnerParticles } from './balloon.js';
import { createChallengeStations, animateChallengeStations, checkChallengeCollisions, updateDirectionArrow } from './challenges.js';
import audioSystem from './audio.js';

// Initialize the game
function init() {
    // Set up the scene
    gameState.scene = new THREE.Scene();
    
    // Initial fog will be updated based on lighting
    gameState.scene.fog = new THREE.FogExp2(0xCCE0FF, 0.0005);
    
    // Set up the camera
    gameState.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    gameState.camera.position.set(0, 5, -10);
    gameState.camera.lookAt(new THREE.Vector3(0, 0, 0));
    
    // Set up the renderer
    gameState.renderer = new THREE.WebGLRenderer({ antialias: true });
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    gameState.renderer.setClearColor(0x87CEEB);
    gameState.renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(gameState.renderer.domElement);
    
    // Set up minimap
    setupMinimap();
    
    // Set up event listeners
    setupEvents();
    
    // Initialize the audio system
    initAudio();
    
    // Initialize the score
    gameState.score = 0;
    
    // Enable keys by default
    gameState.keysEnabled = true;
    
    // Don't create the actual game elements yet - wait for user to select options and start
}

// Initialize audio
function initAudio() {
    // Define the path to the burner sound effect
    const burnerSoundPath = 'sounds/burner.mp3';
    
    // Define paths to background music tracks
    const musicTrackPaths = [
        'sounds/track1.mp3',
        'sounds/track2.mp3',
        'sounds/track3.mp3',
        'sounds/track4.mp3',
        // Add more tracks as needed
    ];
    
    // Initialize the audio system
    audioSystem.init(burnerSoundPath, musicTrackPaths);
    
    // Add a sound toggle button to the UI (optional)
    addSoundControls();
}

// Add sound controls to the UI
function addSoundControls() {
    // Create a container for sound controls
    const soundControlsContainer = document.createElement('div');
    soundControlsContainer.id = 'sound-controls';
    soundControlsContainer.style.position = 'absolute';
    soundControlsContainer.style.top = '20px';
    soundControlsContainer.style.right = '140px';
    soundControlsContainer.style.zIndex = '100';
    
    // Create a mute/unmute button
    const soundToggleButton = document.createElement('button');
    soundToggleButton.id = 'sound-toggle';
    soundToggleButton.textContent = '🔊';
    soundToggleButton.style.background = 'rgba(0, 0, 0, 0.5)';
    soundToggleButton.style.color = 'white';
    soundToggleButton.style.border = 'none';
    soundToggleButton.style.borderRadius = '50%';
    soundToggleButton.style.width = '40px';
    soundToggleButton.style.height = '40px';
    soundToggleButton.style.fontSize = '20px';
    soundToggleButton.style.cursor = 'pointer';
    
    let muted = false;
    soundToggleButton.addEventListener('click', () => {
        muted = !muted;
        audioSystem.setMute(muted);
        soundToggleButton.textContent = muted ? '🔇' : '🔊';
    });
    
    soundControlsContainer.appendChild(soundToggleButton);
    document.getElementById('game-container').appendChild(soundControlsContainer);
}

// Start the game
function startGame() {
    // Hide the start screen
    document.getElementById('start-screen').style.display = 'none';
    
    // Initialize game state
    gameState.isGameRunning = true;
    gameState.collectedKnowledge = 0;
    updateCollectionCounter();
    
    // Reset challenge system state
    gameState.completedChallenges = [];
    gameState.masterChallengeCompleted = false;
    
    // Create the environment based on selected settings
    createGameEnvironment();
    
    // Initial altitude display
    updateAltitudeDisplay();
    
    // Start the background music
    audioSystem.startBackgroundMusic();
    
    // Start the animation loop
    if (!gameState.animationClock) {
        gameState.animationClock = new THREE.Clock();
        animate();
    }
}

// Create the game environment with selected options
function createGameEnvironment() {
    // Clear any existing elements
    clearExistingGameElements();
    
    // Create the skybox with dynamic time of day
    createSkybox();
    
    // Create the terrain
    createTerrain();
    
    // Create the hot air balloon
    createBalloon();
    
    // Set up lighting
    setupLights();
    
    // Create knowledge orbs
    createKnowledgeOrbs();
    
    // Create challenge stations
    createChallengeStations();
    
    // Adjust starting position for mountain terrain
    if (gameState.selectedTerrain === 'mountains') {
        // Start at higher altitude in mountains
        gameState.balloonPhysics.position.y = 200;
    }
}

// Clear existing game elements when changing environment
function clearExistingGameElements() {
    // Remove all children that aren't essential
    const essentialObjects = [];
    
    gameState.scene.children.forEach(child => {
        // Only keep essential objects
        if (!essentialObjects.includes(child)) {
            gameState.scene.remove(child);
        }
    });
    
    // Reset arrays
    gameState.terrainChunks = [];
    gameState.knowledgeOrbs = [];
    gameState.challengeStations = [];
    gameState.masterChallenge = null;
}

// Update the collection counter
function updateCollectionCounter() {
    document.getElementById('collection-counter').textContent = 
        `Knowledge Collected: ${gameState.collectedKnowledge}/${gameState.totalKnowledge}`;
}

// Update the altitude display
function updateAltitudeDisplay() {
    const altitude = Math.floor(gameState.balloonPhysics.position.y);
    
    // Check if score-value exists before updating display
    const scoreValueExists = document.getElementById('score-value');
    
    if (scoreValueExists) {
        // If we've added the score display, just update altitude separately
        document.getElementById('altitude-label').textContent = `Altitude: ${altitude}m`;
    } else {
        // Original behavior if score hasn't been added yet
        document.getElementById('score-display').textContent = `Altitude: ${altitude}m`;
    }
}

// Main animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = Math.min(0.1, gameState.animationClock.getDelta());
    
    if (gameState.isGameRunning) {
        // Only update physics if keys are enabled (not in challenge)
        if (gameState.keysEnabled !== false) {
            // Update balloon physics
            updateBalloonPhysics(delta);
        }
        
        // Update camera position
        updateCamera();
        
        // Check for collisions with knowledge orbs
        checkOrbCollisions();
        
        // Check for collisions with challenge stations
        checkChallengeCollisions();
        
        // Update burner particles
        updateBurnerParticles(delta);
        
        // Animate knowledge orbs
        animateKnowledgeOrbs(delta);
        
        // Animate challenge stations
        animateChallengeStations(delta);
        
        // Update clouds
        updateClouds(delta);
        
        // Update altitude display
        updateAltitudeDisplay();
        
        // Update the compass
        updateCompass();
        
        // Update direction arrow if active
        if (typeof updateDirectionArrow === 'function') {
            updateDirectionArrow();
        }
    }
    
    // Render the scene
    gameState.renderer.render(gameState.scene, gameState.camera);
    
    // Render the minimap
    gameState.minimapRenderer.render(gameState.scene, gameState.minimapCamera);
}

// Export functions for event listeners
export { init, startGame, updateCollectionCounter };

// Initialize the game when the page loads
window.onload = init;