/**
 * Module Progression System
 * Handles tracking progress through learning modules and unlocking sequential content
 */

// Define pathway module structures
const pathwayModules = {
    'ai-foundations': [
        {
            id: 'module1',
            name: 'AI Safety & Ethics',
            url: '../getting-started/ai-safety-ethics.html?pathway=ai-foundations&module=1',
            required: null // No prerequisite
        },
        {
            id: 'module2',
            name: 'What is AI and why use it in Education?',
            url: '../getting-started/why-use-ai.html?pathway=ai-foundations&module=2',
            required: 'module1' // Requires module1 to be completed
        },
        {
            id: 'module3',
            name: 'AI Prompting Basics',
            url: '../getting-started/prompting.html?pathway=ai-foundations&module=3',
            required: 'module2' // Requires module2 to be completed
        }
    ],
    'resource-builder': [
        {
            id: 'module1',
            name: 'AI Safety & Ethics',
            url: '../getting-started/ai-safety-ethics.html?pathway=resource-builder&module=1',
            required: null // No prerequisite
        },
        {
            id: 'module2',
            name: 'Developing Prompting',
            url: '../resource-builder/developing-prompting.html?pathway=resource-builder&module=2',
            required: 'module1' // Requires module1 to be completed
        },
        {
            id: 'module3',
            name: 'Polishing Your AI Output',
            url: '../resource-builder/polishing-output.html?pathway=resource-builder&module=3',
            required: 'module2', // Requires module2 to be completed
        }
    ],
    'code-creator': [
        {
            id: 'module1',
            name: 'AI Safety & Ethics',
            url: '../getting-started/ai-safety-ethics.html?pathway=code-creator&module=1',
            required: null // No prerequisite
        },
        {
            id: 'module2',
            name: 'Coding with AI',
            url: '../editors/index.html?pathway=code-creator&module=2',
            required: 'module1' // Requires module1 to be completed
        },
        {
            id: 'module3',
            name: 'How to Create a Mini Web App',
            url: '#', // Update this URL when the content is ready
            required: 'module2', // Requires module2 to be completed
            comingSoon: true // Set to false when ready
        }

    ]
};

/**
 * Check if a module has been completed
 * @param {string} pathway - The pathway ID (e.g., 'ai-foundations')
 * @param {string} moduleId - The module ID (e.g., 'module1')
 * @returns {boolean} - Whether the module is completed
 */
function isModuleCompleted(pathway, moduleId) {
    // Check localStorage for module completion
    return localStorage.getItem(`${pathway}_${moduleId}_completed`) === 'true';
}

/**
 * Check if a module is available to start
 * @param {string} pathway - The pathway ID
 * @param {string} moduleId - The module ID
 * @returns {boolean} - Whether the module can be accessed
 */
function isModuleAvailable(pathway, moduleId) {
    const module = pathwayModules[pathway].find(m => m.id === moduleId);
    
    // If module does not exist or is coming soon, it's not available
    if (!module || module.comingSoon) {
        return false;
    }
    
    // If no prerequisite, it's available
    if (!module.required) {
        return true;
    }
    
    // Check if prerequisite is completed
    return isModuleCompleted(pathway, module.required);
}

/**
 * Mark a module as completed
 * @param {string} pathway - The pathway ID
 * @param {string} moduleId - The module ID
 */
function completeModule(pathway, moduleId) {
    localStorage.setItem(`${pathway}_${moduleId}_completed`, 'true');
}

/**
 * Get the next available module in the sequence
 * @param {string} pathway - The pathway ID
 * @returns {object|null} - The next module or null if none available
 */
function getNextAvailableModule(pathway) {
    const modules = pathwayModules[pathway];
    
    // Check each module in sequence
    for (const module of modules) {
        if (!isModuleCompleted(pathway, module.id) && isModuleAvailable(pathway, module.id)) {
            return module;
        }
    }
    
    // If all modules are completed or unavailable, return null
    return null;
}

/**
 * Initialize the pathway modules display
 * @param {string} pathway - The pathway ID
 */
function initPathwayModules(pathway) {
    // Get the modules container
    const modulesContainer = document.getElementById('modules-container');
    if (!modulesContainer) return;
    
    // Clear existing modules
    modulesContainer.innerHTML = '';
    
    // Create module cards
    pathwayModules[pathway].forEach((module, index) => {
        const isCompleted = isModuleCompleted(pathway, module.id);
        const isAvailable = isModuleAvailable(pathway, module.id);
        
        // Create module card with card classes
        const moduleCard = document.createElement('div');
        moduleCard.className = `card ${isCompleted ? 'completed' : ''} ${!isAvailable ? 'locked' : ''}`;
        
        // Add appropriate card color class based on index
        const colorClasses = ['card-primary', 'card-secondary', 'card-tertiary', 'card-quaternary'];
        moduleCard.classList.add(colorClasses[index % colorClasses.length]);
        
        // Create module content with card structure
        moduleCard.innerHTML = `
            <div class="card-header"></div>
            <div class="card-title">
                <h3>${module.name}</h3>
                ${module.comingSoon ? '<span class="coming-soon">Coming Soon</span>' : ''}
            </div>
            <div class="card-body">
                <div class="module-step text-center mb-4">
                    <div class="step-number">${index + 1}</div>
                    <div class="step-status">
                        ${isCompleted ? '<i class="fas fa-check-circle"></i>' : 
                          !isAvailable ? '<i class="fas fa-lock"></i>' : 
                          '<i class="fas fa-circle"></i>'}
                    </div>
                </div>
                <p>${getModuleDescription(pathway, index)}</p>
                <div class="card-footer">
                    ${module.comingSoon ? 
                        `<a href="#" class="btn-card" style="cursor: not-allowed;">Coming Soon</a>` : 
                        isAvailable ? 
                            `<a href="${module.url}" class="btn-card ${isCompleted ? 'completed' : ''}">${isCompleted ? 'Review Module' : 'Start Module'}</a>` : 
                            `<a href="#" class="btn-card locked" disabled>
                                <i class="fas fa-lock"></i> Complete Previous Module
                             </a>`
                    }
                </div>
            </div>
        `;
        
        // Add to container
        modulesContainer.appendChild(moduleCard);
    });
    
    // Update progress bar
    updateProgressBar(pathway);
}

/**
 * Get descriptive text for each module
 * @param {string} pathway - The pathway ID
 * @param {number} index - The module index
 * @returns {string} - Module description
 */
function getModuleDescription(pathway, index) {
    // First module is always AI Safety & Ethics
    if (index === 0) {
        return "Learn essential guidelines for using AI responsibly in educational settings, covering data privacy, AI limitations, avoiding bias, and ethical considerations.";
    }
    
    // Other modules depend on the pathway
    const pathwayDescriptions = {
        'ai-foundations': [
            null, // index 0 is handled above
            "Discover the basics of what AI actually is and how it can enhance your teaching practice, save time, and create new opportunities for your students while addressing common concerns.",
            "Learn a simple, effective approach to communicate with AI tools and create amazing resources for your classroom, no technical expertise required.",
            "Get a teacher-friendly introduction to what AI is, how it works, and the different types of AI tools available for education."
        ],
        'resource-builder': [
            null, // index 0 is handled above
            "Take your prompting to the next level with structured frameworks, prompt chaining, and resource upload strategies to get better results with less back-and-forth.",
            "Learn how to get AI to produce polished, professional-quality educational resources that require minimal editing and are ready to use in your classroom.",
            "Discover advanced techniques for creating multi-page resources, interactive materials, and visually appealing content that engages students."
        ],
        'code-creator': [
            null, // index 0 is handled above
            "Explore these interactive editors to create engaging learning activities for your classroom with these easy-to-use, no-code editor tools.",
            "Learn the basics of using AI to generate HTML, CSS, and JavaScript code for educational applications without programming knowledge.",
            "Create custom, interactive quizzes with immediate feedback, multimedia elements, and engaging design using AI assistance."
        ]
    };
    
    return pathwayDescriptions[pathway][index] || "Explore this module to continue your AI learning journey.";
}

/**
 * Update the progress bar based on completed modules
 * @param {string} pathway - The pathway ID
 */
function updateProgressBar(pathway) {
    const progressBar = document.getElementById('pathway-progress-bar');
    if (!progressBar) return;
    
    const modules = pathwayModules[pathway];
    let completedCount = 0;
    
    // Count completed non-comingSoon modules
    modules.forEach(module => {
        if (!module.comingSoon && isModuleCompleted(pathway, module.id)) {
            completedCount++;
        }
    });
    
    // Count total available modules (excluding coming soon)
    const availableModules = modules.filter(module => !module.comingSoon).length;
    
    // Calculate progress percentage
    const progress = (completedCount / availableModules) * 100;
    
    // Update progress bar
    progressBar.style.width = `${progress}%`;
    
    // Update progress text
    const progressText = document.getElementById('pathway-progress-text');
    if (progressText) {
        progressText.textContent = `${completedCount} of ${availableModules} modules completed`;
    }
}

/**
 * Initialize module progression on page load
 */
function initModuleProgression() {
    // Get pathway from URL or default to 'ai-foundations'
    const urlParams = new URLSearchParams(window.location.search);
    const pathway = urlParams.get('pathway') || 'ai-foundations';
    
    // If we're on a pathway landing page, initialize modules
    initPathwayModules(pathway);
    
    // If we're on a module page, update module progress
    const moduleId = urlParams.get('module');
    if (moduleId) {
        const moduleElements = document.querySelectorAll('.progress-step');
        moduleElements.forEach((step, index) => {
            const stepNumber = step.querySelector('.step-number');
            if (index + 1 < parseInt(moduleId)) {
                // Previous modules are completed
                stepNumber.classList.add('completed');
                stepNumber.classList.remove('active');
            } else if (index + 1 === parseInt(moduleId)) {
                // Current module is active
                stepNumber.classList.add('active');
                stepNumber.classList.remove('completed');
            } else {
                // Future modules are neither
                stepNumber.classList.remove('active', 'completed');
            }
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initModuleProgression);

/**
 * Redirect to the appropriate pathway page if the user tries to access a module directly
 * without completing prerequisites
 */
function checkModuleAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const pathway = urlParams.get('pathway');
    const moduleId = urlParams.get('module');
    
    // If this is a module page but not part of the pathway system, skip
    if (!pathway || !moduleId || !pathwayModules[pathway]) return;
    
    const moduleNumber = parseInt(moduleId);
    if (isNaN(moduleNumber)) return;
    
    // Get the module
    const module = pathwayModules[pathway].find(m => m.id === `module${moduleNumber}`);
    if (!module) return;
    
    // If there's a prerequisite, check if it's completed
    if (module.required && !isModuleCompleted(pathway, module.required)) {
        // Redirect to the pathway page
        window.location.href = `../${pathway}/index.html?access_denied=true`;
    }
}

// Check module access on page load
window.addEventListener('load', checkModuleAccess);