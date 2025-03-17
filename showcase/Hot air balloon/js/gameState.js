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
    
    // Game state
    score: 0,
    isGameRunning: false,
    collectedKnowledge: 0,
    totalKnowledge: 20,
    
    // Orbs
    knowledgeOrbs: [],
    nearestOrbDirection: new THREE.Vector3(),
    nearestOrbDistance: Infinity,
    
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
    
    // Knowledge data for the orbs
    knowledgeData: [
        {
            title: "The Water Cycle",
            text: "The water cycle is the continuous movement of water within Earth and its atmosphere. It includes processes like evaporation, condensation, precipitation, and collection. This cycle is essential for maintaining all life on our planet.",
            type: "science",
            color: 0x2196F3
        },
        {
            title: "Photosynthesis",
            text: "Photosynthesis is how plants make their food. They use sunlight, water, and carbon dioxide to create glucose and oxygen. This process is vital for producing oxygen in our atmosphere and forms the basis of most food chains.",
            type: "science",
            color: 0x4CAF50
        },
        {
            title: "Plate Tectonics",
            text: "Earth's surface is divided into large, moving pieces called tectonic plates. Their movement causes earthquakes, volcanic eruptions, and the formation of mountains. This theory explains why continents appear to fit together like puzzle pieces.",
            type: "science",
            color: 0xFF9800
        },
        {
            title: "Gravity",
            text: "Gravity is the force that attracts objects toward each other. On Earth, it pulls everything toward the planet's center. The strength of gravity depends on an object's mass and the distance between objects.",
            type: "science",
            color: 0x9C27B0
        },
        {
            title: "Ancient Egypt",
            text: "Ancient Egyptian civilization flourished along the Nile River for over 3,000 years. They built massive pyramids, developed hieroglyphic writing, and made advances in medicine, mathematics, and astronomy. The Great Pyramid of Giza is the only surviving structure of the Seven Wonders of the Ancient World.",
            type: "history",
            color: 0xFFD700
        },
        {
            title: "Roman Empire",
            text: "The Roman Empire was one of history's largest empires, controlling territories across Europe, North Africa, and Western Asia. Romans developed advanced architecture, road systems, and a legal code that influenced modern law. Latin, the Romans' language, forms the basis for Romance languages like Spanish, French, and Italian.",
            type: "history",
            color: 0xE91E63
        },
        {
            title: "Renaissance",
            text: "The Renaissance was a period of artistic and intellectual growth in Europe from the 14th to 17th centuries. It marked the transition from medieval to modern times. Famous figures include Leonardo da Vinci, Michelangelo, and Galileo Galilei, who made breakthroughs in art, science, and philosophy.",
            type: "history",
            color: 0x3F51B5
        },
        {
            title: "Industrial Revolution",
            text: "The Industrial Revolution began in Britain in the 18th century and spread worldwide. It transformed society from primarily agricultural to manufacturing-based. Steam power, textile machinery, and factory systems changed how people lived and worked, leading to urbanization and new social challenges.",
            type: "history",
            color: 0x795548
        },
        {
            title: "Fractions",
            text: "Fractions represent parts of a whole. The numerator (top number) indicates how many parts you have, while the denominator (bottom number) shows how many equal parts make up the whole. Understanding fractions is essential for advanced math concepts and everyday problem-solving.",
            type: "math",
            color: 0x00BCD4
        },
        {
            title: "Pythagorean Theorem",
            text: "The Pythagorean theorem states that in a right triangle, the square of the length of the hypotenuse equals the sum of squares of the other two sides (a² + b² = c²). This fundamental principle has applications in construction, navigation, and various scientific fields.",
            type: "math",
            color: 0xCDDC39
        },
        {
            title: "Amazon Rainforest",
            text: "The Amazon Rainforest is Earth's largest tropical rainforest, covering much of northwestern Brazil and extending into neighboring countries. It's home to 10% of known species on Earth and produces about 20% of Earth's oxygen, earning it the nickname 'Lungs of the Planet.'",
            type: "geography",
            color: 0x009688
        },
        {
            title: "Himalayas",
            text: "The Himalayas form Earth's highest mountain range, containing Mount Everest (8,848m), the world's tallest peak. Created by the collision of the Indian and Eurasian tectonic plates, these mountains influence weather patterns and are home to diverse ecosystems and cultures.",
            type: "geography",
            color: 0x607D8B
        },
        {
            title: "Great Barrier Reef",
            text: "Australia's Great Barrier Reef is the world's largest coral reef system, visible from space and home to thousands of marine species. Made up of over 2,900 individual reefs and 900 islands, it's a critical marine ecosystem now threatened by climate change and ocean acidification.",
            type: "geography",
            color: 0x00BCD4
        },
        {
            title: "Sahara Desert",
            text: "The Sahara is the world's largest hot desert, covering most of North Africa. Despite its harsh conditions, it supports unique wildlife and has historically been home to nomadic peoples. The Sahara has grown significantly in the past century due to climate change and human activities.",
            type: "geography",
            color: 0xFFEB3B
        },
        {
            title: "Cells",
            text: "Cells are the basic building blocks of all living organisms. Plant cells have cell walls and chloroplasts for photosynthesis, while animal cells do not. Both contain DNA in a nucleus which controls the cell's activities and allows organisms to grow, reproduce, and adapt.",
            type: "science",
            color: 0x8BC34A
        },
        {
            title: "Solar System",
            text: "Our solar system consists of the Sun, eight planets, dwarf planets, moons, asteroids, and comets. The inner planets (Mercury, Venus, Earth, Mars) are rocky, while the outer planets (Jupiter, Saturn, Uranus, Neptune) are gas giants. Everything orbits the Sun due to its gravitational pull.",
            type: "science",
            color: 0xFF5722
        },
        {
            title: "World War II",
            text: "World War II (1939-1945) was the deadliest global conflict in history, involving most of the world's nations. It ended with the defeat of Nazi Germany and Imperial Japan, establishment of the United Nations, beginning of the nuclear age, and set the stage for the Cold War.",
            type: "history",
            color: 0x673AB7
        },
        {
            title: "Renaissance Art",
            text: "Renaissance art emerged in Italy around 1400, characterized by realistic perspective, anatomical accuracy, and classical influences. Artists like Leonardo da Vinci, Michelangelo, and Raphael created masterpieces that transformed Western art, focusing on balance, harmony, and the dignity of human subjects.",
            type: "art",
            color: 0xE91E63
        },
        {
            title: "Classical Music",
            text: "Classical music developed in Western culture from approximately 1750 to 1820. The Classical period featured composers like Mozart, Haydn, and early Beethoven who created structured, balanced compositions. Their works emphasized clarity, symmetry, and elegant melodies, setting standards still influential today.",
            type: "art",
            color: 0x9C27B0
        },
        {
            title: "Biodiversity",
            text: "Biodiversity refers to the variety of life forms on Earth, including genetic diversity within species, ecosystem diversity, and species diversity. High biodiversity increases ecosystem resilience and provides humans with resources like food, medicine, and clean water. Conservation efforts aim to protect this crucial planetary feature.",
            type: "science",
            color: 0x4CAF50
        }
    ]
};