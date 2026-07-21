import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import { getFirebaseDb } from './firebase.js';
import { DEFAULT_SETTINGS } from './storage.js';

export const ADMIN_USERNAME = 'martin';
export const DEFAULT_ADMIN_PASSWORD = 'rozhen1';

/** @typedef {'admin' | 'driver'} UserRole */

/**
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** @param {string} raw */
export function normalizeUsername(raw) {
  return raw.trim().toLowerCase().replace(/\s+/g, '_');
}

/** @param {string} username */
export function isAdminUsername(username) {
  return normalizeUsername(username) === ADMIN_USERNAME;
}

function accountRef(username) {
  return doc(getFirebaseDb(), 'accounts', normalizeUsername(username));
}

/**
 * @returns {Promise<void>}
 */
export async function ensureBootstrapAdmin() {
  const ref = accountRef(ADMIN_USERNAME);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    username: ADMIN_USERNAME,
    displayName: 'Мартин',
    passwordHash: await hashPassword(DEFAULT_ADMIN_PASSWORD),
    role: 'admin',
    settings: DEFAULT_SETTINGS,
    disabled: false,
    createdAt: new Date().toISOString()
  });
}

/**
 * @returns {Promise<Array<{ username: string, displayName: string, role: UserRole, disabled: boolean }>>}
 */
export async function listLoginUsers() {
  await ensureBootstrapAdmin();
  const snap = await getDocs(collection(getFirebaseDb(), 'accounts'));

  return snap.docs
    .map(d => ({ username: d.id, ...d.data() }))
    .filter(u => !u.disabled)
    .sort((a, b) => {
      if (a.username === ADMIN_USERNAME) return -1;
      if (b.username === ADMIN_USERNAME) return 1;
      return (a.displayName || a.username).localeCompare(b.displayName || b.username, 'bg');
    });
}

/**
 * @returns {Promise<Array<{ username: string, displayName: string, role: UserRole, disabled: boolean, createdAt: string }>>}
 */
export async function listAllAccounts() {
  await ensureBootstrapAdmin();
  const snap = await getDocs(collection(getFirebaseDb(), 'accounts'));

  return snap.docs
    .map(d => ({ username: d.id, ...d.data() }))
    .sort((a, b) => (a.displayName || a.username).localeCompare(b.displayName || b.username, 'bg'));
}

/**
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ username: string, displayName: string, role: UserRole }>}
 */
export async function verifyLogin(username, password) {
  const key = normalizeUsername(username);
  if (!key) throw new Error('Изберете потребител.');

  const snap = await getDoc(accountRef(key));
  if (!snap.exists()) throw new Error('Грешен потребител или парола.');

  const data = snap.data();
  if (data.disabled) throw new Error('Този акаунт е деактивиран.');

  const hash = await hashPassword(password);
  if (hash !== data.passwordHash) throw new Error('Грешен потребител или парола.');

  return {
    username: key,
    displayName: data.displayName || key,
    role: data.role === 'admin' ? 'admin' : 'driver'
  };
}

/**
 * @param {{ username: string, displayName?: string, password: string }} input
 */
export async function createUserAccount(input) {
  const username = normalizeUsername(input.username);
  const displayName = (input.displayName || username).trim();
  const password = input.password;

  if (!username || username.length < 2) {
    throw new Error('Потребителското име трябва да е поне 2 символа.');
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    throw new Error('Потребителското име: само букви, цифри и _');
  }
  if (password.length < 4) {
    throw new Error('Паролата трябва да е поне 4 символа.');
  }
  if (isAdminUsername(username)) {
    throw new Error('Потребителят martin е запазен за администратора.');
  }

  const ref = accountRef(username);
  const existing = await getDoc(ref);
  if (existing.exists()) throw new Error('Това потребителско име вече съществува.');

  await setDoc(ref, {
    username,
    displayName,
    passwordHash: await hashPassword(password),
    role: 'driver',
    settings: DEFAULT_SETTINGS,
    disabled: false,
    createdAt: new Date().toISOString()
  });

  return username;
}

/**
 * @param {string} username
 * @param {string} newPassword
 */
export async function updateUserPassword(username, newPassword) {
  const key = normalizeUsername(username);
  if (newPassword.length < 4) {
    throw new Error('Паролата трябва да е поне 4 символа.');
  }

  const ref = accountRef(key);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error('Потребителят не е намерен.');

  await updateDoc(ref, {
    passwordHash: await hashPassword(newPassword),
    updatedAt: new Date().toISOString()
  });
}

/**
 * @param {string} username
 * @param {boolean} disabled
 */
export async function setUserDisabled(username, disabled) {
  const key = normalizeUsername(username);
  if (isAdminUsername(key) && disabled) {
    throw new Error('Не може да деактивирате администратора.');
  }

  await updateDoc(accountRef(key), {
    disabled,
    updatedAt: new Date().toISOString()
  });
}
