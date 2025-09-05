// =========================
// AI at School Navigation System
// =========================

let currentSection = 0;
let totalSections = 0; // derive from DOM on init
let sections = [];
let headerHeight = 0;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Updates the progress bar and step indicators
 */
function updateProgress() {
  const progressFill = document.getElementById('progressFill');
  const progressSteps = document.querySelectorAll('.progress-step');
  const percentage = (currentSection / totalSections) * 100;
  
  // Update progress bar width
  if (progressFill) progressFill.style.width = percentage + '%';
  // Update mini progress if present
  const miniFill = document.getElementById('progressMiniFill');
  if (miniFill) miniFill.style.width = percentage + '%';
  
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
      step.setAttribute('aria-current', 'step');
    } else if (stepNumber < currentSection) {
      step.classList.add('completed');
      circle.classList.add('completed');
      step.setAttribute('aria-current', 'false');
    } else {
      step.setAttribute('aria-current', 'false');
    }
  });
}

/**
 * Shows a specific section and hides all others
 * @param {number} sectionNumber - The section number to show
 */
function showSection(sectionNumber) {
  // Hide all sections
  sections.forEach(section => {
    section.classList.remove('active');
    section.setAttribute('aria-hidden', 'true');
    section.setAttribute('hidden', '');
  });
  
  // Show the selected section
  const targetSection = document.getElementById(`section-${sectionNumber}`);
  if (targetSection) {
    targetSection.classList.add('active');
    targetSection.removeAttribute('hidden');
    targetSection.setAttribute('aria-hidden', 'false');
    currentSection = sectionNumber;
    updateProgress();
    trackSectionView(sectionNumber);
    // Update URL hash without scrolling
    if (history.replaceState) {
      history.replaceState(null, '', `#section-${sectionNumber}`);
    } else {
      location.hash = `section-${sectionNumber}`;
    }
    
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
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
    // Accessibility semantics
    step.setAttribute('role', 'button');
    step.setAttribute('tabindex', '0');
    step.setAttribute('aria-current', index === 0 ? 'step' : 'false');
    // Keyboard support
    step.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        const targetSection = index + 1;
        goToSection(targetSection);
      }
    });
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
 * Ensures sections have ARIA roles and initial hidden state
 */
function setupSectionAccessibility() {
  sections.forEach((section, idx) => {
    if (!section.hasAttribute('role')) section.setAttribute('role', 'region');
    const labelledBy = section.getAttribute('aria-labelledby');
    if (!labelledBy) {
      const h2 = section.querySelector('h2');
      if (h2 && h2.id) section.setAttribute('aria-labelledby', h2.id);
    }
    // Hide non-active sections at start
    if (!section.classList.contains('active')) {
      section.setAttribute('aria-hidden', 'true');
      section.setAttribute('hidden', '');
    } else {
      section.setAttribute('aria-hidden', 'false');
      section.removeAttribute('hidden');
    }
  });
}

/**
 * Injects Prev/Next navigation buttons into each section
 */
function injectNavButtons() {
  const steps = Array.from(document.querySelectorAll('.progress-step'));
  sections.forEach((section, idx) => {
    // Avoid duplicate injection
    if (section.querySelector('.nav-buttons')) return;
    const nav = document.createElement('div');
    nav.className = 'nav-buttons';

    // Prev button
    const prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.className = 'btn btn-secondary';
    prevBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M15.5 19l-7-7 7-7"/></svg> Back`;
    prevBtn.setAttribute('aria-label', 'Go to previous section');
    if (idx === 0) {
      prevBtn.disabled = true;
      prevBtn.setAttribute('aria-disabled', 'true');
    } else {
      prevBtn.addEventListener('click', prevSection);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.className = 'btn btn-primary';
    const nextLabel = steps[idx + 1]?.querySelector('span')?.textContent?.trim() || 'Next';
    if (idx < sections.length - 1) {
      nextBtn.innerHTML = `Next${nextLabel ? `: ${nextLabel}` : ''} <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.5 5l7 7-7 7"/></svg>`;
      nextBtn.setAttribute('aria-label', `Go to next section${nextLabel ? `: ${nextLabel}` : ''}`);
      nextBtn.addEventListener('click', nextSection);
    } else {
      nextBtn.innerHTML = `Review summary <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.5 5l7 7-7 7"/></svg>`;
      nextBtn.setAttribute('aria-label', 'Go to summary');
      nextBtn.addEventListener('click', () => goToSection(1));
    }

    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    section.appendChild(nav);
  });
}

/**
 * Sticky mini progress bar that appears after hero scroll
 */
function setupMiniProgress() {
  const mini = document.createElement('div');
  mini.className = 'progress-mini';
  mini.innerHTML = `
    <div class="progress-mini-bar">
      <div class="progress-mini-fill" id="progressMiniFill"></div>
    </div>
  `;
  document.body.appendChild(mini);

  const onScroll = () => {
    // Toggle mini progress after header is out of view
    const show = window.scrollY > Math.max(0, headerHeight - 20);
    mini.classList.toggle('show', show);
  };
  window.addEventListener('scroll', () => {
    if (prefersReducedMotion) return onScroll();
    // rAF throttle
    if (onScroll._ticking) return;
    onScroll._ticking = true;
    requestAnimationFrame(() => { onScroll(); onScroll._ticking = false; });
  });
  // Initial state
  onScroll();
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
  // Cache key elements
  sections = Array.from(document.querySelectorAll('.section'));
  totalSections = sections.length;
  const header = document.querySelector('.header');
  headerHeight = header ? header.offsetHeight : 0;

  // Insert skip link for keyboard users
  const skipLink = document.createElement('a');
  skipLink.href = '#main';
  skipLink.className = 'skip-link';
  skipLink.textContent = 'Skip to content';
  document.body.insertAdjacentElement('afterbegin', skipLink);
  
  // Setup navigation systems
  setupKeyboardNavigation();
  setupProgressNavigation();
  setupExpandableAccessibility();
  setupSectionAccessibility();
  setupFocusManagement();
  injectNavButtons();
  setupMiniProgress();

  // Wire up intro panel
  const intro = document.getElementById('introPanel');
  const startBtn = document.getElementById('startModuleBtn');
  if (intro && startBtn) {
    startBtn.addEventListener('click', () => {
      intro.style.display = 'none';
      goToSection(1);
      window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });
  }

  // Render case studies in Section 4
  setupCaseStudies();

  // Handle deep linking via hash; only show a section immediately if deep-linked
  const hash = window.location.hash;
  const hasDeepLink = /^#section-(\d+)$/.test(hash || '');
  if (hasDeepLink) {
    const target = parseInt(hash.replace('#section-', ''), 10);
    if (intro) intro.style.display = 'none';
    goToSection(target);
  } else {
    // Keep sections hidden until the user starts the module
    currentSection = 0;
    updateProgress();
  }
  
  // Announce to screen readers that the page is ready
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = 'AI guidance module loaded. Use arrow keys or click progress steps to navigate.';
  document.body.appendChild(announcement);
  
  // Remove announcement after screen readers have had time to read it
  setTimeout(() => {
    if (announcement.parentNode) {
      announcement.parentNode.removeChild(announcement);
    }
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

// =========================
// Case Studies (Section 4)
// =========================

const caseStudiesData = [
  {
    id: 'cs1',
    title: 'Class photo and an AI app',
    scenario: 'Your friend asks you to upload a class photo to an AI app to “make it look cinematic”.',
    options: [
      { key: 'A', text: 'Allowed — there’s no problem with this.' },
      { key: 'B', text: 'Allowed only if you blur faces first.' },
      { key: 'C', text: 'Not allowed — never upload photos of students or staff.' },
      { key: 'D', text: 'Only if a teacher gives written permission.' }
    ],
    answer: 'C',
    explanation: 'School photos of students or staff must not be uploaded to any AI platform. This protects people’s privacy and safety.',
    policy: 'Policy mapping: Appendix 2; ICT Acceptable Use Agreement.'
  },
  {
    id: 'cs2',
    title: 'Face‑swap of a classmate',
    scenario: 'Someone sends you a face‑swap of a classmate in a silly situation and suggests posting it in a group chat.',
    options: [
      { key: 'A', text: 'Allowed — it’s clearly a joke.' },
      { key: 'B', text: 'Allowed if the classmate says it’s fine.' },
      { key: 'C', text: 'Not allowed — deepfakes/face‑swaps of real people are misuse.' },
      { key: 'D', text: 'Report to the police immediately.' }
    ],
    answer: 'C',
    explanation: 'Creating or sharing deepfakes of real people is harmful and prohibited, even if intended as a joke.',
    policy: 'Policy mapping: Appendix 2.'
  },
  {
    id: 'cs3',
    title: 'AI‑created sexual image',
    scenario: 'A student boasts that an AI tool created a sexualised image of a real person and asks if you want the link.',
    options: [
      { key: 'A', text: 'Allowed only if it isn’t shared further.' },
      { key: 'B', text: 'Not allowed — it’s a safeguarding issue; do not view or share.' },
      { key: 'C', text: 'Allowed if the person is over 18.' },
      { key: 'D', text: 'Download it for evidence and send it to friends.' }
    ],
    answer: 'B',
    explanation: 'AI‑created nudes/semi‑nudes of a real person are treated seriously as a safeguarding matter. Do not create, request, forward or store such content; report to staff.',
    policy: 'Policy mapping: Appendix 4.'
  },
  {
    id: 'cs4',
    title: 'Offensive AI meme',
    scenario: 'You use an image generator to make a meme that targets a protected group and consider posting it.',
    options: [
      { key: 'A', text: 'Not allowed — discriminatory or abusive content is prohibited.' },
      { key: 'B', text: 'Allowed if you delete it afterwards.' },
      { key: 'C', text: 'Allowed if your account is private.' },
      { key: 'D', text: 'Allowed if you add a disclaimer.' }
    ],
    answer: 'A',
    explanation: 'Harmful or discriminatory content (including AI‑generated) is not permitted and may lead to sanctions.',
    policy: 'Policy mapping: Appendix 2.'
  },
  {
    id: 'cs5',
    title: 'You receive harmful AI content',
    scenario: 'A contact sends you an AI‑generated image that is upsetting. They ask you to forward it.',
    options: [
      { key: 'A', text: 'Forward it to friends so they know.' },
      { key: 'B', text: 'Report it to a teacher/staff member and don’t share it on.' },
      { key: 'C', text: 'Ignore it and delete the chat.' },
      { key: 'D', text: 'Post it with a warning so others are aware.' }
    ],
    answer: 'B',
    explanation: 'Do not forward harmful content. Tell a teacher or member of staff promptly and keep helpful details.',
    policy: 'Policy mapping: Section 8; Appendix 4.'
  },
  {
    id: 'cs6',
    title: 'Essay writing with AI',
    scenario: 'You’re short on time and ask an AI to write your entire English essay, planning to submit it as your own.',
    options: [
      { key: 'A', text: 'Allowed if you change a few words.' },
      { key: 'B', text: 'Not allowed — submitting AI‑generated work is academic dishonesty.' },
      { key: 'C', text: 'Allowed if the AI cites sources.' },
      { key: 'D', text: 'Allowed if your friend does the same.' }
    ],
    answer: 'B',
    explanation: 'AI can help you brainstorm or improve understanding, but the work you submit must be your own.',
    policy: 'Policy mapping: Academic integrity policies.'
  },
  {
    id: 'cs7',
    title: 'Understanding a difficult maths topic',
    scenario: 'You ask an AI to explain a tricky maths concept in simpler steps before you practise questions.',
    options: [
      { key: 'A', text: 'Good practice — allowed, as part of learning.' },
      { key: 'B', text: 'Not allowed — you must not use AI for explanations.' },
      { key: 'C', text: 'Allowed only if you copy the answer directly.' },
      { key: 'D', text: 'Allowed if you don’t tell your teacher.' }
    ],
    answer: 'A',
    explanation: 'Using AI to understand concepts can support your learning, as long as you then practise and do your own work.',
    policy: ''
  },
  {
    id: 'cs8',
    title: 'Sharing personal information in prompts',
    scenario: 'You want tailored revision tips and consider sharing your full name, address and phone number with an AI.',
    options: [
      { key: 'A', text: 'Allowed — AI will keep it private.' },
      { key: 'B', text: 'Allowed with care — avoid sensitive personal details; use school‑approved tools.' },
      { key: 'C', text: 'Not allowed under any circumstances.' },
      { key: 'D', text: 'Only allowed if you’re over 18.' }
    ],
    answer: 'B',
    explanation: 'Avoid sharing sensitive personal information. Prefer school‑approved tools (e.g. Microsoft Copilot) that offer stronger data protection.',
    policy: ''
  }
];

// Remove policy mapping references from case studies
try { caseStudiesData.forEach(cs => { if ('policy' in cs) { delete cs.policy; } }); } catch (e) { /* no-op */ }

function setupCaseStudies() {
  const container = document.getElementById('caseStudies');
  const scoreEl = document.getElementById('caseScore');
  if (!container || !scoreEl) return;

  let correctCount = 0;
  const total = caseStudiesData.length;
  const updateScore = () => { scoreEl.textContent = `${correctCount}/${total} correct`; };
  updateScore();

  caseStudiesData.forEach((cs, idx) => {
    const card = document.createElement('article');
    card.className = 'quiz-case';
    card.setAttribute('role', 'listitem');

    const meta = document.createElement('div');
    meta.className = 'quiz-meta';
    meta.textContent = `Case ${idx + 1} of ${total}`;

    const title = document.createElement('h3');
    title.className = 'quiz-title';
    title.textContent = cs.title;

    const scenario = document.createElement('p');
    scenario.className = 'quiz-scenario';
    scenario.textContent = cs.scenario;

    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'quiz-options';

    const name = `opt-${cs.id}`;
    cs.options.forEach(opt => {
      const option = document.createElement('div');
      option.className = 'quiz-option';
      const input = document.createElement('input');
      input.type = 'radio';
      input.name = name;
      input.id = `${name}-${opt.key}`;
      input.value = opt.key;
      const label = document.createElement('label');
      label.setAttribute('for', input.id);
      const keyBadge = document.createElement('span');
      keyBadge.className = 'opt-key';
      keyBadge.textContent = opt.key;
      const txt = document.createElement('span');
      txt.textContent = opt.text;
      label.appendChild(keyBadge);
      label.appendChild(txt);
      option.appendChild(input);
      option.appendChild(label);
      optionsWrap.appendChild(option);
    });

    const actions = document.createElement('div');
    actions.className = 'quiz-actions';
    const checkBtn = document.createElement('button');
    checkBtn.type = 'button';
    checkBtn.className = 'btn btn-primary';
    checkBtn.textContent = 'Check answer';
    checkBtn.disabled = true;

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'btn btn-secondary';
    resetBtn.textContent = 'Reset';
    resetBtn.disabled = true;

    actions.appendChild(checkBtn);
    actions.appendChild(resetBtn);

    const feedback = document.createElement('div');
    feedback.className = 'case-feedback';
    feedback.style.display = 'none';
    feedback.setAttribute('aria-live', 'polite');

    let answered = false;
    let selected = null;

    optionsWrap.addEventListener('change', (e) => {
      if (e.target && e.target.name === name) {
        selected = e.target.value;
        checkBtn.disabled = false;
      }
    });

    checkBtn.addEventListener('click', () => {
      if (!selected) return;
      answered = true;
      const isCorrect = selected === cs.answer;
      card.classList.toggle('correct', isCorrect);
      card.classList.toggle('incorrect', !isCorrect);
      feedback.classList.toggle('success', isCorrect);
      feedback.classList.toggle('error', !isCorrect);
      feedback.style.display = '';
      feedback.innerHTML = `<strong>${isCorrect ? 'Correct' : 'Not quite'}</strong> — ${cs.explanation}${cs.policy ? `<br><span class="text-muted">${cs.policy}</span>` : ''}`;
      if (isCorrect) {
        // Count only the first time a case is correctly answered
        if (!card.dataset.scored) {
          correctCount += 1;
          card.dataset.scored = 'true';
          updateScore();
        }
      }
      // Lock radios after checking
      [...optionsWrap.querySelectorAll('input[type="radio"]')].forEach(r => r.disabled = true);
      checkBtn.disabled = true;
      resetBtn.disabled = false;
    });

    resetBtn.addEventListener('click', () => {
      // Unlock and clear selection/feedback
      [...optionsWrap.querySelectorAll('input[type="radio"]')].forEach(r => { r.disabled = false; r.checked = false; });
      selected = null;
      checkBtn.disabled = true;
      resetBtn.disabled = true;
      feedback.style.display = 'none';
      card.classList.remove('correct', 'incorrect');
      if (card.dataset.scored === 'true') {
        correctCount = Math.max(0, correctCount - 1);
        delete card.dataset.scored;
        updateScore();
      }
    });

    card.appendChild(meta);
    card.appendChild(title);
    card.appendChild(scenario);
    card.appendChild(optionsWrap);
    card.appendChild(actions);
    card.appendChild(feedback);
    container.appendChild(card);
  });
}
