// Central game state object to be shared across modules
export const gameState = {
    // Scene objects
    scene: null,
    camera: null,
    renderer: null,
    
    // Game elements
    balloon: null,
    balloonGroup: null,
    terrain: null,
    skybox: null,
    directionalLight: null,
    
    // Minimap
    minimapCamera: null,
    minimapRenderer: null,
    
    // Animation
    mixer: null,
    animationClock: null,
    
    // Game settings
    selectedTerrain: 'islands',
    selectedLighting: 'day',
    
    // Game state
    score: 0,
    isGameRunning: false,
    collectedKnowledge: 0,
    totalKnowledge: 10, // Reduced to 10 for focused photosynthesis theme
    
    // Challenge system
    challengeStations: [],
    completedChallenges: [],
    masterChallenge: null,
    masterChallengeCompleted: false,
    
    // Orbs
    knowledgeOrbs: [],
    nearestOrbDistance: Infinity,
    nearestOrbDirection: new THREE.Vector3(),
    
    // Terrain management
    terrainChunks: [],
    currentChunk: { x: 0, z: 0 },
    
    // Balloon effects
    burnerLight: null,
    burnerParticles: null,
    burnerActive: false,
    
    // Movement controls
    keys: {
        ArrowUp: false,
        ArrowDown: false,
        ArrowLeft: false,
        ArrowRight: false,
        KeyW: false,
        KeyS: false
    },
    
    // Balloon physics
    balloonPhysics: {
        position: new THREE.Vector3(0, 100, 0),
        velocity: new THREE.Vector3(0, 0, 5), // Initial forward movement
        acceleration: new THREE.Vector3(0, 0, 0),
        maxSpeed: 20,
        minSpeed: 2,
        baseSpeed: 5,
        rotationSpeed: 0.02,
        turnSpeed: 0.5,
        verticalSpeed: 0.8,
        damping: 0.95, // Damping for smoother movement
        accelerationRate: 0.04, // How quickly to accelerate when keys are held
        currentAcceleration: 0  // Current acceleration value (builds up when keys are held)
    },
    
    // Photosynthesis knowledge data for the orbs
    knowledgeData: [
        {
            title: "Light Absorption",
            text: "Chlorophyll is the green pigment in plants that absorbs light energy. It primarily absorbs red and blue wavelengths while reflecting green, which is why plants appear green to our eyes.",
            type: "photosynthesis",
            color: 0x2BC537,
            id: "light"
        },
        {
            title: "Carbon Dioxide",
            text: "Plants take in carbon dioxide (CO₂) from the air through tiny openings called stomata, usually found on the underside of leaves. Guard cells control the opening and closing of stomata.",
            type: "photosynthesis",
            color: 0x80CBC4,
            id: "co2"
        },
        {
            title: "Water Uptake",
            text: "Water (H₂O) is absorbed by plants through their roots and transported up the stem through xylem vessels to the leaves where photosynthesis occurs.",
            type: "photosynthesis",
            color: 0x03A9F4,
            id: "water"
        },
        {
            title: "Light-Dependent Reactions",
            text: "These reactions occur in the thylakoid membranes of chloroplasts. Light energy is converted to chemical energy in the form of ATP and NADPH. Oxygen is produced as a waste product.",
            type: "photosynthesis",
            color: 0xFFEB3B,
            id: "light-dependent"
        },
        {
            title: "Calvin Cycle",
            text: "Also known as the light-independent reactions, the Calvin cycle uses the ATP and NADPH from the light-dependent reactions to convert CO₂ into glucose. This cycle takes place in the stroma of chloroplasts.",
            type: "photosynthesis",
            color: 0xFF7043,
            id: "calvin"
        },
        {
            title: "Glucose Production",
            text: "The end product of photosynthesis is glucose (C₆H₁₂O₆), a simple sugar that plants use for energy and to build other important compounds like cellulose and starch.",
            type: "photosynthesis",
            color: 0xFFF59D,
            id: "glucose"
        },
        {
            title: "Oxygen Release",
            text: "During photosynthesis, plants split water molecules and release oxygen (O₂) into the atmosphere as a byproduct. This oxygen is essential for aerobic organisms, including humans.",
            type: "photosynthesis",
            color: 0x90CAF9,
            id: "oxygen"
        },
        {
            title: "Photosynthesis Equation",
            text: "The balanced chemical equation for photosynthesis is: 6CO₂ + 6H₂O + light energy → C₆H₁₂O₆ + 6O₂. This summarizes how carbon dioxide and water combine with light energy to produce glucose and oxygen.",
            type: "photosynthesis",
            color: 0xE1BEE7,
            id: "equation"
        },
        {
            title: "Chloroplast Structure",
            text: "Chloroplasts are organelles where photosynthesis occurs. They contain thylakoids arranged in stacks called grana, surrounded by a fluid called stroma. A double membrane surrounds the entire chloroplast.",
            type: "photosynthesis",
            color: 0x1B5E20,
            id: "chloroplast"
        },
        {
            title: "Limiting Factors",
            text: "The rate of photosynthesis is affected by limiting factors including light intensity, carbon dioxide concentration, and temperature. If any one of these is below optimal levels, it will limit the rate of photosynthesis.",
            type: "photosynthesis",
            color: 0xFFA726,
            id: "factors"
        }
    ],
    
    // Challenge station data
    challengeData: [
        {
            title: "Light and Pigments",
            question: "Which wavelengths of light does chlorophyll primarily absorb?",
            options: ["Green and yellow", "Red and blue", "All wavelengths equally", "Ultraviolet only"],
            correctAnswer: 1,
            explanation: "Chlorophyll primarily absorbs red and blue wavelengths while reflecting green, which is why plants appear green.",
            requiredKnowledge: ["light"],
            position: new THREE.Vector3(400, 100, 400),
            id: "challenge1"
        },
        {
            title: "Gas Exchange",
            question: "Which gas do plants take in during photosynthesis?",
            options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
            correctAnswer: 1,
            explanation: "Plants take in carbon dioxide (CO₂) through stomata for use in the Calvin cycle.",
            requiredKnowledge: ["co2"],
            position: new THREE.Vector3(-400, 100, 400),
            id: "challenge2"
        },
        {
            title: "Water in Photosynthesis",
            question: "What happens to water molecules during the light-dependent reactions?",
            options: ["They are stored as a reserve", "They are converted directly to glucose", "They are split, releasing oxygen", "They dissolve carbon dioxide"],
            correctAnswer: 2,
            explanation: "In photosynthesis, water molecules are split (photolysis) during the light-dependent reactions, releasing oxygen as a byproduct.",
            requiredKnowledge: ["water", "oxygen"],
            position: new THREE.Vector3(400, 100, -400),
            id: "challenge3"
        },
        {
            title: "Energy Conversion",
            question: "What is the role of light in photosynthesis?",
            options: ["To warm the plant", "To provide energy that's converted to chemical energy", "To directly synthesize glucose", "To break down carbon dioxide"],
            correctAnswer: 1,
            explanation: "Light provides the energy that is converted into chemical energy (ATP and NADPH) during the light-dependent reactions.",
            requiredKnowledge: ["light-dependent"],
            position: new THREE.Vector3(-400, 100, -400),
            id: "challenge4"
        },
        {
            title: "Products of Photosynthesis",
            question: "What are the main products of photosynthesis?",
            options: ["Carbon dioxide and water", "ATP and NADPH", "Glucose and oxygen", "Amino acids and lipids"],
            correctAnswer: 2,
            explanation: "The main products of photosynthesis are glucose (a sugar) and oxygen (released as a byproduct).",
            requiredKnowledge: ["glucose", "oxygen"],
            position: new THREE.Vector3(700, 100, 0),
            id: "challenge5"
        }
    ],
    
    // Master challenge data
    masterChallengeData: {
        title: "Photosynthesis Master Challenge",
        questions: [
            {
                question: "Which process occurs in the thylakoid membranes of chloroplasts?",
                options: ["Calvin cycle", "Light-dependent reactions", "Glycolysis", "Krebs cycle"],
                correctAnswer: 1
            },
            {
                question: "What is the primary pigment responsible for capturing light energy in plants?",
                options: ["Melanin", "Hemoglobin", "Chlorophyll", "Carotene"],
                correctAnswer: 2
            },
            {
                question: "Where does the Calvin cycle take place?",
                options: ["In the thylakoid membrane", "In the stroma of the chloroplast", "In the cytoplasm", "In the mitochondria"],
                correctAnswer: 1
            },
            {
                question: "Which of these is NOT a limiting factor for photosynthesis?",
                options: ["Light intensity", "Carbon dioxide concentration", "Oxygen concentration", "Temperature"],
                correctAnswer: 2
            },
            {
                question: "What is the correct balanced equation for photosynthesis?",
                options: ["6O₂ + C₆H₁₂O₆ → 6CO₂ + 6H₂O + Energy", 
                         "6CO₂ + 6H₂O + Light energy → C₆H₁₂O₆ + 6O₂", 
                         "6CO₂ + 12H₂O + Light energy → C₆H₁₂O₆ + 6O₂ + 6H₂O", 
                         "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP"],
                correctAnswer: 1
            }
        ],
        position: new THREE.Vector3(0, 100, -800),
        requiredChallenges: ["challenge1", "challenge2", "challenge3", "challenge4", "challenge5"]
    }
};