import { loadData, saveDay, getDay } from '../storage.js';
import { calcDaySummary, formatEUR, todayKey, generateId } from '../calculations.js';

/** @type {import('../app.js').DailyViewCallbacks} */
let callbacks = {};

/** @param {import('../app.js').DailyViewCallbacks} cb */
export function initDailyView(cb) {
  callbacks = cb;

  document.getElementById('form-add-delivery')?.addEventListener('submit', handleAddDelivery);
  document.getElementById('delivery-list')?.addEventListener('change', handleToggle);
  document.getElementById('delivery-list')?.addEventListener('click', handleDelete);
}

export function renderDailyView() {
  const dateKey = todayKey();
  const data = loadData();
  const day = getDay(dateKey);
  const summary = calcDaySummary(day.deliveries, data.settings);

  renderDeliveryList(day.deliveries);
  updateSummaryBar(summary);
  callbacks.onDateUpdate?.(dateKey);
}

function renderDeliveryList(deliveries) {
  const list = document.getElementById('delivery-list');
  const empty = document.getElementById('empty-deliveries');
  const count = document.getElementById('delivery-count');

  if (!list) return;

  count.textContent = String(deliveries.length);

  if (deliveries.length === 0) {
    list.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');

  list.innerHTML = deliveries.map(d => `
    <li>
      <article class="delivery-card ${d.delivered ? 'delivered' : 'bg-white'} rounded-2xl shadow-card p-4 border border-navy/5 transition-all duration-300"
        data-id="${d.id}">
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="delivery-name font-semibold text-navy truncate">${escapeHtml(d.clientName)}</h3>
            <p class="delivery-amount text-lg font-bold mt-0.5 ${d.delivered ? '' : 'text-accent-coral'}">${formatEUR(d.amount)}</p>
          </div>
          <label class="toggle-switch" aria-label="Маркирай като доставено">
            <input type="checkbox" ${d.delivered ? 'checked' : ''} data-action="toggle" data-id="${d.id}">
            <span class="toggle-slider"></span>
          </label>
        </div>
        ${d.delivered ? `
          <div class="mt-2 flex items-center gap-1.5 text-success-dark text-xs font-medium">
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            Доставено
          </div>
        ` : ''}
        <button type="button" data-action="delete" data-id="${d.id}"
          class="mt-2 text-xs text-slate-400 hover:text-red-500 transition-colors">
          Премахни
        </button>
      </article>
    </li>
  `).join('');
}

function updateSummaryBar(summary) {
  document.getElementById('sum-turnover').textContent = formatEUR(summary.turnover);
  document.getElementById('sum-bonus').textContent = formatEUR(summary.bonus);
  document.getElementById('sum-allowance').textContent = formatEUR(summary.allowance);
  document.getElementById('sum-total').textContent = formatEUR(summary.total);
}

async function handleAddDelivery(e) {
  e.preventDefault();

  const clientInput = document.getElementById('input-client');
  const amountInput = document.getElementById('input-amount');

  const clientName = clientInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!clientName || isNaN(amount) || amount < 0) return;

  const dateKey = todayKey();
  const day = getDay(dateKey);

  day.deliveries.push({
    id: generateId(),
    clientName,
    amount,
    delivered: false,
    createdAt: new Date().toISOString()
  });

  try {
    await saveDay(dateKey, day);
    clientInput.value = '';
    amountInput.value = '';
    clientInput.focus();
    callbacks.onDeliveryAdded?.();
  } catch (err) {
    showToast(err.message || 'Грешка при запис.');
  }
}

async function handleToggle(e) {
  if (e.target.dataset.action !== 'toggle') return;

  const id = e.target.dataset.id;
  const dateKey = todayKey();
  const day = getDay(dateKey);
  const delivery = day.deliveries.find(d => d.id === id);
  if (!delivery) return;

  delivery.delivered = e.target.checked;

  try {
    await saveDay(dateKey, day);
  } catch (err) {
    e.target.checked = !e.target.checked;
    showToast(err.message || 'Грешка при запис.');
  }
}

async function handleDelete(e) {
  if (e.target.dataset.action !== 'delete') return;

  const id = e.target.dataset.id;
  const dateKey = todayKey();
  const day = getDay(dateKey);
  day.deliveries = day.deliveries.filter(d => d.id !== id);

  try {
    await saveDay(dateKey, day);
  } catch (err) {
    showToast(err.message || 'Грешка при запис.');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
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
