/**
 * Cabinetry Notation Standards and Classification Utilities
 * Identifies standard architectural / millwork cabinetry codes (NKBA standard):
 * - Base Cabinets: B, DB (Drawer Base), SB (Sink Base), BBC (Blind Base Corner), LS (Lazy Susan), FSB (Farm Sink)
 * - Wall Cabinets: W, DCW (Diagonal Corner Wall), MC (Microwave Wall), WDC
 * - Tall / Pantry: U (Utility), T (Tall), PC (Pantry Cabinet), OC (Oven Cabinet), POC
 * - Vanity Cabinets: V, VS (Vanity Sink), VDB (Vanity Drawer Base)
 * - Fillers & Trim: BF (Base Filler), WF (Wall Filler), TF (Tall Filler), CM (Crown Molding), SM (Scribe), TK (Toe Kick), LRM (Light Rail)
 * - Panels & Skins: REP (Refrigerator End Panel), BEP (Base End Panel), WEP (Wall End Panel), TEP (Tall End Panel), DWP (Dishwasher Return Panel)
 * - Accessories: ROT (Roll-out Tray), Cutlery, Trash pull-out, Touch-up Kit, Hardware
 */

import { OrderItem } from './types.ts';

export type CabinetCategory = 
  | 'base' 
  | 'wall' 
  | 'tall' 
  | 'vanity' 
  | 'fillers' 
  | 'panels' 
  | 'accessories' 
  | 'other';

export interface CabinetClassification {
  category: CabinetCategory;
  categoryName: string;
  badgeColor: string;
  width?: number;
  height?: number;
}

export const CABINET_CATEGORY_INFO: Record<CabinetCategory, { label: string; badgeColor: string; orderIndex: number }> = {
  base: { label: 'Base Cabinets', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300', orderIndex: 1 },
  wall: { label: 'Wall Cabinets (Upper)', badgeColor: 'bg-sky-100 text-sky-800 border-sky-300', orderIndex: 2 },
  tall: { label: 'Tall / Pantries', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300', orderIndex: 3 },
  vanity: { label: 'Vanities', badgeColor: 'bg-purple-100 text-purple-800 border-purple-300', orderIndex: 4 },
  fillers: { label: 'Fillers & Moldings', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300', orderIndex: 5 },
  panels: { label: 'Panels & Skins', badgeColor: 'bg-rose-100 text-rose-800 border-rose-300', orderIndex: 6 },
  accessories: { label: 'Accessories & Hardware', badgeColor: 'bg-teal-100 text-teal-800 border-teal-300', orderIndex: 7 },
  other: { label: 'Other Items', badgeColor: 'bg-gray-100 text-gray-700 border-gray-300', orderIndex: 8 },
};

export const DEFAULT_CABINET_PREFIXES: Record<CabinetCategory, string[]> = {
  base: ['B', 'DB', 'SB', 'BBC', 'LS', 'CB', '2B', '3DB', '4DB', 'FSB', 'BWD', 'WSB', 'CW', 'BC'],
  wall: ['W', 'WW', 'DCW', 'WDC', 'MC', 'UR', 'WC'],
  tall: ['U', 'T', 'PC', 'OC', 'POC', 'UT', 'UC', 'DTC'],
  vanity: ['V', 'VS', 'VDB', 'VSD', 'VB'],
  fillers: ['BF', 'WF', 'TF', 'FF', 'F3', 'F6', 'CM', 'SM', 'BM', 'TK', 'TKM', 'QR', 'LRM', 'VAL', 'FLF'],
  panels: ['REP', 'BEP', 'WEP', 'TEP', 'DWP', 'DWR', 'FEP', 'PNL', 'PANEL', 'BP', 'ISL-PNL', 'SKIN'],
  accessories: ['ROT', 'TR', 'SP', 'TUK', 'HDL', 'KNB', 'HNG', 'SCRW'],
  other: [],
};

const PREFIX_STORAGE_KEY = 'deluxe_cabinetry_prefixes_v1';

export function getSavedPrefixes(): Record<CabinetCategory, string[]> {
  try {
    const raw = localStorage.getItem(PREFIX_STORAGE_KEY);
    if (!raw) return DEFAULT_CABINET_PREFIXES;
    const parsed = JSON.parse(raw);
    const result = { ...DEFAULT_CABINET_PREFIXES };
    for (const key of Object.keys(DEFAULT_CABINET_PREFIXES) as CabinetCategory[]) {
      if (Array.isArray(parsed[key])) {
        result[key] = parsed[key];
      }
    }
    return result;
  } catch (err) {
    console.warn('Failed to load prefixes from localStorage:', err);
    return DEFAULT_CABINET_PREFIXES;
  }
}

export function saveCustomPrefixes(prefixes: Record<CabinetCategory, string[]>): void {
  try {
    localStorage.setItem(PREFIX_STORAGE_KEY, JSON.stringify(prefixes));
  } catch (err) {
    console.error('Failed to save prefixes to localStorage:', err);
  }
}

export function resetPrefixesToDefault(): Record<CabinetCategory, string[]> {
  try {
    localStorage.removeItem(PREFIX_STORAGE_KEY);
  } catch (err) {
    console.error(err);
  }
  return DEFAULT_CABINET_PREFIXES;
}

export function classifyCabinetItem(
  item: OrderItem,
  customPrefixes?: Record<CabinetCategory, string[]>
): CabinetClassification {
  const prefixes = customPrefixes || getSavedPrefixes();
  const rawSku = String(item.sku || '').trim().toUpperCase();
  const rawDesc = String(item.description || '').trim().toLowerCase();
  const combined = `${rawSku} ${rawDesc}`.toUpperCase();

  // Helper to match custom or standard prefixes
  const matchesPrefixList = (prefixList: string[]) => {
    if (!prefixList || prefixList.length === 0) return false;
    return prefixList.some(p => {
      const up = p.trim().toUpperCase();
      if (!up) return false;
      return rawSku === up || rawSku.startsWith(up);
    });
  };

  // 1. Panels & Skins check
  if (
    matchesPrefixList(prefixes.panels) ||
    /^(REP|BEP|WEP|TEP|DWP|DWR|FEP|PNL|PANEL|BP|ISL-PNL|SKIN)/i.test(rawSku) ||
    combined.includes('REFRIGERATOR END PANEL') ||
    combined.includes('DISHWASHER PANEL') ||
    combined.includes('END PANEL') ||
    combined.includes('BACK PANEL') ||
    combined.includes('ISLAND PANEL') ||
    combined.includes('DECORATIVE PANEL') ||
    combined.includes('SKIN PANEL') ||
    combined.includes('WAINSCOT') ||
    rawDesc.includes('panel') ||
    rawDesc.includes('skin')
  ) {
    return {
      category: 'panels',
      categoryName: CABINET_CATEGORY_INFO.panels.label,
      badgeColor: CABINET_CATEGORY_INFO.panels.badgeColor,
    };
  }

  // 2. Fillers & Moldings / Trim
  if (
    matchesPrefixList(prefixes.fillers) ||
    /^(BF|WF|TF|FF|F3|F6|CM|SM|BM|TK|TKM|QR|LRM|VAL|FLF)/i.test(rawSku) ||
    combined.includes('FILLER') ||
    combined.includes('BASE FILLER') ||
    combined.includes('WALL FILLER') ||
    combined.includes('TALL FILLER') ||
    combined.includes('FLUTED FILLER') ||
    combined.includes('CROWN MOLDING') ||
    combined.includes('SCRIBE MOLDING') ||
    combined.includes('BASE MOLDING') ||
    combined.includes('TOE KICK') ||
    combined.includes('TOEKICK') ||
    combined.includes('LIGHT RAIL') ||
    combined.includes('VALANCE') ||
    rawDesc.includes('filler') ||
    rawDesc.includes('molding') ||
    rawDesc.includes('moulding') ||
    rawDesc.includes('toe kick')
  ) {
    return {
      category: 'fillers',
      categoryName: CABINET_CATEGORY_INFO.fillers.label,
      badgeColor: CABINET_CATEGORY_INFO.fillers.badgeColor,
    };
  }

  // 3. Tall Cabinets / Pantries / Oven Cabinets
  if (
    matchesPrefixList(prefixes.tall) ||
    /^(U|T|PC|OC|POC|UT|UC|DTC)\d+/i.test(rawSku) ||
    combined.includes('PANTRY') ||
    combined.includes('UTILITY') ||
    combined.includes('TALL CABINET') ||
    combined.includes('OVEN CABINET') ||
    combined.includes('DOUBLE OVEN') ||
    rawDesc.includes('pantry') ||
    rawDesc.includes('tall cabinet') ||
    rawDesc.includes('utility cabinet')
  ) {
    const match = rawSku.match(/\d+/);
    const width = match ? parseInt(match[0].substring(0, 2), 10) : undefined;
    return {
      category: 'tall',
      categoryName: CABINET_CATEGORY_INFO.tall.label,
      badgeColor: CABINET_CATEGORY_INFO.tall.badgeColor,
      width,
    };
  }

  // 4. Vanities
  if (
    matchesPrefixList(prefixes.vanity) ||
    /^(V|VS|VDB|VSD|VB)\d+/i.test(rawSku) ||
    combined.includes('VANITY') ||
    rawDesc.includes('vanity')
  ) {
    const match = rawSku.match(/\d+/);
    const width = match ? parseInt(match[0], 10) : undefined;
    return {
      category: 'vanity',
      categoryName: CABINET_CATEGORY_INFO.vanity.label,
      badgeColor: CABINET_CATEGORY_INFO.vanity.badgeColor,
      width,
    };
  }

  // 5. Wall Cabinets (Upper)
  if (
    matchesPrefixList(prefixes.wall) ||
    /^(W|WW|DCW|WDC|MC|UR|WC)\d+/i.test(rawSku) ||
    combined.includes('WALL CABINET') ||
    combined.includes('UPPER CABINET') ||
    combined.includes('WALL DIAGONAL') ||
    combined.includes('CORNER WALL') ||
    combined.includes('MICROWAVE WALL') ||
    rawDesc.includes('wall cabinet') ||
    rawDesc.includes('upper cabinet')
  ) {
    const match = rawSku.match(/\d+/);
    const num = match ? match[0] : '';
    const width = num.length >= 4 ? parseInt(num.substring(0, 2), 10) : (num.length >= 2 ? parseInt(num.substring(0, 2), 10) : undefined);
    const height = num.length >= 4 ? parseInt(num.substring(2, 4), 10) : undefined;
    return {
      category: 'wall',
      categoryName: CABINET_CATEGORY_INFO.wall.label,
      badgeColor: CABINET_CATEGORY_INFO.wall.badgeColor,
      width,
      height,
    };
  }

  // 6. Base Cabinets
  if (
    matchesPrefixList(prefixes.base) ||
    /^(B|DB|SB|BBC|LS|CB|2B|3DB|4DB|FSB|BWD|WSB|CW|BC)\d+/i.test(rawSku) ||
    combined.includes('BASE CABINET') ||
    combined.includes('DRAWER BASE') ||
    combined.includes('SINK BASE') ||
    combined.includes('LAZY SUSAN') ||
    combined.includes('CORNER BASE') ||
    combined.includes('BLIND BASE') ||
    combined.includes('FARM SINK BASE') ||
    rawDesc.includes('base cabinet') ||
    rawDesc.includes('drawer base') ||
    rawDesc.includes('sink base') ||
    rawDesc.includes('lazy susan')
  ) {
    const match = rawSku.match(/\d+/);
    const width = match ? parseInt(match[0], 10) : undefined;
    return {
      category: 'base',
      categoryName: CABINET_CATEGORY_INFO.base.label,
      badgeColor: CABINET_CATEGORY_INFO.base.badgeColor,
      width,
    };
  }

  // 7. Accessories & Hardware
  if (
    matchesPrefixList(prefixes.accessories) ||
    /^(ROT|TR|SP|TUK|HDL|KNB|HNG|SCRW)/i.test(rawSku) ||
    combined.includes('ROLL OUT') ||
    combined.includes('ROLLOUT') ||
    combined.includes('CUTLERY') ||
    combined.includes('TRASH') ||
    combined.includes('TOUCH UP') ||
    combined.includes('TOUCH-UP') ||
    combined.includes('HARDWARE') ||
    combined.includes('HINGE') ||
    combined.includes('HANDLE') ||
    combined.includes('KNOB') ||
    rawDesc.includes('roll out') ||
    rawDesc.includes('accessory') ||
    rawDesc.includes('hardware')
  ) {
    return {
      category: 'accessories',
      categoryName: CABINET_CATEGORY_INFO.accessories.label,
      badgeColor: CABINET_CATEGORY_INFO.accessories.badgeColor,
    };
  }

  return {
    category: 'other',
    categoryName: CABINET_CATEGORY_INFO.other.label,
    badgeColor: CABINET_CATEGORY_INFO.other.badgeColor,
  };
}

/**
 * Local rule-based sorter used as a fallback if network/AI is unavailable
 */
export function reorderCabinetItemsLocally(
  items: OrderItem[],
  instruction: string,
  customPrefixes?: Record<CabinetCategory, string[]>
): { items: OrderItem[]; summary: string } {
  const norm = instruction.toLowerCase();

  // Determine requested sequence
  let sequence: CabinetCategory[] = ['base', 'wall', 'tall', 'fillers', 'panels', 'accessories', 'other'];

  const isViceVersa = norm.includes('vice versa') || norm.includes('vic versa') || norm.includes('reverse');

  // Check if explicit categories were specified in instruction
  const tokens = ['base', 'wall', 'tall', 'fillers', 'filler', 'panels', 'panel', 'vanity', 'vanities', 'accessories'];
  const foundOrder: CabinetCategory[] = [];

  // Simple token scan in the order they appear in the instruction
  const regex = /(base|wall|tall|pantr|filler|panel|vanit|accessor)/gi;
  let match;
  while ((match = regex.exec(norm)) !== null) {
    const word = match[0].toLowerCase();
    let cat: CabinetCategory | null = null;
    if (word.startsWith('base')) cat = 'base';
    else if (word.startsWith('wall')) cat = 'wall';
    else if (word.startsWith('tall') || word.startsWith('pantr')) cat = 'tall';
    else if (word.startsWith('filler')) cat = 'fillers';
    else if (word.startsWith('panel')) cat = 'panels';
    else if (word.startsWith('vanit')) cat = 'vanity';
    else if (word.startsWith('accessor')) cat = 'accessories';

    if (cat && !foundOrder.includes(cat)) {
      foundOrder.push(cat);
    }
  }

  if (foundOrder.length >= 2) {
    sequence = foundOrder;
    // Append any missing categories at the end
    const standardAll: CabinetCategory[] = ['base', 'wall', 'tall', 'fillers', 'panels', 'vanity', 'accessories', 'other'];
    for (const c of standardAll) {
      if (!sequence.includes(c)) sequence.push(c);
    }
  }

  if (isViceVersa && foundOrder.length < 2) {
    // Standard reverse: Panels -> Fillers -> Tall -> Wall -> Base
    sequence = ['panels', 'fillers', 'tall', 'wall', 'base', 'vanity', 'accessories', 'other'];
  } else if (isViceVersa && foundOrder.length >= 2) {
    sequence.reverse();
  }

  // Classify each item with custom prefixes
  const classified = items.map(item => ({
    item,
    meta: classifyCabinetItem(item, customPrefixes),
  }));

  // Sort according to sequence order, then by width if available, then SKU
  const sortByWidth = norm.includes('width') || norm.includes('size') || norm.includes('dimension');

  classified.sort((a, b) => {
    const seqA = sequence.indexOf(a.meta.category);
    const seqB = sequence.indexOf(b.meta.category);
    const rankA = seqA === -1 ? 999 : seqA;
    const rankB = seqB === -1 ? 999 : seqB;

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    if (sortByWidth && a.meta.width && b.meta.width) {
      return a.meta.width - b.meta.width;
    }

    // Default secondary sort: natural SKU ordering
    const skuA = String(a.item.sku || a.item.description || '');
    const skuB = String(b.item.sku || b.item.description || '');
    return skuA.localeCompare(skuB, undefined, { numeric: true, sensitivity: 'base' });
  });

  const categoryCounts: Record<string, number> = {};
  for (const c of classified) {
    categoryCounts[c.meta.category] = (categoryCounts[c.meta.category] || 0) + 1;
  }

  const parts = sequence
    .filter(cat => categoryCounts[cat] > 0)
    .map(cat => `${CABINET_CATEGORY_INFO[cat].label} (${categoryCounts[cat]})`);

  const summary = `Re-arranged ${items.length} items according to cabinetry standards: ${parts.join(' → ')}.`;

  return {
    items: classified.map(c => c.item),
    summary,
  };
}
