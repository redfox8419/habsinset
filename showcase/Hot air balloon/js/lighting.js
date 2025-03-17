import { gameState } from './gameState.js';

// Set up scene lighting
export function setupLights() {
    // Configure lighting based on selected lighting mode
    switch (gameState.selectedLighting) {
        case 'sunset':
            setupSunsetLighting();
            break;
        case 'moonlight':
            setupMoonlightLighting();
            break;
        case 'day':
        default:
            setupDaylightLighting();
            break;
    }
}

// Set up daytime lighting
function setupDaylightLighting() {
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

// Set up sunset lighting
function setupSunsetLighting() {
    // Main directional light (setting sun)
    gameState.directionalLight = new THREE.DirectionalLight(0xFF7E00, 1.2);
    gameState.directionalLight.position.set(50, 50, -150); // Low angle from horizon
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
    
    // Ambient light for general scene illumination - orange tint
    const ambientLight = new THREE.AmbientLight(0x993300, 0.3);
    gameState.scene.add(ambientLight);
    
    // Hemisphere light for better terrain lighting - sunset colors
    const hemisphereLight = new THREE.HemisphereLight(0xFF7700, 0x330000, 0.7);
    gameState.scene.add(hemisphereLight);
    
    // Add extra sunset glow
    const sunsetLight = new THREE.PointLight(0xFF4500, 0.5, 2000);
    sunsetLight.position.set(50, 100, -1000);
    gameState.scene.add(sunsetLight);
}

// Set up moonlight lighting
function setupMoonlightLighting() {
    // Main directional light (moon) - subtle blue tint
    gameState.directionalLight = new THREE.DirectionalLight(0xCCDDFF, 0.3);
    gameState.directionalLight.position.set(-100, 200, 100);
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
    
    // Ambient light for general scene illumination - dark blue night
    const ambientLight = new THREE.AmbientLight(0x001133, 0.2);
    gameState.scene.add(ambientLight);
    
    // Hemisphere light for better terrain lighting - night colors
    const hemisphereLight = new THREE.HemisphereLight(0x0022AA, 0x000033, 0.2);
    gameState.scene.add(hemisphereLight);
    
    // Add moonlight effect
    const moonLight = new THREE.PointLight(0xEEFFFF, 0.8, 1500);
    moonLight.position.set(-1000, 800, 400);
    gameState.scene.add(moonLight);
    
    // Enhance balloon burner glow for moonlight scene
    if (gameState.burnerLight) {
        gameState.burnerLight.intensity = 5;
        gameState.burnerLight.distance = 20;
        gameState.burnerLight.color.set(0xFF6600);
    }
}