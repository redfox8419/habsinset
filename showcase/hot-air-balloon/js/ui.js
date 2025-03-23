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
    
    // Create a player marker for the minimap (3D objects still created for compatibility)
    createMinimapMarker();
    
    // Add HTML overlay markers on top of the minimap
    createMinimapOverlay();
}

// Create HTML overlay for player marker
function createMinimapOverlay() {
    // Get the minimap container
    const minimapContainer = document.getElementById('minimap');
    
    // Create player marker dot element
    const playerMarker = document.createElement('div');
    playerMarker.id = 'minimap-player-marker';
    playerMarker.style.position = 'absolute';
    playerMarker.style.width = '14px';
    playerMarker.style.height = '14px';
    playerMarker.style.backgroundColor = 'red';
    playerMarker.style.border = '2px solid white';
    playerMarker.style.borderRadius = '50%';
    playerMarker.style.top = '50%';
    playerMarker.style.left = '50%';
    playerMarker.style.transform = 'translate(-50%, -50%)';
    playerMarker.style.zIndex = '100';
    playerMarker.style.boxShadow = '0 0 4px rgba(0,0,0,0.5)';
    
    // Create a container that's perfectly centered on the red dot
    const arrowContainer = document.createElement('div');
    arrowContainer.id = 'minimap-arrow-container';
    arrowContainer.style.position = 'absolute';
    arrowContainer.style.width = '0';
    arrowContainer.style.height = '0';
    arrowContainer.style.top = '50%';
    arrowContainer.style.left = '50%';
    arrowContainer.style.transform = 'translate(-50%, -50%)'; // Center perfectly
    arrowContainer.style.zIndex = '101';

    // Create the direction line
    const directionLine = document.createElement('div');
    directionLine.id = 'minimap-direction-arrow'; // Keep the same ID for compatibility
    directionLine.style.position = 'absolute';
    directionLine.style.width = '15px'; // Length of the direction line
    directionLine.style.height = '3px'; // Thickness of the line
    directionLine.style.backgroundColor = 'white';
    directionLine.style.left = '0'; // Start exactly at center
    directionLine.style.top = '-1.5px'; // Vertically center (-height/2)
    directionLine.style.transformOrigin = 'left center'; // Rotate around left point (center)
    directionLine.style.boxShadow = '0 0 3px rgba(0,0,0,0.8)';

    // Create arrowhead at the end of the line
    const arrowHead = document.createElement('div');
    arrowHead.style.position = 'absolute';
    arrowHead.style.width = '0';
    arrowHead.style.height = '0';
    arrowHead.style.borderTop = '5px solid transparent';
    arrowHead.style.borderBottom = '5px solid transparent';
    arrowHead.style.borderLeft = '7px solid white'; // Arrow points right
    arrowHead.style.right = '-7px'; // Position at the end of the line
    arrowHead.style.top = '-3.5px'; // Center vertically

    // Add everything together
    directionLine.appendChild(arrowHead);
    arrowContainer.appendChild(directionLine);
    minimapContainer.appendChild(arrowContainer);
    
    // Add elements to minimap container
    minimapContainer.appendChild(playerMarker);
    
    // Store references for rotation updates
    gameState.minimapPlayerMarker = playerMarker;
    gameState.minimapDirectionArrow = directionLine;
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

// Generic indicator creation function
function createMinimapIndicator(position, color, size, isRing = false) {
    // Create appropriate geometry based on type
    const geometry = isRing 
        ? new THREE.RingGeometry(size, size * 1.5, 16)
        : new THREE.CircleGeometry(size, 16);
    
    // Create material with appropriate properties
    const material = new THREE.MeshBasicMaterial({ 
        color: color,
        transparent: true,
        opacity: isRing ? 0.5 : 0.8,
        side: isRing ? THREE.DoubleSide : THREE.FrontSide
    });
    
    // Create and configure the indicator mesh
    const indicator = new THREE.Mesh(geometry, material);
    indicator.rotation.x = -Math.PI / 2; // Flat facing up
    indicator.position.set(
        position.x,
        isRing ? 1002 : 1003, // Different heights for ring vs beacon
        position.z
    );
    
    // Store indicator type in userData
    indicator.userData.isRing = isRing;
    
    return indicator;
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
        // Create position object for the indicators
        const position = {
            x: orb.position.x,
            z: orb.position.z
        };
        
        // Create a glowing beacon for each orb - INCREASED SIZE
        const beacon = createMinimapIndicator(
            position,
            orb.userData.data.color,
            24, // Doubled size (was 12)
            false // Not a ring
        );
        
        // Create a pulsing outer ring - INCREASED SIZE
        const ring = createMinimapIndicator(
            position,
            orb.userData.data.color,
            24, // Inner size (was 12)
            true // Is a ring
        );
        
        // Store reference to the corresponding orb
        beacon.userData.orb = orb;
        ring.userData.orb = orb;
        
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
        -gameState.balloonPhysics.position.x, // Negate the X coordinate
        1000,
        -gameState.balloonPhysics.position.z
    );
    
    // Update minimap marker position and rotation
    if (gameState.minimapMarkerGroup) {
        gameState.minimapMarkerGroup.position.set(
            -gameState.balloonPhysics.position.x,
            0,
            gameState.balloonPhysics.position.z
        );
        
        // Rotate arrow to match balloon direction
        gameState.minimapArrow.rotation.z = -gameState.balloonGroup.rotation.y;
    }
    
    // Update the HTML overlay direction arrow
    if (gameState.minimapDirectionArrow) {
        // Get balloon's rotation angle and convert to degrees
        // Add 90 degrees to correct the alignment
        const angle = (-gameState.balloonGroup.rotation.y * (180 / Math.PI)) - 90;
        
        // Only apply rotation, no translation needed
        gameState.minimapDirectionArrow.style.transform = `rotate(${angle}deg)`;
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