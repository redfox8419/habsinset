import { gameState } from './gameState.js';

// Create the skybox with dynamic time of day
export function createSkybox() {
    // Create a large dome for the sky
    const skyGeometry = new THREE.SphereGeometry(5000, 32, 32);
    skyGeometry.scale(-1, 1, 1); // Invert the geometry so we see the texture from the inside
    
    // Create gradient sky material
    const vertexShader = `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    
    const fragmentShader = `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
            float h = normalize(vWorldPosition + offset).y;
            gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
    `;
    
    // Different colors based on lighting setting
    let topColor, bottomColor, fogColor;
    
    switch (gameState.selectedLighting) {
        case 'sunset':
            topColor = new THREE.Color(0x1F1033); // Deep blue/purple
            bottomColor = new THREE.Color(0xFF7E00); // Orange sunset
            fogColor = 0xFFA07A; // Light salmon
            break;
        case 'moonlight':
            topColor = new THREE.Color(0x000011); // Much darker deep blue
            bottomColor = new THREE.Color(0x000022); // Very dark navy blue
            fogColor = 0x000011; // Very dark blue fog
            break;
        case 'day':
        default:
            topColor = new THREE.Color(0x0077FF); // Sky blue
            bottomColor = new THREE.Color(0xFFFFFF); // White/light blue
            fogColor = 0xCCE0FF; // Light blue fog
            break;
    }
    
    const uniforms = {
        topColor: { value: topColor },
        bottomColor: { value: bottomColor },
        offset: { value: 100 },
        exponent: { value: 0.6 }
    };
    
    const skyMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        uniforms: uniforms,
        side: THREE.BackSide
    });
    
    gameState.skybox = new THREE.Mesh(skyGeometry, skyMaterial);
    gameState.scene.add(gameState.skybox);
    
    // Update fog based on lighting setting
    gameState.scene.fog = new THREE.FogExp2(fogColor, 0.0005);
    
    // Add stars for night and moonlight scenes
    if (gameState.selectedLighting === 'moonlight') {
        addStars();
        addMoon();
    } else if (gameState.selectedLighting === 'sunset') {
        addSun(true); // True for sunset
    } else {
        addStars(true); // Fewer, fainter stars for daytime
        addSun(false); // False for regular sun
    }
    
    // Add clouds
    addClouds();
}

// Add stars to the sky
function addStars(faint = false) {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: faint ? 0.5 : 1,
        transparent: true,
        opacity: faint ? 0.3 : 0.8,
        sizeAttenuation: false
    });
    
    const starCount = faint ? 3000 : 10000;
    const starVertices = [];
    
    for (let i = 0; i < starCount; i++) {
        const x = (Math.random() - 0.5) * 2;
        const y = Math.random() * 0.5 + 0.5; // Only in the upper hemisphere
        const z = (Math.random() - 0.5) * 2;
        const normalized = new THREE.Vector3(x, y, z).normalize();
        starVertices.push(normalized.x * 4900, normalized.y * 4900, normalized.z * 4900);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    gameState.scene.add(stars);
}

// Add a moon to the sky
function addMoon() {
    // Create moon geometry
    const moonGeometry = new THREE.SphereGeometry(200, 32, 32);
    const moonMaterial = new THREE.MeshBasicMaterial({
        color: 0xECF0F1,
        emissive: 0xECF0F1,
        emissiveIntensity: 0.2
    });
    
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    
    // Position the moon in the sky
    const moonAngle = Math.PI * 0.1; // Just above horizon
    const moonDistance = 4500;
    moon.position.set(
        Math.cos(moonAngle) * moonDistance,
        Math.sin(moonAngle) * moonDistance,
        0
    );
    
    gameState.scene.add(moon);
    
    // Add a glow effect around the moon
    const moonGlowGeometry = new THREE.SphereGeometry(250, 32, 32);
    const moonGlowMaterial = new THREE.MeshBasicMaterial({
        color: 0xECF0F1,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    
    const moonGlow = new THREE.Mesh(moonGlowGeometry, moonGlowMaterial);
    moonGlow.position.copy(moon.position);
    gameState.scene.add(moonGlow);
    
    // Add a point light from the moon
    const moonLight = new THREE.PointLight(0xECF0F1, 0.8, 6000);
    moonLight.position.copy(moon.position);
    gameState.scene.add(moonLight);
}

// Add a sun to the sky
function addSun(isSunset) {
    // Create sun geometry
    const sunGeometry = new THREE.SphereGeometry(isSunset ? 150 : 100, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({
        color: isSunset ? 0xFF4500 : 0xFFFFaa, // Orange-red for sunset, yellow for day
        emissive: isSunset ? 0xFF4500 : 0xFFFFaa,
        emissiveIntensity: 1
    });
    
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    
    // Position the sun in the sky
    const sunAngle = isSunset ? Math.PI * 0.05 : Math.PI * 0.4; // Lower for sunset
    const sunDistance = 4500;
    sun.position.set(
        Math.cos(sunAngle) * sunDistance,
        Math.sin(sunAngle) * sunDistance,
        isSunset ? -1000 : 0 // Push back a bit for sunset
    );
    
    gameState.scene.add(sun);
    
    // Add a glow effect around the sun
    const sunGlowGeometry = new THREE.SphereGeometry(isSunset ? 250 : 160, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({
        color: isSunset ? 0xFF4500 : 0xFFFF00,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sunGlow.position.copy(sun.position);
    gameState.scene.add(sunGlow);
    
    // For sunset, add additional glow layers
    if (isSunset) {
        const sunsetGlowGeometry = new THREE.SphereGeometry(400, 32, 32);
        const sunsetGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF9933,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        
        const sunsetGlow = new THREE.Mesh(sunsetGlowGeometry, sunsetGlowMaterial);
        sunsetGlow.position.copy(sun.position);
        gameState.scene.add(sunsetGlow);
    }
}

// Add clouds to the sky
function addClouds() {
    const cloudCount = gameState.selectedLighting === 'moonlight' ? 20 : 50;
    
    for (let i = 0; i < cloudCount; i++) {
        createCloud(
            Math.random() * 2000 - 1000,
            Math.random() * 300 + 200,
            Math.random() * 2000 - 1000
        );
    }
}

// Create a cloud - improved version with more realistic shapes
export function createCloud(x, y, z) {
    const cloudGroup = new THREE.Group();
    
    // Adjust cloud appearance based on lighting
    let cloudColor, cloudEmissive, cloudOpacity;
    
    switch (gameState.selectedLighting) {
        case 'sunset':
            cloudColor = 0xFFB266; // Sunset orange tint
            cloudEmissive = 0xFF4500;
            cloudOpacity = 0.9;
            break;
        case 'moonlight':
            cloudColor = 0x6699CC; // Blue tint for night
            cloudEmissive = 0x222222;
            cloudOpacity = 0.7;
            break;
        case 'day':
        default:
            cloudColor = 0xffffff; // White for day
            cloudEmissive = 0x555555;
            cloudOpacity = 0.9;
            break;
    }
    
    const cloudMaterial = new THREE.MeshStandardMaterial({
        color: cloudColor,
        emissive: cloudEmissive,
        emissiveIntensity: 0.1,
        flatShading: false,  // Smoother look
        transparent: true,
        opacity: cloudOpacity
    });
    
    // Create main cloud body (flatter, wider shape)
    const mainCloudGeometry = new THREE.SphereGeometry(70 + Math.random() * 40, 8, 8);
    mainCloudGeometry.scale(1, 0.4, 0.8); // Flatter and slightly elongated
    const mainCloud = new THREE.Mesh(mainCloudGeometry, cloudMaterial);
    cloudGroup.add(mainCloud);
    
    // Create additional puffs with more variation and natural shapes
    const puffCount = 6 + Math.floor(Math.random() * 8);
    
    for (let i = 0; i < puffCount; i++) {
        // Size variations
        const puffSize = 30 + Math.random() * 50;
        // Use sphere geometry for smoother clouds
        const puffGeometry = new THREE.SphereGeometry(puffSize, 8, 8);
        const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
        
        // Calculate angle around the main body
        const angle = (i / puffCount) * Math.PI * 2;
        const distanceFromCenter = 40 + Math.random() * 30;
        
        // Position puffs around the main cloud
        puff.position.set(
            Math.cos(angle) * distanceFromCenter * (0.7 + Math.random() * 0.5),
            (Math.random() - 0.2) * 20, // Less vertical variation
            Math.sin(angle) * distanceFromCenter * (0.7 + Math.random() * 0.5)
        );
        
        // Random scale for each puff to create more natural appearance
        const scaleY = 0.3 + Math.random() * 0.4; // Flatter
        puff.scale.set(
            0.8 + Math.random() * 0.4,
            scaleY,
            0.8 + Math.random() * 0.4
        );
        
        cloudGroup.add(puff);
    }
    
    // Add smaller detail puffs for more realistic cloud texture
    const detailCount = 8 + Math.floor(Math.random() * 10);
    for (let i = 0; i < detailCount; i++) {
        const detailSize = 15 + Math.random() * 25;
        const detailGeometry = new THREE.SphereGeometry(detailSize, 6, 6);
        const detail = new THREE.Mesh(detailGeometry, cloudMaterial);
        
        // Position these randomly across the cloud surface
        const angle = Math.random() * Math.PI * 2;
        const dist = 30 + Math.random() * 60;
        
        detail.position.set(
            Math.cos(angle) * dist,
            (Math.random() - 0.5) * 15,
            Math.sin(angle) * dist
        );
        
        detail.scale.set(
            0.6 + Math.random() * 0.5,
            0.3 + Math.random() * 0.3,
            0.6 + Math.random() * 0.5
        );
        
        cloudGroup.add(detail);
    }
    
    // Position the cloud
    cloudGroup.position.set(x, y, z);
    
    // Add to scene
    gameState.scene.add(cloudGroup);
    
    // Randomly assign a slow drift movement
    cloudGroup.userData = {
        drift: new THREE.Vector3(
            (Math.random() - 0.5) * 0.5, 
            0,
            (Math.random() - 0.5) * 0.5
        )
    };
    
    return cloudGroup;
}

// Update clouds
export function updateClouds(delta) {
    gameState.scene.children.forEach(child => {
        if (child.userData && child.userData.drift) {
            child.position.add(child.userData.drift.clone().multiplyScalar(delta));
            
            // Wrap clouds around when they go too far
            const maxDistance = 3000;
            if (Math.abs(child.position.x) > maxDistance) {
                child.position.x = -Math.sign(child.position.x) * maxDistance;
            }
            if (Math.abs(child.position.z) > maxDistance) {
                child.position.z = -Math.sign(child.position.z) * maxDistance;
            }
        }
    });
}