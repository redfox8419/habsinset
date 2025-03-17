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

// Initialize the game
function init() {
    // Set up the scene
    gameState.scene = new THREE.Scene();
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
    
    // Set up animation clock
    gameState.animationClock = new THREE.Clock();
    
    // Set up event listeners
    setupEvents();
    
    // Start the render loop
    animate();
}

// Start the game
function startGame() {
    // Hide the start screen
    document.getElementById('start-screen').style.display = 'none';
    
    // Initialize game state
    gameState.isGameRunning = true;
    gameState.collectedKnowledge = 0;
    updateCollectionCounter();
    
    // Initial altitude display
    updateAltitudeDisplay();
}

// Update the collection counter
function updateCollectionCounter() {
    document.getElementById('collection-counter').textContent = 
        `Knowledge Collected: ${gameState.collectedKnowledge}/${gameState.totalKnowledge}`;
}

// Update the altitude display
function updateAltitudeDisplay() {
    const altitude = Math.floor(gameState.balloonPhysics.position.y);
    document.getElementById('score-display').textContent = `Altitude: ${altitude}m`;
}

// Main animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = Math.min(0.1, gameState.animationClock.getDelta());
    
    if (gameState.isGameRunning) {
        // Update balloon physics
        updateBalloonPhysics(delta);
        
        // Update camera position
        updateCamera();
        
        // Check for collisions with knowledge orbs
        checkOrbCollisions();
        
        // Update burner particles
        updateBurnerParticles(delta);
        
        // Animate knowledge orbs
        animateKnowledgeOrbs(delta);
        
        // Update clouds
        updateClouds(delta);
        
        // Update altitude display
        updateAltitudeDisplay();
        
        // Update the compass
        updateCompass();
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