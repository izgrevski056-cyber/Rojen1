/**
 * Storage layer — localStorage today, Firestore-ready interface tomorrow.
 * All reads/writes go through this module so the backend can be swapped later.
 */

const STORAGE_KEY = 'rozhen1_data';

const DEFAULT_SETTINGS = {
  bonusPercent: 0.25,
  dailyAllowance: 33.16,
  monthlyVoucher: 100
};

/** @typedef {{ id: string, clientName: string, amount: number, delivered: boolean, createdAt: string }} Delivery */
/** @typedef {{ deliveries: Delivery[], updatedAt: string }} DayRecord */
/** @typedef {{ bonusPercent: number, dailyAllowance: number, monthlyVoucher: number }} Settings */
/** @typedef {{ settings: Settings, days: Record<string, DayRecord> }} AppData */

/** @returns {AppData} */
function getDefaultData() {
  return {
    settings: { ...DEFAULT_SETTINGS },
    days: {}
  };
}

/** @returns {AppData} */
export function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw);
    return {
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      days: parsed.days || {}
    };
  } catch {
    return getDefaultData();
  }
}

/** @param {AppData} data */
export function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** @param {Partial<Settings>} settings */
export function updateSettings(settings) {
  const data = loadData();
  data.settings = { ...data.settings, ...settings };
  saveData(data);
  return data.settings;
}

/** @param {string} dateKey YYYY-MM-DD */
export function getDay(dateKey) {
  const data = loadData();
  return data.days[dateKey] || { deliveries: [], updatedAt: new Date().toISOString() };
}

/** @param {string} dateKey */
/** @param {DayRecord} dayRecord */
export function saveDay(dateKey, dayRecord) {
  const data = loadData();
  data.days[dateKey] = {
    ...dayRecord,
    updatedAt: new Date().toISOString()
  };
  saveData(data);
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Firebase-ready adapter stub — implement these when connecting Firestore.
 * @example
 * import { firebaseAdapter } from './firebase.js';
 * storage.setAdapter(firebaseAdapter);
 */
let adapter = null;

export function setAdapter(firebaseAdapter) {
  adapter = firebaseAdapter;
}

export async function loadDataAsync() {
  if (adapter?.load) return adapter.load();
  return loadData();
}

export async function saveDataAsync(data) {
  if (adapter?.save) return adapter.save(data);
  saveData(data);
}

export { DEFAULT_SETTINGS };
