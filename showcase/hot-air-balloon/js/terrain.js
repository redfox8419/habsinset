import { gameState } from './gameState.js';
import { createEnvironmentalObject } from './features.js';
import { interpolateBiomeValues, createBiomeConfigs, generateBiomeMap, generateTerrainHeight } from './terrainHelpers.js';

// Create the terrain with multiple biomes
export function createTerrain() {
    // Set up biome parameters based on selected terrain
    const biomes = createBiomeConfigs(gameState.selectedTerrain);
    
    // Create perlin noise generator
    const simplex = new SimplexNoise();
    
    // Generate a biome map using perlin noise
    const biomeMapSize = 2000;
    const biomeMapResolution = 100;
    const biomeMap = generateBiomeMap(simplex, biomeMapSize, biomeMapResolution, gameState.selectedTerrain);
    
    // Function to get biome at a specific world position
    function getBiomeAt(worldX, worldZ) {
        const mapX = Math.floor(((worldX + biomeMapSize/2) / biomeMapSize) * biomeMapResolution);
        const mapZ = Math.floor(((worldZ + biomeMapSize/2) / biomeMapSize) * biomeMapResolution);
        
        // Check bounds
        if (mapX < 0 || mapX >= biomeMapResolution || mapZ < 0 || mapZ >= biomeMapResolution) {
            return gameState.selectedTerrain === 'mountains' ? 'valleys' : 'plains'; // Default biome
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
        const height = interpolateBiomeValues(
            b00.height, b10.height, b01.height, b11.height, dx, dz
        );
        
        const roughness = interpolateBiomeValues(
            b00.roughness, b10.roughness, b01.roughness, b11.roughness, dx, dz
        );
        
        return {
            color: color,
            height: height,
            roughness: roughness,
            biomeName: getBiomeAt(worldX, worldZ) // For determining features
        };
    }
    
    // Create a chunked terrain system for efficiency
    const chunkSize = 1000;
    const chunkDetail = 64; // Base detail level for chunks
    const loadDistance = 2; // Number of chunks to load around player
    
    // Cache terrainMaterials to avoid creating duplicate materials
    const terrainMaterialsCache = {};
    
    // Function to create a terrain chunk with LOD (Level of Detail) optimization
    function createTerrainChunk(chunkX, chunkZ) {
        // Calculate world position for this chunk
        const worldOffsetX = chunkX * chunkSize;
        const worldOffsetZ = chunkZ * chunkSize;
        
        // Calculate distance from camera/balloon for LOD
        const distanceFromBalloon = Math.sqrt(
            Math.pow((worldOffsetX + chunkSize/2) - gameState.balloonPhysics.position.x, 2) + 
            Math.pow((worldOffsetZ + chunkSize/2) - gameState.balloonPhysics.position.z, 2)
        );
        
        // Adjust detail level based on distance (Level of Detail)
        let detail = chunkDetail; // Base detail (64)
if (distanceFromBalloon > 3000) {
    detail = 16; // Use fixed values instead of division
} else if (distanceFromBalloon > 2000) {
    detail = 32; // Use fixed values for better alignment
} else if (distanceFromBalloon > 1000) {
    detail = 48; // Use fixed values for better alignment
}
        
        const geometry = new THREE.PlaneGeometry(chunkSize, chunkSize, detail, detail);
        geometry.rotateX(-Math.PI / 2);
        
        const positions = geometry.attributes.position.array;
        
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
            
            // Generate noise-based height using helper function
            let height = generateTerrainHeight(simplex, worldX, worldZ, biomeParams, gameState.selectedTerrain);
            
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
        
        // Use material caching for better performance
        const materialKey = `terrain_${distanceFromBalloon > 2000 ? 'far' : 'near'}`;
        if (!terrainMaterialsCache[materialKey]) {
            terrainMaterialsCache[materialKey] = new THREE.MeshStandardMaterial({
                vertexColors: true,
                roughness: 0.8,
                metalness: 0.1,
                flatShading: distanceFromBalloon > 2000 // Use flat shading for distant chunks
            });
        }
        
        // Create the terrain mesh
        const terrainMesh = new THREE.Mesh(geometry, terrainMaterialsCache[materialKey]);
        terrainMesh.castShadow = distanceFromBalloon < 2000; // Only close chunks cast shadows
        terrainMesh.receiveShadow = true;
        terrainMesh.position.set(worldOffsetX, 0, worldOffsetZ);
        
        // Store chunk coordinates and create a bounding sphere for frustum culling
        terrainMesh.userData = {
            chunkX: chunkX,
            chunkZ: chunkZ,
            distanceFromBalloon: distanceFromBalloon
        };
        
        // Explicitly compute bounding sphere for frustum culling
        geometry.computeBoundingSphere();
        
        gameState.scene.add(terrainMesh);
        
        // Add terrain features based on biome (with distance-based optimization)
        let waterSurface = null;
        
        // Only add features and water if this chunk might be visible
        if (distanceFromBalloon < 4000) {
            addTerrainFeatures(terrainMesh, chunkX, chunkZ, biomeMap, biomes, worldOffsetX, worldOffsetZ, chunkSize, getBiomeAt, distanceFromBalloon);
            
            // Create water surface for non-mountain terrain
            if (gameState.selectedTerrain !== 'mountains') {
                waterSurface = createWaterSurface(worldOffsetX, worldOffsetZ, chunkSize);
                gameState.scene.add(waterSurface);
            }
        }
        
        // Return the chunk with mesh
        return {
            mesh: terrainMesh,
            water: waterSurface,
            x: chunkX,
            z: chunkZ,
            distanceFromBalloon: distanceFromBalloon,
            lastDistanceCheck: performance.now() // Track when we last checked distance
        };
    }
    
    // Add initial terrain chunks around the starting position
    for (let z = -loadDistance; z <= loadDistance; z++) {
        for (let x = -loadDistance; x <= loadDistance; x++) {
            gameState.terrainChunks.push(createTerrainChunk(x, z));
        }
    }
    
    // Add function to update terrain chunks (to be called from main.js)
    gameState.updateTerrainChunks = function() {
        const now = performance.now();
        
        // Calculate current chunk coordinates based on balloon position
        const currentChunkX = Math.floor(gameState.balloonPhysics.position.x / chunkSize);
        const currentChunkZ = Math.floor(gameState.balloonPhysics.position.z / chunkSize);
        
        // Update current chunk reference
        if (gameState.currentChunk.x !== currentChunkX || gameState.currentChunk.z !== currentChunkZ) {
            gameState.currentChunk = { x: currentChunkX, z: currentChunkZ };
            
            // Get list of chunks that should be loaded
            const chunksToLoad = [];
            for (let z = currentChunkZ - loadDistance; z <= currentChunkZ + loadDistance; z++) {
                for (let x = currentChunkX - loadDistance; x <= currentChunkX + loadDistance; x++) {
                    // Skip chunks that already exist
                    if (!gameState.terrainChunks.some(c => c.x === x && c.z === z)) {
                        chunksToLoad.push({ x, z });
                    }
                }
            }
            
            // Load new chunks that are needed
            chunksToLoad.forEach(chunk => {
                gameState.terrainChunks.push(createTerrainChunk(chunk.x, chunk.z));
            });
        }
        
        // Update distance and visibility for existing chunks
        gameState.terrainChunks.forEach(chunk => {
            // Only update distance check periodically for better performance
            if (now - chunk.lastDistanceCheck > 500) { // 500ms = check twice per second
                // Calculate world position for this chunk
                const worldX = chunk.x * chunkSize + chunkSize/2;
                const worldZ = chunk.z * chunkSize + chunkSize/2;
                
                // Calculate distance from balloon
                chunk.distanceFromBalloon = Math.sqrt(
                    Math.pow(worldX - gameState.balloonPhysics.position.x, 2) + 
                    Math.pow(worldZ - gameState.balloonPhysics.position.z, 2)
                );
                
                // Update shadow casting based on distance
                if (chunk.mesh) {
                    chunk.mesh.castShadow = chunk.distanceFromBalloon < 2000;
                }
                
                chunk.lastDistanceCheck = now;
            }
            
            // Remove chunks that are too far away
            const distance = Math.max(
                Math.abs(chunk.x - currentChunkX),
                Math.abs(chunk.z - currentChunkZ)
            );
            
            if (distance > loadDistance + 1) { // +1 for hysteresis
                // Remove the chunk from the scene
                if (chunk.mesh) gameState.scene.remove(chunk.mesh);
                if (chunk.water) gameState.scene.remove(chunk.water);
                
                // Find and remove the chunk from the array
                const index = gameState.terrainChunks.indexOf(chunk);
                if (index !== -1) {
                    gameState.terrainChunks.splice(index, 1);
                }
            }
        });
    };
}

// Create water surface for a chunk
function createWaterSurface(worldOffsetX, worldOffsetZ, chunkSize) {
    // Use a singleton water geometry for all chunks to save memory
    if (!gameState.waterGeometry) {
        gameState.waterGeometry = new THREE.PlaneGeometry(chunkSize, chunkSize, 1, 1);
        gameState.waterGeometry.rotateX(-Math.PI / 2);
    }
    
    // Adjust water color based on lighting
    let waterColor, waterOpacity;
    
    switch (gameState.selectedLighting) {
        case 'sunset':
            waterColor = 0x0077BE; // Keep blue for sunset
            waterOpacity = 0.7;
            break;
        case 'moonlight':
            waterColor = 0x001133; // Dark blue for night
            waterOpacity = 0.85;
            break;
        case 'day':
        default:
            waterColor = 0x0077BE; // Standard blue
            waterOpacity = 0.8;
            break;
    }
    
    // Cache water materials for better performance
    const materialKey = `water_${gameState.selectedLighting}`;
    if (!gameState.waterMaterials) {
        gameState.waterMaterials = {};
    }
    
    if (!gameState.waterMaterials[materialKey]) {
        gameState.waterMaterials[materialKey] = new THREE.MeshStandardMaterial({
            color: waterColor,
            transparent: true,
            opacity: waterOpacity,
            metalness: 0.1,
            roughness: 0.1
        });
    }
    
    const water = new THREE.Mesh(gameState.waterGeometry, gameState.waterMaterials[materialKey]);
    water.position.set(worldOffsetX, 20, worldOffsetZ); // Water level
    
    return water;
}

// Add features to terrain chunk based on biome with distance-based optimization
function addTerrainFeatures(terrainMesh, chunkX, chunkZ, biomeMap, biomes, worldOffsetX, worldOffsetZ, chunkSize, getBiomeAt, distanceFromBalloon) {
    const featureGroup = new THREE.Group();
    featureGroup.position.set(worldOffsetX, 0, worldOffsetZ);
    
    // Adjust feature count based on distance and terrain type
    // Number of feature attempts (reduced for distant chunks)
    let featureCount = gameState.selectedTerrain === 'mountains' ? 150 : 100;
    
    // Apply distance-based reduction
    if (distanceFromBalloon > 3000) {
        featureCount = Math.floor(featureCount * 0.1); // Only 10% of features for very distant chunks
    } else if (distanceFromBalloon > 2000) {
        featureCount = Math.floor(featureCount * 0.25); // Only 25% of features for distant chunks
    } else if (distanceFromBalloon > 1000) {
        featureCount = Math.floor(featureCount * 0.5); // 50% for medium distance
    }
    
    // Skip feature placement entirely for extremely distant chunks
    if (distanceFromBalloon > 4000) {
        return;
    }
    
    // Pre-calculate raycaster for performance
    const raycaster = new THREE.Raycaster();
    
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
        raycaster.set(
            new THREE.Vector3(localX, 1000, localZ),
            new THREE.Vector3(0, -1, 0)
        );
        const intersects = raycaster.intersectObject(terrainMesh);
        
        if (intersects.length > 0) {
            const y = intersects[0].point.y;
            
            // Optimization: Use simplified geometry for distant objects
            const geometryQuality = distanceFromBalloon > 2000 ? 'low' : 'normal';
            
            if (gameState.selectedTerrain === 'mountains') {
                // Mountain-specific features
                
                // Add snow caps to high areas
                if (biomeName === 'snowPeaks' || biomeName === 'highMountains' && y > 300) {
                    if (Math.random() < 0.15) {
                        createEnvironmentalObject('snowCap', localX, y, localZ, { quality: geometryQuality }, featureGroup);
                    }
                }
                
                // Add mountain peaks at high elevations
                if ((biomeName === 'snowPeaks' || biomeName === 'highMountains') && Math.random() < 0.05) {
                    createEnvironmentalObject('mountainPeak', localX, y, localZ, { quality: geometryQuality }, featureGroup);
                }
                
                // Add rocks to mid-high elevations
                if ((biomeName === 'highMountains' || biomeName === 'midMountains') && Math.random() < 0.25) {
                    createEnvironmentalObject('rock', localX, y, localZ, { quality: geometryQuality }, featureGroup);
                }
                
                // Add trees only to lower elevations
                if (biome.trees && Math.random() < biome.treeDensity) {
                    // Only add trees below a certain elevation
                    if (y < 200) {
                        createEnvironmentalObject('tree', localX, y, localZ, { 
                            color: biome.treeColor,
                            quality: geometryQuality
                        }, featureGroup);
                    }
                }
                
                // Add grass to valley areas
                if (biomeName === 'valleys' && Math.random() < 0.3) {
                    createEnvironmentalObject('grassClump', localX, y, localZ, { quality: geometryQuality }, featureGroup);
                }
            } else {
                // Original feature placement logic for default terrain
                
                // Add trees in forested biomes
                if (biome.trees && Math.random() < biome.treeDensity) {
                    createEnvironmentalObject('tree', localX, y, localZ, { 
                        color: biome.treeColor,
                        quality: geometryQuality
                    }, featureGroup);
                }
                
                // Add rocks in rocky biomes
                if (biome.rocks && Math.random() < biome.rockDensity) {
                    createEnvironmentalObject('rock', localX, y, localZ, { quality: geometryQuality }, featureGroup);
                }
                
                // Add cacti in desert
                if (biomeName === 'desert' && Math.random() < 0.2) {
                    createEnvironmentalObject('cactus', localX, y, localZ, { quality: geometryQuality }, featureGroup);
                }
                
                // Add special features in specific biomes
                if (biomeName === 'mountains' && Math.random() < 0.05) {
                    createEnvironmentalObject('snowCap', localX, y, localZ, { quality: geometryQuality }, featureGroup);
                }
                
                // Only add grass in closer chunks to optimize performance
                if (distanceFromBalloon < 1500 && biomeName === 'plains' && Math.random() < 0.3) {
                    createEnvironmentalObject('grassClump', localX, y, localZ, { quality: geometryQuality }, featureGroup);
                }
            }
        }
    }
    
    // Add bounding information for frustum culling
    featureGroup.userData = {
        chunkX: chunkX,
        chunkZ: chunkZ,
        // Create a bounding sphere that encompasses the entire chunk
        boundingSphere: new THREE.Sphere(
            new THREE.Vector3(worldOffsetX + chunkSize/2, 0, worldOffsetZ + chunkSize/2),
            Math.sqrt(2) * chunkSize/2
        )
    };
    
    gameState.scene.add(featureGroup);
}