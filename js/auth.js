import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js';
import { getFirebaseAuth } from './firebase.js';
import { initUserStorage, teardownStorage } from './storage.js';
import { ensureUserProfile } from './roles.js';

/** @type {(user: import('https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js').User | null, role: import('./roles.js').UserRole | null) => void} */
let onAuthReady = () => {};

/** @type {import('./roles.js').UserRole | null} */
let currentRole = null;

const AUTH_ERRORS = {
  'auth/wrong-password': 'Грешна парола.',
  'auth/user-not-found': 'Няма акаунт с този email.',
  'auth/invalid-email': 'Невалиден email адрес.',
  'auth/invalid-credential': 'Грешен email или парола.',
  'auth/too-many-requests': 'Твърде много опити. Опитайте по-късно.',
  'auth/network-request-failed': 'Няма интернет връзка.',
  'auth/user-disabled': 'Този акаунт е деактивиран.'
};

export function initAuth({ onReady }) {
  onAuthReady = onReady;

  document.getElementById('form-auth')?.addEventListener('submit', handleAuthSubmit);

  try {
    const auth = getFirebaseAuth();
    showLoading('Проверка на акаунт…');

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        showLoading('Зареждане на данни…');
        try {
          const role = await ensureUserProfile(user);
          currentRole = role;
          await initUserStorage(user.uid, role);
          showApp(user, role);
          onAuthReady(user, role);
        } catch (err) {
          await signOut(auth).catch(() => {});
          currentRole = null;
          showAuthError(err.message || 'Грешка при вход.');
          showAuthScreen();
        } finally {
          hideLoading();
        }
      } else {
        currentRole = null;
        teardownStorage();
        showAuthScreen();
        onAuthReady(null, null);
      }
    });
  } catch (err) {
    hideLoading();
    showAuthError(err.message);
    showAuthScreen();
  }
}

export function getCurrentRole() {
  return currentRole;
}

export function isCurrentUserAdmin() {
  return currentRole === 'admin';
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  clearAuthError();

  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  if (!email || !password) return;

  setAuthLoading(true);

  try {
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  } catch (err) {
    showAuthError(AUTH_ERRORS[err.code] || err.message || 'Възникна грешка.');
  } finally {
    setAuthLoading(false);
  }
}

export async function handleLogout() {
  if (!confirm('Сигурни ли сте, че искате да излезете?')) return;
  try {
    await signOut(getFirebaseAuth());
  } catch (err) {
    showToast(err.message || 'Грешка при изход.');
  }
}

function showAuthScreen() {
  hideLoading();
  document.getElementById('auth-screen')?.classList.remove('hidden');
  document.getElementById('app')?.classList.add('hidden');
  clearAuthError();
}

/** @param {import('https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js').User} user */
/** @param {import('./roles.js').UserRole} role */
function showApp(user, role) {
  document.getElementById('auth-screen')?.classList.add('hidden');
  document.getElementById('loading-screen')?.classList.add('hidden');
  document.getElementById('app')?.classList.remove('hidden');

  const emailEl = document.getElementById('header-user-email');
  if (emailEl) {
    const label = role === 'admin' ? 'Администратор' : 'Шофьор';
    emailEl.textContent = `${label} · ${user.email || ''}`;
  }

  const adminTab = document.getElementById('tab-admin');
  adminTab?.classList.toggle('hidden', role !== 'admin');
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
  const inputs = document.querySelectorAll('#form-auth input');
  if (btn) {
    btn.disabled = loading;
    btn.classList.toggle('opacity-60', loading);
  }
  inputs.forEach(input => { input.disabled = loading; });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const inner = toast?.querySelector('div');
  if (!inner) return;
  inner.textContent = message;
  toast.classList.add('show');
  toast.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}
