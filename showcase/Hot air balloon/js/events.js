import { gameState } from './gameState.js';
import { activateBurner } from './balloon.js';
import { startGame } from './main.js';

// Set up event listeners
export function setupEvents() {
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start button event listener
    document.getElementById('start-button').addEventListener('click', startGame);
    
    // Setup option button listeners
    setupOptionButtons();
}

// Setup option buttons for terrain and lighting
function setupOptionButtons() {
    // Terrain options
    const terrainButtons = document.querySelectorAll('.terrain-button');
    terrainButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove selected class from all terrain buttons
            terrainButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add selected class to clicked button
            button.classList.add('selected');
            
            // Store the selected terrain
            gameState.selectedTerrain = button.getAttribute('data-terrain');
        });
    });
    
    // Lighting options
    const lightingButtons = document.querySelectorAll('.lighting-button');
    lightingButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove selected class from all lighting buttons
            lightingButtons.forEach(btn => btn.classList.remove('selected'));
            
            // Add selected class to clicked button
            button.classList.add('selected');
            
            // Store the selected lighting
            gameState.selectedLighting = button.getAttribute('data-lighting');
        });
    });
}

// Handle keyboard input (keydown)
function handleKeyDown(event) {
    if (gameState.keys.hasOwnProperty(event.code)) {
        gameState.keys[event.code] = true;
        
        // Activate burner effect when moving up
        if (event.code === 'KeyW' && !gameState.burnerActive) {
            activateBurner(true);
        }
        
        event.preventDefault();
    }
}

// Handle keyboard input (keyup)
function handleKeyUp(event) {
    if (gameState.keys.hasOwnProperty(event.code)) {
        gameState.keys[event.code] = false;
        
        // Deactivate burner effect when no longer moving up
        if (event.code === 'KeyW') {
            activateBurner(false);
        }
        
        event.preventDefault();
    }
}

// Handle window resize
export function onWindowResize() {
    gameState.camera.aspect = window.innerWidth / window.innerHeight;
    gameState.camera.updateProjectionMatrix();
    gameState.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update minimap renderer size
    gameState.minimapRenderer.setSize(200, 200);
}