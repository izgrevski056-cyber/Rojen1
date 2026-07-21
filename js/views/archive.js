import { loadData } from '../storage.js';
import { calcMonthSummary, formatEUR, formatShortDate, formatMonthLabel } from '../calculations.js';

let currentYear;
let currentMonth;

export function initArchiveView() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();

  document.getElementById('btn-prev-month')?.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }
    renderArchiveView();
  });

  document.getElementById('btn-next-month')?.addEventListener('click', () => {
    const now = new Date();
    const next = new Date(currentYear, currentMonth + 1, 1);
    if (next > now) return;

    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    renderArchiveView();
  });
}

export function renderArchiveView() {
  const data = loadData();
  const summary = calcMonthSummary(data.days, currentYear, currentMonth, data.settings);

  document.getElementById('archive-month-label').textContent =
    formatMonthLabel(currentYear, currentMonth);

  renderTable(summary.rows);
  renderSummaryCards(summary);
  renderPayoutBanner(summary);
}

function renderTable(rows) {
  const tbody = document.getElementById('archive-table-body');
  const tfoot = document.getElementById('archive-table-foot');

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="py-10 text-center text-slate-400 text-sm">
          Няма записи за този месец
        </td>
      </tr>`;
    tfoot.innerHTML = '';
    return;
  }

  tbody.innerHTML = rows.map(row => `
    <tr class="border-b border-slate-100">
      <td class="py-2.5 px-3 font-medium text-navy">${formatShortDate(row.dateKey)}</td>
      <td class="py-2.5 px-2 text-right">${formatEUR(row.turnover)}</td>
      <td class="py-2.5 px-2 text-right text-accent-amber">${formatEUR(row.bonus)}</td>
      <td class="py-2.5 px-2 text-right">${formatEUR(row.allowance)}</td>
      <td class="py-2.5 px-3 text-right font-semibold text-success-dark">${formatEUR(row.total)}</td>
    </tr>
  `).join('');

  const totals = rows.reduce(
    (acc, r) => ({
      turnover: acc.turnover + r.turnover,
      bonus: acc.bonus + r.bonus,
      allowance: acc.allowance + r.allowance,
      total: acc.total + r.total
    }),
    { turnover: 0, bonus: 0, allowance: 0, total: 0 }
  );

  tfoot.innerHTML = `
    <tr class="bg-navy/5 font-bold text-navy text-xs">
      <td class="py-3 px-3">ОБЩО</td>
      <td class="py-3 px-2 text-right">${formatEUR(totals.turnover)}</td>
      <td class="py-3 px-2 text-right">${formatEUR(totals.bonus)}</td>
      <td class="py-3 px-2 text-right">${formatEUR(totals.allowance)}</td>
      <td class="py-3 px-3 text-right text-success-dark">${formatEUR(totals.total)}</td>
    </tr>`;
}

function renderSummaryCards(summary) {
  const container = document.getElementById('archive-summary');
  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-card p-3 border border-navy/5">
      <p class="text-xs text-slate-500">Месечен оборот</p>
      <p class="text-lg font-bold text-navy">${formatEUR(summary.totalTurnover)}</p>
    </div>
    <div class="bg-white rounded-xl shadow-card p-3 border border-navy/5">
      <p class="text-xs text-slate-500">Общ бонус</p>
      <p class="text-lg font-bold text-accent-amber">${formatEUR(summary.totalBonus)}</p>
    </div>
    <div class="bg-white rounded-xl shadow-card p-3 border border-navy/5">
      <p class="text-xs text-slate-500">Общ надник</p>
      <p class="text-lg font-bold text-slate-700">${formatEUR(summary.totalAllowance)}</p>
    </div>
    <div class="bg-white rounded-xl shadow-card p-3 border border-navy/5">
      <p class="text-xs text-slate-500">Ваучер бонус</p>
      <p class="text-lg font-bold text-accent-sky">${formatEUR(summary.voucher)}</p>
    </div>`;
}

function renderPayoutBanner(summary) {
  const banner = document.getElementById('archive-payout');
  banner.innerHTML = `
    <div class="flex items-center justify-between">
      <div>
        <p class="text-white/80 text-sm font-medium">ЗА ПЛАЩАНЕ</p>
        <p class="text-3xl font-bold mt-1">${formatEUR(summary.finalPayout)}</p>
      </div>
      <div class="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </div>
    </div>
    <p class="text-white/60 text-xs mt-2">
      ${formatEUR(summary.totalDaily)} дневни + ${formatEUR(summary.voucher)} ваучер
    </p>`;
}
