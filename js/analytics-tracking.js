// Track clicks from the main hub to resource pages in Firestore
// Uses atomic increments on a single analytics document.

import { db } from './firebase.js';
import {
  doc,
  setDoc,
  updateDoc,
  increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const NAV_DELAY_MS = 120;
const hostname = window.location.hostname || '';
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
const isDev = isLocalhost || hostname.endsWith('.local') || window.location.protocol === 'file:' || hostname === '';

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
if (isDev) {
  console.info('[analytics-tracking] Disabled in local/dev environment.');
} else {
  document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('a.hub-card[href]');
    cards.forEach((anchor) => {
      anchor.addEventListener('click', () => {
        const key = pageKeyForHref(anchor.getAttribute('href'));
        if (!key) return; // not a tracked link

        try {
          const tracking = incrementPageClick(key);
          if (tracking && typeof tracking.catch === 'function') {
            tracking.catch(() => {});
          }
        } catch (err) {
          console.warn('Click tracking failed before navigation:', err);
        }
      });
    });
  });
}
