// AI Knowledge Assessment Quiz
// This script creates a modal quiz that appears when users first visit the site
// Based on their answers, it recommends a learning pathway

// Quiz questions and options
const quizQuestions = [
    {
        question: "How often do you currently use AI tools in your teaching practice?",
        options: [
            { text: "Never, I haven't tried them yet", score: 0 },
            { text: "Rarely, I've experimented once or twice", score: 1 },
            { text: "Occasionally, for specific tasks", score: 2 },
            { text: "Regularly, as part of my workflow", score: 3 }
        ]
    },
    {
        question: "How comfortable are you with providing specific instructions (prompts) to AI tools?",
        options: [
            { text: "Not at all - I don't know how to instruct AI effectively", score: 0 },
            { text: "Slightly - I can give basic instructions but often don't get what I want", score: 1 },
            { text: "Moderately - I can usually get useful results with some trial and error", score: 2 },
            { text: "Very - I can craft detailed prompts that produce exactly what I need", score: 3 }
        ]
    },
    {
        question: "Which of these AI applications are you most interested in for your teaching?",
        options: [
            { text: "Learning the basics and understanding how AI can help me", score: 0 },
            { text: "Creating teaching resources and saving time on routine tasks", score: 1 },
            { text: "Developing interactive activities and custom digital resources", score: 3 },
            { text: "All of the above", score: 2 }
        ]
    },
    {
        question: "How would you rate your technical skills with digital tools in general?",
        options: [
            { text: "Basic - I use essential tools but often need help", score: 0 },
            { text: "Intermediate - Comfortable with common applications and some troubleshooting", score: 1 },
            { text: "Advanced - Proficient with various software and can learn new tools quickly", score: 2 },
            { text: "Expert - Very tech-savvy and enjoy exploring cutting-edge tools", score: 3 }
        ]
    },
    {
        question: "Have you ever modified HTML or CSS code, even in a simple way?",
        options: [
            { text: "No, I've never worked with code", score: 0 },
            { text: "I've made minor text edits to existing code", score: 1 },
            { text: "Yes, I've made basic modifications to existing templates", score: 2 },
            { text: "Yes, I'm comfortable creating and editing code", score: 3 }
        ]
    },
    {
        question: "What's your biggest challenge when it comes to using AI for education?",
        options: [
            { text: "Understanding what AI is capable of and how to start using it", score: 0 },
            { text: "Getting AI to produce high-quality, usable teaching resources", score: 1 },
            { text: "Creating customized, interactive materials with AI assistance", score: 3 },
            { text: "Keeping up with the rapid pace of AI developments", score: 2 }
        ]
    },
    {
        question: "How do you typically learn to use new digital tools?",
        options: [
            { text: "I prefer step-by-step guidance with lots of support", score: 0 },
            { text: "I like tutorials with examples I can adapt to my needs", score: 1 },
            { text: "I learn by experimenting and figuring things out independently", score: 2 },
            { text: "I enjoy diving deep into advanced features and pushing the boundaries", score: 3 }
        ]
    }
];

// Result pathways based on score ranges
const pathways = [
    {
        name: "AI Foundations",
        range: [0, 7],
        description: "Perfect for beginners! Start with the fundamentals of AI in education, learn basic prompting techniques, and discover how AI can enhance your teaching practice.",
        link: "ai-foundations/index.html",
        firstModule: "../getting-started/ai-safety-ethics.html?pathway=ai-foundations&module=1",
        icon: "fas fa-seedling"
    },
    {
        name: "Resource Builder",
        range: [8, 14],
        description: "Great for teachers with some AI experience! Learn advanced prompting techniques and access ready-to-use templates to create high-quality educational resources quickly.",
        link: "resource-builder/index.html",
        firstModule: "../getting-started/ai-safety-ethics.html?pathway=resource-builder&module=1",
        icon: "fas fa-tools"
    },
    {
        name: "Code Creator",
        range: [15, 21],
        description: "For tech-savvy educators! Learn to use AI to generate interactive HTML applications, quizzes, and games for your classroom - no programming experience required.",
        link: "code-creator/index.html",
        firstModule: "../getting-started/ai-safety-ethics.html?pathway=code-creator&module=1",
        icon: "fas fa-code"
    }
];

// Create and initialize the quiz modal
function createQuizModal() {
    // Check if the user has already taken the quiz
    if (localStorage.getItem('aiQuizCompleted')) {
        return; // Don't show the quiz again
    }
    
    // Create modal container
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'quiz-modal-overlay';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'quiz-modal-content';
    
    // Create quiz header
    const quizHeader = document.createElement('div');
    quizHeader.className = 'quiz-header';
    quizHeader.innerHTML = `
        <h2>Find Your AI Learning Pathway</h2>
        <p>Answer a few questions to discover which learning track is best for you.</p>
    `;
    
    // Create quiz body
    const quizBody = document.createElement('div');
    quizBody.className = 'quiz-body';
    
    // Create progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'quiz-progress-container';
    progressContainer.innerHTML = `
        <div class="quiz-progress-bar">
            <div class="quiz-progress-fill" style="width: 0%"></div>
        </div>
        <div class="quiz-progress-text">Question 1 of ${quizQuestions.length}</div>
    `;
    
    // Create quiz content area
    const quizContent = document.createElement('div');
    quizContent.className = 'quiz-content';
    
    // Create quiz navigation
    const quizNav = document.createElement('div');
    quizNav.className = 'quiz-nav';
    quizNav.innerHTML = `
        <button class="quiz-btn quiz-btn-back" style="visibility: hidden;">
            <i class="fas fa-arrow-left"></i> Back
        </button>
        <button class="quiz-btn quiz-btn-next" disabled>
            Next <i class="fas fa-arrow-right"></i>
        </button>
    `;
    
    // Assemble the modal
    quizBody.appendChild(progressContainer);
    quizBody.appendChild(quizContent);
    quizBody.appendChild(quizNav);
    
    modalContent.appendChild(quizHeader);
    modalContent.appendChild(quizBody);
    
    modalOverlay.appendChild(modalContent);
    document.body.appendChild(modalOverlay);
    
    // Initialize quiz state
    let currentQuestion = 0;
    let userScore = 0;
    let userAnswers = [];
    
    // Display the first question
    displayQuestion(currentQuestion);
    
    // Event listeners for navigation buttons
    document.querySelector('.quiz-btn-next').addEventListener('click', function() {
        if (currentQuestion < quizQuestions.length - 1) {
            // Move to next question
            currentQuestion++;
            displayQuestion(currentQuestion);
            updateProgress(currentQuestion);
            
            // Show back button once we're past the first question
            document.querySelector('.quiz-btn-back').style.visibility = 'visible';
            
            // Disable next button until an option is selected
            this.disabled = true;
            
            // Change button text on the last question
            if (currentQuestion === quizQuestions.length - 1) {
                this.innerHTML = `See Results <i class="fas fa-check"></i>`;
            }
        } else {
            // Show results when we've reached the end
            showResults();
        }
    });
    
    document.querySelector('.quiz-btn-back').addEventListener('click', function() {
        if (currentQuestion > 0) {
            // Move to previous question
            currentQuestion--;
            displayQuestion(currentQuestion);
            updateProgress(currentQuestion);
            
            // Hide back button if we're at the first question
            if (currentQuestion === 0) {
                this.style.visibility = 'hidden';
            }
            
            // Reset next button text if we're no longer on the last question
            if (currentQuestion < quizQuestions.length - 1) {
                document.querySelector('.quiz-btn-next').innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
            }
            
            // Enable next button since we've already answered this question
            document.querySelector('.quiz-btn-next').disabled = false;
        }
    });
    
    // Function to display a question
    function displayQuestion(index) {
        const question = quizQuestions[index];
        
        // Create question markup
        let questionMarkup = `
            <div class="quiz-question">
                <h3>${question.question}</h3>
                <div class="quiz-options">
        `;
        
        // Add each option
        question.options.forEach((option, optionIndex) => {
            const isSelected = userAnswers[index] === optionIndex;
            questionMarkup += `
                <div class="quiz-option ${isSelected ? 'selected' : ''}" data-index="${optionIndex}">
                    <div class="quiz-option-radio">
                        <div class="quiz-option-radio-inner ${isSelected ? 'selected' : ''}"></div>
                    </div>
                    <div class="quiz-option-text">${option.text}</div>
                </div>
            `;
        });
        
        questionMarkup += `</div></div>`;
        
        // Update the content area
        quizContent.innerHTML = questionMarkup;
        
        // Add event listeners to options
        document.querySelectorAll('.quiz-option').forEach(option => {
            option.addEventListener('click', function() {
                // Clear previous selection
                document.querySelectorAll('.quiz-option').forEach(opt => {
                    opt.classList.remove('selected');
                    opt.querySelector('.quiz-option-radio-inner').classList.remove('selected');
                });
                
                // Set new selection
                this.classList.add('selected');
                this.querySelector('.quiz-option-radio-inner').classList.add('selected');
                
                // Update user answers
                const optionIndex = parseInt(this.getAttribute('data-index'));
                userAnswers[index] = optionIndex;
                userScore = calculateScore();
                
                // Enable next button
                document.querySelector('.quiz-btn-next').disabled = false;
            });
        });
    }
    
    // Function to update progress bar
    function updateProgress(index) {
        const progressPercent = ((index + 1) / quizQuestions.length) * 100;
        document.querySelector('.quiz-progress-fill').style.width = `${progressPercent}%`;
        document.querySelector('.quiz-progress-text').textContent = `Question ${index + 1} of ${quizQuestions.length}`;
    }
    
    // Function to calculate the user's score
    function calculateScore() {
        let total = 0;
        userAnswers.forEach((answerIndex, questionIndex) => {
            if (answerIndex !== undefined) {
                total += quizQuestions[questionIndex].options[answerIndex].score;
            }
        });
        return total;
    }
    
    // Function to show results
    function showResults() {
        // Determine which pathway to recommend
        const recommendedPathway = getRecommendedPathway(userScore);
        
        // Create results markup
        const resultsMarkup = `
            <div class="quiz-results">
                <div class="quiz-results-icon">
                    <i class="${recommendedPathway.icon}"></i>
                </div>
                <h3>Your Recommended Pathway</h3>
                <div class="quiz-results-pathway">${recommendedPathway.name}</div>
                <p class="quiz-results-description">${recommendedPathway.description}</p>
                <div class="quiz-results-actions">
                    <a href="${recommendedPathway.firstModule}" class="quiz-btn quiz-btn-primary">Start Learning</a>
                    <button class="quiz-btn quiz-btn-secondary quiz-close-btn">Choose Another Pathway</button>
                </div>
            </div>
        `;
        
        // Update the content and navigation
        quizContent.innerHTML = resultsMarkup;
        document.querySelector('.quiz-nav').style.display = 'none';
        document.querySelector('.quiz-progress-container').style.display = 'none';
        
        // Update header
        document.querySelector('.quiz-header h2').textContent = 'Your Personal Learning Path';
        document.querySelector('.quiz-header p').textContent = 'Based on your responses, we\'ve identified the best starting point for your AI learning journey.';
        
        // Add event listener to close button
        // Add event listener to close button
    document.querySelector('.quiz-close-btn').addEventListener('click', function() {
        closeQuizModal();
        
        // Show pathways section after quiz closes
        gsap.set('.pathways', { 
            y: 0,
            visibility: 'visible'
        });

        // Scroll directly to the pathways section
    document.querySelector('.pathways').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Mark quiz as completed
    localStorage.setItem('aiQuizCompleted', 'true');
}
    
    // Function to determine recommended pathway
    function getRecommendedPathway(score) {
        for (const pathway of pathways) {
            if (score >= pathway.range[0] && score <= pathway.range[1]) {
                return pathway;
            }
        }
        // Default to foundations if something goes wrong
        return pathways[0];
    }
    
    // Function to close the quiz modal
    function closeQuizModal() {
        document.body.removeChild(modalOverlay);
    }
}

// Add quiz modal styles
function addQuizStyles() {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerText = `
        .quiz-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.3s ease;
        }
        
        .quiz-modal-content {
            background-color: white;
            border-radius: 16px;
            max-width: 700px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            animation: slideUp 0.4s ease;
        }
        
        .quiz-header {
            padding: 30px 30px 20px;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .quiz-header h2 {
            font-size: 1.8rem;
            color: var(--primary);
            margin-bottom: 10px;
        }
        
        .quiz-header p {
            color: var(--neutral);
            font-size: 1.1rem;
        }
        
        .quiz-body {
            padding: 30px;
        }
        
        .quiz-progress-container {
            margin-bottom: 30px;
        }
        
        .quiz-progress-bar {
            width: 100%;
            height: 8px;
            background-color: #e5e7eb;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
        }
        
        .quiz-progress-fill {
            height: 100%;
            background: linear-gradient(to right, var(--primary), var(--secondary));
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .quiz-progress-text {
            text-align: center;
            font-size: 0.9rem;
            color: var(--neutral);
        }
        
        .quiz-content {
            margin-bottom: 30px;
        }
        
        .quiz-question h3 {
            font-size: 1.3rem;
            color: var(--dark);
            margin-bottom: 20px;
        }
        
        .quiz-options {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .quiz-option {
            display: flex;
            align-items: center;
            padding: 15px;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .quiz-option:hover {
            border-color: var(--primary-light);
            background-color: rgba(99, 102, 241, 0.05);
        }
        
        .quiz-option.selected {
            border-color: var(--primary);
            background-color: rgba(99, 102, 241, 0.1);
        }
        
        .quiz-option-radio {
            width: 24px;
            height: 24px;
            border: 2px solid #d1d5db;
            border-radius: 50%;
            margin-right: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: all 0.2s ease;
        }
        
        .quiz-option.selected .quiz-option-radio {
            border-color: var(--primary);
        }
        
        .quiz-option-radio-inner {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: transparent;
            transition: all 0.2s ease;
        }
        
        .quiz-option-radio-inner.selected {
            background-color: var(--primary);
        }
        
        .quiz-option-text {
            font-size: 1.05rem;
            color: var(--dark);
        }
        
        .quiz-nav {
            display: flex;
            justify-content: space-between;
        }
        
        .quiz-btn {
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            font-size: 1rem;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .quiz-btn-back {
            background-color: #f3f4f6;
            color: var(--dark);
        }
        
        .quiz-btn-back:hover {
            background-color: #e5e7eb;
        }
        
        .quiz-btn-next {
            background-color: var(--primary);
            color: white;
        }
        
        .quiz-btn-next:hover:not(:disabled) {
            background-color: var(--primary-dark);
        }
        
        .quiz-btn-next:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .quiz-results {
            text-align: center;
            padding: 20px 0;
        }
        
        .quiz-results-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background-color: rgba(99, 102, 241, 0.1);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2.5rem;
            color: var(--primary);
        }
        
        .quiz-results h3 {
            font-size: 1.3rem;
            color: var(--neutral);
            margin-bottom: 10px;
        }
        
        .quiz-results-pathway {
            font-size: 2rem;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 20px;
        }
        
        .quiz-results-description {
            color: var(--neutral);
            line-height: 1.6;
            max-width: 600px;
            margin: 0 auto 30px;
            font-size: 1.1rem;
        }
        
        .quiz-results-actions {
            display: flex;
            gap: 15px;
            justify-content: center;
        }
        
        .quiz-btn-primary {
            background-color: var(--primary);
            color: white;
            text-decoration: none;
        }
        
        .quiz-btn-primary:hover {
            background-color: var(--primary-dark);
        }
        
        .quiz-btn-secondary {
            background-color: white;
            color: var(--dark);
            border: 2px solid #e5e7eb;
        }
        
        .quiz-btn-secondary:hover {
            background-color: #f3f4f6;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        @media (max-width: 640px) {
            .quiz-modal-content {
                width: 95%;
                max-height: 95vh;
            }
            
            .quiz-header h2 {
                font-size: 1.5rem;
            }
            
            .quiz-body {
                padding: 20px;
            }
            
            .quiz-option {
                padding: 12px;
            }
            
            .quiz-option-text {
                font-size: 0.95rem;
            }
            
            .quiz-results-actions {
                flex-direction: column;
            }
            
            .quiz-btn {
                width: 100%;
                justify-content: center;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}

// Initialize once DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    addQuizStyles();
    
    
    // For testing - add a reset button to clear localStorage and reload the page
    // Uncomment these lines during development, comment out for production
    /*
    const resetButton = document.createElement('button');
    resetButton.innerText = 'Reset Quiz';
    resetButton.style.position = 'fixed';
    resetButton.style.bottom = '10px';
    resetButton.style.right = '10px';
    resetButton.style.zIndex = '9999';
    resetButton.style.padding = '5px 10px';
    resetButton.addEventListener('click', function() {
        localStorage.removeItem('aiQuizCompleted');
        window.location.reload();
    });
    document.body.appendChild(resetButton);
    */
});