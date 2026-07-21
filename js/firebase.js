import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

/** @type {import('https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js').FirebaseApp | null} */
let app = null;

/** @type {import('https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js').Firestore | null} */
let db = null;

export function initFirebase() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Edit js/firebase-config.js with your project credentials.');
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
  }
  return { app, db };
}

export function getFirebaseDb() {
  if (!db) initFirebase();
  return db;
}
