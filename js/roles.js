import { initializeApp, deleteApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import { getAuth as getSecondaryAuth, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import { httpsCallable } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js';
import { firebaseConfig, isBootstrapAdminEmail } from './firebase-config.js';
import { getFirebaseDb, getFirebaseAuth, getFirebaseFunctions } from './firebase.js';
import { DEFAULT_SETTINGS } from './storage.js';

/** @typedef {'admin' | 'driver'} UserRole */

/**
 * @param {import('https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js').User} user
 * @returns {Promise<UserRole>}
 */
export async function ensureUserProfile(user) {
  const ref = doc(getFirebaseDb(), 'users', user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    if (data.disabled) {
      throw new Error('Този акаунт е деактивиран. Свържете се с администратора.');
    }
    if (data.role === 'admin' || data.role === 'driver') {
      return data.role;
    }
    throw new Error('Невалиден профил. Свържете се с администратора.');
  }

  if (isBootstrapAdminEmail(user.email)) {
    await setDoc(ref, {
      role: 'admin',
      email: user.email,
      settings: DEFAULT_SETTINGS,
      createdAt: new Date().toISOString()
    });
    return 'admin';
  }

  throw new Error('Акаунтът не е създаден от администратор. Свържете се с Rozhen 1.');
}

/**
 * @param {{ email: string, password: string, displayName?: string }} input
 * @returns {Promise<string>} new driver uid
 */
export async function createDriverAccount(input) {
  const adminUid = getFirebaseAuth().currentUser?.uid;
  if (!adminUid) throw new Error('Not signed in');

  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const displayName = (input.displayName || '').trim();

  if (!email || password.length < 6) {
    throw new Error('Email и парола (мин. 6 символа) са задължителни.');
  }

  const secondaryApp = initializeApp(firebaseConfig, `driver-create-${Date.now()}`);
  const secondaryAuth = getSecondaryAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await setDoc(doc(getFirebaseDb(), 'users', cred.user.uid), {
      role: 'driver',
      email,
      displayName,
      settings: DEFAULT_SETTINGS,
      disabled: false,
      createdAt: new Date().toISOString(),
      createdBy: adminUid
    });
    await signOut(secondaryAuth);
    return cred.user.uid;
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('Този email вече се използва.');
    }
    throw err;
  } finally {
    await deleteApp(secondaryApp);
  }
}

/** @returns {Promise<Array<{ uid: string, email: string, displayName: string, disabled: boolean, createdAt: string }>>} */
export async function listDriverAccounts() {
  const q = query(collection(getFirebaseDb(), 'users'), where('role', '==', 'driver'));
  const snap = await getDocs(q);

  return snap.docs
    .map(d => ({ uid: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

/**
 * @param {string} uid
 * @param {string} newPassword
 */
export async function resetDriverPassword(uid, newPassword) {
  if (newPassword.length < 6) {
    throw new Error('Паролата трябва да е поне 6 символа.');
  }

  const resetFn = httpsCallable(getFirebaseFunctions(), 'adminResetPassword');
  await resetFn({ uid, newPassword });
}

/**
 * @param {string} uid
 * @param {boolean} disabled
 */
export async function setDriverDisabled(uid, disabled) {
  await updateDoc(doc(getFirebaseDb(), 'users', uid), {
    disabled,
    updatedAt: new Date().toISOString()
  });
}
