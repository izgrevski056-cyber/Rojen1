/**
 * Copy to firebase-config.js and fill in your Firebase project values.
 * Firebase Console → Project settings → Your apps → Web app
 */
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID',
  appId: 'YOUR_APP_ID'
};

/** Admin login email(s) — must match firestore.rules bootstrap email */
export const ADMIN_EMAILS = [
  'admin@rozhen1.bg'
];

export function isFirebaseConfigured() {
  return !firebaseConfig.apiKey.includes('YOUR_');
}

export function isBootstrapAdminEmail(email) {
  if (!email) return false;
  return ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email.toLowerCase());
}
