/**
 * Copy to firebase-config.js and fill in your Firebase project values.
 */
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

export const ADMIN_EMAILS = [
  'martin@rozhen1.bg'
];

export function isFirebaseConfigured() {
  return !firebaseConfig.apiKey.includes('YOUR_');
}

export function isBootstrapAdminEmail(email) {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some(e => e.trim().toLowerCase() === normalized);
}

export default {
  firebaseConfig,
  ADMIN_EMAILS,
  isFirebaseConfigured,
  isBootstrapAdminEmail
};
