import { gameState } from './gameState.js';
import { activateBurner } from './balloon.js';

// Create challenge stations
export function createChallengeStations() {
    // Clear any existing challenge stations
    gameState.challengeStations.forEach(station => {
        gameState.scene.remove(station);
    });
    gameState.challengeStations = [];
    
    // Create challenge stations from challenge data
    gameState.challengeData.forEach(challengeData => {
        createChallengeStation(challengeData);
    });
    
    // Create master challenge station
    createMasterChallenge();
}

// Create individual challenge station
function createChallengeStation(data) {
    const stationGroup = new THREE.Group();
    
    // Question mark platform
    const platformGeometry = new THREE.CylinderGeometry(10, 12, 3, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x4FC3F7,
        metalness: 0.3,
        roughness: 0.4
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    stationGroup.add(platform);
    
    // Floating C shape for challenge (replacing question mark)
    const cShapeGroup = new THREE.Group();
    
    // Create the C shape using a TorusGeometry (partial ring)
    const cGeometry = new THREE.TorusGeometry(5, 1.5, 16, 32, Math.PI * 1.5); // C shape covers 270 degrees (1.5π)
    const cMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFEB3B,
        emissive: 0xFFEB3B,
        emissiveIntensity: 0.5,
        metalness: 0.5,
        roughness: 0.2
    });
    const cShape = new THREE.Mesh(cGeometry, cMaterial);
    
    // Rotate to make it a 'C' shape
    cShape.rotation.y = Math.PI / 2;
    cShape.rotation.z = Math.PI / 2;
    
    cShapeGroup.add(cShape);
    
    // Position the C shape above the platform
    cShapeGroup.position.y = 12;
    cShapeGroup.scale.set(1.8, 1.8, 1.8); // Make C larger
    stationGroup.add(cShapeGroup);
    
    // Add a point light
    const light = new THREE.PointLight(0xFFEB3B, 2, 100);
    light.position.y = 20;
    stationGroup.add(light);
    
    // Add vertical light beam for visibility from distance - WIDER BEAM
    const beamGeometry = new THREE.CylinderGeometry(3, 3, 200, 16); // Increased diameter from 0.5 to 3
    const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFEB3B,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.position.y = 100; // Extend high into the sky
    stationGroup.add(beam);
    
    // Get the color of the first required knowledge orb for this challenge
    let knowledgeColor = 0xFFEB3B; // Default yellow
    
    // Modify to use color based on challenge index instead of knowledge orb
    // Get the index of this challenge in the challenge data array
    const challengeIndex = gameState.challengeData.findIndex(c => c.id === data.id);
    if (challengeIndex >= 0) {
        // Calculate which knowledge orbs this challenge is associated with
        const knowledgeIndex = challengeIndex * 2; // First associated orb (e.g. challenge 0 -> orbs 0,1)
        if (knowledgeIndex < gameState.knowledgeData.length) {
            knowledgeColor = gameState.knowledgeData[knowledgeIndex].color;
        }
    }
    
    // Update materials to match the knowledge orb color
    cMaterial.color.setHex(knowledgeColor);
    cMaterial.emissive.setHex(knowledgeColor);
    light.color.setHex(knowledgeColor);
    beamMaterial.color.setHex(knowledgeColor);
    
    // Add animation properties
    stationGroup.userData = {
        originalY: data.position.y,
        rotationSpeed: 0.01,
        animationPhase: Math.random() * Math.PI * 2,
        data: data,
        type: 'challenge',
        active: false, // Will be set based on collected knowledge count
        knowledgeColor: knowledgeColor
    };
    
    // Position the station
    stationGroup.position.copy(data.position);
    
    // Set initial visibility - hide the station until knowledge is collected
    stationGroup.visible = false;
    
    // Add to scene and tracking array
    gameState.scene.add(stationGroup);
    gameState.challengeStations.push(stationGroup);
    
    return stationGroup;
}

// Create master challenge station
function createMasterChallenge() {
    const stationGroup = new THREE.Group();
    
    // Create a larger, more elaborate platform
    const platformGeometry = new THREE.CylinderGeometry(20, 25, 5, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
        color: 0x7E57C2,
        metalness: 0.5,
        roughness: 0.3
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    stationGroup.add(platform);
    
    // Add decorative elements to the platform
    const ringGeometry = new THREE.TorusGeometry(22, 2, 16, 100);
    const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xE040FB,
        emissive: 0xE040FB,
        emissiveIntensity: 0.2,
        metalness: 0.7,
        roughness: 0.2
    });
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 3;
    stationGroup.add(ring);
    
    // Create docking structure
    const dockGeometry = new THREE.CylinderGeometry(15, 15, 15, 8);
    const dockMaterial = new THREE.MeshStandardMaterial({
        color: 0x9C27B0,
        transparent: true,
        opacity: 0.7,
        metalness: 0.5,
        roughness: 0.3
    });
    const dock = new THREE.Mesh(dockGeometry, dockMaterial);
    dock.position.y = 12.5;
    stationGroup.add(dock);
    
    // Add pillars around the platform
    const pillarCount = 6;
    for (let i = 0; i < pillarCount; i++) {
        const angle = (i / pillarCount) * Math.PI * 2;
        const radius = 22;
        
        const pillarGeometry = new THREE.CylinderGeometry(1, 1, 12, 8);
        const pillarMaterial = new THREE.MeshStandardMaterial({
            color: 0x9575CD,
            metalness: 0.4,
            roughness: 0.6
        });
        const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
        
        pillar.position.x = Math.cos(angle) * radius;
        pillar.position.z = Math.sin(angle) * radius;
        pillar.position.y = 6;
        
        stationGroup.add(pillar);
        
        // Add a glowing orb on top of each pillar
        const orbGeometry = new THREE.SphereGeometry(2, 16, 16);
        const orbMaterial = new THREE.MeshStandardMaterial({
            color: 0xE040FB,
            emissive: 0xE040FB,
            emissiveIntensity: 0.5,
            metalness: 0.2,
            roughness: 0.3
        });
        const orb = new THREE.Mesh(orbGeometry, orbMaterial);
        orb.position.x = Math.cos(angle) * radius;
        orb.position.z = Math.sin(angle) * radius;
        orb.position.y = 14;
        
        // Add a point light at each orb
        const light = new THREE.PointLight(0xE040FB, 0.5, 30);
        light.position.copy(orb.position);
        stationGroup.add(light);
        
        stationGroup.add(orb);
    }
    
    // Add central beacon light
    const beaconGeometry = new THREE.ConeGeometry(3, 10, 16);
    const beaconMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0xE040FB,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.8
    });
    const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    beacon.position.y = 28;
    stationGroup.add(beacon);
    
    // Add a strong point light at the beacon
    const beaconLight = new THREE.PointLight(0xE040FB, 2, 100);
    beaconLight.position.y = 33;
    stationGroup.add(beaconLight);
    
    // Add animation properties
    stationGroup.userData = {
        originalY: gameState.masterChallengeData.position.y,
        rotationSpeed: 0.005,
        animationPhase: 0,
        data: gameState.masterChallengeData,
        type: 'masterChallenge',
        active: false // Will only be active once all other challenges are completed
    };
    
    // Position the station
    stationGroup.position.copy(gameState.masterChallengeData.position);
    
    // Add to scene and store reference
    gameState.scene.add(stationGroup);
    gameState.masterChallenge = stationGroup;
    
    // Hide initially until all challenges are completed
    stationGroup.visible = false;
    
    return stationGroup;
}

// Animate challenge stations
export function animateChallengeStations(delta) {
    // Animate regular challenge stations
    gameState.challengeStations.forEach(station => {
        // First check if completed - if so, make sure it's hidden
        if (gameState.completedChallenges.includes(station.userData.data.id)) {
            // Make sure the challenge is hidden when completed
            if (station.visible) {
                station.visible = false;
                
                // Also remove minimap indicators for completed challenges
                if (station.userData.minimapMarker) {
                    gameState.scene.remove(station.userData.minimapMarker);
                    station.userData.minimapMarker = null;
                }
                
                if (station.userData.minimapRing) {
                    gameState.scene.remove(station.userData.minimapRing);
                    station.userData.minimapRing = null;
                }
                
                if (station.userData.minimapCShape) {
                    gameState.scene.remove(station.userData.minimapCShape);
                    station.userData.minimapCShape = null;
                }
            }
            return; // Skip animation for completed challenges
        }
        
        // Only animate visible challenges
        if (station.visible) {
            // Rotate the C shape
            if (station.children[1]) {
                station.children[1].rotation.y += station.userData.rotationSpeed;
            }
            
            // Bobbing motion
            station.userData.animationPhase += delta * 0.5;
            station.position.y = station.userData.originalY + Math.sin(station.userData.animationPhase) * 5;
        }
        
        // Update visual appearance based on active status
        updateChallengeVisuals(station);
    });
    
    // Animate master challenge station
    if (gameState.masterChallenge) {
        const masterStation = gameState.masterChallenge;
        
        // Check if master challenge is completed
        if (gameState.masterChallengeCompleted) {
            if (masterStation.visible) {
                masterStation.visible = false;
            }
            return; // Skip animation for completed master challenge
        }
        
        // Only animate if visible
        if (masterStation.visible) {
            // Rotate the station slowly
            masterStation.rotation.y += masterStation.userData.rotationSpeed * delta;
            
            // Bobbing motion
            masterStation.userData.animationPhase += delta * 0.3;
            masterStation.position.y = masterStation.userData.originalY + Math.sin(masterStation.userData.animationPhase) * 3;
        }
        
        // Check if master challenge should be active
        updateMasterChallengeActiveStatus(masterStation);
        
        // Update visual appearance based on active status
        updateMasterChallengeVisuals(masterStation);
    }
}

// Update challenge visuals based on active status
function updateChallengeVisuals(station) {
    // Skip if challenge is completed - it should be hidden entirely
    if (gameState.completedChallenges.includes(station.userData.data.id)) {
        return;
    }
    
    // Change colors and effects based on active status
    if (station.userData.active) {
        // Bright, glowing appearance for active challenges
        if (station.children[0]) { // Platform
            station.children[0].material.emissive = new THREE.Color(0x4FC3F7);
            station.children[0].material.emissiveIntensity = 0.3;
        }
        
        if (station.children[2]) { // Light
            station.children[2].intensity = 2;
            station.children[2].distance = 100;
        }
    } else {
        // Dimmer appearance for inactive challenges
        if (station.children[0]) { // Platform
            station.children[0].material.emissive = new THREE.Color(0x000000);
            station.children[0].material.emissiveIntensity = 0;
        }
        
        if (station.children[2]) { // Light
            station.children[2].intensity = 0.5;
            station.children[2].distance = 30;
        }
    }
}

// Update master challenge active status
function updateMasterChallengeActiveStatus(masterStation) {
    // Check if all 5 regular challenges have been completed
    const allChallengesCompleted = gameState.completedChallenges.length >= 5;
    
    masterStation.userData.active = allChallengesCompleted;
    
    // Show the master challenge if all challenges are completed and it's not visible
    if (allChallengesCompleted && !masterStation.visible) {
        masterStation.visible = true;
        createChallengeRevealEffect(masterStation);
    }
}

// Update master challenge visuals based on active status
function updateMasterChallengeVisuals(masterStation) {
    // Skip if master challenge is completed - it should be hidden entirely
    if (gameState.masterChallengeCompleted) {
        masterStation.visible = false;
        return;
    }
    
    if (masterStation.userData.active) {
        // Bright, pulsing appearance for active master challenge
        if (masterStation.children[0]) { // Platform
            masterStation.children[0].material.emissive = new THREE.Color(0x7E57C2);
            masterStation.children[0].material.emissiveIntensity = 0.4;
        }
        
        if (masterStation.children[1]) { // Ring
            masterStation.children[1].material.emissiveIntensity = 0.5 + Math.sin(masterStation.userData.animationPhase * 2) * 0.3;
        }
        
        if (masterStation.children[2]) { // Dock
            masterStation.children[2].material.opacity = 0.7 + Math.sin(masterStation.userData.animationPhase * 3) * 0.2;
        }
        
        // Beacon and beacon light
        if (masterStation.children[masterStation.children.length - 2]) { // Beacon
            masterStation.children[masterStation.children.length - 2].material.emissiveIntensity = 0.8 + Math.sin(masterStation.userData.animationPhase * 4) * 0.2;
        }
        
        if (masterStation.children[masterStation.children.length - 1]) { // Beacon light
            masterStation.children[masterStation.children.length - 1].intensity = 2 + Math.sin(masterStation.userData.animationPhase * 4) * 1;
        }
    } else {
        // Hide master challenge until active
        masterStation.visible = false;
        
        // Dimmer appearance for inactive master challenge
        if (masterStation.children[0]) { // Platform
            masterStation.children[0].material.emissive = new THREE.Color(0x000000);
            masterStation.children[0].material.emissiveIntensity = 0;
        }
        
        if (masterStation.children[1]) { // Ring
            masterStation.children[1].material.emissiveIntensity = 0.1;
        }
        
        if (masterStation.children[2]) { // Dock
            masterStation.children[2].material.opacity = 0.4;
        }
        
        // Beacon and beacon light
        if (masterStation.children[masterStation.children.length - 2]) { // Beacon
            masterStation.children[masterStation.children.length - 2].material.emissiveIntensity = 0.2;
        }
        
        if (masterStation.children[masterStation.children.length - 1]) { // Beacon light
            masterStation.children[masterStation.children.length - 1].intensity = 0.5;
        }
    }
}

// Create a visual effect when a challenge station appears
// Show a challenge station without animation
export function createChallengeRevealEffect(station) {
    // Set to final position and scale immediately
    station.position.y = station.userData.originalY;
    station.scale.set(1, 1, 1);
    
    // Create popup notification immediately
    createChallengeNotification(station);
}

// Function to activate a challenge from outside this module
export function activateChallenge(challengeId) {
    // Find the challenge station by ID
    const challengeStation = gameState.challengeStations.find(station => 
        station.userData.data.id === challengeId
    );
    
    if (challengeStation) {
        // Force the challenge to be active
        challengeStation.userData.active = true;
        challengeStation.visible = true;
        
        // Use our reveal effect
        createChallengeRevealEffect(challengeStation);
    }
}

// Create a notification when a new challenge appears
export function createChallengeNotification(station) {
    // Get challenge data
    const challengeData = station.userData.data;
    
    // Create the notification element
    const notification = document.createElement('div');
    notification.className = 'challenge-notification';
    notification.innerHTML = `
        <div class="notification-icon">C</div>
        <div class="notification-content">
            <div class="notification-title">New Challenge Available!</div>
            <div class="notification-text">${challengeData.title}</div>
        </div>
    `;
    
    // Add styles for the notification
    if (!document.getElementById('notification-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'notification-styles';
        styleElement.textContent = `
            .challenge-notification {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 20px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                gap: 15px;
                z-index: 1000;
                max-width: 400px;
                border: 3px solid #FFD700;
                box-shadow: 0 0 25px rgba(255, 215, 0, 0.8);
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0% { box-shadow: 0 0 25px rgba(255, 215, 0, 0.8); }
                50% { box-shadow: 0 0 35px rgba(255, 215, 0, 1); }
                100% { box-shadow: 0 0 25px rgba(255, 215, 0, 0.8); }
            }
            
            .notification-icon {
                background-color: #FFD700;
                color: black;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 30px;
                font-weight: bold;
            }
            
            .notification-content {
                flex: 1;
            }
            
            .notification-title {
                font-weight: bold;
                font-size: 24px;
                margin-bottom: 10px;
                color: #FFD700;
            }
            
            .notification-text {
                font-size: 18px;
                margin-bottom: 15px;
            }
            
            .notification-button {
                background-color: #FFD700;
                color: black;
                border: none;
                padding: 8px 15px;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                margin-top: 5px;
                display: block;
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    // Set the notification color based on knowledge color
    if (station.userData.knowledgeColor) {
        const colorHex = '#' + station.userData.knowledgeColor.toString(16).padStart(6, '0');
        notification.style.borderColor = colorHex;
        notification.style.boxShadow = `0 0 25px ${colorHex}`;
        notification.querySelector('.notification-icon').style.backgroundColor = colorHex;
        notification.querySelector('.notification-title').style.color = colorHex;
        
        // Update animation
        const styleSheet = document.styleSheets[document.styleSheets.length - 1];
        for (let i = 0; i < styleSheet.cssRules.length; i++) {
            if (styleSheet.cssRules[i].type === CSSRule.KEYFRAMES_RULE && 
                styleSheet.cssRules[i].name === 'pulse') {
                styleSheet.deleteRule(i);
                const newAnimation = `
                    @keyframes pulse {
                        0% { box-shadow: 0 0 25px ${colorHex}80; }
                        50% { box-shadow: 0 0 35px ${colorHex}; }
                        100% { box-shadow: 0 0 25px ${colorHex}80; }
                    }
                `;
                styleSheet.insertRule(newAnimation, i);
                break;
            }
        }
    }
    
    // Add to document
    document.body.appendChild(notification);
    
    // Center in view with dramatic entrance
    notification.style.transform = 'translate(-50%, -50%) scale(0.5)';
    notification.style.opacity = '0';
    
    // Animate in
    setTimeout(() => {
        notification.style.transition = 'all 0.5s ease-out';
        notification.style.transform = 'translate(-50%, -50%) scale(1)';
        notification.style.opacity = '1';
    }, 100);
    
    // Remove after delay (longer time to ensure player sees it)
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.transform = 'translate(-50%, -50%) scale(1.2)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 500);
        }
    }, 8000);
    
    // Also add the challenge to the minimap
    addChallengeToMinimap(station);
}

// Add challenge to minimap
function addChallengeToMinimap(station) {
    // Create a distinct marker for the challenge on the minimap
    const markerGeometry = new THREE.CircleGeometry(15, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
        color: station.userData.knowledgeColor || 0xFFEB3B,
        transparent: true,
        opacity: 0.8
    });
    
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.rotation.x = -Math.PI / 2; // Flat circle facing up
    marker.position.set(station.position.x, 1005, station.position.z); // Above terrain in minimap view
    
    // Add a C shape symbol
    if (!THREE.TextGeometry) {
        const ringGeometry = new THREE.RingGeometry(5, 8, 16, 8, 0, Math.PI * 1.5); // Using ring geometry for C shape
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = -Math.PI / 2;
        ring.position.set(station.position.x, 1006, station.position.z);
        gameState.scene.add(ring);
        
        // Save reference to the ring
        station.userData.minimapRing = ring;
    } else {
        // If TextGeometry available, we could use it, but using ring for consistency
        const cGeometry = new THREE.RingGeometry(5, 8, 16, 8, 0, Math.PI * 1.5);
        const cMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const cShape = new THREE.Mesh(cGeometry, cMaterial);
        cShape.rotation.x = -Math.PI / 2;
        cShape.position.set(station.position.x, 1006, station.position.z);
        gameState.scene.add(cShape);
        
        station.userData.minimapCShape = cShape;
    }
    
    gameState.scene.add(marker);
    station.userData.minimapMarker = marker;
    
    // Make the marker pulse
    const startTime = Date.now();
    function animateMarker() {
        if (marker.parent) { // Check if marker is still in the scene
            const time = Date.now() - startTime;
            const scale = 1 + 0.3 * Math.sin(time * 0.003);
            marker.scale.set(scale, scale, scale);
            
            // Also animate the opacity for a pulsing effect
            marker.material.opacity = 0.4 + 0.4 * Math.sin(time * 0.003);
            
            requestAnimationFrame(animateMarker);
        }
    }
    
    animateMarker();
}

// Update direction arrow to point toward target - kept for compatibility but not used
export function updateDirectionArrow() {
    // Function is kept but doesn't do anything now
    return;
}

// Check for collisions with challenge stations
// Add cooldown time tracking (at the top of the file)
let lastChallengeTime = 0;
const CHALLENGE_COOLDOWN = 2000; // 2 seconds cooldown between challenge triggers

export function checkChallengeCollisions() {
    if (gameState.challengeStations.length === 0 && !gameState.masterChallenge) return;
    
    // Don't check for collisions if a challenge is already active or on cooldown
    if (isChallengeActive || (Date.now() - lastChallengeTime) < CHALLENGE_COOLDOWN) return;
    
    const balloonRadius = 5;  // Player balloon radius
    const stationRadius = 10; // Challenge station interaction radius
    const minDistance = balloonRadius + stationRadius;
    
    // Check regular challenge stations
    for (let i = 0; i < gameState.challengeStations.length; i++) {
        const station = gameState.challengeStations[i];
        
        // Skip if not active or already completed
        if (!station.userData.active || gameState.completedChallenges.includes(station.userData.data.id)) {
            continue;
        }
        
        // Calculate distance between player balloon and station
        const distance = gameState.balloonPhysics.position.distanceTo(station.position);
        
        if (distance < minDistance) {
            // Collision detected - show challenge question
            lastChallengeTime = Date.now();
            showChallengeQuestion(station.userData.data);
            break;
        }
    }
    
    // Check master challenge
    if (gameState.masterChallenge && gameState.masterChallenge.userData.active && !gameState.masterChallengeCompleted) {
        const masterDistance = gameState.balloonPhysics.position.distanceTo(gameState.masterChallenge.position);
        const masterMinDistance = balloonRadius + 20; // Larger radius for master challenge
        
        if (masterDistance < masterMinDistance) {
            // Show master challenge
            lastChallengeTime = Date.now();
            showMasterChallenge();
        }
    }
}

// Show challenge question
// Add this at the top of the file, with other variable declarations:
let activeChallengeTimer = null;
let isChallengeActive = false;

function showChallengeQuestion(challengeData) {
    // Don't show a new challenge if one is already active
    if (isChallengeActive) return;
    
    isChallengeActive = true;
    
    // Create or update challenge UI
    const challengePanel = document.getElementById('challenge-panel') || createChallengePanel();
    
    // Clean up any existing feedback from previous challenges
    const existingFeedback = document.getElementById('challenge-feedback');
    if (existingFeedback && existingFeedback.parentNode) {
        existingFeedback.parentNode.removeChild(existingFeedback);
    }
    
    // Update content
    document.getElementById('challenge-title').textContent = challengeData.title;
    document.getElementById('challenge-question').textContent = challengeData.question;
    
    const optionsContainer = document.getElementById('challenge-options');
    optionsContainer.innerHTML = '';
    
    // Add options
    challengeData.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'challenge-option'; // Reset to base class with no correct/incorrect state
        button.textContent = option;
        button.dataset.index = index;
        button.onclick = () => checkAnswer(index, challengeData);
        optionsContainer.appendChild(button);
    });
    
    // Show the panel
    challengePanel.style.opacity = '1';
    challengePanel.style.pointerEvents = 'auto';
    
    // Pause game movement
    pauseGameMovement();
}

// Check the user's answer to a challenge question
function checkAnswer(selectedIndex, challengeData) {
    // Prevent multiple clicks
    const optionsContainer = document.getElementById('challenge-options');
    const buttons = optionsContainer.querySelectorAll('button');
    
    // If buttons are already disabled, a selection was already made
    if (buttons[0] && buttons[0].disabled) return;
    
    // Clear any existing timers
    if (activeChallengeTimer) {
        clearTimeout(activeChallengeTimer);
        activeChallengeTimer = null;
    }
    
    const challengePanel = document.getElementById('challenge-panel');
    const feedbackElement = document.getElementById('challenge-feedback') || createFeedbackElement();
    
    // Disable all option buttons
    buttons.forEach(button => {
        button.disabled = true;
    });
    
    // Check if answer is correct
    const isCorrect = selectedIndex === challengeData.correctAnswer;
    
    if (isCorrect) {
        // Mark the selected button as correct
        buttons[selectedIndex].classList.add('correct');
        
        // Show success feedback
        feedbackElement.textContent = 'Correct! ' + challengeData.explanation;
        feedbackElement.className = 'challenge-feedback correct';
        
        // Add to completed challenges
        if (!gameState.completedChallenges.includes(challengeData.id)) {
            gameState.completedChallenges.push(challengeData.id);
        }
        
        // Update score
        gameState.score += 100;
        updateScoreDisplay();
        
        // Close panel after delay
        activeChallengeTimer = setTimeout(() => {
            closeChallenge(challengePanel);
        }, 3000);
    } else {
        // Mark the selected button as incorrect
        buttons[selectedIndex].classList.add('incorrect');
        
        // Mark the correct answer
        buttons[challengeData.correctAnswer].classList.add('correct');
        
        // Show error feedback
        // Show error feedback
feedbackElement.textContent = 'Incorrect. ' + challengeData.explanation;
feedbackElement.className = 'challenge-feedback incorrect';

// Add to completed challenges even if incorrect - prevents repeated triggering
if (!gameState.completedChallenges.includes(challengeData.id)) {
    gameState.completedChallenges.push(challengeData.id);
}

// Close panel after delay - USING closeChallenge FUNCTION INSTEAD
activeChallengeTimer = setTimeout(() => {
    closeChallenge(challengePanel);
}, 4000);
    }
    
    // Add feedback element to panel if not already added
    if (!challengePanel.contains(feedbackElement)) {
        challengePanel.appendChild(feedbackElement);
    }
}

// Add this new function to properly close the challenge UI
function closeChallenge(challengePanel) {
    challengePanel.style.opacity = '0';
    challengePanel.style.pointerEvents = 'none';
    
    // Reset the UI after fade out transition
    setTimeout(() => {
        // Remove feedback element completely
        const feedbackElement = document.getElementById('challenge-feedback');
        if (feedbackElement && feedbackElement.parentNode) {
            feedbackElement.parentNode.removeChild(feedbackElement);
        }
        
        // Reset challenge state
        isChallengeActive = false;
    }, 500); // Give time for opacity transition
    
    // Resume game movement
    resumeGameMovement();
}

// Show master challenge
function showMasterChallenge() {
    // Create or update master challenge UI
    const masterPanel = document.getElementById('master-challenge-panel') || createMasterChallengePanel();
    
    // Set title
    document.getElementById('master-challenge-title').textContent = 'Photosynthesis Master Challenge';
    
    // Initialize master challenge state
    if (!gameState.masterChallengeState) {
        gameState.masterChallengeState = {
            currentQuestion: 0,
            correctAnswers: 0,
            totalQuestions: gameState.masterChallengeData.questions.length
        };
    }
    
    // Show the current question
    showMasterQuestion();
    
    // Show the panel
    masterPanel.style.opacity = '1';
    masterPanel.style.pointerEvents = 'auto';
    
    // Pause game movement
    pauseGameMovement();
}

// Show current master challenge question
function showMasterQuestion() {
    const state = gameState.masterChallengeState;
    const questions = gameState.masterChallengeData.questions;
    
    // If all questions have been answered, show results
    if (state.currentQuestion >= questions.length) {
        showMasterResults();
        return;
    }
    
    const question = questions[state.currentQuestion];
    const questionContainer = document.getElementById('master-question');
    const progressElement = document.getElementById('master-progress');
    
    // Update progress display
    progressElement.textContent = `Question ${state.currentQuestion + 1} of ${state.totalQuestions}`;
    
    // Clear previous content
    questionContainer.innerHTML = '';
    
    // Add question text
    const questionText = document.createElement('div');
    questionText.className = 'master-question-text';
    questionText.textContent = question.question;
    questionContainer.appendChild(questionText);
    
    // Add options
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'master-options';
    
    question.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.className = 'master-option';
        button.textContent = option;
        button.onclick = () => checkMasterAnswer(index);
        optionsContainer.appendChild(button);
    });
    
    questionContainer.appendChild(optionsContainer);
}

// Check answer for master challenge
function checkMasterAnswer(selectedIndex) {
    const state = gameState.masterChallengeState;
    const question = gameState.masterChallengeData.questions[state.currentQuestion];
    const questionContainer = document.getElementById('master-question');
    
    // Disable all option buttons
    const buttons = questionContainer.querySelectorAll('button');
    buttons.forEach(button => {
        button.disabled = true;
    });
    
    // Check if answer is correct
    const isCorrect = selectedIndex === question.correctAnswer;
    
    if (isCorrect) {
        // Mark the selected button as correct
        buttons[selectedIndex].classList.add('correct');
        
        // Add to correct answers count
        state.correctAnswers++;
    } else {
        // Mark the selected button as incorrect
        buttons[selectedIndex].classList.add('incorrect');
        
        // Mark the correct answer
        buttons[question.correctAnswer].classList.add('correct');
    }
    
    // Add feedback
    const feedback = document.createElement('div');
    feedback.className = `master-feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    feedback.textContent = isCorrect ? 'Correct!' : 'Incorrect';
    questionContainer.appendChild(feedback);
    
    // Move to the next question after delay
    setTimeout(() => {
        state.currentQuestion++;
        showMasterQuestion();
    }, 2000);
}

// Show master challenge results
function showMasterResults() {
    const state = gameState.masterChallengeState;
    const questionContainer = document.getElementById('master-question');
    const progressElement = document.getElementById('master-progress');
    
    // Clear the container
    questionContainer.innerHTML = '';
    progressElement.textContent = 'Challenge Complete!';
    
    // Calculate score percentage
    const scorePercent = Math.round((state.correctAnswers / state.totalQuestions) * 100);
    
    // Create results display
    const resultsElement = document.createElement('div');
    resultsElement.className = 'master-results';
    
    let resultsHTML = `
        <div class="master-score">Your Score: ${state.correctAnswers}/${state.totalQuestions} (${scorePercent}%)</div>
    `;
    
    if (scorePercent >= 80) {
        resultsHTML += `
            <div class="master-message success">
                Excellent! You have mastered photosynthesis concepts.
            </div>
        `;
        
        // Mark master challenge as completed
        gameState.masterChallengeCompleted = true;
        
        // Give a big score bonus
        gameState.score += 500;
        updateScoreDisplay();
    } else if (scorePercent >= 60) {
        resultsHTML += `
            <div class="master-message partial">
                Good work! You understand the basics of photosynthesis, but there's room for improvement.
            </div>
        `;
        
        // Give a moderate score bonus
        gameState.score += 200;
        updateScoreDisplay();
    } else {
        resultsHTML += `
            <div class="master-message fail">
                You need to review the photosynthesis concepts. Try collecting more knowledge and answering the challenges again.
            </div>
        `;
        
        // Give a small score bonus for effort
        gameState.score += 50;
        updateScoreDisplay();
    }
    
    // Add close button
    resultsHTML += `
        <button class="master-close-button">Close</button>
    `;
    
    resultsElement.innerHTML = resultsHTML;
    questionContainer.appendChild(resultsElement);
    
    // Add close button event
    const closeButton = questionContainer.querySelector('.master-close-button');
    closeButton.onclick = () => {
        const masterPanel = document.getElementById('master-challenge-panel');
        masterPanel.style.opacity = '0';
        masterPanel.style.pointerEvents = 'none';
        
        // Reset master challenge state
        gameState.masterChallengeState = null;
        
        // Resume game movement
        resumeGameMovement();
    };
}

// Create challenge panel UI
function createChallengePanel() {
    const panel = document.createElement('div');
    panel.id = 'challenge-panel';
    panel.className = 'game-panel';
    
    const titleElement = document.createElement('h2');
    titleElement.id = 'challenge-title';
    
    const questionElement = document.createElement('div');
    questionElement.id = 'challenge-question';
    
    const optionsContainer = document.createElement('div');
    optionsContainer.id = 'challenge-options';
    
    panel.appendChild(titleElement);
    panel.appendChild(questionElement);
    panel.appendChild(optionsContainer);
    
    document.getElementById('game-container').appendChild(panel);
    
    // Add challenge panel styles
    addChallengeStyles();
    
    return panel;
}

// Create master challenge panel UI
function createMasterChallengePanel() {
    const panel = document.createElement('div');
    panel.id = 'master-challenge-panel';
    panel.className = 'game-panel master';
    
    const titleElement = document.createElement('h2');
    titleElement.id = 'master-challenge-title';
    
    const progressElement = document.createElement('div');
    progressElement.id = 'master-progress';
    
    const questionContainer = document.createElement('div');
    questionContainer.id = 'master-question';
    
    panel.appendChild(titleElement);
    panel.appendChild(progressElement);
    panel.appendChild(questionContainer);
    
    document.getElementById('game-container').appendChild(panel);
    
    return panel;
}

// Create feedback element for challenges
function createFeedbackElement() {
    const feedback = document.createElement('div');
    feedback.id = 'challenge-feedback';
    return feedback;
}

// Add challenge styles to document
function addChallengeStyles() {
    // Check if styles already exist
    if (document.getElementById('challenge-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'challenge-styles';
    
    styleElement.textContent = `
        .game-panel {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 30px;
            border-radius: 15px;
            width: 80%;
            max-width: 600px;
            text-align: center;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 1000;
            pointer-events: none;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            border: 3px solid #4FC3F7;
        }
        
        .game-panel.master {
            border-color: #E040FB;
        }
        
        #challenge-title, #master-challenge-title {
            font-size: 28px;
            margin-top: 0;
            margin-bottom: 20px;
            color: #4FC3F7;
        }
        
        #master-challenge-title {
            color: #E040FB;
        }
        
        #challenge-question, .master-question-text {
            font-size: 20px;
            margin-bottom: 25px;
            line-height: 1.5;
        }
        
        #challenge-options, .master-options {
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 15px;
        }
        
        .challenge-option, .master-option {
            background-color: rgba(255, 255, 255, 0.1);
            border: 2px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 15px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            transition: background-color 0.3s;
            text-align: left;
        }
        
        .challenge-option:hover, .master-option:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
        
        .challenge-option.correct, .master-option.correct {
            background-color: rgba(76, 175, 80, 0.3);
            border-color: #4CAF50;
        }
        
        .challenge-option.incorrect, .master-option.incorrect {
            background-color: rgba(244, 67, 54, 0.3);
            border-color: #F44336;
        }
        
        .challenge-feedback, .master-feedback {
            margin-top: 20px;
            padding: 15px;
            border-radius: 8px;
            font-size: 18px;
            line-height: 1.5;
        }
        
        .challenge-feedback.correct, .master-feedback.correct {
            background-color: rgba(76, 175, 80, 0.2);
            border: 1px solid #4CAF50;
            color: #A5D6A7;
        }
        
        .challenge-feedback.incorrect, .master-feedback.incorrect {
            background-color: rgba(244, 67, 54, 0.2);
            border: 1px solid #F44336;
            color: #EF9A9A;
        }
        
        #master-progress {
            font-size: 16px;
            color: #B39DDB;
            margin-bottom: 20px;
        }
        
        .master-score {
            font-size: 28px;
            margin-bottom: 20px;
            font-weight: bold;
            color: #E040FB;
        }
        
        .master-message {
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 25px;
            font-size: 18px;
            line-height: 1.5;
        }
        
        .master-message.success {
            background-color: rgba(76, 175, 80, 0.2);
            border: 1px solid #4CAF50;
            color: #A5D6A7;
        }
        
        .master-message.partial {
            background-color: rgba(255, 152, 0, 0.2);
            border: 1px solid #FF9800;
            color: #FFCC80;
        }
        
        .master-message.fail {
            background-color: rgba(244, 67, 54, 0.2);
            border: 1px solid #F44336;
            color: #EF9A9A;
        }
        
        .master-close-button {
            background-color: rgba(224, 64, 251, 0.3);
            border: 2px solid #E040FB;
            color: white;
            padding: 12px 30px;
            border-radius: 50px;
            cursor: pointer;
            font-size: 18px;
            transition: background-color 0.3s;
            margin-top: 10px;
        }
        
        .master-close-button:hover {
            background-color: rgba(224, 64, 251, 0.5);
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Update score display
function updateScoreDisplay() {
    // Check if score element exists
    let scoreElement = document.getElementById('score-value');
    
    if (!scoreElement) {
        // Create the score display if it doesn't exist
        const scoreDisplay = document.getElementById('score-display');
        scoreElement = document.createElement('span');
        scoreElement.id = 'score-value';
        scoreDisplay.innerHTML = scoreDisplay.innerHTML.replace('Altitude:', '<span id="altitude-label">Altitude:</span>');
        scoreDisplay.appendChild(document.createElement('br'));
        
        const scoreLabel = document.createElement('span');
        scoreLabel.textContent = 'Score: ';
        scoreDisplay.appendChild(scoreLabel);
        scoreDisplay.appendChild(scoreElement);
    }
    
    // Update the score value
    scoreElement.textContent = gameState.score;
}

// Pause game movement while in challenge
function pauseGameMovement() {
    // Store current velocity
    gameState.pausedVelocity = gameState.balloonPhysics.velocity.clone();
    
    // Stop all movement
    gameState.balloonPhysics.velocity.set(0, 0, 0);
    
    // Disable keys temporarily
    gameState.keysEnabled = false;
    
    // Store burner state and turn it off if active
    if (gameState.burnerActive) {
        gameState.burnerWasActive = true;
        // Call the function from balloon.js to properly turn off burner with sound
        activateBurner(false);
    }
}

// Resume game movement after challenge
function resumeGameMovement() {
    // Only restore movement if game is running
    if (!gameState.isGameRunning) return;
    
    // Restore velocity if saved
    if (gameState.pausedVelocity) {
        gameState.balloonPhysics.velocity.copy(gameState.pausedVelocity);
        gameState.pausedVelocity = null;
    } else {
        // If no saved velocity, ensure it's not stuck at zero
        if (gameState.balloonPhysics.velocity.lengthSq() < 0.1) {
            gameState.balloonPhysics.velocity.set(0, 0, 5); // Small forward momentum
        }
    }
    
    // Re-enable keys
    gameState.keysEnabled = true;
    
    // Restore burner if it was active
    if (gameState.burnerWasActive) {
        // Only restart if W key is still pressed
        if (gameState.keys.KeyW) {
            activateBurner(true);
        }
        gameState.burnerWasActive = false;
    }
}