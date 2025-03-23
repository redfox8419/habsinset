// Create a generic environmental object
export function createEnvironmentalObject(type, x, y, z, options = {}, parent) {
    const defaultOptions = {
        scaleFactor: 0.7 + Math.random() * 0.6,
        rotation: Math.random() * Math.PI * 2,
        color: null
    };
    
    const settings = {...defaultOptions, ...options};
    
    // Create the appropriate environmental object
    let object;
    
    switch(type) {
        case 'tree':
            object = createTree(x, y, z, settings.color, parent, settings);
            break;
        case 'rock':
            object = createRock(x, y, z, parent, settings);
            break;
        case 'cactus':
            object = createCactus(x, y, z, parent, settings);
            break;
        case 'snowCap':
            object = createSnowCap(x, y, z, parent, settings);
            break;
        case 'grassClump':
            object = createGrassClump(x, y, z, parent, settings);
            break;
        case 'mountainPeak':
            object = createMountainPeak(x, y, z, parent, settings);
            break;
        default:
            console.warn(`Unknown environmental object type: ${type}`);
            return null;
    }
    
    return object;
}

// Create a tree
export function createTree(x, y, z, treeColor, parent, settings = {}) {
    const treeGroup = new THREE.Group();
    
    // Vary the tree style
    const treeType = settings.treeType !== undefined ? settings.treeType : Math.floor(Math.random() * 3);
    
    // Use provided scale factor or calculate one
    const scaleFactor = settings.scaleFactor || (0.7 + Math.random() * 0.6);
    
    if (treeType === 0) {
        // Pine tree
        const trunkGeometry = new THREE.CylinderGeometry(1, 2, 15 * scaleFactor, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4D3319,
            roughness: 1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 7.5 * scaleFactor;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Multiple layers of foliage
        const foliageColor = new THREE.Color(treeColor);
        
        for (let i = 0; i < 3; i++) {
            const foliageGeometry = new THREE.ConeGeometry(8 - i * 2, 12, 8);
            const foliageMaterial = new THREE.MeshStandardMaterial({ 
                color: foliageColor,
                roughness: 0.8 
            });
            const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
            foliage.position.y = 15 + i * 8;
            foliage.scale.multiplyScalar(scaleFactor);
            foliage.castShadow = true;
            treeGroup.add(foliage);
        }
    } else if (treeType === 1) {
        // Deciduous tree
        const trunkGeometry = new THREE.CylinderGeometry(2, 3, 20 * scaleFactor, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 10 * scaleFactor;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Spherical foliage
        const foliageGeometry = new THREE.SphereGeometry(12 * scaleFactor, 10, 10);
        const foliageMaterial = new THREE.MeshStandardMaterial({ 
            color: treeColor,
            roughness: 0.8 
        });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        foliage.position.y = 25 * scaleFactor;
        foliage.castShadow = true;
        treeGroup.add(foliage);
    } else {
        // Palm tree
        const trunkGeometry = new THREE.CylinderGeometry(2, 3, 30 * scaleFactor, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 1
        });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.y = 15 * scaleFactor;
        trunk.castShadow = true;
        treeGroup.add(trunk);
        
        // Add palm fronds
        const frondCount = 6 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < frondCount; i++) {
            const angle = (i / frondCount) * Math.PI * 2;
            const frondGroup = new THREE.Group();
            
            // Create a long triangular leaf
            const frondGeometry = new THREE.CylinderGeometry(0.5, 3, 15, 3);
            const frondMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x5EB95E,
                roughness: 0.9
            });
            const frond = new THREE.Mesh(frondGeometry, frondMaterial);
            frond.rotation.z = Math.PI / 2;
            frond.position.x = 7.5;
            frondGroup.add(frond);
            
            frondGroup.position.y = 30 * scaleFactor;
            frondGroup.rotation.y = angle;
            frondGroup.rotation.z = -Math.random() * 0.5 - 0.2;
            
            treeGroup.add(frondGroup);
        }
    }
    
    treeGroup.position.set(x, y, z);
    treeGroup.rotation.y = settings.rotation || Math.random() * Math.PI * 2;
    
    parent.add(treeGroup);
    return treeGroup;
}

// Create a rock
export function createRock(x, y, z, parent, settings = {}) {
    // Create an irregular rock using multiple geometries
    const rockGroup = new THREE.Group();
    
    // Create 2-4 overlapping geometries for a more natural look
    const numParts = settings.numParts || (2 + Math.floor(Math.random() * 3));
    const baseSize = settings.baseSize || (3 + Math.random() * 8);
    const rockColor = settings.color || (Math.random() > 0.7 ? 0x8B8B8B : 0x696969);
    
    for (let i = 0; i < numParts; i++) {
        // Use different primitive shapes for variety
        let geometry;
        const shapeType = settings.shapeType !== undefined ? settings.shapeType : Math.floor(Math.random() * 3);
        
        switch(shapeType) {
            case 0:
                geometry = new THREE.DodecahedronGeometry(baseSize * (0.6 + Math.random() * 0.4), 0);
                break;
            case 1:
                geometry = new THREE.OctahedronGeometry(baseSize * (0.6 + Math.random() * 0.4), 0);
                break;
            case 2:
                geometry = new THREE.IcosahedronGeometry(baseSize * (0.6 + Math.random() * 0.4), 0);
                break;
        }
        
        const material = new THREE.MeshStandardMaterial({ 
            color: rockColor,
            roughness: 0.9,
            metalness: Math.random() * 0.1
        });
        
        const part = new THREE.Mesh(geometry, material);
        
        // Position the part slightly off-center
        part.position.set(
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 3
        );
        
        // Rotate each part differently
        part.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        
        // Scale each part slightly differently
        const scale = 0.8 + Math.random() * 0.4;
        part.scale.set(scale, scale * (0.8 + Math.random() * 0.4), scale);
        
        part.castShadow = true;
        rockGroup.add(part);
    }
    
    rockGroup.position.set(x, y + 2, z);
    rockGroup.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
    );
    
    parent.add(rockGroup);
    return rockGroup;
}

// Create a cactus
export function createCactus(x, y, z, parent, settings = {}) {
    const cactusGroup = new THREE.Group();
    
    // Main cactus body
    const bodyHeight = settings.bodyHeight || (10 + Math.random() * 15);
    const bodyGeometry = new THREE.CylinderGeometry(2, 3, bodyHeight, 8);
    const cactusMaterial = new THREE.MeshStandardMaterial({ 
        color: settings.color || 0x2E8B57,
        roughness: 0.9 
    });
    const body = new THREE.Mesh(bodyGeometry, cactusMaterial);
    body.position.y = bodyHeight / 2;
    body.castShadow = true;
    cactusGroup.add(body);
    
    // Add arms to larger cacti
    if (bodyHeight > 15 && Math.random() > 0.3) {
        const armCount = 1 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < armCount; i++) {
            const armHeight = bodyHeight * (0.4 + Math.random() * 0.3);
            const armGeometry = new THREE.CylinderGeometry(1.5, 2, armHeight, 8);
            const arm = new THREE.Mesh(armGeometry, cactusMaterial);
            
            // Position arm halfway up the body
            const yPos = bodyHeight * (0.5 + Math.random() * 0.3);
            arm.position.y = yPos;
            
            // Rotate and position arm outward
            const angle = Math.PI * 2 * Math.random();
            arm.rotation.z = Math.PI / 4;
            arm.position.x = Math.sin(angle) * 1.5;
            arm.position.z = Math.cos(angle) * 1.5;
            arm.castShadow = true;
            
            cactusGroup.add(arm);
        }
    }
    
    cactusGroup.position.set(x, y, z);
    cactusGroup.rotation.y = settings.rotation || Math.random() * Math.PI * 2;
    
    parent.add(cactusGroup);
    return cactusGroup;
}

// Create a snow cap for mountains
export function createSnowCap(x, y, z, parent, settings = {}) {
    const size = settings.size || (10 + Math.random() * 20);
    const snowGeometry = new THREE.SphereGeometry(size, 8, 8);
    snowGeometry.scale(1, 0.3, 1);
    const snowMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        roughness: 0.5,
        metalness: 0.1
    });
    const snow = new THREE.Mesh(snowGeometry, snowMaterial);
    snow.position.set(x, y + 1, z);
    snow.rotation.y = settings.rotation || Math.random() * Math.PI * 2;
    snow.receiveShadow = true;
    
    parent.add(snow);
    return snow;
}

// Create grass clumps for plains
export function createGrassClump(x, y, z, parent, settings = {}) {
    const grassGroup = new THREE.Group();
    
    const bladeCount = settings.bladeCount || (15 + Math.floor(Math.random() * 20));
    const clumpSize = settings.clumpSize || (5 + Math.random() * 5);
    const grassColor = settings.color || 0x91E56E;
    
    for (let i = 0; i < bladeCount; i++) {
        const bladeHeight = 1 + Math.random() * 2;
        const bladeGeometry = new THREE.CylinderGeometry(0.1, 0.05, bladeHeight, 3);
        const bladeMaterial = new THREE.MeshStandardMaterial({
            color: grassColor,
            roughness: 0.9,
        });
        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
        
        // Position randomly within clump
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * clumpSize;
        blade.position.set(
            Math.sin(angle) * radius,
            bladeHeight / 2,
            Math.cos(angle) * radius
        );
        
        // Random rotation for natural look
        blade.rotation.set(
            (Math.random() - 0.5) * 0.5,
            Math.random() * Math.PI * 2,
            (Math.random() - 0.5) * 0.5
        );
        
        grassGroup.add(blade);
    }
    
    grassGroup.position.set(x, y, z);
    parent.add(grassGroup);
    return grassGroup;
}

// Create a dramatic mountain peak with snow
export function createMountainPeak(x, y, z, parent, settings = {}) {
    const peakGroup = new THREE.Group();
    
    // Create the main rocky peak
    const peakHeight = settings.peakHeight || (40 + Math.random() * 30);
    const peakRadius = settings.peakRadius || (15 + Math.random() * 10);
    const peakGeometry = new THREE.ConeGeometry(peakRadius, peakHeight, 6);
    const peakMaterial = new THREE.MeshStandardMaterial({ 
        color: settings.color || 0x696969, // Gray rock
        roughness: 0.9,
        metalness: 0.1
    });
    const peak = new THREE.Mesh(peakGeometry, peakMaterial);
    peak.position.y = 20;
    peak.castShadow = true;
    peakGroup.add(peak);
    
    // Add snow cap on top
    const snowCapGeometry = new THREE.ConeGeometry(18, 20, 6);
    const snowCapMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF, // Snow white
        roughness: 0.7,
        metalness: 0.1
    });
    const snowCap = new THREE.Mesh(snowCapGeometry, snowCapMaterial);
    snowCap.position.y = 50;
    snowCap.scale.set(0.8, 0.4, 0.8);
    snowCap.castShadow = true;
    peakGroup.add(snowCap);
    
    // Add some smaller snow patches on the sides
    const patchCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < patchCount; i++) {
        const angle = (i / patchCount) * Math.PI * 2;
        const dist = 8 + Math.random() * 5;
        
        const patchGeometry = new THREE.SphereGeometry(5 + Math.random() * 3, 5, 5);
        patchGeometry.scale(1, 0.3, 1);
        const patch = new THREE.Mesh(patchGeometry, snowCapMaterial);
        
        patch.position.set(
            Math.sin(angle) * dist,
            25 + Math.random() * 20,
            Math.cos(angle) * dist
        );
        
        patch.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI
        );
        
        peakGroup.add(patch);
    }
    
    // Add some rocks at the base
    const rockCount = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < rockCount; i++) {
        const angle = (i / rockCount) * Math.PI * 2;
        const dist = 10 + Math.random() * 8;
        
        const rockGeometry = new THREE.DodecahedronGeometry(3 + Math.random() * 2, 0);
        const rockMaterial = new THREE.MeshStandardMaterial({
            color: 0x555555,
            roughness: 0.9
        });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        
        rock.position.set(
            Math.sin(angle) * dist,
            Math.random() * 5,
            Math.cos(angle) * dist
        );
        
        rock.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI
        );
        
        rock.scale.set(
            1 + Math.random() * 0.5,
            1 + Math.random() * 0.5,
            1 + Math.random() * 0.5
        );
        
        peakGroup.add(rock);
    }
    
    peakGroup.position.set(x, y, z);
    peakGroup.rotation.y = settings.rotation || Math.random() * Math.PI * 2;
    
    parent.add(peakGroup);
    return peakGroup;
}