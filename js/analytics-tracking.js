// Track clicks from the main hub to resource pages in Firestore
// Uses atomic increments on a single analytics document.

import { db } from './firebase.js';
import {
  doc,
  setDoc,
  updateDoc,
  increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Map hrefs to metric keys
const pageKeyForHref = (href) => {
  try {
    const url = new URL(href, window.location.origin);
    const path = url.pathname;
    if (path.includes('prompt-library')) return 'promptLibrary';
    if (path.includes('ideas')) return 'ideas';
    if (path.includes('ai-tools')) return 'aiTools';
  } catch (e) {
    // Fallback simple contains check
    if (href.includes('prompt-library')) return 'promptLibrary';
    if (href.includes('ideas')) return 'ideas';
    if (href.includes('ai-tools')) return 'aiTools';
  }
  return null;
};

// Increment analytics counter, creating doc if missing
async function incrementPageClick(key) {
  const ref = doc(db, 'analytics', 'pageClicks');
  try {
    await updateDoc(ref, { [key]: increment(1) });
  } catch (err) {
    // If doc doesn't exist yet, create it with merge + increment
    try {
      await setDoc(ref, { [key]: increment(1) }, { merge: true });
    } catch (e) {
      // Swallow errors to never block navigation
      console.warn('Page click tracking failed:', e);
    }
  }
}

// Attach click handlers once DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('a.hub-card[href]');
  cards.forEach((anchor) => {
    anchor.addEventListener('click', async (ev) => {
      const key = pageKeyForHref(anchor.getAttribute('href'));
      if (!key) return; // not a tracked link

      const openInNewTab = ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0 || anchor.target === '_blank';
      const href = anchor.href;

      if (openInNewTab) {
        // Fire and forget so we don't block default behavior
        incrementPageClick(key).catch(() => {});
        return; // allow default
      }

      // Prevent immediate navigation to ensure increment request is sent
      ev.preventDefault();
      try {
        await incrementPageClick(key);
      } catch (_) {
        // ignore
      } finally {
        window.location.href = href;
      }
    });
  });
});
