import {
  createDriverAccount,
  listDriverAccounts,
  resetDriverPassword,
  setDriverDisabled
} from '../roles.js';

/** @type {string | null} */
let resetTargetUid = null;

export function initAdminView() {
  document.getElementById('form-create-driver')?.addEventListener('submit', handleCreateDriver);
  document.getElementById('btn-refresh-drivers')?.addEventListener('click', renderDriverList);
  document.getElementById('admin-driver-list')?.addEventListener('click', handleDriverAction);
  document.getElementById('form-reset-password')?.addEventListener('submit', handleResetPassword);
  document.getElementById('btn-close-reset')?.addEventListener('click', closeResetModal);
  document.getElementById('reset-backdrop')?.addEventListener('click', closeResetModal);
}

export function renderAdminView() {
  renderDriverList();
}

async function renderDriverList() {
  const list = document.getElementById('admin-driver-list');
  const empty = document.getElementById('admin-empty');
  if (!list) return;

  list.innerHTML = '<li class="text-center text-slate-400 text-sm py-6">Зареждане…</li>';

  try {
    const drivers = await listDriverAccounts();

    if (!drivers.length) {
      list.innerHTML = '';
      empty?.classList.remove('hidden');
      return;
    }

    empty?.classList.add('hidden');
    list.innerHTML = drivers.map(d => `
      <li class="bg-white rounded-xl shadow-card p-4 border border-navy/5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="font-semibold text-navy truncate">${escapeHtml(d.displayName || d.email)}</p>
            <p class="text-xs text-slate-500 truncate">${escapeHtml(d.email)}</p>
            <p class="text-xs mt-1 ${d.disabled ? 'text-red-500' : 'text-success-dark'}">
              ${d.disabled ? 'Деактивиран' : 'Активен'}
            </p>
          </div>
          <div class="flex flex-col gap-2 shrink-0">
            <button type="button" data-action="reset" data-uid="${d.uid}" data-email="${escapeHtml(d.email)}"
              class="text-xs px-3 py-1.5 rounded-lg bg-navy/10 text-navy font-medium hover:bg-navy/15">
              Смени парола
            </button>
            <button type="button" data-action="toggle" data-uid="${d.uid}" data-disabled="${d.disabled}"
              class="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-cream">
              ${d.disabled ? 'Активирай' : 'Деактивирай'}
            </button>
          </div>
        </div>
      </li>
    `).join('');
  } catch (err) {
    list.innerHTML = '';
    showAdminError(err.message || 'Грешка при зареждане на шофьори.');
  }
}

async function handleCreateDriver(e) {
  e.preventDefault();
  clearAdminError();

  const email = document.getElementById('admin-driver-email').value;
  const password = document.getElementById('admin-driver-password').value;
  const displayName = document.getElementById('admin-driver-name').value;

  const btn = document.getElementById('btn-create-driver');
  btn.disabled = true;

  try {
    await createDriverAccount({ email, password, displayName });
    e.target.reset();
    showAdminSuccess('Шофьорът е създаден успешно.');
    renderDriverList();
  } catch (err) {
    showAdminError(err.message || 'Грешка при създаване.');
  } finally {
    btn.disabled = false;
  }
}

async function handleDriverAction(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const uid = btn.dataset.uid;
  const action = btn.dataset.action;

  if (action === 'reset') {
    openResetModal(uid, btn.dataset.email);
    return;
  }

  if (action === 'toggle') {
    const currentlyDisabled = btn.dataset.disabled === 'true';
    const label = currentlyDisabled ? 'активирате' : 'деактивирате';
    if (!confirm(`Сигурни ли сте, че искате да ${label} този шофьор?`)) return;

    try {
      await setDriverDisabled(uid, !currentlyDisabled);
      renderDriverList();
    } catch (err) {
      showAdminError(err.message || 'Грешка при промяна на статуса.');
    }
  }
}

function openResetModal(uid, email) {
  resetTargetUid = uid;
  document.getElementById('reset-driver-email').textContent = email;
  document.getElementById('admin-new-password').value = '';
  document.getElementById('modal-reset-password').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeResetModal() {
  resetTargetUid = null;
  document.getElementById('modal-reset-password').classList.add('hidden');
  document.body.style.overflow = '';
}

async function handleResetPassword(e) {
  e.preventDefault();
  if (!resetTargetUid) return;

  const newPassword = document.getElementById('admin-new-password').value;
  const btn = document.getElementById('btn-confirm-reset');
  btn.disabled = true;

  try {
    await resetDriverPassword(resetTargetUid, newPassword);
    closeResetModal();
    showAdminSuccess('Паролата е сменена успешно.');
  } catch (err) {
    const msg = err.message?.includes('internal')
      ? 'Cloud Function не е деплойната. Вижте README → Firebase Functions.'
      : (err.message || 'Грешка при смяна на парола.');
    showAdminError(msg);
  } finally {
    btn.disabled = false;
  }
}

function showAdminError(message) {
  const el = document.getElementById('admin-feedback');
  if (!el) return;
  el.textContent = message;
  el.className = 'mb-4 p-3 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700';
  el.classList.remove('hidden');
}

function showAdminSuccess(message) {
  const el = document.getElementById('admin-feedback');
  if (!el) return;
  el.textContent = message;
  el.className = 'mb-4 p-3 rounded-xl text-sm bg-success-light border border-success/30 text-success-dark';
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

function clearAdminError() {
  document.getElementById('admin-feedback')?.classList.add('hidden');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
