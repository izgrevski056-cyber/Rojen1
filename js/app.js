import { loadData, saveDay, getDay } from './storage.js';
import { formatDisplayDate, todayKey, generateId } from './calculations.js';
import { initDailyView, renderDailyView } from './views/daily.js';
import { initArchiveView, renderArchiveView } from './views/archive.js';
import { initSettingsView } from './views/settings.js';

/** @typedef {{ onDateUpdate?: (dateKey: string) => void, onDeliveryAdded?: () => void }} DailyViewCallbacks */

let activeView = 'daily';

function initNavigation() {
  const tabs = document.querySelectorAll('[data-view]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.dataset.view;
      if (view === activeView) return;
      switchView(view);
    });
  });
}

/** @param {'daily' | 'archive'} view */
function switchView(view) {
  activeView = view;

  document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
  document.getElementById(`view-${view}`)?.classList.remove('hidden');

  document.body.classList.toggle('view-archive', view === 'archive');

  const tabs = document.querySelectorAll('[role="tab"]');
  tabs.forEach(tab => {
    const isActive = tab.dataset.view === view;
    tab.setAttribute('aria-selected', String(isActive));
    tab.classList.toggle('border-success', isActive);
    tab.classList.toggle('text-white', isActive);
    tab.classList.toggle('bg-white/5', isActive);
    tab.classList.toggle('border-transparent', !isActive);
    tab.classList.toggle('text-white/60', !isActive);
  });

  const subtitle = document.getElementById('header-subtitle');
  subtitle.textContent = view === 'daily' ? 'Дневен Курс' : 'Месечен Архив';

  if (view === 'daily') renderDailyView();
  else renderArchiveView();
}

function updateHeaderDate(dateKey) {
  document.getElementById('header-date').textContent = formatDisplayDate(dateKey);
}

function seedDemoDataIfEmpty() {
  const data = loadData();
  const dateKey = todayKey();

  if (Object.keys(data.days).length > 0) return;

  const demoDeliveries = [
    { id: generateId(), clientName: 'Магазин „Слънце"', amount: 245.80, delivered: true, createdAt: new Date().toISOString() },
    { id: generateId(), clientName: 'Ресторант „Родопи"', amount: 189.50, delivered: true, createdAt: new Date().toISOString() },
    { id: generateId(), clientName: 'Хотел „Пампорovo"', amount: 412.00, delivered: false, createdAt: new Date().toISOString() },
    { id: generateId(), clientName: 'Супермаркет „Кarma"', amount: 156.30, delivered: false, createdAt: new Date().toISOString() }
  ];

  saveDay(dateKey, { deliveries: demoDeliveries, updatedAt: new Date().toISOString() });

  // Seed a few past days for archive demo
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  saveDay(yKey, {
    deliveries: [
      { id: generateId(), clientName: 'Клиент А', amount: 320.00, delivered: true, createdAt: new Date().toISOString() },
      { id: generateId(), clientName: 'Клиент Б', amount: 180.50, delivered: true, createdAt: new Date().toISOString() }
    ],
    updatedAt: new Date().toISOString()
  });
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  }
}

function init() {
  seedDemoDataIfEmpty();

  initNavigation();

  initDailyView({
    onDateUpdate: updateHeaderDate,
    onDeliveryAdded: () => {}
  });

  initArchiveView();

  initSettingsView({
    onSaved: () => {
      renderDailyView();
      if (activeView === 'archive') renderArchiveView();
    }
  });

  updateHeaderDate(todayKey());
  renderDailyView();
  registerServiceWorker();
}

document.addEventListener('DOMContentLoaded', init);
