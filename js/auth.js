import {
  listLoginUsers,
  verifyLogin,
  ADMIN_USERNAME
} from './accounts.js';
import {
  initUserStorage,
  teardownStorage,
  saveSession,
  loadSession,
  clearSession
} from './storage.js';

/** @type {(session: { username: string, displayName: string, role: import('./accounts.js').UserRole } | null) => void} */
let onAuthReady = () => {};

/** @type {import('./accounts.js').UserRole | null} */
let currentRole = null;

/** @type {{ username: string, displayName: string } | null} */
let currentUser = null;

export function initAuth({ onReady }) {
  onAuthReady = onReady;

  document.getElementById('form-auth')?.addEventListener('submit', handleAuthSubmit);

  bootstrapAuth().catch((err) => {
    hideLoading();
    showAuthError(err.message || 'Грешка при стартиране.');
    showAuthScreen();
  });
}

async function bootstrapAuth() {
  showLoading('Зареждане…');

  await populateUserSelect();

  const session = loadSession();
  if (session?.username) {
    try {
      await completeLogin(session);
      return;
    } catch {
      clearSession();
    }
  }

  hideLoading();
  showAuthScreen();
  onAuthReady(null);
}

async function populateUserSelect() {
  const select = document.getElementById('auth-user');
  if (!select) return;

  select.innerHTML = '<option value="">— Изберете потребител —</option>';

  const users = await listLoginUsers();
  for (const user of users) {
    const opt = document.createElement('option');
    opt.value = user.username;
    opt.textContent = user.displayName || user.username;
    if (user.username === ADMIN_USERNAME) {
      opt.textContent += ' (Админ)';
    }
    select.appendChild(opt);
  }
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  clearAuthError();

  const username = document.getElementById('auth-user')?.value;
  const password = document.getElementById('auth-password')?.value;

  if (!username || !password) {
    showAuthError('Изберете потребител и въведете парола.');
    return;
  }

  setAuthLoading(true);

  try {
    const session = await verifyLogin(username, password);
    saveSession(session);
    await completeLogin(session);
  } catch (err) {
    showAuthError(err.message || 'Грешка при вход.');
  } finally {
    setAuthLoading(false);
  }
}

/**
 * @param {{ username: string, displayName: string, role: import('./accounts.js').UserRole }} session
 */
async function completeLogin(session) {
  showLoading('Зареждане на данни…');
  currentRole = session.role;
  currentUser = { username: session.username, displayName: session.displayName };

  await initUserStorage(session.username, session.role);
  showApp(session);
  onAuthReady(session);
  hideLoading();
  refreshActiveViewAfterLogin();
}

function refreshActiveViewAfterLogin() {
  document.dispatchEvent(new CustomEvent('rojen1:storage-ready'));
}

export async function handleLogout() {
  if (!confirm('Сигурни ли сте, че искате да излезете?')) return;

  clearSession();
  currentRole = null;
  currentUser = null;
  teardownStorage();

  document.getElementById('app')?.classList.add('hidden');
  await populateUserSelect();
  showAuthScreen();
  onAuthReady(null);
}

export function getCurrentRole() {
  return currentRole;
}

export function isCurrentUserAdmin() {
  return currentRole === 'admin';
}

function showAuthScreen() {
  hideLoading();
  document.getElementById('auth-screen')?.classList.remove('hidden');
  document.getElementById('app')?.classList.add('hidden');
  clearAuthError();
}

/** @param {{ username: string, displayName: string, role: import('./accounts.js').UserRole }} session */
function showApp(session) {
  document.getElementById('auth-screen')?.classList.add('hidden');
  document.getElementById('loading-screen')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');

  const userEl = document.getElementById('header-user-email');
  if (userEl) {
    const label = session.role === 'admin' ? 'Администратор' : 'Шофьор';
    userEl.textContent = `${label} · ${session.displayName || session.username}`;
  }

  document.getElementById('tab-admin')?.classList.toggle('hidden', session.role !== 'admin');
}

function showLoading(message) {
  const text = document.getElementById('loading-text');
  if (text) text.textContent = message;
  document.getElementById('loading-screen')?.classList.remove('hidden');
  document.getElementById('auth-screen')?.classList.add('hidden');
  document.getElementById('app')?.classList.add('hidden');
}

function hideLoading() {
  document.getElementById('loading-screen')?.classList.add('hidden');
}

function showAuthError(message) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('hidden');
}

function clearAuthError() {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}

function setAuthLoading(loading) {
  const btn = document.getElementById('auth-submit');
  const inputs = document.querySelectorAll('#form-auth input, #form-auth select');
  if (btn) {
    btn.disabled = loading;
    btn.classList.toggle('opacity-60', loading);
  }
  inputs.forEach(input => { input.disabled = loading; });
}
