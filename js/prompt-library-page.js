// Prompt Library page script extracted from resources/prompt-library.html
// Keeps existing functionality and adds voting with local repeat protection

// Import Firebase modules used throughout the page
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  increment,
  orderBy,
  query,
  where,
  limit,
  startAfter,
  getCountFromServer,
  setDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Local modules
import { db, hasVoted, recordVote } from './firebase.js';
import { categories } from './categories.js';

// State
let prompts = [];
let deepLinkId = null;
let deepLinkOpened = false;
let filteredPrompts = [];
let currentViewedPromptId = null;
let currentFilters = {
  search: '',
  subject: null,
  phase: null,
  type: null,
  sort: 'newest'
};

// Minimal inline SVG icon system for consistent, professional icons
function svgIcon(name, size = 18, stroke = 1.8) {
  const base = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"`;
  switch (name) {
    case 'copy':
      return `<svg ${base}><rect x="9" y="9" width="10" height="10" rx="2"/><rect x="5" y="5" width="10" height="10" rx="2"/></svg>`;
    case 'eye':
      return `<svg ${base}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>`;
    case 'upvote':
      return `<i class="fas fa-thumbs-up" aria-hidden="true"></i>`;
    case 'check':
      return `<svg ${base}><path d="M5 13l4 4L19 7"/></svg>`;
    default:
      return '';
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  deepLinkId = params.get('id');

  loadCategories();
  loadPrompts();
  setupEventListeners();
  restoreCollapsedState();
});

// Load categories
function loadCategories() {
  // Populate sidebar categories
  const subjectCats = categories.subjects;
  const phaseCats = categories.phases;
  const typeCats = categories.types;
  const audienceCats = categories.audience || ['Teacher','Students'];

  document.getElementById('subjectCategories').innerHTML = subjectCats.map(cat => `
    <li class="category-item">
      <a href="#" class="category-link" data-category="subject" data-value="${cat}">
        <i class="fas fa-tag category-icon"></i>
        <span>${cat}</span>
        <span class="category-count">0</span>
      </a>
    </li>
  `).join('');

  document.getElementById('phaseCategories').innerHTML = phaseCats.map(cat => `
    <li class="category-item">
      <a href="#" class="category-link" data-category="phase" data-value="${cat}">
        <i class="fas fa-tag category-icon"></i>
        <span>${cat}</span>
        <span class="category-count">0</span>
      </a>
    </li>
  `).join('');

  document.getElementById('typeCategories').innerHTML = typeCats.map(cat => `
    <li class="category-item">
      <a href="#" class="category-link" data-category="type" data-value="${cat}">
        <i class="fas fa-tag category-icon"></i>
        <span>${cat}</span>
        <span class="category-count">0</span>
      </a>
    </li>
  `).join('');

  document.getElementById('audienceCategories').innerHTML = audienceCats.map(cat => `
    <li class="category-item">
      <a href="#" class="category-link" data-category="audience" data-value="${cat}">
        <i class="fas fa-tag category-icon"></i>
        <span>${cat}</span>
        <span class="category-count">0</span>
      </a>
    </li>
  `).join('');

  // Populate form dropdowns
  document.getElementById('promptSubject').innerHTML = '<option value="">Select subject</option>' +
    subjectCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');

  document.getElementById('promptPhase').innerHTML = '<option value="">Select phase</option>' +
    phaseCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');

  document.getElementById('promptType').innerHTML = '<option value="">Select type</option>' +
    typeCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
  // audience checkboxes already in DOM; nothing to populate
}

// Load prompts from Firebase
async function loadPrompts() {
  try {
    const promptsRef = collection(db, 'prompts');
    let q;

    // Apply sorting
    switch (currentFilters.sort) {
      case 'popular':
        q = query(promptsRef, orderBy('votes', 'desc'));
        break;
      case 'newest':
        q = query(promptsRef, orderBy('createdAt', 'desc'));
        break;
      case 'votes':
        q = query(promptsRef, orderBy('votes', 'desc'));
        break;
      default:
        q = query(promptsRef, orderBy('createdAt', 'asc'));
    }

    const snapshot = await getDocs(q);
    prompts = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    }));

    // Apply filters
    applyFilters();
    updateCategoryCounts();

    // Deep link to a prompt by id (open modal) once after initial load
    if (deepLinkId && !deepLinkOpened) {
      const match = prompts.find(p => p.id === deepLinkId);
      if (match) {
        deepLinkOpened = true;
        viewPrompt(deepLinkId);
        // Optional: scroll to the card
        setTimeout(() => {
          const el = document.querySelector(`.prompt-card[onclick*="${deepLinkId}"]`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    }

  } catch (error) {
    console.error('Error loading prompts:', error);
    showToast('Error loading prompts. Please try again.', 'error');
  }
}

// Apply filters
function applyFilters() {
  filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !currentFilters.search ||
      (prompt.title || '').toLowerCase().includes(currentFilters.search.toLowerCase()) ||
      (prompt.description || '').toLowerCase().includes(currentFilters.search.toLowerCase()) ||
      (prompt.content || '').toLowerCase().includes(currentFilters.search.toLowerCase()) ||
      (prompt.context || '').toLowerCase().includes(currentFilters.search.toLowerCase());

    const matchesSubject = !currentFilters.subject || prompt.subject === currentFilters.subject;
    const matchesPhase = !currentFilters.phase || prompt.phase === currentFilters.phase;
    const matchesType = !currentFilters.type || prompt.type === currentFilters.type;
    const matchesAudience = !currentFilters.audience || Array.isArray(prompt.audience) && prompt.audience.includes(currentFilters.audience);

    return matchesSearch && matchesSubject && matchesPhase && matchesType && matchesAudience;
  });

  displayPrompts();
  updateResultCount();
}

// Update category counts
function updateCategoryCounts() {
  // Update subject counts
  categories.subjects.forEach(subject => {
    const count = prompts.filter(p => p.subject === subject).length;
    const element = document.querySelector(`[data-category="subject"][data-value="${subject}"] .category-count`);
    if (element) element.textContent = count;
  });

  // Update phase counts
  categories.phases.forEach(phase => {
    const count = prompts.filter(p => p.phase === phase).length;
    const element = document.querySelector(`[data-category="phase"][data-value="${phase}"] .category-count`);
    if (element) element.textContent = count;
  });

  // Update type counts
  categories.types.forEach(type => {
    const count = prompts.filter(p => p.type === type).length;
    const element = document.querySelector(`[data-category="type"][data-value="${type}"] .category-count`);
    if (element) element.textContent = count;
  });

  // Update audience counts
  (categories.audience || ['Teacher','Students']).forEach(aud => {
    const count = prompts.filter(p => Array.isArray(p.audience) && p.audience.includes(aud)).length;
    const element = document.querySelector(`[data-category="audience"][data-value="${aud}"] .category-count`);
    if (element) element.textContent = count;
  });
}

// Display prompts
function displayPrompts() {
  const grid = document.getElementById('promptsGrid');

  if (filteredPrompts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-sparkles empty-icon"></i>
        <h3 class="empty-title">No prompts found</h3>
        <p class="empty-description">Try adjusting your filters or be the first to add a prompt!</p>
        <button class="btn btn-primary" onclick="showAddPromptModal()">
          <i class="fas fa-plus"></i> Add First Prompt
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filteredPrompts.map(prompt => `
    <div class="prompt-card" onclick="viewPrompt('${prompt.id}')">
      <div class="prompt-header">
        <h3 class="prompt-title">${escapeHtml(prompt.title || '')}</h3>
        <div class="prompt-meta">
          <span class="prompt-meta-item">
            ${svgIcon('upvote', 16, 1.7)}
            ${prompt.votes || 0}
          </span>
          <span class="prompt-meta-item">
            ${svgIcon('copy', 16, 1.7)}
            ${prompt.usageCount || 0}
          </span>
          <span class="prompt-meta-item">
            <i class="fas fa-user"></i>
            by ${escapeHtml(prompt.createdBy || 'Anonymous')}
          </span>
        </div>
      </div>
      <p class="prompt-description">${escapeHtml(prompt.description || '')}</p>
      ${prompt.context ? ('<p class="prompt-context"><strong>Context:</strong> ' + escapeHtml(prompt.context).slice(0, 160) + (prompt.context.length > 160 ? '…' : '') + '</p>') : ''}
      <div class="prompt-categories">
        <span class="category-badge">${prompt.subject || ''}</span>
        <span class="category-badge">${prompt.phase || ''}</span>
        <span class="category-badge">${prompt.type || ''}</span>
        ${(Array.isArray(prompt.audience) ? prompt.audience : []).map(a=>`<span class=\"category-badge ${a==='Teacher'?'audience-teacher':'audience-students'}\">${a}</span>`).join('')}
      </div>
      <div class="prompt-actions">
        <button class="prompt-action-btn" onclick="event.stopPropagation(); copyPromptText('${prompt.id}')">
          ${svgIcon('copy')} Copy
        </button>
        <button class="prompt-action-btn primary" onclick="event.stopPropagation(); viewPrompt('${prompt.id}')">
          ${svgIcon('eye')} View
        </button>
        <button class="prompt-action-btn" ${hasVoted(prompt.id) ? 'disabled' : ''} onclick="event.stopPropagation(); handleVote('${prompt.id}')">
          ${hasVoted(prompt.id) ? `${svgIcon('check')} Voted` : `${svgIcon('upvote')} Vote`}
        </button>
      </div>
    </div>
  `).join('');
}

// Setup event listeners
function setupEventListeners() {
  // Search
  const searchInput = document.getElementById('searchInput');
  let searchTimeout;
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentFilters.search = e.target.value;
      applyFilters();
    }, 300);
  });

  // Filter tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');

      const filter = e.target.dataset.filter;
      switch (filter) {
        case 'popular':
          currentFilters.sort = 'popular';
          break;
        case 'newest':
          currentFilters.sort = 'newest';
          break;
        case 'timesaver':
          currentFilters.type = 'Time Saver';
          break;
        default:
          currentFilters.sort = 'newest';
          currentFilters.type = null;
      }
      loadPrompts();
    });
  });

  // Category links
  document.addEventListener('click', (e) => {
    if (e.target.closest('.category-link')) {
      e.preventDefault();
      const link = e.target.closest('.category-link');
      const categoryType = link.dataset.category;
      const categoryValue = link.dataset.value;

      // Toggle filter
      if (currentFilters[categoryType] === categoryValue) {
        currentFilters[categoryType] = null;
        link.classList.remove('active');
      } else {
        // Clear other filters of the same type
        document.querySelectorAll(`[data-category="${categoryType}"]`).forEach(l => l.classList.remove('active'));
        currentFilters[categoryType] = categoryValue;
        link.classList.add('active');
      }

      applyFilters();
    }
  });

  // Sort dropdown
  document.getElementById('sortDropdown').addEventListener('change', (e) => {
    currentFilters.sort = e.target.value;
    loadPrompts();
  });

  // Form submission
  document.getElementById('promptForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await savePrompt();
  });
}

// View prompt
async function viewPrompt(promptId) {
  const prompt = prompts.find(p => p.id === promptId);
  if (!prompt) return;

  currentViewedPromptId = promptId;
  document.getElementById('modalPromptTitle').textContent = prompt.title || '';
  document.getElementById('modalPromptText').textContent = prompt.content || '';
  document.getElementById('modalCreatedBy').textContent = prompt.createdBy || 'Anonymous';
  document.getElementById('modalVotes').textContent = prompt.votes || 0;
  const modalUsageEl = document.getElementById('modalUsageCount');
  if (modalUsageEl) modalUsageEl.textContent = prompt.usageCount || 0;

  // Context section
  const contextSection = document.getElementById('contextSection');
  const contextEl = document.getElementById('modalPromptContext');
  if (prompt.context && prompt.context.trim() !== '') {
    contextEl.textContent = prompt.context;
    contextSection.style.display = 'block';
  } else {
    contextEl.textContent = '';
    contextSection.style.display = 'none';
  }

  // Categories
  document.getElementById('modalCategories').innerHTML = `
    <span class="category-badge">${prompt.subject || ''}</span>
    <span class="category-badge">${prompt.phase || ''}</span>
    <span class="category-badge">${prompt.type || ''}</span>
    ${(Array.isArray(prompt.audience) ? prompt.audience : []).map(a=>`<span class=\"category-badge ${a==='Teacher'?'audience-teacher':'audience-students'}\">${a}</span>`).join('')}
  `;

  showModal('viewPromptModal');

  // Vote button in modal
  const btn = document.getElementById('modalVoteButton');
  if (btn) {
    const voted = hasVoted(promptId);
    btn.disabled = voted;
    renderVoteButton(btn, voted);
    btn.onclick = async (e) => {
      e.preventDefault();
      await handleVote(promptId);
      // Update modal button and count
      const p = prompts.find(x => x.id === promptId);
      if (p) {
        document.getElementById('modalVotes').textContent = p.votes || 0;
      }
      btn.disabled = true;
      renderVoteButton(btn, true);
    };
  }
}

// Voting
async function handleVote(promptId) {
  try {
    if (hasVoted(promptId)) return;
    await updateDoc(doc(db, 'prompts', promptId), {
      votes: increment(1)
    });

    // Update local state and UI
    const p = prompts.find(x => x.id === promptId);
    if (p) p.votes = (p.votes || 0) + 1;
  recordVote(promptId);
  applyFilters();
  showToast('Thanks for voting!', 'success');

  // If modal open for this prompt, update its count/button
  if (currentViewedPromptId === promptId) {
    const btn = document.getElementById('modalVoteButton');
    if (btn) {
      btn.disabled = true;
      renderVoteButton(btn, true);
    }
    const p2 = prompts.find(x => x.id === promptId);
    if (p2) {
      const mv = document.getElementById('modalVotes');
      if (mv) mv.textContent = p2.votes || 0;
    }
  }
  } catch (err) {
    console.error('Error voting:', err);
    showToast('Failed to record vote. Please try again.', 'error');
  }
}

// Copy prompt
async function copyPrompt() {
  const text = document.getElementById('modalPromptText').textContent;
  try {
    await navigator.clipboard.writeText(text);
    showToast('Prompt copied to clipboard!', 'success');
    // Increment usage count for currently viewed prompt
    if (currentViewedPromptId) {
      try {
        await updateDoc(doc(db, 'prompts', currentViewedPromptId), { usageCount: increment(1) });
        const p = prompts.find(x => x.id === currentViewedPromptId);
        if (p) p.usageCount = (p.usageCount || 0) + 1;
        const modalUsageEl = document.getElementById('modalUsageCount');
        if (modalUsageEl && p) modalUsageEl.textContent = p.usageCount || 0;
        applyFilters();
      } catch (e) {
        console.error('Failed to increment usage from modal:', e);
      }
      // Increment global promptCopies total
      try {
        const ref = doc(db, 'analytics', 'pageClicks');
        await updateDoc(ref, { promptCopies: increment(1) });
      } catch (e1) {
        try {
          await setDoc(doc(db, 'analytics', 'pageClicks'), { promptCopies: increment(1) }, { merge: true });
        } catch (e2) {
          console.warn('Failed to increment global promptCopies', e2);
        }
      }
    }
  } catch (error) {
    console.error('Failed to copy:', error);
    showToast('Failed to copy prompt.', 'error');
  }
}

// Copy prompt text directly
async function copyPromptText(promptId) {
  const prompt = prompts.find(p => p.id === promptId);
  if (prompt) {
    try {
      await navigator.clipboard.writeText(prompt.content || '');
      showToast('Prompt copied to clipboard!', 'success');

      // Track copy (increment usage count)
      await updateDoc(doc(db, 'prompts', promptId), {
        usageCount: increment(1)
      });
      // Increment global promptCopies total
      try {
        const ref = doc(db, 'analytics', 'pageClicks');
        await updateDoc(ref, { promptCopies: increment(1) });
      } catch (e1) {
        try {
          await setDoc(doc(db, 'analytics', 'pageClicks'), { promptCopies: increment(1) }, { merge: true });
        } catch (e2) {
          console.warn('Failed to increment global promptCopies', e2);
        }
      }
      const p = prompts.find(x => x.id === promptId);
      if (p) p.usageCount = (p.usageCount || 0) + 1;
      applyFilters();
    } catch (error) {
      console.error('Failed to copy:', error);
      showToast('Failed to copy prompt.', 'error');
    }
  }
}

// Save prompt to Firebase
async function savePrompt() {
  const formData = {
    title: document.getElementById('promptTitle').value.trim(),
    description: document.getElementById('promptDescription').value.trim(),
    content: document.getElementById('promptContent').value.trim(),
    context: document.getElementById('promptContext').value.trim(),
    subject: document.getElementById('promptSubject').value,
    phase: document.getElementById('promptPhase').value,
    type: document.getElementById('promptType').value,
    audience: [
      ...(document.getElementById('audTeacher')?.checked ? ['Teacher'] : []),
      ...(document.getElementById('audStudents')?.checked ? ['Students'] : [])
    ],
    createdBy: document.getElementById('promptCreatedBy').value.trim() || 'Anonymous',
    votes: 0,
    usageCount: 0,
    createdAt: new Date()
  };

  try {
    await addDoc(collection(db, 'prompts'), formData);

    closeModal('addPromptModal');
    document.getElementById('promptForm').reset();
    showToast('Prompt added successfully!', 'success');
    await loadPrompts();

  } catch (error) {
    console.error('Error saving prompt:', error);
    showToast('Error saving prompt. Please try again.', 'error');
  }
}

// Modal functions
function showModal(modalId) {
  document.getElementById(modalId).classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
  document.body.style.overflow = '';
  if (modalId === 'addPromptModal') {
    document.getElementById('promptForm').reset();
  }
}

function showAddPromptModal() {
  showModal('addPromptModal');
}

// Update result count
function updateResultCount() {
  document.getElementById('resultCount').textContent = filteredPrompts.length;
}

// Utility functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    padding: 1rem 1.5rem;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    margin-bottom: 10px;
    animation: slideIn 0.3s ease-out;
    background-color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
  `;
  toast.textContent = message;

  const container = document.getElementById('toastContainer');
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-in forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Close modal on backdrop click
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal.id);
    }
  });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Make functions globally accessible for inline onclicks
window.viewPrompt = viewPrompt;
window.copyPrompt = copyPrompt;
window.copyPromptText = copyPromptText;
window.showAddPromptModal = showAddPromptModal;
window.closeModal = closeModal;
window.toggleSection = toggleSection;
window.toggleAllSections = toggleAllSections;
window.handleVote = handleVote;

// Helpers
function renderVoteButton(btn, voted) {
  btn.innerHTML = voted ? `${svgIcon('check')} Voted` : `${svgIcon('upvote')} Vote`;
}

// Collapsible sections functionality
function toggleSection(sectionName) {
  const section = document.querySelector(`[data-section="${sectionName}"]`);
  if (section) {
    section.classList.toggle('collapsed');

    // Update icon rotation
    const icon = section.querySelector('.collapse-icon');
    if (section.classList.contains('collapsed')) {
      icon.style.transform = 'rotate(-90deg)';
    } else {
      icon.style.transform = 'rotate(0deg)';
    }

    // Save state to localStorage
    const collapsedSections = JSON.parse(localStorage.getItem('collapsedSections') || '[]');
    if (section.classList.contains('collapsed')) {
      if (!collapsedSections.includes(sectionName)) {
        collapsedSections.push(sectionName);
      }
    } else {
      const index = collapsedSections.indexOf(sectionName);
      if (index > -1) {
        collapsedSections.splice(index, 1);
      }
    }
    localStorage.setItem('collapsedSections', JSON.stringify(collapsedSections));
  }
}

function toggleAllSections() {
  const sections = document.querySelectorAll('.sidebar-section');
  const allCollapsed = Array.from(sections).every(section => section.classList.contains('collapsed'));
  const button = document.querySelector('.collapse-all-btn');
  const buttonIcon = button.querySelector('i');
  const buttonText = button.querySelector('span');

  sections.forEach(section => {
    const icon = section.querySelector('.collapse-icon');

    if (allCollapsed) {
      // Expand all
      section.classList.remove('collapsed');
      icon.style.transform = 'rotate(0deg)';
    } else {
      // Collapse all
      section.classList.add('collapsed');
      icon.style.transform = 'rotate(-90deg)';
    }
  });

  // Update button text and icon
  if (allCollapsed) {
    buttonIcon.className = 'fas fa-compress-alt';
    buttonText.textContent = 'Collapse All';
  } else {
    buttonIcon.className = 'fas fa-expand-alt';
    buttonText.textContent = 'Expand All';
  }

  // Update localStorage
  const collapsedSections = allCollapsed ? [] : ['subjects', 'phases', 'types'];
  localStorage.setItem('collapsedSections', JSON.stringify(collapsedSections));
}

// Restore collapsed state on page load
function restoreCollapsedState() {
  let collapsedSections = JSON.parse(localStorage.getItem('collapsedSections') || '[]');
  // Default to all collapsed on first load
  if (!Array.isArray(collapsedSections) || collapsedSections.length === 0) {
    collapsedSections = ['subjects', 'phases', 'types'];
    localStorage.setItem('collapsedSections', JSON.stringify(collapsedSections));
  }

  collapsedSections.forEach(sectionName => {
    const section = document.querySelector(`[data-section=\"${sectionName}\"]`);
    if (section) {
      section.classList.add('collapsed');
      const icon = section.querySelector('.collapse-icon');
      if (icon) icon.style.transform = 'rotate(-90deg)';
    }
  });

  // Update the collapse-all button to reflect current state (all collapsed)
  const sections = document.querySelectorAll('.sidebar-section');
  const allCollapsed = Array.from(sections).every(s => s.classList.contains('collapsed'));
  const button = document.querySelector('.collapse-all-btn');
  if (button) {
    const buttonIcon = button.querySelector('i');
    const buttonText = button.querySelector('span');
    if (allCollapsed) {
      if (buttonIcon) buttonIcon.className = 'fas fa-expand-alt';
      if (buttonText) buttonText.textContent = 'Expand All';
    } else {
      if (buttonIcon) buttonIcon.className = 'fas fa-compress-alt';
      if (buttonText) buttonText.textContent = 'Collapse All';
    }
  }
}
