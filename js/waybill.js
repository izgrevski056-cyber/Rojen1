import { groupDeliveriesByRegion } from './regions.js';
import { formatDisplayDate, formatEUR } from './calculations.js';

const LINE = '━━━━━━━━━━━━━━━━━━━━━━';

/**
 * @param {import('./storage.js').Delivery[]} deliveries
 * @param {{ dateKey: string, driverName?: string }} options
 */
export function formatWaybillText(deliveries, { dateKey, driverName = '' }) {
  if (!deliveries.length) {
    return '';
  }

  const groups = groupDeliveriesByRegion(deliveries);
  const totalAmount = deliveries.reduce((sum, d) => sum + d.amount, 0);
  const lines = [
    LINE,
    'ТОВАРИТЕЛНИЦА',
    'Рожен 1',
    LINE,
    '',
    `Дата: ${formatDisplayDate(dateKey)}`,
  ];

  if (driverName) {
    lines.push(`Шофьор: ${driverName}`);
  }

  lines.push('');

  for (const group of groups) {
    lines.push(`📍 ${group.region.toUpperCase()}`);
    lines.push('──────────────────────');
    lines.push('');

    group.deliveries.forEach((delivery, index) => {
      lines.push(`${index + 1}. ${delivery.clientName}`);
      lines.push(`   ${formatEUR(delivery.amount)}`);
      lines.push('');
    });
  }

  lines.push(LINE);
  lines.push(`ОБЩО: ${deliveries.length} спирки`);
  lines.push(`СУМА: ${formatEUR(totalAmount)}`);
  lines.push(LINE);

  return lines.join('\n').trim();
}

/** @param {string} text */
export async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
