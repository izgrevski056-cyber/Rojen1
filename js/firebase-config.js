/**
 * Firebase project configuration — Rozhen 1
 * All exports below are required by firebase.js and roles.js
 */

export const firebaseConfig = {
  apiKey: 'AIzaSyCPMZ9n0IumMyTXfyZXUBbwMFFl6CL8OUI',
  authDomain: 'rozhen1.firebaseapp.com',
  projectId: 'rozhen1',
  storageBucket: 'rozhen1.firebasestorage.app',
  messagingSenderId: '752081332317',
  appId: '1:752081332317:web:e4353fedb17cd3493d05b4',
  measurementId: 'G-DBE1ZHNYDD'
};

/** Admin login emails — must match firestore.rules bootstrap email */
export const ADMIN_EMAILS = [
  'martin@rozhen1.bg'
];

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

export function isBootstrapAdminEmail(email) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(e => e.trim().toLowerCase() === normalized);
}

/** Convenience default export for tooling / future imports */
export default {
  firebaseConfig,
  ADMIN_EMAILS,
  isFirebaseConfigured,
  isBootstrapAdminEmail
};
