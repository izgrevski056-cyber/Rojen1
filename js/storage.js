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

export const DEFAULT_SETTINGS = {
  bonusPercent: 0.25,
  dailyAllowance: 33.16,
  monthlyVoucher: 100
};

/** @typedef {{ id: string, clientName: string, amount: number, delivered: boolean, createdAt: string }} Delivery */
/** @typedef {{ deliveries: Delivery[], updatedAt: string }} DayRecord */
/** @typedef {{ bonusPercent: number, dailyAllowance: number, monthlyVoucher: number }} Settings */
/** @typedef {{ role: 'admin' | 'driver', email: string, displayName?: string, disabled?: boolean }} UserProfile */
/** @typedef {{ settings: Settings, days: Record<string, DayRecord>, profile: UserProfile | null }} AppData */

/** @type {string | null} */
let currentRole = null;

/** @type {AppData} */
let cache = getDefaultData();

/** @type {string | null} */
let currentUid = null;

/** @type {(() => void)[]} */
const listeners = [];

/** @type {(() => void)[]} */
let unsubscribes = [];

/** @returns {AppData} */
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

/** @returns {AppData} */
export function loadData() {
  return cache;
}

/** @param {string} dateKey */
export function getDay(dateKey) {
  return cache.days[dateKey] || { deliveries: [], updatedAt: new Date().toISOString() };
}

function userRef(uid) {
  return doc(getFirebaseDb(), 'users', uid);
}

function dayRef(uid, dateKey) {
  return doc(getFirebaseDb(), 'users', uid, 'days', dateKey);
}

function daysCollection(uid) {
  return collection(getFirebaseDb(), 'users', uid, 'days');
}

/**
 * @param {string} uid
 * @param {'admin' | 'driver'} role
 * @returns {Promise<void>}
 */
export async function initUserStorage(uid, role) {
  teardownStorage();
  currentUid = uid;
  currentRole = role;
  cache = getDefaultData();
  cache.profile = { role, email: '' };

  const db = getFirebaseDb();

  return new Promise((resolve, reject) => {
    let userReady = false;
    let daysReady = false;
    let settled = false;

    const tryReady = () => {
      if (userReady && daysReady && !settled) {
        settled = true;
        migrateLegacyLocalStorage(uid)
          .then(resolve)
          .catch(reject);
      }
    };

    const userUnsub = onSnapshot(
      userRef(uid),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          cache.settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
          cache.profile = {
            role: data.role || role,
            email: data.email || '',
            displayName: data.displayName || '',
            disabled: !!data.disabled
          };
        } else if (role === 'admin') {
          setDoc(userRef(uid), {
            role: 'admin',
            settings: DEFAULT_SETTINGS,
            createdAt: new Date().toISOString()
          }).catch(reject);
        } else {
          reject(new Error('Липсва профил на шофьора.'));
          return;
        }
        userReady = true;
        notify();
        tryReady();
      },
      reject
    );

    const daysUnsub = onSnapshot(
      daysCollection(uid),
      (snap) => {
        /** @type {Record<string, DayRecord>} */
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
  currentUid = null;
  currentRole = null;
  cache = getDefaultData();
}

export function getUserRole() {
  return currentRole;
}

export function isAdmin() {
  return currentRole === 'admin';
}

/**
 * @param {string} uid
 * @returns {Promise<void>}
 */
async function migrateLegacyLocalStorage(uid) {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return;

    const daysSnap = await getDocs(daysCollection(uid));
    if (!daysSnap.empty) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return;
    }

    const parsed = JSON.parse(raw);
    const db = getFirebaseDb();
    const batch = writeBatch(db);

    batch.set(userRef(uid), {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) },
      migratedFromLocalStorage: true,
      migratedAt: new Date().toISOString()
    }, { merge: true });

    const days = parsed.days || {};
    for (const [dateKey, day] of Object.entries(days)) {
      batch.set(dayRef(uid, dateKey), {
        deliveries: day.deliveries || [],
        updatedAt: day.updatedAt || new Date().toISOString()
      });
    }

    await batch.commit();
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    notify();
  } catch {
    // Migration is best-effort; cloud data remains source of truth.
  }
}

/** @param {Partial<Settings>} settings */
export async function updateSettings(settings) {
  if (!currentUid) throw new Error('Not signed in');

  const merged = { ...cache.settings, ...settings };
  cache.settings = merged;
  notify();

  await setDoc(userRef(currentUid), { settings: merged }, { merge: true });
  return merged;
}

/** @param {string} dateKey */
/** @param {DayRecord} dayRecord */
export async function saveDay(dateKey, dayRecord) {
  if (!currentUid) throw new Error('Not signed in');

  const record = {
    ...dayRecord,
    updatedAt: new Date().toISOString()
  };

  cache.days[dateKey] = record;
  notify();

  await setDoc(dayRef(currentUid, dateKey), record);
}

export async function clearAllData() {
  if (!currentUid) throw new Error('Not signed in');

  const db = getFirebaseDb();
  const daysSnap = await getDocs(daysCollection(currentUid));

  const batch = writeBatch(db);
  daysSnap.forEach((dayDoc) => batch.delete(dayDoc.ref));
  batch.set(userRef(currentUid), {
    settings: DEFAULT_SETTINGS,
    clearedAt: new Date().toISOString()
  }, { merge: true });

  await batch.commit();

  cache = getDefaultData();
  notify();
}

export function isStorageReady() {
  return currentUid !== null;
}
