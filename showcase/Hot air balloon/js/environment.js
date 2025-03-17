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
    
    const uniforms = {
        topColor: { value: new THREE.Color(0x0077FF) }, // Sky blue
        bottomColor: { value: new THREE.Color(0xFFFFFF) }, // White/light blue
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
    
    // Add stars for a more immersive night sky effect
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 1,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: false
    });
    
    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2;
        const y = Math.random() * 0.5 + 0.5; // Only in the upper hemisphere
        const z = (Math.random() - 0.5) * 2;
        const normalized = new THREE.Vector3(x, y, z).normalize();
        starVertices.push(normalized.x * 4900, normalized.y * 4900, normalized.z * 4900);
    }
    
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    gameState.scene.add(stars);
    
    // Add clouds
    for (let i = 0; i < 50; i++) {
        createCloud(
            Math.random() * 2000 - 1000,
            Math.random() * 300 + 200,
            Math.random() * 2000 - 1000
        );
    }
}

// Create a cloud
export function createCloud(x, y, z) {
    const cloudGroup = new THREE.Group();
    const cloudMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: 0x555555,
        flatShading: true,
        transparent: true,
        opacity: 0.9
    });
    
    // Create cloud puffs
    const puffCount = 4 + Math.floor(Math.random() * 6);
    const puffSize = 50 + Math.random() * 70;
    
    for (let i = 0; i < puffCount; i++) {
        const puffGeometry = new THREE.SphereGeometry(puffSize, 7, 7);
        const puff = new THREE.Mesh(puffGeometry, cloudMaterial);
        
        puff.position.set(
            (Math.random() - 0.5) * puffSize * 2,
            (Math.random() - 0.5) * puffSize * 0.6,
            (Math.random() - 0.5) * puffSize * 2
        );
        
        puff.scale.y = 0.6;
        
        cloudGroup.add(puff);
    }
    
    cloudGroup.position.set(x, y, z);
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