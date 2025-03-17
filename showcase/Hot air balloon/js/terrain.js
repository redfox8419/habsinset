import { gameState } from './gameState.js';
import { createTree, createRock, createCactus, createSnowCap, createGrassClump } from './features.js';

// Create the terrain with multiple biomes
export function createTerrain() {
    // Set up biome parameters
    const biomes = {
        forest: {
            color: 0x2D572C,
            height: 100,
            roughness: 1,
            trees: true,
            treeColor: 0x006400,
            treeDensity: 0.7
        },
        mountains: {
            color: 0x6D6552,
            height: 250,
            roughness: 1.5,
            trees: true,
            treeColor: 0x004B00,
            treeDensity: 0.3
        },
        desert: {
            color: 0xE6C78F,
            height: 60,
            roughness: 0.8,
            trees: false,
            rocks: true,
            rockDensity: 0.4
        },
        plains: {
            color: 0x91B95E,
            height: 40,
            roughness: 0.6,
            trees: true,
            treeColor: 0x628A40,
            treeDensity: 0.2
        },
        canyon: {
            color: 0xA3623A,
            height: 150,
            roughness: 1.2,
            trees: false,
            rocks: true,
            rockDensity: 0.6
        },
        water: {
            color: 0x0077BE,
            height: -20,
            roughness: 0.3,
            reflective: true
        }
    };
    
    // Create perlin noise generator
    const simplex = new SimplexNoise();
    
    // Generate a biome map using perlin noise
    const biomeMapSize = 2000;
    const biomeMapResolution = 100;
    const biomeMap = [];
    
    for (let z = 0; z < biomeMapResolution; z++) {
        biomeMap[z] = [];
        for (let x = 0; x < biomeMapResolution; x++) {
            const nx = x / biomeMapResolution - 0.5;
            const nz = z / biomeMapResolution - 0.5;
            
            // Use larger scale noise for biome transitions
            const biomeValue = simplex.noise2D(nx * 2, nz * 2);
            
            let biomeName;
            if (biomeValue < -0.6) {
                biomeName = 'water';
            } else if (biomeValue < -0.3) {
                biomeName = 'plains';
            } else if (biomeValue < 0.1) {
                biomeName = 'forest';
            } else if (biomeValue < 0.4) {
                biomeName = 'desert';
            } else if (biomeValue < 0.7) {
                biomeName = 'canyon';
            } else {
                biomeName = 'mountains';
            }
            
            biomeMap[z][x] = biomeName;
        }
    }
    
    // Function to get biome at a specific world position
    function getBiomeAt(worldX, worldZ) {
        const mapX = Math.floor(((worldX + biomeMapSize/2) / biomeMapSize) * biomeMapResolution);
        const mapZ = Math.floor(((worldZ + biomeMapSize/2) / biomeMapSize) * biomeMapResolution);
        
        // Check bounds
        if (mapX < 0 || mapX >= biomeMapResolution || mapZ < 0 || mapZ >= biomeMapResolution) {
            return 'plains'; // Default biome
        }
        
        return biomeMap[mapZ][mapX];
    }
    
    // Function to get biome parameters with smooth transitions
    function getBiomeParameters(worldX, worldZ) {
        const mapX = ((worldX + biomeMapSize/2) / biomeMapSize) * biomeMapResolution;
        const mapZ = ((worldZ + biomeMapSize/2) / biomeMapSize) * biomeMapResolution;
        
        // Get integer cell coordinates
        const x0 = Math.floor(mapX);
        const z0 = Math.floor(mapZ);
        const x1 = Math.min(x0 + 1, biomeMapResolution - 1);
        const z1 = Math.min(z0 + 1, biomeMapResolution - 1);
        
        // Get fractional position within the cell
        const dx = mapX - x0;
        const dz = mapZ - z0;
        
        // Get biomes at corners
        const b00 = biomes[getBiomeAt(worldX - dx * (biomeMapSize/biomeMapResolution), worldZ - dz * (biomeMapSize/biomeMapResolution))];
        const b10 = biomes[getBiomeAt(worldX + (1-dx) * (biomeMapSize/biomeMapResolution), worldZ - dz * (biomeMapSize/biomeMapResolution))];
        const b01 = biomes[getBiomeAt(worldX - dx * (biomeMapSize/biomeMapResolution), worldZ + (1-dz) * (biomeMapSize/biomeMapResolution))];
        const b11 = biomes[getBiomeAt(worldX + (1-dx) * (biomeMapSize/biomeMapResolution), worldZ + (1-dz) * (biomeMapSize/biomeMapResolution))];
        
        // Bilinear interpolation for color
        const c00 = new THREE.Color(b00.color);
        const c10 = new THREE.Color(b10.color);
        const c01 = new THREE.Color(b01.color);
        const c11 = new THREE.Color(b11.color);
        
        const c0 = c00.clone().lerp(c10, dx);
        const c1 = c01.clone().lerp(c11, dx);
        const color = c0.clone().lerp(c1, dz);
        
        // Bilinear interpolation for height and roughness
        const h0 = b00.height * (1-dx) + b10.height * dx;
        const h1 = b01.height * (1-dx) + b11.height * dx;
        const height = h0 * (1-dz) + h1 * dz;
        
        const r0 = b00.roughness * (1-dx) + b10.roughness * dx;
        const r1 = b01.roughness * (1-dx) + b11.roughness * dx;
        const roughness = r0 * (1-dz) + r1 * dz;
        
        return {
            color: color,
            height: height,
            roughness: roughness,
            biomeName: getBiomeAt(worldX, worldZ) // For determining features
        };
    }
    
    // Create a chunked terrain system for efficiency
    const chunkSize = 1000;
    const chunkDetail = 64;
    const loadDistance = 2; // Number of chunks to load around player
    
    // Function to create a terrain chunk
    function createTerrainChunk(chunkX, chunkZ) {
        const geometry = new THREE.PlaneGeometry(chunkSize, chunkSize, chunkDetail, chunkDetail);
        geometry.rotateX(-Math.PI / 2);
        
        const positions = geometry.attributes.position.array;
        const worldOffsetX = chunkX * chunkSize;
        const worldOffsetZ = chunkZ * chunkSize;
        
        // Create array for vertex colors
        const colors = [];
        
        // Apply height based on biome and noise
        for (let i = 0; i < positions.length; i += 3) {
            // Local position within the chunk
            const localX = positions[i];
            const localZ = positions[i + 2];
            
            // World position
            const worldX = localX + worldOffsetX;
            const worldZ = localZ + worldOffsetZ;
            
            // Get biome parameters
            const biomeParams = getBiomeParameters(worldX, worldZ);
            
            // Generate noise-based height
            const frequency = 0.002;
            let height = 0;
            
            // Layer multiple frequencies for more natural looking terrain
            height += biomeParams.height * simplex.noise2D(worldX * frequency * biomeParams.roughness, worldZ * frequency * biomeParams.roughness);
            height += biomeParams.height * 0.5 * simplex.noise2D(worldX * frequency * 2 * biomeParams.roughness, worldZ * frequency * 2 * biomeParams.roughness);
            height += biomeParams.height * 0.25 * simplex.noise2D(worldX * frequency * 4 * biomeParams.roughness, worldZ * frequency * 4 * biomeParams.roughness);
            
            // Flatten the center area for starting zone
            const distanceFromCenter = Math.sqrt(worldX * worldX + worldZ * worldZ);
            const flattenFactor = Math.max(0, 1 - Math.max(0, (200 - distanceFromCenter) / 200));
            
            // Set vertex height
            positions[i + 1] = height * flattenFactor;
            
            // Set vertex color
            colors.push(biomeParams.color.r, biomeParams.color.g, biomeParams.color.b);
        }
        
        // Update vertex positions
        geometry.attributes.position.needsUpdate = true;
        
        // Add vertex colors to geometry
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // Compute normals for proper lighting
        geometry.computeVertexNormals();
        
        // Create the terrain material
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: true
        });
        
        // Create the terrain mesh
        const terrainMesh = new THREE.Mesh(geometry, material);
        terrainMesh.castShadow = true;
        terrainMesh.receiveShadow = true;
        terrainMesh.position.set(worldOffsetX, 0, worldOffsetZ);
        
        // Store chunk coordinates
        terrainMesh.userData = {
            chunkX: chunkX,
            chunkZ: chunkZ
        };
        
        gameState.scene.add(terrainMesh);
        
        // Add terrain features based on biome
        addTerrainFeatures(terrainMesh, chunkX, chunkZ, biomeMap, biomes, worldOffsetX, worldOffsetZ, chunkSize, getBiomeAt);
        
        // Add water for water biomes
        const waterSurface = createWaterSurface(worldOffsetX, worldOffsetZ, chunkSize);
        gameState.scene.add(waterSurface);
        
        // Return the chunk with mesh
        return {
            mesh: terrainMesh,
            water: waterSurface,
            x: chunkX,
            z: chunkZ
        };
    }
    
    // Add initial terrain chunks around the starting position
    for (let z = -loadDistance; z <= loadDistance; z++) {
        for (let x = -loadDistance; x <= loadDistance; x++) {
            gameState.terrainChunks.push(createTerrainChunk(x, z));
        }
    }
}

// Create water surface for a chunk
function createWaterSurface(worldOffsetX, worldOffsetZ, chunkSize) {
    const waterGeometry = new THREE.PlaneGeometry(chunkSize, chunkSize, 1, 1);
    waterGeometry.rotateX(-Math.PI / 2);
    
    const waterMaterial = new THREE.MeshStandardMaterial({
        color: 0x0077BE,
        transparent: true,
        opacity: 0.8,
        metalness: 0.1,
        roughness: 0.1
    });
    
    const water = new THREE.Mesh(waterGeometry, waterMaterial);
    water.position.set(worldOffsetX, 20, worldOffsetZ); // Water level
    
    return water;
}

// Add features to terrain chunk based on biome
function addTerrainFeatures(terrainMesh, chunkX, chunkZ, biomeMap, biomes, worldOffsetX, worldOffsetZ, chunkSize, getBiomeAt) {
    const featureGroup = new THREE.Group();
    featureGroup.position.set(worldOffsetX, 0, worldOffsetZ);
    
    // Number of feature attempts
    const featureCount = 100;
    
    // For each feature attempt
    for (let i = 0; i < featureCount; i++) {
        // Random position within the chunk
        const localX = (Math.random() - 0.5) * chunkSize;
        const localZ = (Math.random() - 0.5) * chunkSize;
        
        // World position
        const worldX = localX + worldOffsetX;
        const worldZ = localZ + worldOffsetZ;
        
        // Get biome at this position
        const biomeName = getBiomeAt(worldX, worldZ);
        const biome = biomes[biomeName];
        
        // Don't place features in the center play area
        if (Math.sqrt(worldX * worldX + worldZ * worldZ) < 200) continue;
        
        // Find y position on terrain using raycasting
        const raycaster = new THREE.Raycaster();
        raycaster.set(
            new THREE.Vector3(localX, 1000, localZ),
            new THREE.Vector3(0, -1, 0)
        );
        const intersects = raycaster.intersectObject(terrainMesh);
        
        if (intersects.length > 0) {
            const y = intersects[0].point.y;
            
            // Add trees in forested biomes
            if (biome.trees && Math.random() < biome.treeDensity) {
                createTree(localX, y, localZ, biome.treeColor, featureGroup);
            }
            
            // Add rocks in rocky biomes
            if (biome.rocks && Math.random() < biome.rockDensity) {
                createRock(localX, y, localZ, featureGroup);
            }
            
            // Add cacti in desert
            if (biomeName === 'desert' && Math.random() < 0.2) {
                createCactus(localX, y, localZ, featureGroup);
            }
            
            // Add special features in specific biomes
            if (biomeName === 'mountains' && Math.random() < 0.05) {
                createSnowCap(localX, y, localZ, featureGroup);
            }
            
            if (biomeName === 'plains' && Math.random() < 0.3) {
                createGrassClump(localX, y, localZ, featureGroup);
            }
        }
    }
    
    gameState.scene.add(featureGroup);
}