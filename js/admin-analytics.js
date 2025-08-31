// Admin Analytics dashboard logic
// No login: loads analytics immediately when page is opened.

import { db } from './firebase.js';
import {
  getDoc,
  doc,
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

function $(id) { return document.getElementById(id); }

function setHidden(id, hidden) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle('hidden', hidden);
}

function renderStat(id, value) {
  const el = $(id);
  if (el) el.textContent = String(value ?? 0);
}

function renderTableRows(tableId, items, valueKeyPrimary, valueKeySecondary) {
  const tbody = document.querySelector(`#${tableId} tbody`);
  if (!tbody) return;
  tbody.innerHTML = items.map((item, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${escapeHtml(item.title || '(untitled)')}</td>
      <td>${item[valueKeyPrimary] ?? 0}</td>
      <td>${item[valueKeySecondary] ?? 0}</td>
    </tr>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text ?? '';
  return div.innerHTML;
}

async function loadPageClicks() {
  const snap = await getDoc(doc(db, 'analytics', 'pageClicks'));
  const data = snap.exists() ? snap.data() : {};
  renderStat('statPromptLibrary', data.promptLibrary || 0);
  renderStat('statIdeas', data.ideas || 0);
  renderStat('statAiTools', data.aiTools || 0);
}

async function loadMostVoted() {
  const q = query(collection(db, 'prompts'), orderBy('votes', 'desc'), limit(10));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderTableRows('tableMostVoted', items, 'votes', 'usageCount');
}

async function loadMostCopied() {
  const q = query(collection(db, 'prompts'), orderBy('usageCount', 'desc'), limit(10));
  const snap = await getDocs(q);
  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderTableRows('tableMostCopied', items, 'usageCount', 'votes');
}

async function loadAll() {
  await Promise.all([
    loadPageClicks(),
    loadMostVoted(),
    loadMostCopied()
  ]);
}

function bindRefresh() {
  $('refreshBtn')?.addEventListener('click', () => loadAll());
}

// Entry
document.addEventListener('DOMContentLoaded', () => {
  bindRefresh();
  loadAll();
});
