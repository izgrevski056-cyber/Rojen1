import { formatDisplayDate, todayKey } from './calculations.js';
import { initDailyView, renderDailyView } from './views/daily.js';
import { initArchiveView, renderArchiveView } from './views/archive.js';
import { initSettingsView } from './views/settings.js';
import { initAdminView, renderAdminView } from './views/admin.js';
import { initAuth } from './auth.js';
import { onDataChange } from './storage.js';

let activeView = 'daily';
let appInitialized = false;

const VIEW_LABELS = {
  daily: 'Дневен Курс',
  archive: 'Месечен Архив',
  admin: 'Админ Панел'
};

function initNavigation() {
  document.querySelectorAll('[data-view]').forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      if (view === activeView) return;
      switchView(view);
    });
  });
}

/** @param {'daily' | 'archive' | 'admin'} view */
function switchView(view) {
  activeView = view;

  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
  document.getElementById(`view-${view}`)?.classList.remove('hidden');

  document.querySelectorAll('[role="tab"]').forEach(tab => {
    const isActive = tab.dataset.view === view;
    tab.setAttribute('aria-selected', String(isActive));
    tab.classList.toggle('border-success', isActive);
    tab.classList.toggle('text-white', isActive);
    tab.classList.toggle('bg-white/5', isActive);
    tab.classList.toggle('border-transparent', !isActive);
    tab.classList.toggle('text-white/60', !isActive);
  });

  document.getElementById('header-subtitle').textContent = VIEW_LABELS[view] || '';
  refreshActiveView();
}

function refreshActiveView() {
  if (activeView === 'daily') renderDailyView();
  else if (activeView === 'archive') renderArchiveView();
  else if (activeView === 'admin') renderAdminView();
}

function updateHeaderDate(dateKey) {
  document.getElementById('header-date').textContent = formatDisplayDate(dateKey);
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}

function initAppShell(role) {
  if (appInitialized) return;
  appInitialized = true;

  initNavigation();
  initDailyView({ onDateUpdate: updateHeaderDate, onDeliveryAdded: () => {} });
  initArchiveView();
  initSettingsView({ onSaved: refreshActiveView });

  if (role === 'admin') {
    initAdminView();
  }

  onDataChange(refreshActiveView);
  updateHeaderDate(todayKey());
  renderDailyView();
}

function init() {
  window.addEventListener('error', (event) => {
    const msg = event.message || 'Грешка при зареждане на приложението.';
    const errEl = document.getElementById('auth-error');
    if (errEl) {
      errEl.textContent = msg;
      errEl.classList.remove('hidden');
    }
    document.getElementById('auth-screen')?.classList.remove('hidden');
    document.getElementById('loading-screen')?.classList.add('hidden');
  });

  registerServiceWorker();

  initAuth({
    onReady: (user, role) => {
      if (user && role) initAppShell(role);
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
