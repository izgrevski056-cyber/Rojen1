import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

/** @type {import('https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js').FirebaseApp | null} */
let app = null;

/** @type {import('https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js').Database | null} */
let db = null;

export function initFirebase() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Edit js/firebase-config.js with your project credentials.');
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  }
  return { app, db };
}

export function getFirebaseDb() {
  if (!db) initFirebase();
  return db;
}
