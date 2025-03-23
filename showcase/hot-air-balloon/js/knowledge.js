import { gameState } from './gameState.js';
import { updateCollectionCounter } from './main.js';

// Create knowledge orbs
export function createKnowledgeOrbs() {
    // Clear any existing orbs
    gameState.knowledgeOrbs.forEach(orb => {
        gameState.scene.remove(orb);
    });
    gameState.knowledgeOrbs = [];
    
    // Distribute knowledge orbs in interesting patterns
    for (let i = 0; i < gameState.knowledgeData.length; i++) {
        const data = gameState.knowledgeData[i];
        const angle = (i / gameState.knowledgeData.length) * Math.PI * 2;
        const radius = 800 + Math.random() * 500;
        
        // Position in a circular pattern around the starting point
        // but with some variation in height and distance
        const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 300;
        const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 300;
        const y = 150 + Math.random() * 200;
        
        createKnowledgeOrb(x, y, z, data);
    }
}

// Create a single knowledge orb
export function createKnowledgeOrb(x, y, z, data) {
    const orbGroup = new THREE.Group();
    
    // Create the glowing orb
    const orbGeometry = new THREE.SphereGeometry(5, 16, 16);
    const orbMaterial = new THREE.MeshStandardMaterial({ 
        color: data.color,
        emissive: data.color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.8
    });
    const orb = new THREE.Mesh(orbGeometry, orbMaterial);
    orbGroup.add(orb);
    
    // Add an outer glow
    const glowGeometry = new THREE.SphereGeometry(6, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: data.color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    orbGroup.add(glow);
    
    // Add point light for illumination
    const light = new THREE.PointLight(data.color, 1, 30);
    orbGroup.add(light);
    
    // Create particles around the orb
    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 5 + Math.random() * 2;
        
        positions[i] = Math.cos(angle) * radius;
        positions[i + 1] = (Math.random() - 0.5) * radius;
        positions[i + 2] = Math.sin(angle) * radius;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
        color: data.color,
        size: 0.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    orbGroup.add(particles);
    
    // Add rotation animation
    orbGroup.userData = {
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        verticalSpeed: Math.sin(Math.random() * Math.PI * 2) * 0.03,
        data: data,
        initialY: y,
        animationPhase: Math.random() * Math.PI * 2
    };
    
    // Position the orb
    orbGroup.position.set(x, y, z);
    
    // Add to scene and tracking array
    gameState.scene.add(orbGroup);
    gameState.knowledgeOrbs.push(orbGroup);
    
    return orbGroup;
}

// Show knowledge information when an orb is collected
export function showKnowledgeInfo(data) {
    const titleElement = document.getElementById('knowledge-title');
    const textElement = document.getElementById('knowledge-text');
    const panelElement = document.getElementById('knowledge-panel');
    
    titleElement.textContent = data.title;
    
    // Find if this knowledge unlocks any challenges
    let challengeGuidance = '';
    gameState.challengeData.forEach(challenge => {
        if (challenge.requiredKnowledge.includes(data.id)) {
            challengeGuidance = `<div class="knowledge-challenge-hint">
                <span class="hint-icon">?</span>
                <span>This knowledge unlocks a challenge! Look for a question mark platform with the same color.</span>
            </div>`;
        }
    });
    
    // Display text with optional challenge guidance
    textElement.innerHTML = `${data.text}${challengeGuidance}`;
    
    // Add styles for the hint if not already added
    if (challengeGuidance && !document.getElementById('knowledge-hint-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'knowledge-hint-styles';
        styleElement.textContent = `
            .knowledge-challenge-hint {
                margin-top: 15px;
                padding: 10px;
                background-color: rgba(255, 255, 255, 0.1);
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .hint-icon {
                background-color: #FFD700;
                color: black;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
            }
        `;
        document.head.appendChild(styleElement);
        
        // Update the hint icon color to match the knowledge orb
        setTimeout(() => {
            const hintIcon = document.querySelector('.hint-icon');
            if (hintIcon) {
                hintIcon.style.backgroundColor = `#${data.color.toString(16).padStart(6, '0')}`;
            }
        }, 10);
    }
    
    // Show the panel
    panelElement.style.opacity = '1';
    
    // Change the panel border color to match the orb
    panelElement.style.borderColor = `#${data.color.toString(16).padStart(6, '0')}`;
    
    // Hide after 10 seconds
    setTimeout(() => {
        panelElement.style.opacity = '0';
    }, 10000); // Extended to 10 seconds to give more time to read the hint
}

// Check for collision with knowledge orbs
export function checkOrbCollisions() {
    if (gameState.knowledgeOrbs.length === 0) return;
    
    const balloonRadius = 5;  // Player balloon radius
    const orbRadius = 5;      // Knowledge orb radius
    const minDistance = balloonRadius + orbRadius;
    
    // Reset nearest orb tracking
    gameState.nearestOrbDistance = Infinity;
    gameState.nearestOrbDirection = new THREE.Vector3();
    
    // Check each orb
    for (let i = 0; i < gameState.knowledgeOrbs.length; i++) {
        const orb = gameState.knowledgeOrbs[i];
        
        // Calculate distance between player balloon and orb
        const distance = gameState.balloonPhysics.position.distanceTo(orb.position);
        
        // Track nearest orb for reference
        if (distance < gameState.nearestOrbDistance) {
            gameState.nearestOrbDistance = distance;
            gameState.nearestOrbDirection.copy(orb.position)
                .sub(gameState.balloonPhysics.position)
                .normalize();
        }
        
        if (distance < minDistance) {
            // Collision detected - collect the knowledge
            const knowledgeData = orb.userData.data;
            
            // Show the knowledge info
            showKnowledgeInfo(knowledgeData);
            
            // Update collection counter
            gameState.collectedKnowledge++;
            updateCollectionCounter();
            
            // Update score
            gameState.score += 50;
            updateScoreDisplay();
            
            // Visual effect for collecting the orb
            collectOrb(orb);
            
            // Remove the orb from the scene
            gameState.scene.remove(orb);
            gameState.knowledgeOrbs.splice(i, 1);
            
            // Also remove corresponding indicators from minimap
            if (gameState.orbIndicators) {
                const indicatorsToRemove = [];
                
                // Find all indicators associated with this orb
                gameState.orbIndicators.forEach((indicator, idx) => {
                    if (indicator.userData.orb === orb) {
                        indicatorsToRemove.push(idx);
                        gameState.scene.remove(indicator);
                    }
                });
                
                // Remove the indicators from the array (in reverse order to avoid index issues)
                indicatorsToRemove.sort((a, b) => b - a);
                indicatorsToRemove.forEach(idx => {
                    gameState.orbIndicators.splice(idx, 1);
                });
            }
            
            i--; // Adjust for the removed element
            
            // Break to prevent multiple collisions in one frame
            break;
        }
    }
}

// Visual effect for collecting an orb
export function collectOrb(orb) {
    // Get the orb's position and color
    const position = orb.position.clone();
    const color = new THREE.Color(orb.userData.data.color);
    
    // Create explosion particles
    const particleCount = 50;
    const particleGroup = new THREE.Group();
    
    for (let i = 0; i < particleCount; i++) {
        const particleGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        
        // Random position around orb center
        particle.position.set(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        
        // Random velocity
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 10
            ),
            life: 1.0
        };
        
        particleGroup.add(particle);
    }
    
    particleGroup.position.copy(position);
    gameState.scene.add(particleGroup);
    
    // Add particle animation
    const animateParticles = function() {
        particleGroup.children.forEach(particle => {
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.05));
            particle.userData.life -= 0.02;
            
            if (particle.userData.life <= 0) {
                particle.scale.set(0, 0, 0);
            } else {
                particle.scale.set(
                    particle.userData.life,
                    particle.userData.life,
                    particle.userData.life
                );
                particle.material.opacity = particle.userData.life;
            }
        });
        
        if (particleGroup.children.some(p => p.userData.life > 0)) {
            requestAnimationFrame(animateParticles);
        } else {
            gameState.scene.remove(particleGroup);
        }
    };
    
    animateParticles();
    
    // Create a flash of light
    const flashLight = new THREE.PointLight(color, 5, 100);
    flashLight.position.copy(position);
    gameState.scene.add(flashLight);
    
    // Fade out the flash
    const fadeFlash = function() {
        flashLight.intensity -= 0.2;
        
        if (flashLight.intensity > 0) {
            requestAnimationFrame(fadeFlash);
        } else {
            gameState.scene.remove(flashLight);
        }
    };
    
    fadeFlash();
}

// Animate knowledge orbs
export function animateKnowledgeOrbs(delta) {
    gameState.knowledgeOrbs.forEach(orb => {
        // Rotate the orb
        orb.rotation.y += orb.userData.rotationSpeed;
        
        // Bobbing motion
        orb.userData.animationPhase += delta * 0.5;
        orb.position.y = orb.userData.initialY + Math.sin(orb.userData.animationPhase) * 5;
        
        // Animate glow
        const outerGlow = orb.children[1];
        outerGlow.scale.set(
            1 + Math.sin(Date.now() * 0.001) * 0.1,
            1 + Math.sin(Date.now() * 0.001) * 0.1,
            1 + Math.sin(Date.now() * 0.001) * 0.1
        );
    });
}

// Update score display function
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