import { gameState } from './gameState.js';

// Create the hot air balloon
export function createBalloon() {
    gameState.balloonGroup = new THREE.Group();
    
    // Hot air balloon envelope (the balloon part)
    const balloonGeometry = new THREE.SphereGeometry(5, 16, 16);
    const balloonMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFF6B6B,
        roughness: 0.7
    });
    gameState.balloon = new THREE.Mesh(balloonGeometry, balloonMaterial);
    gameState.balloon.position.y = 5;
    gameState.balloonGroup.add(gameState.balloon);
    
    // Balloon basket
    const basketGeometry = new THREE.BoxGeometry(3, 2, 3);
    const basketMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 1 
    });
    const basket = new THREE.Mesh(basketGeometry, basketMaterial);
    basket.position.y = -3;
    gameState.balloonGroup.add(basket);
    
    // Ropes connecting balloon to basket
    const ropeMaterial = new THREE.LineBasicMaterial({ color: 0x8B4513 });
    
    for (let i = 0; i < 4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const x = Math.cos(angle) * 2;
        const z = Math.sin(angle) * 2;
        
        const ropeGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(x, -2, z),
            new THREE.Vector3(x * 2, 1, z * 2)
        ]);
        const rope = new THREE.Line(ropeGeometry, ropeMaterial);
        gameState.balloonGroup.add(rope);
    }
    
    // Add a burner with light and particle effect
    const burnerGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
    const burnerMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.5,
        metalness: 0.8
    });
    const burner = new THREE.Mesh(burnerGeometry, burnerMaterial);
    burner.position.y = -2;
    gameState.balloonGroup.add(burner);
    
    // Add burner light
    gameState.burnerLight = new THREE.PointLight(0xFFA500, 0, 10);
    gameState.burnerLight.position.y = -1.5;
    gameState.balloonGroup.add(gameState.burnerLight);
    
    // Create particle system for flames
    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        // Particles start at the burner and move upward
        particlePositions[i3] = (Math.random() - 0.5) * 0.5;
        particlePositions[i3 + 1] = -1.5; // Position at the top of the burner
        particlePositions[i3 + 2] = (Math.random() - 0.5) * 0.5;
        particleSizes[i] = Math.random() * 0.5 + 0.1;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: 0xFF4500,
        size: 0.5,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    gameState.burnerParticles = new THREE.Points(particleGeometry, particleMaterial);
    gameState.balloonGroup.add(gameState.burnerParticles);
    
    // Add a directional indicator (arrow) to help with navigation
    const arrowGroup = new THREE.Group();
    
    // Arrow body
    const arrowBodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
    const arrowMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    const arrowBody = new THREE.Mesh(arrowBodyGeometry, arrowMaterial);
    arrowBody.rotation.x = Math.PI / 2;
    arrowBody.position.z = 1.5;
    arrowGroup.add(arrowBody);
    
    // Arrow head
    const arrowHeadGeometry = new THREE.ConeGeometry(0.6, 1.5, 8);
    const arrowHead = new THREE.Mesh(arrowHeadGeometry, arrowMaterial);
    arrowHead.rotation.x = Math.PI / 2;
    arrowHead.position.z = 3.5;
    arrowGroup.add(arrowHead);
    
    // Position the arrow in front of the basket
    arrowGroup.position.set(0, -3, 2);
    gameState.balloonGroup.add(arrowGroup);
    
    // Position and add the balloon to the scene
    gameState.balloonGroup.position.copy(gameState.balloonPhysics.position);
    gameState.scene.add(gameState.balloonGroup);
}

// Update the burner particles
export function updateBurnerParticles(delta) {
    if (!gameState.burnerActive) return;
    
    const positions = gameState.burnerParticles.geometry.attributes.position.array;
    const sizes = gameState.burnerParticles.geometry.attributes.size.array;
    
    for (let i = 0; i < positions.length; i += 3) {
        // Move particles upward toward the balloon
        positions[i + 1] += (1 + Math.random()) * delta * 10;
        
        // Slightly spread particles as they rise
        positions[i] += (Math.random() - 0.5) * delta * 0.5;
        positions[i + 2] += (Math.random() - 0.5) * delta * 0.5;
        
        // Fade out particles that go too far
        if (positions[i + 1] > 2) { // Reset when they get closer to the balloon
            // Reset particle to start at burner
            positions[i] = (Math.random() - 0.5) * 0.5;
            positions[i + 1] = -1.5; // Start at top of burner
            positions[i + 2] = (Math.random() - 0.5) * 0.5;
            sizes[i/3] = Math.random() * 0.5 + 0.1;
        } else {
            // Increase size as particles move
            sizes[i/3] += delta * 0.5;
        }
    }
    
    gameState.burnerParticles.geometry.attributes.position.needsUpdate = true;
    gameState.burnerParticles.geometry.attributes.size.needsUpdate = true;
}

// Activate/deactivate the burner effect
export function activateBurner(active) {
    gameState.burnerActive = active;
    
    if (active) {
        // Adjust burner light based on lighting mode
        let intensity, distance, color;
        
        switch (gameState.selectedLighting) {
            case 'moonlight':
                intensity = 8;  // Brighter in darkness
                distance = 20;
                color = 0xFF6600; // More orange
                break;
            case 'sunset':
                intensity = 5;
                distance = 15;
                color = 0xFF4500; // Orange-red
                break;
            case 'day':
            default:
                intensity = 3;
                distance = 10;
                color = 0xFFA500; // Standard orange
                break;
        }
        
        // Turn on burner light with appropriate settings
        gameState.burnerLight.intensity = intensity;
        gameState.burnerLight.distance = distance;
        gameState.burnerLight.color.set(color);
        
        // Show flame particles
        gameState.burnerParticles.material.opacity = 1;
        
        // Make particles more visible in moonlight
        if (gameState.selectedLighting === 'moonlight') {
            gameState.burnerParticles.material.size = 1.0;
            gameState.burnerParticles.material.color.set(0xFF4500);
        }
        
        // Add audio for burner (would be added here if audio implemented)
    } else {
        // Turn off burner light
        gameState.burnerLight.intensity = 0;
        
        // Hide flame particles
        gameState.burnerParticles.material.opacity = 0;
        
        // Stop audio
    }
}

// Update balloon physics and position
export function updateBalloonPhysics(delta) {
    // Reset acceleration
    gameState.balloonPhysics.acceleration.set(0, 0, 0);
    
    // Apply damping to velocity for smoother movement
    gameState.balloonPhysics.velocity.multiplyScalar(gameState.balloonPhysics.damping);
    
    // Get forward direction based on balloon rotation
    const forwardVector = new THREE.Vector3(0, 0, 1).applyQuaternion(gameState.balloonGroup.quaternion);
    const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(gameState.balloonGroup.quaternion);
    
    // Handle progressive acceleration for forward/backward movement
    if (gameState.keys.ArrowUp) {
        // Increase acceleration while key is held
        gameState.balloonPhysics.currentAcceleration += gameState.balloonPhysics.accelerationRate;
        // Cap the acceleration
        gameState.balloonPhysics.currentAcceleration = Math.min(gameState.balloonPhysics.currentAcceleration, 1.0);
    } else if (gameState.keys.ArrowDown) {
        // Decrease acceleration while key is held
        gameState.balloonPhysics.currentAcceleration -= gameState.balloonPhysics.accelerationRate;
        // Cap the deceleration
        gameState.balloonPhysics.currentAcceleration = Math.max(gameState.balloonPhysics.currentAcceleration, -0.7);
    } else {
        // Gradually return to normal speed when no keys are pressed
        if (Math.abs(gameState.balloonPhysics.currentAcceleration) < 0.05) {
            gameState.balloonPhysics.currentAcceleration = 0;
        } else if (gameState.balloonPhysics.currentAcceleration > 0) {
            gameState.balloonPhysics.currentAcceleration -= gameState.balloonPhysics.accelerationRate / 2;
        } else {
            gameState.balloonPhysics.currentAcceleration += gameState.balloonPhysics.accelerationRate / 2;
        }
    }
    
    // Apply the current acceleration
    gameState.balloonPhysics.acceleration.addScaledVector(
        forwardVector, 
        gameState.balloonPhysics.currentAcceleration
    );
    
    // Handle user input for vertical movement
    if (gameState.keys.KeyW) {
        // Move up
        gameState.balloonPhysics.acceleration.y += gameState.balloonPhysics.verticalSpeed;
        
        // Animate the balloon slightly (expand) when rising
        gameState.balloon.scale.set(1.03, 1.03, 1.03);
    } else {
        // Return to normal size
        gameState.balloon.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
    
    if (gameState.keys.KeyS) {
        // Move down
        gameState.balloonPhysics.acceleration.y -= gameState.balloonPhysics.verticalSpeed;
        
        // Animate the balloon slightly (contract) when descending
        gameState.balloon.scale.set(0.97, 0.97, 0.97);
    }
    
    // Apply turning
    if (gameState.keys.ArrowLeft) {
        gameState.balloonGroup.rotation.y += gameState.balloonPhysics.turnSpeed * delta;
    }
    
    if (gameState.keys.ArrowRight) {
        gameState.balloonGroup.rotation.y -= gameState.balloonPhysics.turnSpeed * delta;
    }
    
    // Apply acceleration to velocity
    gameState.balloonPhysics.velocity.add(
        gameState.balloonPhysics.acceleration.clone().multiplyScalar(delta * 60)
    );
    
    // Add base forward speed to velocity
    const baseForwardVelocity = forwardVector.clone().multiplyScalar(gameState.balloonPhysics.baseSpeed);
    gameState.balloonPhysics.velocity.x += baseForwardVelocity.x * delta;
    gameState.balloonPhysics.velocity.z += baseForwardVelocity.z * delta;
    
    // Limit velocity to max speed
    const horizontalSpeed = new THREE.Vector2(
        gameState.balloonPhysics.velocity.x, 
        gameState.balloonPhysics.velocity.z
    ).length();
    
    if (horizontalSpeed > gameState.balloonPhysics.maxSpeed) {
        const ratio = gameState.balloonPhysics.maxSpeed / horizontalSpeed;
        gameState.balloonPhysics.velocity.x *= ratio;
        gameState.balloonPhysics.velocity.z *= ratio;
    }
    
    // Ensure minimum horizontal speed
    if (horizontalSpeed < gameState.balloonPhysics.minSpeed) {
        // Only enforce minimum speed if not actively braking
        if (gameState.balloonPhysics.currentAcceleration >= -0.2) {
            const ratio = gameState.balloonPhysics.minSpeed / (horizontalSpeed || 1);
            gameState.balloonPhysics.velocity.x *= ratio;
            gameState.balloonPhysics.velocity.z *= ratio;
        }
    }
    
    // Limit vertical speed
    const maxVerticalSpeed = 10;
    gameState.balloonPhysics.velocity.y = THREE.MathUtils.clamp(
        gameState.balloonPhysics.velocity.y, 
        -maxVerticalSpeed, 
        maxVerticalSpeed
    );
    
    // Apply velocity to position
    gameState.balloonPhysics.position.add(
        gameState.balloonPhysics.velocity.clone().multiplyScalar(delta)
    );
    
    // Ensure minimum height
    if (gameState.balloonPhysics.position.y < 30) {
        gameState.balloonPhysics.position.y = 30;
        gameState.balloonPhysics.velocity.y = 0;
    }
    
    // Maximum height
    if (gameState.balloonPhysics.position.y > 500) {
        gameState.balloonPhysics.position.y = 500;
        gameState.balloonPhysics.velocity.y = 0;
    }
    
    // Update balloon group position
    gameState.balloonGroup.position.copy(gameState.balloonPhysics.position);
    
    // Make the balloon sway slightly
    gameState.balloonGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.05;
    gameState.balloonGroup.rotation.z = Math.sin(Date.now() * 0.0008) * 0.05;
}