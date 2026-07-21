import { parseInvoiceImage, createImagePreviewUrl } from '../invoice-scan.js';
import { isGeminiConfigured } from '../gemini-config.js';
import {
  fillRegionSelect,
  syncRegionOtherVisibility,
  getRegionFromSelect,
  LAST_REGION_KEY
} from '../regions.js';
import { saveDay, getDay } from '../storage.js';
import { todayKey, generateId } from '../calculations.js';

/** @type {{ onDeliveryAdded?: () => void, showToast: (msg: string) => void }} */
let callbacks = {};

/** @type {string | null} */
let previewObjectUrl = null;

/** @param {{ onDeliveryAdded?: () => void, showToast: (msg: string) => void }} cb */
export function initInvoiceScan(cb) {
  callbacks = cb;

  document.getElementById('btn-scan-invoice')?.addEventListener('click', handleScanClick);
  document.getElementById('input-invoice-photo')?.addEventListener('change', handlePhotoSelected);
  document.getElementById('form-scan-confirm')?.addEventListener('submit', handleScanConfirm);
  document.getElementById('btn-close-scan')?.addEventListener('click', closeScanModal);
  document.getElementById('scan-backdrop')?.addEventListener('click', closeScanModal);
  document.getElementById('scan-region')?.addEventListener('change', () => {
    syncRegionOtherVisibility(
      document.getElementById('scan-region'),
      document.getElementById('scan-region-other')
    );
  });
}

function handleScanClick() {
  if (!isGeminiConfigured()) {
    callbacks.showToast('Добавете Gemini API ключ в js/gemini-config.js');
    return;
  }

  document.getElementById('input-invoice-photo')?.click();
}

async function handlePhotoSelected(e) {
  const input = /** @type {HTMLInputElement} */ (e.target);
  const file = input.files?.[0];
  input.value = '';

  if (!file) return;

  openScanModal();
  setScanLoading(true);

  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }

  previewObjectUrl = createImagePreviewUrl(file);
  const preview = document.getElementById('scan-preview');
  if (preview) {
    preview.src = previewObjectUrl;
    preview.classList.remove('hidden');
  }

  fillRegionSelect(
    document.getElementById('scan-region'),
    document.getElementById('scan-region-other')
  );

  try {
    const result = await parseInvoiceImage(file);

    document.getElementById('scan-company').value = result.companyName;
    document.getElementById('scan-amount').value = result.amountEur ?? '';

    if (!result.companyName && result.amountEur === null) {
      callbacks.showToast('AI не намери данни. Попълнете ръчно.');
    }
  } catch (err) {
    callbacks.showToast(err.message || 'Грешка при разчитане.');
    document.getElementById('scan-company').value = '';
    document.getElementById('scan-amount').value = '';
  } finally {
    setScanLoading(false);
  }
}

async function handleScanConfirm(e) {
  e.preventDefault();

  const region = getRegionFromSelect(
    document.getElementById('scan-region'),
    document.getElementById('scan-region-other')
  );
  const clientName = document.getElementById('scan-company')?.value.trim();
  const amount = parseFloat(document.getElementById('scan-amount')?.value);

  if (!region) {
    callbacks.showToast('Изберете район.');
    return;
  }
  if (!clientName) {
    callbacks.showToast('Въведете име на фирма.');
    return;
  }
  if (isNaN(amount) || amount < 0) {
    callbacks.showToast('Въведете валидна сума в €.');
    return;
  }

  const btn = document.getElementById('btn-scan-confirm');
  btn.disabled = true;

  try {
    const dateKey = todayKey();
    const day = getDay(dateKey);

    day.deliveries.push({
      id: generateId(),
      clientName,
      amount,
      region,
      delivered: false,
      createdAt: new Date().toISOString()
    });

    await saveDay(dateKey, day);
    sessionStorage.setItem(LAST_REGION_KEY, region);
    closeScanModal();
    callbacks.showToast('Спирката е добавена.');
    callbacks.onDeliveryAdded?.();
  } catch (err) {
    callbacks.showToast(err.message || 'Грешка при запис.');
  } finally {
    btn.disabled = false;
  }
}

function openScanModal() {
  document.getElementById('modal-invoice-scan')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  document.getElementById('scan-company').value = '';
  document.getElementById('scan-amount').value = '';
  setScanLoading(true);
}

function closeScanModal() {
  document.getElementById('modal-invoice-scan')?.classList.add('hidden');
  document.body.style.overflow = '';
  setScanLoading(false);

  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }

  const preview = document.getElementById('scan-preview');
  if (preview) {
    preview.src = '';
    preview.classList.add('hidden');
  }
}

/** @param {boolean} loading */
function setScanLoading(loading) {
  document.getElementById('scan-loading')?.classList.toggle('hidden', !loading);
  document.getElementById('scan-form-fields')?.classList.toggle('hidden', loading);
  document.getElementById('btn-scan-confirm')?.toggleAttribute('disabled', loading);
}
