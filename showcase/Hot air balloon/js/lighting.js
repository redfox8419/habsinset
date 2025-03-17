import { gameState } from './gameState.js';

// Set up scene lighting
export function setupLights() {
    // Main directional light (sun)
    gameState.directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    gameState.directionalLight.position.set(100, 200, 100);
    gameState.directionalLight.castShadow = true;
    
    // Configure shadow properties
    gameState.directionalLight.shadow.mapSize.width = 2048;
    gameState.directionalLight.shadow.mapSize.height = 2048;
    gameState.directionalLight.shadow.camera.near = 10;
    gameState.directionalLight.shadow.camera.far = 1000;
    gameState.directionalLight.shadow.camera.left = -500;
    gameState.directionalLight.shadow.camera.right = 500;
    gameState.directionalLight.shadow.camera.top = 500;
    gameState.directionalLight.shadow.camera.bottom = -500;
    
    gameState.scene.add(gameState.directionalLight);
    
    // Ambient light for general scene illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    gameState.scene.add(ambientLight);
    
    // Hemisphere light for better terrain lighting
    const hemisphereLight = new THREE.HemisphereLight(0xFFFFFF, 0x4CAF50, 0.5);
    gameState.scene.add(hemisphereLight);
}