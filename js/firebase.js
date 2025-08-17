// Firebase configuration and initialization
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyBVHcM-71Cng73326ZrrIsikg1A7ItimdQ",
  authDomain: "prompt-library-eaaa0.firebaseapp.com",
  projectId: "prompt-library-eaaa0",
  storageBucket: "prompt-library-eaaa0.firebasestorage.app",
  messagingSenderId: "148469463641",
  appId: "1:148469463641:web:81df970407c6c3885d8f48",
  measurementId: "G-JJMWW5JPV8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Voting functions
export const hasVoted = (promptId) => {
  const voted = JSON.parse(localStorage.getItem('votedPrompts') || '[]');
  return voted.includes(promptId);
};

export const recordVote = (promptId) => {
  const voted = JSON.parse(localStorage.getItem('votedPrompts') || '[]');
  voted.push(promptId);
  localStorage.setItem('votedPrompts', JSON.stringify(voted));
};