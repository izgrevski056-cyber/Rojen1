/**
 * Firebase project configuration — Rozhen 1
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyCPMZ9n0IumMyTXfyZXUBbwMFFl6CL8OUI',
  authDomain: 'rozhen1.firebaseapp.com',
  databaseURL: 'https://rozhen1-default-rtdb.firebaseio.com',
  projectId: 'rozhen1',
  storageBucket: 'rozhen1.firebasestorage.app',
  messagingSenderId: '752081332317',
  appId: '1:752081332317:web:e4353fedb17cd3493d05b4',
  measurementId: 'G-DBE1ZHNYDD'
};

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId &&
    firebaseConfig.databaseURL
  );
}

export default { firebaseConfig, isFirebaseConfigured };
