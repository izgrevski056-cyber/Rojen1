import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  writeBatch,
  getDocs
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import { getFirebaseDb } from './firebase.js';

const LEGACY_STORAGE_KEY = 'rozhen1_data';
const SESSION_KEY = 'rozhen1_session';

export const DEFAULT_SETTINGS = {
  bonusPercent: 0.25,
  dailyAllowance: 33.16,
  monthlyVoucher: 100
};

/** @typedef {{ id: string, clientName: string, amount: number, delivered: boolean, createdAt: string }} Delivery */
/** @typedef {{ deliveries: Delivery[], updatedAt: string }} DayRecord */
/** @typedef {{ bonusPercent: number, dailyAllowance: number, monthlyVoucher: number }} Settings */
/** @typedef {{ role: 'admin' | 'driver', username: string, displayName?: string, disabled?: boolean }} UserProfile */
/** @typedef {{ settings: Settings, days: Record<string, DayRecord>, profile: UserProfile | null }} AppData */

/** @type {string | null} */
let currentRole = null;

/** @type {AppData} */
let cache = getDefaultData();

/** @type {string | null} */
let currentUsername = null;

/** @type {(() => void)[]} */
const listeners = [];

/** @type {(() => void)[]} */
let unsubscribes = [];

function getDefaultData() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    days: {},
    profile: null
  };
}

function notify() {
  listeners.forEach(fn => fn());
}

/** @param {() => void} fn */
export function onDataChange(fn) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function loadData() {
  return cache;
}

/** @param {string} dateKey */
export function getDay(dateKey) {
  return cache.days[dateKey] || { deliveries: [], updatedAt: new Date().toISOString() };
}

function accountRef(username) {
  return doc(getFirebaseDb(), 'accounts', username);
}

function dayRef(username, dateKey) {
  return doc(getFirebaseDb(), 'accounts', username, 'days', dateKey);
}

function daysCollection(username) {
  return collection(getFirebaseDb(), 'accounts', username, 'days');
}

/**
 * @param {string} username
 * @param {'admin' | 'driver'} role
 */
export async function initUserStorage(username, role) {
  teardownStorage();
  currentUsername = username;
  currentRole = role;
  cache = getDefaultData();
  cache.profile = { role, username, displayName: username };

  return new Promise((resolve, reject) => {
    let userReady = false;
    let daysReady = false;
    let settled = false;

    const tryReady = () => {
      if (userReady && daysReady && !settled) {
        settled = true;
        migrateLegacyLocalStorage(username).then(resolve).catch(reject);
      }
    };

    const userUnsub = onSnapshot(
      accountRef(username),
      (snap) => {
        if (!snap.exists()) {
          reject(new Error('Липсва профил на потребителя.'));
          return;
        }
        const data = snap.data();
        cache.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
        cache.profile = {
          role: data.role || role,
          username,
          displayName: data.displayName || username,
          disabled: !!data.disabled
        };
        userReady = true;
        notify();
        tryReady();
      },
      reject
    );

    const daysUnsub = onSnapshot(
      daysCollection(username),
      (snap) => {
        const days = {};
        snap.forEach((dayDoc) => {
          const data = dayDoc.data();
          days[dayDoc.id] = {
            deliveries: data.deliveries || [],
            updatedAt: data.updatedAt || new Date().toISOString()
          };
        });
        cache.days = days;
        daysReady = true;
        notify();
        tryReady();
      },
      reject
    );

    unsubscribes = [userUnsub, daysUnsub];
  });
}

export function teardownStorage() {
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];
  currentUsername = null;
  currentRole = null;
  cache = getDefaultData();
}

export function getUserRole() {
  return currentRole;
}

export function getCurrentUsername() {
  return currentUsername;
}

export function isAdmin() {
  return currentRole === 'admin';
}

export function saveSession(session) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

async function migrateLegacyLocalStorage(username) {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;

    const daysSnap = await getDocs(daysCollection(username));
    if (!daysSnap.empty) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }

    const parsed = JSON.parse(raw);
    const batch = writeBatch(getFirebaseDb());

    batch.set(accountRef(username), {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      migratedFromLocalStorage: true,
      migratedAt: new Date().toISOString()
    }, { merge: true });

    for (const [dateKey, day] of Object.entries(parsed.days || {})) {
      batch.set(dayRef(username, dateKey), {
        deliveries: day.deliveries || [],
        updatedAt: day.updatedAt || new Date().toISOString()
      });
    }

    await batch.commit();
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    notify();
  } catch {
    // best-effort
  }
}

/** @param {Partial<Settings>} settings */
export async function updateSettings(settings) {
  if (!currentUsername) throw new Error('Not signed in');

  const merged = { ...cache.settings, ...settings };
  cache.settings = merged;
  notify();

  await setDoc(accountRef(currentUsername), { settings: merged }, { merge: true });
  return merged;
}

/** @param {string} dateKey */
/** @param {DayRecord} dayRecord */
export async function saveDay(dateKey, dayRecord) {
  if (!currentUsername) throw new Error('Not signed in');

  const record = { ...dayRecord, updatedAt: new Date().toISOString() };
  cache.days[dateKey] = record;
  notify();

  await setDoc(dayRef(currentUsername, dateKey), record);
}

export async function clearAllData() {
  if (!currentUsername) throw new Error('Not signed in');

  const daysSnap = await getDocs(daysCollection(currentUsername));
  const batch = writeBatch(getFirebaseDb());
  daysSnap.forEach((dayDoc) => batch.delete(dayDoc.ref));
  batch.set(accountRef(currentUsername), {
    settings: DEFAULT_SETTINGS,
    clearedAt: new Date().toISOString()
  }, { merge: true });

  await batch.commit();
  cache = getDefaultData();
  notify();
}

export function isStorageReady() {
  return currentUsername !== null;
}
