// Ideas page: load ideas from Firestore, render cards, and show details modal
import { collection, getDocs, query, orderBy, addDoc, updateDoc, increment, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { db, hasVotedIdea, recordIdeaVote } from './firebase.js';
import { categories } from './categories.js';

let ideas = [];

// Inline SVG icon helper for consistent, crisp icons
function svgIcon(name, size = 18, stroke = 1.8) {
  const base = `width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"`;
  switch (name) {
    case 'copy':
      return `<svg ${base}><rect x=\"9\" y=\"9\" width=\"10\" height=\"10\" rx=\"2\"/><rect x=\"5\" y=\"5\" width=\"10\" height=\"10\" rx=\"2\"/></svg>`;
    case 'eye':
      return `<svg ${base}><path d=\"M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>`;
    case 'upvote':
      return `<i class=\"fas fa-thumbs-up\" aria-hidden=\"true\"></i>`;
    case 'check':
      return `<svg ${base}><path d=\"M5 13l4 4L19 7\"/></svg>`;
    default:
      return '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadIdeas();

  // Close modal on backdrop click
  const modal = document.getElementById('viewIdeaModal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal('viewIdeaModal');
    });
  }

  // Add Idea modal backdrop close
  const addModal = document.getElementById('addIdeaModal');
  if (addModal) {
    addModal.addEventListener('click', (e) => {
      if (e.target === addModal) closeModal('addIdeaModal');
    });
  }

  // Form submit
  const form = document.getElementById('ideaForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      await saveIdea();
    });
  }

  // Toggle linked prompt fields
  const toggle = document.getElementById('addLinkedPromptToggle');
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      const box = document.getElementById('linkedPromptFields');
      if (box) box.style.display = e.target.checked ? 'block' : 'none';
      if (e.target.checked) {
        ensureAtLeastOneLinkedPromptEntry();
      }
    });
  }
});

async function loadIdeas() {
  const grid = document.getElementById('ideasGrid');
  if (!grid) return;

  try {
    const ideasRef = collection(db, 'ideas');
    let snap;
    try {
      const q = query(ideasRef, orderBy('createdAt', 'desc'));
      snap = await getDocs(q);
    } catch (err) {
      // Fallback if no index/field yet
      snap = await getDocs(ideasRef);
    }

    ideas = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderIdeas();
  } catch (error) {
    console.error('Error loading ideas:', error);
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #f87171; padding: 40px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 16px;"></i>
        <p>Failed to load ideas. Please refresh the page.</p>
      </div>
    `;
  }
}

function renderIdeas() {
  const grid = document.getElementById('ideasGrid');
  if (!grid) return;

  if (!ideas || ideas.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 40px;">
        <i class="fas fa-lightbulb" style="font-size: 2rem; margin-bottom: 12px; color:#fbbf24;"></i>
        <div>No ideas yet. Add some in Firestore to get started.</div>
      </div>
    `;
    return;
  }

  grid.innerHTML = ideas.map(idea => {
    const title = escapeHtml(idea.title || 'Untitled Idea');
    const summary = escapeHtml(
      idea.summary || idea.description || ''
    );
    const readTime = idea.readTime ? `${idea.readTime} min read` : '';
    const subject = idea.subject || idea.category || '';

    const votes = Number(idea.votes || 0);
    const voted = hasVotedIdea(idea.id);

    return `
      <div class="idea-card" onclick="viewIdea('${idea.id}')">
        <h3>${title}</h3>
        <p>${summary}</p>
        <div class="idea-meta">
          ${readTime ? `<span><i class=\"fas fa-clock\"></i> ${readTime}</span>` : ''}
          ${subject ? `<span><i class=\"fas fa-book\"></i> ${escapeHtml(subject)}</span>` : ''}
          <span><i class=\"fas fa-thumbs-up\"></i> ${votes}</span>
        </div>
        <div class="idea-actions">
          <a href="#" class="btn btn-secondary" onclick="event.preventDefault(); event.stopPropagation(); viewIdea('${idea.id}')">${svgIcon('eye')} Read</a>
          <button class="btn btn-secondary" ${voted ? 'disabled' : ''} onclick="event.stopPropagation(); handleVoteIdea('${idea.id}')">${voted ? `${svgIcon('check')} Voted` : `${svgIcon('upvote')} Vote`}</button>
        </div>
      </div>
    `;
  }).join('');
}

function viewIdea(id) {
  const idea = ideas.find(i => i.id === id);
  if (!idea) return;

  // Title
  const titleEl = document.getElementById('modalIdeaTitle');
  if (titleEl) titleEl.textContent = idea.title || 'Untitled Idea';

  // Meta
  const metaEl = document.getElementById('modalIdeaMeta');
  if (metaEl) {
    const readTime = idea.readTime ? `${idea.readTime} min read` : null;
    const subject = idea.subject || idea.category || null;
    const audience = Array.isArray(idea.audience) ? idea.audience.join(', ') : (idea.audience || null);
    metaEl.innerHTML = [
      readTime ? `<span><i class=\"fas fa-clock\"></i> ${escapeHtml(readTime)}</span>` : '',
      subject ? `<span><i class=\"fas fa-book\"></i> ${escapeHtml(subject)}</span>` : '',
      audience ? `<span><i class=\"fas fa-users\"></i> ${escapeHtml(audience)}</span>` : ''
    ].filter(Boolean).join('\n');
  }

  // Body content
  const bodyEl = document.getElementById('modalIdeaBody');
  if (bodyEl) {
    const parts = [];

    const desc = idea.description || idea.guide || (idea.content && idea.content.description);
    if (desc) {
      parts.push(
        `<div class="idea-section-title">Overview</div>` +
        `<div class="idea-full-text">${escapeHtml(desc)}</div>`
      );
    }

    const steps = idea.steps || (idea.content && idea.content.steps) || null;
    if (Array.isArray(steps) && steps.length) {
      parts.push('<div class="idea-section-title">How To Do It</div>');
      parts.push('<ol class="idea-list">' + steps.map(s => `<li>${escapeHtml(s)}</li>`).join('') + '</ol>');
    }

    const hasLinked = Array.isArray(idea.linkedPromptIds) && idea.linkedPromptIds.length > 0;
    const examples = !hasLinked ? (idea.examplePrompts || idea.examples || (idea.content && idea.content.examples) || null) : null;
    if (Array.isArray(examples) && examples.length) {
      parts.push('<div class="idea-section-title">Example Prompts</div>');
      parts.push(examples.map(ex => `<div class="idea-full-text">${escapeHtml(ex)}</div>`).join(''));
    }

    const tips = idea.tips || (idea.content && idea.content.tips) || null;
    if (Array.isArray(tips) && tips.length) {
      parts.push('<div class="idea-section-title">Tips</div>');
      parts.push('<ul class="idea-list">' + tips.map(t => `<li>${escapeHtml(t)}</li>`).join('') + '</ul>');
    }

    const resources = idea.resources || (idea.content && idea.content.resources) || null;
    if (Array.isArray(resources) && resources.length) {
      parts.push('<div class="idea-section-title">Resources</div>');
      parts.push('<ul class="idea-list">' + resources.map(r => {
        if (typeof r === 'string') return `<li>${escapeHtml(r)}</li>`;
        const label = escapeHtml(r.label || r.title || r.url || 'Link');
        const url = r.url ? String(r.url) : null;
        return url ? `<li><a href="${url}" target="_blank" class="resource-link">${label} <i class=\"fas fa-external-link-alt\"></i></a></li>` : `<li>${label}</li>`;
      }).join('') + '</ul>');
    }

    // Fallback: if no sections rendered, at least show summary
    if (!parts.length) {
      const summary = idea.summary || 'No details available yet.';
      parts.push(`<div class="idea-full-text">${escapeHtml(summary)}</div>`);
    }

    bodyEl.innerHTML = parts.join('\n');
  }

  // Votes in modal
  const votesCount = Number(idea.votes || 0);
  const votesEl = document.getElementById('modalIdeaVotes');
  if (votesEl) votesEl.textContent = `${votesCount} votes`;
  const voteBtn = document.getElementById('modalIdeaVoteButton');
  if (voteBtn) {
    const voted = hasVotedIdea(id);
    voteBtn.disabled = voted;
    renderIdeaVoteButton(voteBtn, voted);
    voteBtn.onclick = (e) => {
      e.preventDefault();
      handleVoteIdea(id);
    };
  }

  showModal('viewIdeaModal');

  // Track read: increment per-idea reads and global total
  (async () => {
    try {
      await updateDoc(doc(db, 'ideas', id), { reads: increment(1) });
    } catch (e) {
      // If document missing (shouldn't be), ignore
      console.warn('Failed to increment idea reads on doc', e);
    }
    try {
      const ref = doc(db, 'analytics', 'pageClicks');
      await updateDoc(ref, { ideaReads: increment(1) });
    } catch (e1) {
      try {
        await setDoc(doc(db, 'analytics', 'pageClicks'), { ideaReads: increment(1) }, { merge: true });
      } catch (e2) {
        console.warn('Failed to increment global ideaReads', e2);
      }
    }
  })();

  // Load and render linked prompts lazily
  if (Array.isArray(idea.linkedPromptIds) && idea.linkedPromptIds.length) {
    renderLinkedPrompts(idea.linkedPromptIds);
  }
}

function showModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

// expose for inline handlers
window.viewIdea = viewIdea;
window.closeModal = closeModal;
window.showAddIdeaModal = () => showModal('addIdeaModal');
window.handleVoteIdea = handleVoteIdea;
window.copyLinkedPrompt = copyLinkedPrompt;
window.addLinkedPromptEntry = addLinkedPromptEntry;
window.removeLinkedPromptEntry = removeLinkedPromptEntry;

// Save Idea
async function saveIdea() {
  const data = {
    title: byId('ideaTitle').value.trim(),
    summary: byId('ideaSummary').value.trim(),
    description: byId('ideaDescription').value.trim(),
    readTime: parseInt(byId('ideaReadTime').value, 10) || null,
    steps: toLines(byId('ideaSteps').value),
    examplePrompts: toLines(byId('ideaExamples').value),
    tips: toLines(byId('ideaTips').value),
    votes: 0,
    createdAt: new Date()
  };

  if (!data.title || !data.summary) return;

  // Optionally add a Prompt Library entry and link it
  const addPrompt = byId('addLinkedPromptToggle')?.checked;
  const linkedPromptIds = [];
  if (addPrompt) {
    const entries = collectLinkedPromptEntries();
    if (entries.length) {
      // save all prompts in parallel
      const results = await Promise.all(entries.map(p => addDoc(collection(db, 'prompts'), p)));
      for (const r of results) linkedPromptIds.push(r.id);
    }
  }

  if (linkedPromptIds.length) data.linkedPromptIds = linkedPromptIds;

  await addDoc(collection(db, 'ideas'), data);
  closeModal('addIdeaModal');
  byId('ideaForm').reset();
  await loadIdeas();
}

// Vote Idea
async function handleVoteIdea(id) {
  if (hasVotedIdea(id)) return;
  try {
    await updateDoc(doc(db, 'ideas', id), { votes: increment(1) });
    // Update local state
    const it = ideas.find(x => x.id === id);
    if (it) it.votes = (it.votes || 0) + 1;
    recordIdeaVote(id);
    renderIdeas();
    // Update modal if open for this idea
    const modal = document.getElementById('viewIdeaModal');
  if (modal && modal.classList.contains('active')) {
    const votesEl = document.getElementById('modalIdeaVotes');
    if (votesEl && it) votesEl.textContent = `${it.votes} votes`;
    const btn = document.getElementById('modalIdeaVoteButton');
    if (btn) { btn.disabled = true; renderIdeaVoteButton(btn, true); }
  }
  } catch (e) {
    console.error('Vote failed', e);
  }
}

// helpers
function byId(id) { return document.getElementById(id); }
function toLines(text) {
  return (text || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

async function renderLinkedPrompts(ids) {
  const bodyEl = document.getElementById('modalIdeaBody');
  if (!bodyEl) return;
  try {
    const prompts = [];
    for (const pid of ids) {
      const snap = await getDoc(doc(db, 'prompts', pid));
      if (snap.exists()) {
        prompts.push({ id: pid, ...snap.data() });
      }
    }
    if (prompts.length) {
      const section = document.createElement('div');
      section.innerHTML = `
        <div class="idea-section-title">Linked ${prompts.length > 1 ? 'Prompts' : 'Prompt'}</div>
        ${prompts.map(p => `
          <div style="position: relative; margin-bottom: 16px;">
            <div style="font-weight:600; color:#e5e7eb; margin-bottom: 6px;">${escapeHtml(p.title || '')}</div>
            <div class="idea-full-text" id="linkedPromptText-${p.id}">${escapeHtml(p.content || '')}</div>
            <button class="copy-button" onclick="event.stopPropagation(); copyLinkedPrompt('${p.id}')">${svgIcon('copy', 16)} Copy</button>
            <div style="margin-top:6px;">
              <a href="../resources/prompt-library.html?id=${p.id}" target="_blank" class="resource-link">View in Prompt Library <i class=\"fas fa-external-link-alt\"></i></a>
            </div>
          </div>
        `).join('')}
      `;
      bodyEl.appendChild(section);
    }
  } catch (e) {
    console.error('Failed to load linked prompts', e);
  }
}

async function copyLinkedPrompt(promptId) {
  try {
    const el = document.getElementById(`linkedPromptText-${promptId}`);
    if (!el) return;
    const text = el.textContent || '';
    await navigator.clipboard.writeText(text);
    // increment usageCount on prompt
    await updateDoc(doc(db, 'prompts', promptId), { usageCount: increment(1) });
    // increment global promptCopies
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
    // visual feedback
    const btn = event?.currentTarget;
    if (btn) {
      btn.classList.add('copied');
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.classList.remove('copied');
        btn.innerHTML = `${svgIcon('copy', 16)} Copy`;
      }, 1200);
    }
  } catch (e) {
    console.error('Copy failed', e);
  }
}

// Linked prompt UI helpers
function ensureAtLeastOneLinkedPromptEntry() {
  const list = byId('linkedPromptList');
  if (!list) return;
  if (list.children.length === 0) addLinkedPromptEntry();
}

function addLinkedPromptEntry() {
  const list = byId('linkedPromptList');
  if (!list) return;
  const idx = list.children.length + 1;
  const wrapper = document.createElement('div');
  wrapper.className = 'lp-entry';
  wrapper.innerHTML = `
    <div class="lp-entry-header">
      <div class="lp-entry-title">Prompt ${idx}</div>
      <button type="button" class="lp-remove-btn" onclick="removeLinkedPromptEntry(this)">Remove</button>
    </div>
    <div class="form-group">
      <label class="form-label">Prompt Title*</label>
      <input type="text" class="form-input lp-title" placeholder="e.g., 5-minute lesson starter">
    </div>
    <div class="form-group">
      <label class="form-label">Prompt Description*</label>
      <textarea class="form-textarea lp-description" placeholder="Short description shown in the library"></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Prompt Content*</label>
      <textarea class="form-textarea lp-content" style="min-height: 160px;" placeholder="The exact prompt text..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Context (optional)</label>
      <textarea class="form-textarea lp-context" placeholder="Any context or notes..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Subject*</label>
      <select class="form-select lp-subject">
        ${['', ...categories.subjects].map((s, i) => i === 0
          ? '<option value="">Select subject</option>'
          : `<option value="${s}" ${s === 'General' ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Phase*</label>
      <select class="form-select lp-phase">
        ${['', ...categories.phases].map((p, i) => i === 0
          ? '<option value="">Select phase</option>'
          : `<option value="${p}" ${p === 'All Ages' ? 'selected' : ''}>${p}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Type*</label>
      <select class="form-select lp-type">
        ${['', ...categories.types].map((t, i) => i === 0
          ? '<option value="">Select type</option>'
          : `<option value="${t}" ${t === 'Teaching Resource' ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Audience</label>
      <div class="checkbox-group">
        <label class="checkbox-label">
          <input type="checkbox" class="lp-aud-teacher" value="Teacher" checked> Teacher
        </label>
        <label class="checkbox-label">
          <input type="checkbox" class="lp-aud-students" value="Students"> Students
        </label>
      </div>
    </div>
  `;
  list.appendChild(wrapper);
}

function removeLinkedPromptEntry(btn) {
  const wrapper = btn.closest('.lp-entry');
  if (wrapper && wrapper.parentElement) {
    wrapper.parentElement.removeChild(wrapper);
  }
}

function collectLinkedPromptEntries() {
  const list = byId('linkedPromptList');
  if (!list) return [];
  const items = Array.from(list.querySelectorAll('.lp-entry'));
  const now = new Date();
  return items.map(item => {
    const title = item.querySelector('.lp-title')?.value.trim() || '';
    const description = item.querySelector('.lp-description')?.value.trim() || '';
    const content = item.querySelector('.lp-content')?.value.trim() || '';
    const context = item.querySelector('.lp-context')?.value.trim() || '';
    const subject = item.querySelector('.lp-subject')?.value || 'General';
    const phase = item.querySelector('.lp-phase')?.value || 'All Ages';
    const type = item.querySelector('.lp-type')?.value || 'Teaching Resource';
    const audTeacher = item.querySelector('.lp-aud-teacher')?.checked;
    const audStudents = item.querySelector('.lp-aud-students')?.checked;
    const audience = [
      ...(audTeacher ? ['Teacher'] : []),
      ...(audStudents ? ['Students'] : [])
    ];
    return { title, description, content, context, subject, phase, type, audience };
  })
  .filter(p => p.title && p.description && p.content)
  .map(p => ({
    title: p.title,
    description: p.description,
    content: p.content,
    context: p.context,
    subject: p.subject || 'General',
    phase: p.phase || 'All Ages',
    type: p.type || 'Teaching Resource',
    audience: (Array.isArray(p.audience) && p.audience.length ? p.audience : ['Teacher']),
    createdBy: 'Anonymous',
    votes: 0,
    usageCount: 0,
    createdAt: now
  }));
}
// no resources collected from UI; existing ideas with resources still render

function renderIdeaVoteButton(btn, voted) {
  btn.innerHTML = voted ? `${svgIcon('check')} Voted` : `${svgIcon('upvote')} Vote`;
}
