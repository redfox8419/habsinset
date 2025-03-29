/**
 * Step navigation functionality for module progression
 */

/**
 * Initialize step navigation for a module
 * @param {string} moduleId - Identifier for the module (used for localStorage)
 * @param {number} totalSteps - Total number of steps in the module
 */
/**
 * Step navigation functionality for module progression
 */

/**
 * Initialize step navigation for a module
 * @param {string} moduleId - Identifier for the module (used for localStorage)
 * @param {number} totalSteps - Total number of steps in the module
 */
function initModuleSteps(moduleId, totalSteps) {
    // Get all step elements
    const steps = document.querySelectorAll('.module-step');
    
    // Current step tracking
    let currentStep = 1;
    const savedStep = localStorage.getItem(`${moduleId}_currentStep`);
    if (savedStep) {
        currentStep = parseInt(savedStep);
    }
    
    // Create indicators and set up navigation for each step
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        const prevBtn = step.querySelector('.prev-step-btn');
        const nextBtn = step.querySelector('.next-step-btn');
        const indicators = step.querySelector('.step-indicators');
        
        // Create indicators if they exist
        if (indicators) {
            indicators.innerHTML = '';
            for (let i = 0; i < totalSteps; i++) {
                const indicator = document.createElement('div');
                indicator.className = 'step-indicator';
                if (i + 1 === stepNumber) {
                    indicator.classList.add('active');
                } else if (i + 1 < stepNumber) {
                    indicator.classList.add('completed');
                }
                indicators.appendChild(indicator);
            }
        }
        
        // Set up previous button
        if (prevBtn) {
            prevBtn.disabled = stepNumber === 1;
            prevBtn.addEventListener('click', function() {
                if (stepNumber > 1) {
                    showStep(stepNumber - 1);
                }
            });
        }
        
        // Set up next button
        if (nextBtn) {
            if (stepNumber === totalSteps) {
                // If last step, set up completion
                nextBtn.addEventListener('click', function() {
                    completeModuleFunction();
                });
            } else {
                // Otherwise navigate to next step
                nextBtn.addEventListener('click', function() {
                    showStep(stepNumber + 1);
                });
            }
        }
    });
    
    // Initialize first view
    showStep(currentStep);
    
    /**
     * Show a specific step and hide others
     * @param {number} stepNumber - The step to show
     */
    function showStep(stepNumber) {
        // Validate step number
        if (stepNumber < 1 || stepNumber > totalSteps) {
            return;
        }
        
        // Update current step
        currentStep = stepNumber;
        localStorage.setItem(`${moduleId}_currentStep`, currentStep);
        
        // Hide all steps
        steps.forEach(step => {
            step.classList.remove('active');
        });
        
        // Show current step
        const currentStepElement = document.querySelector(`.module-step[data-step="${currentStep}"]`);
        if (currentStepElement) {
            currentStepElement.classList.add('active');
            // Scroll to top of step
            window.scrollTo({
                top: document.querySelector('.main-content').offsetTop - 80,
                behavior: 'smooth'
            });
            
            // Update all indicator sets to show the current step
            document.querySelectorAll('.step-indicators').forEach(indicatorSet => {
                const indicators = indicatorSet.querySelectorAll('.step-indicator');
                indicators.forEach((indicator, index) => {
                    indicator.classList.remove('active', 'completed');
                    if (index + 1 === currentStep) {
                        indicator.classList.add('active');
                    } else if (index + 1 < currentStep) {
                        indicator.classList.add('completed');
                    }
                });
            });
            
            // Update all progress texts
            document.querySelectorAll('.step-progress-text').forEach(textEl => {
                textEl.textContent = `Step ${currentStep} of ${totalSteps}`;
            });
        }
    }
    
    /**
     * Handle completion of the module
     */
    function completeModuleFunction() {
        // This will use the existing completeModule function in the module page
        if (window.completeModuleOriginal) {
            window.completeModuleOriginal();
        } else {
            console.warn('Complete module function not found');
        }
    }
}