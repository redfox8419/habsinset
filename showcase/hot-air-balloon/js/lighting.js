import { gameState } from './gameState.js';

// Set up scene lighting
export function setupLights() {
    // Configure lighting based on selected lighting mode
    const lightingConfigs = {
        day: {
            directional: { color: 0xFFFFFF, intensity: 1, position: [100, 200, 100] },
            ambient: { color: 0x404040, intensity: 0.5 },
            hemisphere: { skyColor: 0xFFFFFF, groundColor: 0x4CAF50, intensity: 0.5 }
        },
        sunset: {
            directional: { color: 0xFF7E00, intensity: 1.2, position: [50, 50, -150] },
            ambient: { color: 0x993300, intensity: 0.3 },
            hemisphere: { skyColor: 0xFF7700, groundColor: 0x330000, intensity: 0.7 },
            extras: [{
                type: 'point',
                color: 0xFF4500, 
                intensity: 0.5, 
                distance: 2000,
                position: [50, 100, -1000]
            }]
        },
        moonlight: {
            directional: { color: 0xCCDDFF, intensity: 0.3, position: [-100, 200, 100] },
            ambient: { color: 0x001133, intensity: 0.2 },
            hemisphere: { skyColor: 0x0022AA, groundColor: 0x000033, intensity: 0.2 },
            extras: [{
                type: 'point',
                color: 0xEEFFFF,
                intensity: 0.8,
                distance: 1500,
                position: [-1000, 800, 400]
            }],
            burner: { intensity: 5, distance: 20, color: 0xFF6600 }
        }
    };
    
    const config = lightingConfigs[gameState.selectedLighting] || lightingConfigs.day;
    
    // Create directional light
    gameState.directionalLight = new THREE.DirectionalLight(
        config.directional.color, 
        config.directional.intensity
    );
    gameState.directionalLight.position.set(...config.directional.position);
    gameState.directionalLight.castShadow = true;
    
    // Configure shadow properties
    configureShadows(gameState.directionalLight);
    gameState.scene.add(gameState.directionalLight);
    
    // Ambient light for general scene illumination
    const ambientLight = new THREE.AmbientLight(config.ambient.color, config.ambient.intensity);
    gameState.scene.add(ambientLight);
    
    // Hemisphere light for better terrain lighting
    const hemisphereLight = new THREE.HemisphereLight(
        config.hemisphere.skyColor,
        config.hemisphere.groundColor,
        config.hemisphere.intensity
    );
    gameState.scene.add(hemisphereLight);
    
    // Add extra lights if defined
    if (config.extras) {
        config.extras.forEach(light => {
            if (light.type === 'point') {
                const pointLight = new THREE.PointLight(light.color, light.intensity, light.distance);
                pointLight.position.set(...light.position);
                gameState.scene.add(pointLight);
            }
        });
    }
    
    // Configure burner if specified
    if (config.burner && gameState.burnerLight) {
        gameState.burnerLight.intensity = config.burner.intensity;
        gameState.burnerLight.distance = config.burner.distance;
        gameState.burnerLight.color.set(config.burner.color);
    }
}

// Configure standard shadow settings
function configureShadows(light) {
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 10;
    light.shadow.camera.far = 1000;
    light.shadow.camera.left = -500;
    light.shadow.camera.right = 500;
    light.shadow.camera.top = 500;
    light.shadow.camera.bottom = -500;
}