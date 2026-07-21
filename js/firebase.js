import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import { getFunctions } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js';
import { firebaseConfig, isFirebaseConfigured } from './firebase-config.js';

/** @type {import('https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js').FirebaseApp | null} */
let app = null;

/** @type {import('https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js').Auth | null} */
let auth = null;

/** @type {import('https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js').Firestore | null} */
let db = null;

/** @type {import('https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js').Functions | null} */
let functions = null;

export function initFirebase() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase is not configured. Edit js/firebase-config.js with your project credentials.');
  }
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    functions = getFunctions(app);
  }
  return { app, auth, db, functions };
}

export function getFirebaseAuth() {
  if (!auth) initFirebase();
  return auth;
}

export function getFirebaseDb() {
  if (!db) initFirebase();
  return db;
}

export function getFirebaseFunctions() {
  if (!functions) initFirebase();
  return functions;
}
