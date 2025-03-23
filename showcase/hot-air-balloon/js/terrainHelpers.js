// Interpolation helper functions for terrain.js

// Bilinear interpolation function for numerical values
export function interpolateBiomeValues(v00, v10, v01, v11, dx, dz) {
    const v0 = v00 * (1-dx) + v10 * dx;
    const v1 = v01 * (1-dx) + v11 * dx;
    return v0 * (1-dz) + v1 * dz;
}

// Function to create terrain biome configurations
export function createBiomeConfigs(terrainType) {
    if (terrainType === 'mountains') {
        // Himalaya-inspired mountain terrain
        return {
            snowPeaks: {
                color: 0xF5F5F5, // Snow white
                height: 450,
                roughness: 1.8,
                trees: false,
                rocks: true,
                rockDensity: 0.3,
                snow: true
            },
            highMountains: {
                color: 0x9E9E9E, // Stone gray
                height: 350,
                roughness: 1.6,
                trees: false,
                rocks: true,
                rockDensity: 0.6
            },
            midMountains: {
                color: 0x757575, // Dark gray
                height: 250,
                roughness: 1.4,
                trees: true,
                treeColor: 0x2E7D32, // Dark green
                treeDensity: 0.2
            },
            foothills: {
                color: 0x558B2F, // Green
                height: 150,
                roughness: 1.0,
                trees: true,
                treeColor: 0x33691E,
                treeDensity: 0.5
            },
            valleys: {
                color: 0x7CB342, // Light green
                height: 80,
                roughness: 0.7,
                trees: true,
                treeColor: 0x558B2F,
                treeDensity: 0.7
            },
            glaciers: {
                color: 0xB3E5FC, // Light blue ice
                height: 100,
                roughness: 0.5,
                trees: false,
                rocks: true,
                rockDensity: 0.2,
                snow: true
            }
        };
    } else {
        // Default terrain (original)
        return {
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
    }
}

// Helper function to generate biome map
export function generateBiomeMap(simplex, mapSize, resolution, terrainType) {
    const biomeMap = [];
    
    for (let z = 0; z < resolution; z++) {
        biomeMap[z] = [];
        for (let x = 0; x < resolution; x++) {
            const nx = x / resolution - 0.5;
            const nz = z / resolution - 0.5;
            
            // Use larger scale noise for biome transitions
            const biomeValue = simplex.noise2D(nx * 2, nz * 2);
            
            let biomeName;
            
            if (terrainType === 'mountains') {
                // Mountain range distribution - Himalaya inspired
                // Use distance from center to create a mountain range pattern
                const distFromCenter = Math.sqrt(nx*nx + nz*nz) * 2;
                
                // Create main mountain range with a curved shape
                const rangeOffset = Math.sin(nx * 6) * 0.2;
                const distFromRange = Math.abs(nz - rangeOffset);
                
                // Combine with noise for natural variation
                const mountainValue = biomeValue - distFromRange * 3;
                
                // Complex multi-biome mountain range
                if (mountainValue > 0.8) {
                    biomeName = 'snowPeaks';
                } else if (mountainValue > 0.5) {
                    biomeName = 'highMountains';
                } else if (mountainValue > 0.2) {
                    biomeName = 'midMountains';
                } else if (mountainValue > -0.2) {
                    biomeName = 'foothills';
                } else if (mountainValue > -0.5) {
                    biomeName = 'valleys';
                } else {
                    biomeName = 'valleys'; // No water, only valleys
                }
                
                // Add glaciers with a different noise pattern
                const glacierNoise = simplex.noise2D(nx * 8, nz * 8);
                if (glacierNoise > 0.8 && mountainValue > 0.4) {
                    biomeName = 'glaciers';
                }
            } else {
                // Original biome distribution for default terrain
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
            }
            
            biomeMap[z][x] = biomeName;
        }
    }
    
    return biomeMap;
}

// Helper function to generate terrain height
export function generateTerrainHeight(simplex, worldX, worldZ, biomeParams, terrainType) {
    const frequency = 0.002;
    let height = 0;
    
    if (terrainType === 'mountains') {
        // Enhanced mountain height generation
        // Layer multiple frequencies for more natural looking mountains
        height += biomeParams.height * simplex.noise2D(worldX * frequency * biomeParams.roughness, worldZ * frequency * biomeParams.roughness);
        height += biomeParams.height * 0.7 * simplex.noise2D(worldX * frequency * 2 * biomeParams.roughness, worldZ * frequency * 2 * biomeParams.roughness);
        height += biomeParams.height * 0.3 * simplex.noise2D(worldX * frequency * 4 * biomeParams.roughness, worldZ * frequency * 4 * biomeParams.roughness);
        
        // Add sharp ridges
        const ridgeNoise = Math.abs(simplex.noise2D(worldX * frequency * 3, worldZ * frequency * 3));
        height += biomeParams.height * 0.4 * Math.pow(ridgeNoise, 2);
        
        // Add occasional very high peaks
        const peakNoise = simplex.noise2D(worldX * frequency * 0.5, worldZ * frequency * 0.5);
        if (peakNoise > 0.7 && biomeParams.biomeName === 'snowPeaks') {
            height *= 1.3;
        }
    } else {
        // Original height generation
        height += biomeParams.height * simplex.noise2D(worldX * frequency * biomeParams.roughness, worldZ * frequency * biomeParams.roughness);
        height += biomeParams.height * 0.5 * simplex.noise2D(worldX * frequency * 2 * biomeParams.roughness, worldZ * frequency * 2 * biomeParams.roughness);
        height += biomeParams.height * 0.25 * simplex.noise2D(worldX * frequency * 4 * biomeParams.roughness, worldZ * frequency * 4 * biomeParams.roughness);
    }
    
    return height;
}