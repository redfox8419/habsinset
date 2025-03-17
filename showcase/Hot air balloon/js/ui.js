import { gameState } from './gameState.js';

// Set up the minimap
export function setupMinimap() {
    const minimapContainer = document.getElementById('minimap');
    gameState.minimapRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    gameState.minimapRenderer.setSize(200, 200);
    minimapContainer.appendChild(gameState.minimapRenderer.domElement);
    
    // Overhead camera for minimap
    gameState.minimapCamera = new THREE.OrthographicCamera(
        -500, 500, 500, -500, 1, 2000
    );
    gameState.minimapCamera.position.set(0, 1000, 0);
    gameState.minimapCamera.lookAt(new THREE.Vector3(0, 0, 0));
    
    // Create a player marker for the minimap
    createMinimapMarker();
}

// Create a marker to represent the player on the minimap
function createMinimapMarker() {
    // Create a bright marker for the balloon on the minimap - INCREASED SIZE
    const markerGeometry = new THREE.CircleGeometry(30, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFF0000,
        transparent: true,
        opacity: 0.8
    });
    gameState.minimapMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    gameState.minimapMarker.rotation.x = -Math.PI / 2; // Flat circle facing up
    gameState.minimapMarker.position.y = 1001; // Slightly above terrain in minimap view
    
    // Add a direction indicator arrow - INCREASED SIZE
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 20);  // Made arrow larger
    arrowShape.lineTo(-10, -10);  // Made arrow larger
    arrowShape.lineTo(10, -10);  // Made arrow larger
    arrowShape.lineTo(0, 20);   // Made arrow larger
    
    const arrowGeometry = new THREE.ShapeGeometry(arrowShape);
    const arrowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFFFFF,
        side: THREE.DoubleSide
    });
    gameState.minimapArrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
    gameState.minimapArrow.rotation.x = -Math.PI / 2; // Flat pointing up
    gameState.minimapArrow.position.y = 1002; // Above the marker
    
    // Group for marker and arrow
    gameState.minimapMarkerGroup = new THREE.Group();
    gameState.minimapMarkerGroup.add(gameState.minimapMarker);
    gameState.minimapMarkerGroup.add(gameState.minimapArrow);
    
    gameState.scene.add(gameState.minimapMarkerGroup);
    
    // Create orb indicators for the minimap
    createOrbIndicators();
}

// Create indicators for orbs on the minimap
function createOrbIndicators() {
    // Remove any existing indicators
    if (gameState.orbIndicators) {
        gameState.orbIndicators.forEach(indicator => {
            gameState.scene.remove(indicator);
        });
    }
    
    gameState.orbIndicators = [];
    
    // Create an indicator for each knowledge orb
    gameState.knowledgeOrbs.forEach(orb => {
        // Create a glowing beacon for each orb - INCREASED SIZE
        const beaconGeometry = new THREE.CircleGeometry(24, 16);  // Doubled size
        const beaconMaterial = new THREE.MeshBasicMaterial({ 
            color: orb.userData.data.color,
            transparent: true,
            opacity: 0.8
        });
        const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
        beacon.rotation.x = -Math.PI / 2; // Flat circle facing up
        beacon.position.set(
            orb.position.x,
            1003, // Above terrain on minimap
            orb.position.z
        );
        
        // Create a pulsing outer ring - INCREASED SIZE
        const ringGeometry = new THREE.RingGeometry(24, 36, 16);  // Doubled size
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: orb.userData.data.color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2; // Flat ring facing up
        ring.position.set(
            orb.position.x,
            1002, // Above terrain on minimap but below beacon
            orb.position.z
        );
        
        // Store reference to the corresponding orb
        beacon.userData.orb = orb;
        ring.userData.orb = orb;
        ring.userData.isRing = true;
        
        gameState.scene.add(beacon);
        gameState.scene.add(ring);
        
        gameState.orbIndicators.push(beacon);
        gameState.orbIndicators.push(ring);
    });
}

// Update camera to follow balloon
export function updateCamera() {
    // Camera follows behind the balloon
    const cameraOffset = new THREE.Vector3(0, 10, -20);
    const rotatedOffset = cameraOffset.clone().applyQuaternion(gameState.balloonGroup.quaternion);
    
    gameState.camera.position.copy(gameState.balloonPhysics.position).add(rotatedOffset);
    gameState.camera.lookAt(gameState.balloonPhysics.position);
    
    // Update minimap camera - keep it centered on the balloon
    gameState.minimapCamera.position.set(
        gameState.balloonPhysics.position.x,
        1000,
        gameState.balloonPhysics.position.z
    );
    
    // Update minimap marker position and rotation
    if (gameState.minimapMarkerGroup) {
        gameState.minimapMarkerGroup.position.set(
            gameState.balloonPhysics.position.x,
            0,
            gameState.balloonPhysics.position.z
        );
        
        // Rotate arrow to match balloon direction
        gameState.minimapArrow.rotation.z = -gameState.balloonGroup.rotation.y;
    }
    
    // Update orb indicators (make them pulse/flash)
    updateOrbIndicators();
}

// Update orb indicators on the minimap
function updateOrbIndicators() {
    if (!gameState.orbIndicators) return;
    
    gameState.orbIndicators.forEach(indicator => {
        if (indicator.userData.isRing) {
            // Create pulsing/expanding effect for rings
            const pulseScale = 0.8 + Math.sin(Date.now() * 0.005 + indicator.position.x * 0.01) * 0.3;
            indicator.scale.set(pulseScale, pulseScale, pulseScale);
            
            // Adjust opacity for flashing effect
            indicator.material.opacity = 0.1 + Math.sin(Date.now() * 0.005 + indicator.position.z * 0.01) * 0.4;
        } else {
            // Create subtle pulsing for beacons
            const pulseScale = 0.9 + Math.sin(Date.now() * 0.003 + indicator.position.x * 0.01) * 0.2;
            indicator.scale.set(pulseScale, pulseScale, pulseScale);
            
            // Adjust opacity for flashing effect
            indicator.material.opacity = 0.6 + Math.sin(Date.now() * 0.003 + indicator.position.z * 0.01) * 0.4;
        }
    });
}

// Update the compass direction
export function updateCompass() {
    // Get compass elements
    const compassContainer = document.getElementById('compass');
    const compassArrow = document.getElementById('compass-arrow');
    const compassText = document.getElementById('compass-text');
    const needleCenter = document.getElementById('compass-center');
    
    // Get balloon's facing direction
    const direction = -gameState.balloonGroup.rotation.y;
    
    // Update needle rotation to point north relative to balloon direction
    compassArrow.style.transform = `rotate(${direction}rad)`;
    
    // Update compass text with cardinal direction
    const cardinal = getCardinalDirection(direction);
    compassText.textContent = cardinal;
}

// Get cardinal direction from radians
function getCardinalDirection(radians) {
    // Normalize to 0-2π
    const normalized = (radians + Math.PI * 2) % (Math.PI * 2);
    
    // Convert to 0-360 degrees
    const degrees = normalized * (180 / Math.PI);
    
    // Determine cardinal direction
    if (degrees >= 337.5 || degrees < 22.5) return "N";
    if (degrees >= 22.5 && degrees < 67.5) return "NE";
    if (degrees >= 67.5 && degrees < 112.5) return "E";
    if (degrees >= 112.5 && degrees < 157.5) return "SE";
    if (degrees >= 157.5 && degrees < 202.5) return "S";
    if (degrees >= 202.5 && degrees < 247.5) return "SW";
    if (degrees >= 247.5 && degrees < 292.5) return "W";
    if (degrees >= 292.5 && degrees < 337.5) return "NW";
    
    return "N"; // Default
}