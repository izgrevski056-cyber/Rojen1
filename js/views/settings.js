import { loadData, updateSettings, clearAllData, DEFAULT_SETTINGS } from '../storage.js';

/** @type {() => void} */
let onSettingsSaved = () => {};

/** @param {{ onSaved: () => void }} options */
export function initSettingsView({ onSaved }) {
  onSettingsSaved = onSaved;

  document.getElementById('btn-settings')?.addEventListener('click', openModal);
  document.getElementById('btn-close-settings')?.addEventListener('click', closeModal);
  document.getElementById('modal-backdrop')?.addEventListener('click', closeModal);

  document.getElementById('form-settings')?.addEventListener('submit', handleSave);
  document.getElementById('btn-reset-data')?.addEventListener('click', handleReset);
}

function openModal() {
  const data = loadData();
  document.getElementById('setting-bonus').value = data.settings.bonusPercent;
  document.getElementById('setting-allowance').value = data.settings.dailyAllowance;
  document.getElementById('setting-voucher').value = data.settings.monthlyVoucher;

  const modal = document.getElementById('modal-settings');
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modal-settings').classList.add('hidden');
  document.body.style.overflow = '';
}

function handleSave(e) {
  e.preventDefault();

  const bonusPercent = parseFloat(document.getElementById('setting-bonus').value);
  const dailyAllowance = parseFloat(document.getElementById('setting-allowance').value);
  const monthlyVoucher = parseFloat(document.getElementById('setting-voucher').value);

  if ([bonusPercent, dailyAllowance, monthlyVoucher].some(v => isNaN(v) || v < 0)) return;

  updateSettings({ bonusPercent, dailyAllowance, monthlyVoucher });
  closeModal();
  onSettingsSaved();
  showToast('Настройките са запазени');
}

function handleReset() {
  if (!confirm('Сигурни ли сте? Всички данни ще бъдат изтрити безвъзвратно.')) return;

  clearAllData();
  closeModal();
  onSettingsSaved();
  showToast('Данните са изчистени');
}

function showToast(message) {
  const toast = document.getElementById('toast');
  const inner = toast.querySelector('div');
  inner.textContent = message;
  toast.classList.add('show');
  toast.classList.remove('hidden');

  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2500);
}

export { DEFAULT_SETTINGS };
