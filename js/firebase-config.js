/**
 * Firebase project configuration — Rozhen 1
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
  return true;
}

export function isBootstrapAdminEmail(email) {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return ADMIN_EMAILS.some(e => e.toLowerCase() === normalized);
}
