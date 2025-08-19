// =========================
// AI at School Navigation System
// =========================

let currentSection = 1;
const totalSections = 7;

/**
 * Updates the progress bar and step indicators
 */
function updateProgress() {
  const progressFill = document.getElementById('progressFill');
  const progressSteps = document.querySelectorAll('.progress-step');
  const percentage = (currentSection / totalSections) * 100;
  
  // Update progress bar width
  progressFill.style.width = percentage + '%';
  
  // Update step indicators
  progressSteps.forEach((step, index) => {
    const stepNumber = index + 1;
    const circle = step.querySelector('.step-circle');
    
    // Remove all classes first
    step.classList.remove('active', 'completed');
    circle.classList.remove('active', 'completed');
    
    // Add appropriate classes
    if (stepNumber === currentSection) {
      step.classList.add('active');
      circle.classList.add('active');
    } else if (stepNumber < currentSection) {
      step.classList.add('completed');
      circle.classList.add('completed');
    }
  });
}

/**
 * Shows a specific section and hides all others
 * @param {number} sectionNumber - The section number to show
 */
function showSection(sectionNumber) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Show the selected section
  const targetSection = document.getElementById(`section-${sectionNumber}`);
  if (targetSection) {
    targetSection.classList.add('active');
    currentSection = sectionNumber;
    updateProgress();
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

/**
 * Navigates to the next section
 */
function nextSection() {
  if (currentSection < totalSections) {
    showSection(currentSection + 1);
  }
}

/**
 * Navigates to the previous section
 */
function prevSection() {
  if (currentSection > 1) {
    showSection(currentSection - 1);
  }
}

/**
 * Navigates to a specific section by number
 * @param {number} sectionNumber - The section number to navigate to
 */
function goToSection(sectionNumber) {
  if (sectionNumber >= 1 && sectionNumber <= totalSections) {
    showSection(sectionNumber);
  }
}

/**
 * Sets up keyboard navigation
 */
function setupKeyboardNavigation() {
  document.addEventListener('keydown', function(event) {
    // Only handle keyboard navigation if no input/textarea is focused
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
      return;
    }
    
    switch(event.key) {
      case 'ArrowRight':
      case ' ': // Spacebar
        event.preventDefault();
        nextSection();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        prevSection();
        break;
      case 'Home':
        event.preventDefault();
        goToSection(1);
        break;
      case 'End':
        event.preventDefault();
        goToSection(totalSections);
        break;
    }
  });
}

/**
 * Sets up progress step click navigation
 */
function setupProgressNavigation() {
  const progressSteps = document.querySelectorAll('.progress-step');
  
  progressSteps.forEach((step, index) => {
    step.addEventListener('click', function() {
      const targetSection = index + 1;
      goToSection(targetSection);
    });
    
    // Add cursor pointer style
    step.style.cursor = 'pointer';
  });
}

/**
 * Sets up expandable content accessibility
 */
function setupExpandableAccessibility() {
  const expandables = document.querySelectorAll('.expandable');
  
  expandables.forEach(expandable => {
    const summary = expandable.querySelector('summary');
    
    // Add keyboard support for expandables
    summary.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        expandable.open = !expandable.open;
      }
    });
    
    // Ensure summary is focusable
    summary.setAttribute('tabindex', '0');
  });
}

/**
 * Sets up focus management for better accessibility
 */
function setupFocusManagement() {
  // When a section becomes active, focus on its heading
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const section = mutation.target;
        if (section.classList.contains('active') && section.classList.contains('section')) {
          const heading = section.querySelector('h2');
          if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus();
          }
        }
      }
    });
  });
  
  // Start observing
  document.querySelectorAll('.section').forEach(section => {
    observer.observe(section, { attributes: true });
  });
}

/**
 * Initializes the application
 */
function initialize() {
  // Update initial progress
  updateProgress();
  
  // Setup navigation systems
  setupKeyboardNavigation();
  setupProgressNavigation();
  setupExpandableAccessibility();
  setupFocusManagement();
  
  // Announce to screen readers that the page is ready
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = 'AI guidance module loaded. Use arrow keys or click progress steps to navigate.';
  document.body.appendChild(announcement);
  
  // Remove announcement after screen readers have had time to read it
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 3000);
}

/**
 * Utility function to get current section info
 */
function getCurrentSectionInfo() {
  return {
    current: currentSection,
    total: totalSections,
    percentage: Math.round((currentSection / totalSections) * 100),
    canGoNext: currentSection < totalSections,
    canGoPrev: currentSection > 1
  };
}

/**
 * Analytics/tracking function (placeholder)
 * Replace with actual analytics implementation if needed
 */
function trackSectionView(sectionNumber) {
  // Placeholder for analytics tracking
  console.log(`Section ${sectionNumber} viewed`);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initialize);

// Export functions for external use if needed
window.StudentAIGuide = {
  nextSection,
  prevSection,
  goToSection,
  getCurrentSectionInfo,
  trackSectionView
};