import { gameState } from './gameState.js';

// Main creature system
export const creatureSystem = {
    birds: {
        flocks: [],
        maxFlocks: 8,
        initialized: false,
        lastUpdate: 0
    },
    fish: {
        schools: [],
        maxSchools: 10,
        initialized: false,
        lastUpdate: 0
    },
    whales: {
        pods: [],
        maxWhales: 3,
        initialized: false,
        lastUpdate: 0,
        breachChance: 0.005 // Chance per second for a whale to breach
    },
    active: true
};

// Initialize all creature systems
export function initCreatures() {
    // Only initialize in water-based terrain
    if (gameState.selectedTerrain !== 'mountains') {
        initFishSchools();
        initWhales();
    }
    
    // Birds work in any terrain type
    initBirdFlocks();
}

// Clean up all creature systems
export function cleanupCreatures() {
    cleanupBirdFlocks();
    cleanupFishSchools();
    cleanupWhales();
}

// Update all creature systems
export function updateCreatures(delta) {
    if (!creatureSystem.active) return;
    
    // Only update water creatures in non-mountain terrain
    if (gameState.selectedTerrain !== 'mountains') {
        updateFishSchools(delta);
        updateWhales(delta);
    }
    
    // Update birds in any terrain
    updateBirdFlocks(delta);
}

// Get random position within boundaries
function getRandomPosition(minDist, maxDist, minHeight, maxHeight) {
    const distance = minDist + Math.random() * (maxDist - minDist);
    const angle = Math.random() * Math.PI * 2;
    
    return new THREE.Vector3(
        Math.cos(angle) * distance,
        minHeight + Math.random() * (maxHeight - minHeight),
        Math.sin(angle) * distance
    );
}

//---------------
// BIRD IMPLEMENTATION
//---------------

// Initialize bird flocks
function initBirdFlocks() {
    if (creatureSystem.birds.initialized) return;
    
    for (let i = 0; i < creatureSystem.birds.maxFlocks; i++) {
        createBirdFlock();
    }
    
    creatureSystem.birds.initialized = true;
}

// Create a single flock of birds
function createBirdFlock() {
    const flockSize = 8 + Math.floor(Math.random() * 8); // 8-15 birds per flock
    const flockGroup = new THREE.Group();
    
    // Set migration target
    const migrationTarget = getRandomPosition(1000, 3000, 150, 350);
    
    // Randomize starting position
    const centerX = (Math.random() - 0.5) * 4000;
    const centerY = 150 + Math.random() * 200;
    const centerZ = (Math.random() - 0.5) * 4000;
    
    // Set initial movement direction
    const directionAngle = Math.random() * Math.PI * 2;
    const direction = new THREE.Vector3(
        Math.cos(directionAngle),
        0,
        Math.sin(directionAngle)
    ).normalize();
    
    // Create birds for this flock
    const birds = [];
    
    // Bird color (dark)
    const birdColor = 0x111111;
    const birdMaterial = new THREE.MeshBasicMaterial({ color: birdColor });
    
    for (let i = 0; i < flockSize; i++) {
        // Create a bird group
        const birdGroup = new THREE.Group();
        
        // Create a simple bird body - small, thin box
         // Create a capsule-shaped bird body
         const bodyRadius = 0.1;    // Controls width of the body
         const bodyLength = 0.6;    // Controls length of the body
         const bodyGeometry = new THREE.CapsuleGeometry(
             bodyRadius,            // radius
             bodyLength,            // length
             4,                     // capSegments
             8                      // radialSegments
         );
         bodyGeometry.rotateX(Math.PI / 2);// Orient the capsule horizontally
         const body = new THREE.Mesh(bodyGeometry, birdMaterial);
         birdGroup.add(body);
        
        // Create left wing - thin 3D plane with some curvature
        // For the curved shape like in your drawing, we'll use a custom shape
        const wingLength = 1.8;    // Controls wing length (distance from body)
        const wingHeight = 0.4;    // Controls wing curve height
        const wingWidth = 0.2;     // Controls wing width

        // Create left wing with more width
        const leftWingShape = new THREE.Shape();
        leftWingShape.moveTo(0, 0);
        leftWingShape.quadraticCurveTo(-wingLength/2, wingHeight, -wingLength, 0);
        // Add width to the wing by creating a curved bottom edge
        leftWingShape.lineTo(-wingLength, -wingWidth);
        leftWingShape.quadraticCurveTo(-wingLength/2, -wingWidth + wingHeight/2, 0, -wingWidth);
        leftWingShape.lineTo(0, 0);
        
        const leftWingGeometry = new THREE.ShapeGeometry(leftWingShape);
        const leftWing = new THREE.Mesh(leftWingGeometry, birdMaterial);
        leftWing.position.set(-0.1, 0, 0);
        // Rotate to be horizontal
        leftWing.rotation.x = -Math.PI / 2;
        birdGroup.add(leftWing);
        
        // Create right wing with more width (mirrored)
        const rightWingShape = new THREE.Shape();
        rightWingShape.moveTo(0, 0);
        rightWingShape.quadraticCurveTo(wingLength/2, wingHeight, wingLength, 0);
        // Add width to the wing by creating a curved bottom edge
        rightWingShape.lineTo(wingLength, -wingWidth);
        rightWingShape.quadraticCurveTo(wingLength/2, -wingWidth + wingHeight/2, 0, -wingWidth);
        rightWingShape.lineTo(0, 0);
        
        const rightWingGeometry = new THREE.ShapeGeometry(rightWingShape);
        const rightWing = new THREE.Mesh(rightWingGeometry, birdMaterial);
        rightWing.position.set(0.1, 0, 0);
        // Rotate to be horizontal
        rightWing.rotation.x = -Math.PI / 2;
        birdGroup.add(rightWing);
        
        // Scale the bird to appropriate size
        birdGroup.scale.set(10.7, 10.7, 10.7);
        
        // Random offset from flock center
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 50;
        const offsetZ = (Math.random() - 0.5) * 100;
        
        birdGroup.position.set(
            centerX + offsetX,
            centerY + offsetY,
            centerZ + offsetZ
        );
        
        // Add to flock group
        flockGroup.add(birdGroup);
        
        // Store bird data with wing references
        birds.push({
            group: birdGroup,
            leftWing: leftWing,
            rightWing: rightWing,
            offset: new THREE.Vector3(offsetX, offsetY, offsetZ),
            wingPhase: Math.random() * Math.PI * 2,
            wingSpeed: 0.1 + Math.random() * 0.1
        });
    }
    
    // Add flock to scene
    gameState.scene.add(flockGroup);
    
    // Store flock data
    creatureSystem.birds.flocks.push({
        group: flockGroup,
        birds: birds,
        position: new THREE.Vector3(centerX, centerY, centerZ),
        direction: direction,
        speed: 15 + Math.random() * 10, // Units per second
        turnTimer: 0,
        turnInterval: 10 + Math.random() * 15, // Seconds between direction changes
        migrationTarget: migrationTarget
    });
}

// Update bird flocks
function updateBirdFlocks(delta) {
    if (!creatureSystem.birds.initialized) return;
    
    // Only update every 50ms for performance
    const now = performance.now();
    if (now - creatureSystem.birds.lastUpdate < 50) return;
    creatureSystem.birds.lastUpdate = now;
    
    // Adjust delta for smoother movement
    const smoothDelta = Math.min(delta, 0.1);
    
    // Update each flock
    creatureSystem.birds.flocks.forEach((flock, flockIndex) => {
        // Update flock position
        flock.position.addScaledVector(flock.direction, flock.speed * smoothDelta);
        
        // Update turn timer
        flock.turnTimer += smoothDelta;
        
        // Check if it's time to change direction
        if (flock.turnTimer >= flock.turnInterval) {
            updateFlockDirection(flock);
            flock.turnTimer = 0;
            flock.turnInterval = 10 + Math.random() * 15;
        }
        
        // Steer toward migration target
        const toTarget = new THREE.Vector3().subVectors(flock.migrationTarget, flock.position);
        const distanceToTarget = toTarget.length();
        
        // If close to target, get a new one
        if (distanceToTarget < 100) {
            flock.migrationTarget = getRandomPosition(1000, 3000, 150, 350);
        } else {
            // Steer toward target (30% influence)
            toTarget.normalize();
            flock.direction.lerp(toTarget, 0.3 * smoothDelta);
            flock.direction.normalize();
        }
        
        // Update flock group position
        flock.group.position.copy(flock.position);
        
        // Rotate flock to face direction
        if (flock.direction.length() > 0.1) {
            flock.group.lookAt(flock.position.clone().add(flock.direction));
        }
        
        // Update individual birds in the flock
        flock.birds.forEach(bird => {
            // Flapping wings animation
            bird.wingPhase += bird.wingSpeed;
            
            // Make birds bob slightly up and down
            const yOffset = bird.offset.y + Math.sin(bird.wingPhase) * 0.5;
            
            // Adjust birds position within flock
            bird.group.position.set(
                bird.offset.x + Math.sin(bird.wingPhase * 0.5) * 1,
                yOffset,
                bird.offset.z + Math.cos(bird.wingPhase * 0.7) * 1
            );
            
            // Animate wings flapping - up and down rotation
            if (bird.leftWing && bird.rightWing) {
                // Use sine wave for smooth flapping
                const wingFlapAmount = Math.sin(bird.wingPhase) * 0.4;
                
                // Left wing goes up when value is positive
                bird.leftWing.rotation.z = wingFlapAmount;
                
                // Right wing goes down when left goes up (opposite movement)
                bird.rightWing.rotation.z = -wingFlapAmount;
            }
        });
        
        // Check if flock is too far from player
        const distanceToPlayer = flock.position.distanceTo(gameState.balloonPhysics.position);
        if (distanceToPlayer > 6000) {
            respawnBirdFlock(flock, flockIndex);
        }
    });
    
    // Maybe add a new flock occasionally if below max
    if (creatureSystem.birds.flocks.length < creatureSystem.birds.maxFlocks && Math.random() < 0.01) {
        createBirdFlock();
    }
}

// Update flock direction
function updateFlockDirection(flock) {
    // Small random change to direction
    const turnAmount = Math.PI / 8;
    flock.direction.x += (Math.random() - 0.5) * turnAmount;
    flock.direction.z += (Math.random() - 0.5) * turnAmount;
    flock.direction.normalize();
    
    // Ensure birds don't fly too high or too low
    if (flock.position.y < 100) {
        flock.direction.y = Math.abs(flock.direction.y);
    } else if (flock.position.y > 350) {
        flock.direction.y = -Math.abs(flock.direction.y);
    } else {
        flock.direction.y = (Math.random() - 0.5) * 0.2;
    }
    
    flock.direction.normalize();
}

// Respawn a bird flock
function respawnBirdFlock(flock, index) {
    // Remove from scene
    gameState.scene.remove(flock.group);
    
    // Remove from array
    creatureSystem.birds.flocks.splice(index, 1);
    
    // Create a new flock
    createBirdFlock();
}

// Clean up bird flocks
function cleanupBirdFlocks() {
    if (!creatureSystem.birds.initialized) return;
    
    // Remove all flocks from scene
    creatureSystem.birds.flocks.forEach(flock => {
        gameState.scene.remove(flock.group);
    });
    
    // Clear array
    creatureSystem.birds.flocks = [];
    creatureSystem.birds.initialized = false;
}

//---------------
// FISH IMPLEMENTATION
//---------------

// Initialize fish schools
function initFishSchools() {
    if (creatureSystem.fish.initialized) return;
    
    for (let i = 0; i < creatureSystem.fish.maxSchools; i++) {
        createFishSchool();
    }
    
    creatureSystem.fish.initialized = true;
}

// Create a fish school
function createFishSchool() {
    const schoolSize = 15 + Math.floor(Math.random() * 15); // 15-30 fish per school
    const schoolGroup = new THREE.Group();
    
    // Position school under water
    const centerX = (Math.random() - 0.5) * 4000;
    const centerY = 5 + Math.random() * 10; // Just below water surface
    const centerZ = (Math.random() - 0.5) * 4000;
    
    // Pick a color for the school
    const colorOptions = [
        0x3399FF, // Blue
        0x66CCFF, // Light blue
        0x99FFFF, // Cyan
        0xCCFF99, // Light green
        0xFFCC66  // Gold
    ];
    const schoolColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    
    // Set initial direction
    const directionAngle = Math.random() * Math.PI * 2;
    const direction = new THREE.Vector3(
        Math.cos(directionAngle),
        0,
        Math.sin(directionAngle)
    ).normalize();
    
    // Create fish for this school
    const fishes = [];
    const fishGeometry = new THREE.ConeGeometry(0.3, 1, 4);
    const fishMaterial = new THREE.MeshBasicMaterial({ color: schoolColor });
    
    for (let i = 0; i < schoolSize; i++) {
        // Create a simple fish shape
        const fishMesh = new THREE.Mesh(fishGeometry, fishMaterial);
        
        // Random offset from school center
        const offsetX = (Math.random() - 0.5) * 15;
        const offsetY = (Math.random() - 0.5) * 5;
        const offsetZ = (Math.random() - 0.5) * 15;
        
        fishMesh.position.set(
            centerX + offsetX,
            centerY + offsetY,
            centerZ + offsetZ
        );
        
        // Make fish face swimming direction
        fishMesh.rotation.y = Math.PI / 2;
        
        // Add to school group
        schoolGroup.add(fishMesh);
        
        // Store fish data
        fishes.push({
            mesh: fishMesh,
            offset: new THREE.Vector3(offsetX, offsetY, offsetZ),
            swimPhase: Math.random() * Math.PI * 2,
            swimSpeed: 0.05 + Math.random() * 0.1
        });
    }
    
    // Add school to scene
    gameState.scene.add(schoolGroup);
    
    // Store school data
    creatureSystem.fish.schools.push({
        group: schoolGroup,
        fishes: fishes,
        position: new THREE.Vector3(centerX, centerY, centerZ),
        direction: direction,
        speed: 8 + Math.random() * 5, // Units per second
        turnTimer: 0,
        turnInterval: 5 + Math.random() * 10, // Seconds between direction changes
        color: schoolColor
    });
}

// Update fish schools
function updateFishSchools(delta) {
    if (!creatureSystem.fish.initialized) return;
    
    // Only update every 100ms for performance
    const now = performance.now();
    if (now - creatureSystem.fish.lastUpdate < 100) return;
    creatureSystem.fish.lastUpdate = now;
    
    // Get the adjusted delta
    const smoothDelta = Math.min(delta, 0.1);
    
    // Update each school
    creatureSystem.fish.schools.forEach((school, schoolIndex) => {
        // Update school position
        school.position.addScaledVector(school.direction, school.speed * smoothDelta);
        
        // Update turn timer
        school.turnTimer += smoothDelta;
        
        // Check if it's time to change direction
        if (school.turnTimer >= school.turnInterval) {
            updateSchoolDirection(school);
            school.turnTimer = 0;
            school.turnInterval = 5 + Math.random() * 10;
        }
        
        // Update school group position
        school.group.position.copy(school.position);
        
        // Rotate school to face direction
        if (school.direction.length() > 0.1) {
            school.group.lookAt(school.position.clone().add(school.direction));
        }
        
        // Update individual fish in the school
        school.fishes.forEach(fish => {
            // Swimming animation
            fish.swimPhase += fish.swimSpeed;
            
            // Make fish move in a wave pattern
            const yOffset = fish.offset.y + Math.sin(fish.swimPhase) * 0.5;
            
            // Adjust fish position within school
            fish.mesh.position.set(
                fish.offset.x + Math.sin(fish.swimPhase * 0.3) * 1,
                yOffset,
                fish.offset.z + Math.cos(fish.swimPhase * 0.7) * 1
            );
            
            // Make tail wiggle with swimming motion
            fish.mesh.rotation.z = Math.sin(fish.swimPhase * 2) * 0.2;
        });
        
        // Check if school is too far from player or out of water
        const distanceToPlayer = school.position.distanceTo(gameState.balloonPhysics.position);
        if (distanceToPlayer > 5000 || school.position.y > 20 || school.position.y < 0) {
            respawnFishSchool(school, schoolIndex);
        }
    });
}

// Update school direction
function updateSchoolDirection(school) {
    // Random change to direction
    const turnAmount = Math.PI / 4;
    school.direction.x += (Math.random() - 0.5) * turnAmount;
    school.direction.z += (Math.random() - 0.5) * turnAmount;
    school.direction.normalize();
    
    // Ensure fish stay at appropriate depth
    if (school.position.y < 3) {
        school.direction.y = Math.abs(school.direction.y) * 0.1;
    } else if (school.position.y > 15) {
        school.direction.y = -Math.abs(school.direction.y) * 0.1;
    } else {
        school.direction.y = (Math.random() - 0.5) * 0.1;
    }
    
    school.direction.normalize();
}

// Respawn a fish school
function respawnFishSchool(school, index) {
    // Remove from scene
    gameState.scene.remove(school.group);
    
    // Remove from array
    creatureSystem.fish.schools.splice(index, 1);
    
    // Create a new school
    createFishSchool();
}

// Clean up fish schools
function cleanupFishSchools() {
    if (!creatureSystem.fish.initialized) return;
    
    // Remove all schools from scene
    creatureSystem.fish.schools.forEach(school => {
        gameState.scene.remove(school.group);
    });
    
    // Clear array
    creatureSystem.fish.schools = [];
    creatureSystem.fish.initialized = false;
}

//---------------
// WHALE IMPLEMENTATION
//---------------

// Initialize whales
function initWhales() {
    if (creatureSystem.whales.initialized) return;
    
    for (let i = 0; i < creatureSystem.whales.maxWhales; i++) {
        createWhale();
    }
    
    creatureSystem.whales.initialized = true;
}

// Create a whale
function createWhale() {
    const whaleGroup = new THREE.Group();
    
    // Position whale under water
    const centerX = (Math.random() - 0.5) * 4000;
    const centerY = -20 - Math.random() * 30; // Deep underwater
    const centerZ = (Math.random() - 0.5) * 4000;
    
    // Create the whale body
    const bodyGeometry = new THREE.CapsuleGeometry(5, 15, 8, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x334455,
        roughness: 0.8
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2; // Orient horizontally
    whaleGroup.add(body);
    
    // Create the whale tail
    const tailGeometry = new THREE.ConeGeometry(5, 8, 8);
    const tail = new THREE.Mesh(tailGeometry, bodyMaterial);
    tail.position.x = -11; // Behind the body
    tail.rotation.z = Math.PI / 2; // Orient horizontally
    whaleGroup.add(tail);
    
    // Create tail fins
    const finGeometry = new THREE.BoxGeometry(8, 1, 15);
    const finMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x334455,
        roughness: 0.8
    });
    const tailFin = new THREE.Mesh(finGeometry, finMaterial);
    tailFin.position.x = -15;
    whaleGroup.add(tailFin);
    
    // Set initial direction
    const directionAngle = Math.random() * Math.PI * 2;
    const direction = new THREE.Vector3(
        Math.cos(directionAngle),
        0,
        Math.sin(directionAngle)
    ).normalize();
    
    // Add to scene
    whaleGroup.position.set(centerX, centerY, centerZ);
    gameState.scene.add(whaleGroup);
    
    // Store whale data
    creatureSystem.whales.pods.push({
        group: whaleGroup,
        position: new THREE.Vector3(centerX, centerY, centerZ),
        direction: direction,
        speed: 5 + Math.random() * 3,
        turnTimer: 0,
        turnInterval: 8 + Math.random() * 12,
        state: 'swimming', // swimming, ascending, breaching, descending
        stateTime: 0,
        tailPhase: 0,
        // Components for animation
        body: body,
        tail: tail,
        tailFin: tailFin,
        // Initial breach timer set randomly
        breachTimer: Math.random() * 60, // Seconds until breach consideration
        // Water effects
        splash: null,
        waterSpout: null
    });
}

// Update whales
function updateWhales(delta) {
    if (!creatureSystem.whales.initialized) return;
    
    // Only update every 50ms for performance
    const now = performance.now();
    if (now - creatureSystem.whales.lastUpdate < 50) return;
    creatureSystem.whales.lastUpdate = now;
    
    // Get smooth delta
    const smoothDelta = Math.min(delta, 0.1);
    
    // Update each whale
    creatureSystem.whales.pods.forEach((whale, whaleIndex) => {
        // Update based on current state
        switch (whale.state) {
            case 'swimming':
                updateSwimmingWhale(whale, smoothDelta, whaleIndex);
                break;
            case 'ascending':
                updateAscendingWhale(whale, smoothDelta);
                break;
            case 'breaching':
                updateBreachingWhale(whale, smoothDelta);
                break;
            case 'descending':
                updateDescendingWhale(whale, smoothDelta);
                break;
        }
        
        // Animate the tail
        animateWhaleTail(whale, smoothDelta);
    });
}

// Update swimming whale
function updateSwimmingWhale(whale, delta, whaleIndex) {
    // Move whale forward
    whale.position.addScaledVector(whale.direction, whale.speed * delta);
    
    // Update turn timer
    whale.turnTimer += delta;
    
    // Check if it's time to change direction
    if (whale.turnTimer >= whale.turnInterval) {
        updateWhaleDirection(whale);
        whale.turnTimer = 0;
        whale.turnInterval = 8 + Math.random() * 12;
    }
    
    // Update whale group position
    whale.group.position.copy(whale.position);
    
    // Rotate whale to face direction
    if (whale.direction.length() > 0.1) {
        whale.group.lookAt(whale.position.clone().add(whale.direction));
        // Adjust rotation for the capsule orientation
        whale.group.rotation.y += Math.PI / 2;
    }
    
    // Update breach timer
    whale.breachTimer -= delta;
    
    // Maybe start a breach sequence
    if (whale.breachTimer <= 0 && Math.random() < creatureSystem.whales.breachChance) {
        // Start ascending to breach
        whale.state = 'ascending';
        whale.stateTime = 0;
        // Angle the whale upward
        whale.direction.y = 0.5;
        whale.direction.normalize();
    } else if (whale.breachTimer <= 0) {
        // Reset timer if no breach
        whale.breachTimer = 30 + Math.random() * 60;
    }
    
    // Check if whale is too far from player
    const distanceToPlayer = whale.position.distanceTo(gameState.balloonPhysics.position);
    if (distanceToPlayer > 5000) {
        respawnWhale(whale, whaleIndex);
    }
}

// Update ascending whale
function updateAscendingWhale(whale, delta) {
    // Increase state time
    whale.stateTime += delta;
    
    // Move upward more quickly
    whale.speed = 15;
    whale.position.y += whale.speed * delta;
    
    // Update whale group position
    whale.group.position.copy(whale.position);
    
    // Steepen ascent angle as whale gets closer to surface
    if (whale.position.y < -5) {
        whale.direction.y = Math.min(whale.direction.y + 0.01, 0.8);
        whale.direction.normalize();
        
        // Update whale rotation
        whale.group.rotation.x = -Math.PI/4; // Angle up
    }
    
    // Check if reached surface
    if (whale.position.y >= 5) {
        // Start breaching
        whale.state = 'breaching';
        whale.stateTime = 0;
        
        // Create splash effect
        createSplashEffect(whale);
    }
}

// Update breaching whale
function updateBreachingWhale(whale, delta) {
    // Increase state time
    whale.stateTime += delta;
    
    // Slow down after initial breach
    whale.speed = Math.max(5, 15 - whale.stateTime * 5);
    
    // Continue ascent but slowing down
    whale.position.y += whale.speed * delta;
    
    // Update whale group position
    whale.group.position.copy(whale.position);
    
    // Maximum breach height
    if (whale.position.y >= 20 || whale.stateTime >= 1.5) {
        // Start descending
        whale.state = 'descending';
        whale.stateTime = 0;
        whale.direction.y = -0.8;
        whale.direction.normalize();
    }
}

// Update descending whale
function updateDescendingWhale(whale, delta) {
    // Increase state time
    whale.stateTime += delta;
    
    // Accelerate downward
    whale.speed = 10 + whale.stateTime * 5;
    whale.position.y -= whale.speed * delta;
    
    // Update whale group position
    whale.group.position.copy(whale.position);
    
    // Update rotation to dive back down
    whale.group.rotation.x = Math.PI/3; // Angle down
    
    // Check if below water surface
    if (whale.position.y <= 0) {
        // Create splash effect for re-entry
        createSplashEffect(whale);
    }
    
    // Check if back to normal swimming depth
    if (whale.position.y <= -20) {
        // Return to swimming state
        whale.state = 'swimming';
        whale.stateTime = 0;
        whale.direction.y = 0;
        whale.direction.normalize();
        whale.group.rotation.x = 0; // Level out
        whale.speed = 5 + Math.random() * 3;
        
        // Reset breach timer
        whale.breachTimer = 60 + Math.random() * 120;
    }
}

// Animate whale tail for swimming motion
function animateWhaleTail(whale, delta) {
    // Update tail phase
    whale.tailPhase += delta * 2;
    
    // Tail movement amplitude depends on state and speed
    let amplitude = 0.1;
    if (whale.state === 'swimming') {
        amplitude = 0.2;
    } else if (whale.state === 'ascending' || whale.state === 'descending') {
        amplitude = 0.4;
    }
    
    // Animate tail fin rotation
    whale.tailFin.rotation.y = Math.sin(whale.tailPhase) * amplitude;
}

// Update whale direction
function updateWhaleDirection(whale) {
    // Random change to direction
    const turnAmount = Math.PI / 6;
    whale.direction.x += (Math.random() - 0.5) * turnAmount;
    whale.direction.z += (Math.random() - 0.5) * turnAmount;
    whale.direction.normalize();
    
    // Ensure whales stay at appropriate depth while swimming
    if (whale.state === 'swimming') {
        if (whale.position.y < -50) {
            whale.direction.y = Math.abs(whale.direction.y) * 0.1;
        } else if (whale.position.y > -15) {
            whale.direction.y = -Math.abs(whale.direction.y) * 0.1;
        } else {
            whale.direction.y = (Math.random() - 0.5) * 0.1;
        }
        
        whale.direction.normalize();
    }
}

// Create water splash effect
function createSplashEffect(whale) {
    // Create particle system for splash
    const particleCount = 30;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        // Random position around whale
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 10;
        particlePositions[i] = Math.cos(angle) * radius;
        particlePositions[i+1] = 0; // At water level
        particlePositions[i+2] = Math.sin(angle) * radius;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: 0x77BBFF,
        size: 2,
        transparent: true,
        opacity: 0.8
    });
    
    const splash = new THREE.Points(particleGeometry, particleMaterial);
    splash.position.copy(whale.position.clone());
    splash.position.y = 0; // At water level
    
    gameState.scene.add(splash);
    
    // Store reference
    whale.splash = splash;
    
    // Set up animation for splash
    let age = 0;
    const animateSplash = function() {
        if (!splash.parent) return;
        
        age += 0.05;
        
        // Move particles up and outward
        const positions = splash.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] *= 1.05; // Expand outward
            positions[i+1] += 0.5; // Rise upward
            positions[i+2] *= 1.05; // Expand outward
        }
        
        splash.geometry.attributes.position.needsUpdate = true;
        
        // Fade out
        splash.material.opacity = Math.max(0, 0.8 - age);
        
        if (age < 2) {
            requestAnimationFrame(animateSplash);
        } else {
            gameState.scene.remove(splash);
            whale.splash = null;
        }
    };
    
    animateSplash();
}

// Respawn a whale
function respawnWhale(whale, index) {
    // Remove from scene
    gameState.scene.remove(whale.group);
    
    // Remove splash if exists
    if (whale.splash) {
        gameState.scene.remove(whale.splash);
    }
    
    // Remove from array
    creatureSystem.whales.pods.splice(index, 1);
    
    // Create a new whale
    createWhale();
}

// Clean up whales
function cleanupWhales() {
    if (!creatureSystem.whales.initialized) return;
    
    // Remove all whales from scene
    creatureSystem.whales.pods.forEach(whale => {
        gameState.scene.remove(whale.group);
        
        // Remove any effects
        if (whale.splash) {
            gameState.scene.remove(whale.splash);
        }
    });
    
    // Clear array
    creatureSystem.whales.pods = [];
    creatureSystem.whales.initialized = false;
}