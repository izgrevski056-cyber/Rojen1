/** @typedef {{ region: string, deliveries: import('./storage.js').Delivery[], delivered: number, total: number }} RegionGroup */

export const DEFAULT_REGIONS = [
  'Поморие',
  'Равда',
  'Несебър',
  'Слънчев бряг',
  'Свети Влас',
  'Бургас'
];

export const OTHER_REGION_VALUE = '__other__';
export const LAST_REGION_KEY = 'rozhen1_last_region';
export const NO_REGION_LABEL = 'Без район';

/** @param {string | undefined | null} region */
export function normalizeRegionLabel(region) {
  const trimmed = (region || '').trim();
  return trimmed || NO_REGION_LABEL;
}

/**
 * Groups deliveries by region, preserving route order (first stop in a region).
 * @param {import('./storage.js').Delivery[]} deliveries
 * @returns {RegionGroup[]}
 */
export function groupDeliveriesByRegion(deliveries) {
  /** @type {Map<string, import('./storage.js').Delivery[]>} */
  const groups = new Map();
  /** @type {Map<string, number>} */
  const regionOrder = new Map();
  let orderIndex = 0;

  for (const delivery of deliveries) {
    const region = normalizeRegionLabel(delivery.region);
    if (!regionOrder.has(region)) {
      regionOrder.set(region, orderIndex++);
    }
    if (!groups.has(region)) {
      groups.set(region, []);
    }
    groups.get(region).push(delivery);
  }

  return [...groups.entries()]
    .sort((a, b) => regionOrder.get(a[0]) - regionOrder.get(b[0]))
    .map(([region, items]) => ({
      region,
      deliveries: items,
      delivered: items.filter(d => d.delivered).length,
      total: items.length
    }));
}

/** @param {RegionGroup[]} groups */
export function isAllRegionsComplete(groups) {
  return groups.length > 0 && groups.every(g => g.delivered === g.total);
}
