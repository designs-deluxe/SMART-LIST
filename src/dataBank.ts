/**
 * Data Bank & Knowledge Base for Cabinetry, Suppliers, Clients, and Finishes
 * Enables instant auto-fill suggestions while typing and persistent catalog management.
 */

import { CabinetCategory } from './cabinetryUtils.ts';
import { OrderData } from './types.ts';

export interface CabinetCatalogItem {
  id: string;
  sku: string;
  description: string;
  unitPrice: number;
  category: CabinetCategory;
  dimensions?: string;
  styleColor?: string;
  supplier?: string;
}

export interface SupplierEntry {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  leadTime?: string;
  notes?: string;
}

export interface ClientEntry {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  company?: string;
}

export interface StyleColorEntry {
  id: string;
  name: string;
  finishType?: string;
  species?: string;
  hex?: string;
}

export interface DataBank {
  cabinets: CabinetCatalogItem[];
  suppliers: SupplierEntry[];
  clients: ClientEntry[];
  styles: StyleColorEntry[];
}

const STORAGE_KEY = 'deluxe_cabinetry_databank_v1';

export const DEFAULT_DATA_BANK: DataBank = {
  cabinets: [
    // Base Cabinets
    { id: 'db-cab-1', sku: 'B12', description: 'Standard Base Cabinet 12"W 1-Door 1-Drawer', unitPrice: 220.00, category: 'base', dimensions: '12"W x 34.5"H x 24"D' },
    { id: 'db-cab-2', sku: 'B15', description: 'Standard Base Cabinet 15"W 1-Door 1-Drawer', unitPrice: 240.00, category: 'base', dimensions: '15"W x 34.5"H x 24"D' },
    { id: 'db-cab-3', sku: 'B18', description: 'Standard Base Cabinet 18"W 1-Door 1-Drawer', unitPrice: 260.00, category: 'base', dimensions: '18"W x 34.5"H x 24"D' },
    { id: 'db-cab-4', sku: 'B21', description: 'Standard Base Cabinet 21"W 1-Door 1-Drawer', unitPrice: 285.00, category: 'base', dimensions: '21"W x 34.5"H x 24"D' },
    { id: 'db-cab-5', sku: 'B24', description: 'Standard Base Cabinet 24"W 2-Door 1-Drawer', unitPrice: 310.00, category: 'base', dimensions: '24"W x 34.5"H x 24"D' },
    { id: 'db-cab-6', sku: 'B27', description: 'Standard Base Cabinet 27"W 2-Door 1-Drawer', unitPrice: 325.00, category: 'base', dimensions: '27"W x 34.5"H x 24"D' },
    { id: 'db-cab-7', sku: 'B30', description: 'Standard Base Cabinet 30"W 2-Door 1-Drawer', unitPrice: 340.00, category: 'base', dimensions: '30"W x 34.5"H x 24"D' },
    { id: 'db-cab-8', sku: 'B33', description: 'Standard Base Cabinet 33"W 2-Door 2-Drawer', unitPrice: 365.00, category: 'base', dimensions: '33"W x 34.5"H x 24"D' },
    { id: 'db-cab-9', sku: 'B36', description: 'Standard Base Cabinet 36"W 2-Door 2-Drawer', unitPrice: 390.00, category: 'base', dimensions: '36"W x 34.5"H x 24"D' },
    { id: 'db-cab-10', sku: 'DB18', description: '3-Drawer Base Cabinet 18"W Full Extension Glides', unitPrice: 380.00, category: 'base', dimensions: '18"W x 34.5"H x 24"D' },
    { id: 'db-cab-11', sku: 'DB24', description: '3-Drawer Base Cabinet 24"W Full Extension Glides', unitPrice: 410.00, category: 'base', dimensions: '24"W x 34.5"H x 24"D' },
    { id: 'db-cab-12', sku: 'DB30', description: '3-Drawer Base Cabinet 30"W Full Extension Glides', unitPrice: 450.00, category: 'base', dimensions: '30"W x 34.5"H x 24"D' },
    { id: 'db-cab-13', sku: 'SB30', description: 'Sink Base Cabinet 30"W 2 False Fronts 2 Doors', unitPrice: 340.00, category: 'base', dimensions: '30"W x 34.5"H x 24"D' },
    { id: 'db-cab-14', sku: 'SB36', description: 'Sink Base Cabinet 36"W 2 False Fronts 2 Doors', unitPrice: 380.00, category: 'base', dimensions: '36"W x 34.5"H x 24"D' },
    { id: 'db-cab-15', sku: 'FSB36', description: 'Farmhouse / Apron Sink Base Cabinet 36"W', unitPrice: 420.00, category: 'base', dimensions: '36"W x 34.5"H x 24"D' },
    { id: 'db-cab-16', sku: 'LS36', description: 'Corner Lazy Susan Base 36" x 36" Bi-fold Door', unitPrice: 560.00, category: 'base', dimensions: '36"W x 34.5"H x 36"D' },
    { id: 'db-cab-17', sku: 'BBC42', description: 'Blind Base Corner Cabinet 42"W (Pulls to 45")', unitPrice: 410.00, category: 'base', dimensions: '42"W x 34.5"H x 24"D' },

    // Wall Cabinets
    { id: 'db-cab-18', sku: 'W1830', description: 'Wall Cabinet 18"W x 30"H 1-Door', unitPrice: 195.00, category: 'wall', dimensions: '18"W x 30"H x 12"D' },
    { id: 'db-cab-19', sku: 'W2430', description: 'Wall Cabinet 24"W x 30"H 2-Door', unitPrice: 235.00, category: 'wall', dimensions: '24"W x 30"H x 12"D' },
    { id: 'db-cab-20', sku: 'W3030', description: 'Wall Cabinet 30"W x 30"H 2-Door', unitPrice: 260.00, category: 'wall', dimensions: '30"W x 30"H x 12"D' },
    { id: 'db-cab-21', sku: 'W3630', description: 'Wall Cabinet 36"W x 30"H 2-Door', unitPrice: 285.00, category: 'wall', dimensions: '36"W x 30"H x 12"D' },
    { id: 'db-cab-22', sku: 'W3018', description: 'Wall Bridge Cabinet Over Range / Fridge 30"W x 18"H', unitPrice: 210.00, category: 'wall', dimensions: '30"W x 18"H x 12"D' },
    { id: 'db-cab-23', sku: 'W3618', description: 'Wall Bridge Cabinet Over Fridge 36"W x 18"H', unitPrice: 225.00, category: 'wall', dimensions: '36"W x 18"H x 24"D' },
    { id: 'db-cab-24', sku: 'W3042', description: 'Tall Wall Cabinet 30"W x 42"H 2-Door', unitPrice: 320.00, category: 'wall', dimensions: '30"W x 42"H x 12"D' },
    { id: 'db-cab-25', sku: 'W3642', description: 'Tall Wall Cabinet 36"W x 42"H 2-Door', unitPrice: 350.00, category: 'wall', dimensions: '36"W x 42"H x 12"D' },
    { id: 'db-cab-26', sku: 'DCW2430', description: 'Diagonal Corner Wall Cabinet 24"W x 30"H', unitPrice: 340.00, category: 'wall', dimensions: '24"W x 30"H x 24"D' },
    { id: 'db-cab-27', sku: 'MC3018', description: 'Microwave Wall Cabinet with Shelf 30"W x 18"H', unitPrice: 310.00, category: 'wall', dimensions: '30"W x 18"H x 18"D' },

    // Tall Pantries / Oven Cabinets
    { id: 'db-cab-28', sku: 'U2484', description: 'Tall Utility / Pantry Cabinet 24"W x 84"H 4-Door', unitPrice: 650.00, category: 'tall', dimensions: '24"W x 84"H x 24"D' },
    { id: 'db-cab-29', sku: 'U3084', description: 'Tall Utility / Pantry Cabinet 30"W x 84"H 4-Door', unitPrice: 740.00, category: 'tall', dimensions: '30"W x 84"H x 24"D' },
    { id: 'db-cab-30', sku: 'U3090', description: 'Tall Utility / Pantry Cabinet 30"W x 90"H 4-Door', unitPrice: 820.00, category: 'tall', dimensions: '30"W x 90"H x 24"D' },
    { id: 'db-cab-31', sku: 'OC3084', description: 'Built-in Single/Double Oven Cabinet 30"W x 84"H', unitPrice: 790.00, category: 'tall', dimensions: '30"W x 84"H x 24"D' },

    // Vanities
    { id: 'db-cab-32', sku: 'V24', description: 'Bathroom Vanity Sink Base 24"W 2-Door', unitPrice: 260.00, category: 'vanity', dimensions: '24"W x 34.5"H x 21"D' },
    { id: 'db-cab-33', sku: 'V30', description: 'Bathroom Vanity Sink Base 30"W 2-Door 1-Bottom Drawer', unitPrice: 320.00, category: 'vanity', dimensions: '30"W x 34.5"H x 21"D' },
    { id: 'db-cab-34', sku: 'V36', description: 'Bathroom Vanity Sink Base 36"W 2-Door Drawers', unitPrice: 390.00, category: 'vanity', dimensions: '36"W x 34.5"H x 21"D' },
    { id: 'db-cab-35', sku: 'V48', description: 'Bathroom Vanity Double Sink 48"W 4-Door Drawers', unitPrice: 580.00, category: 'vanity', dimensions: '48"W x 34.5"H x 21"D' },

    // Fillers & Moldings
    { id: 'db-cab-36', sku: 'BF3', description: 'Base Filler 3"W x 34.5"H Solid Wood', unitPrice: 42.00, category: 'fillers', dimensions: '3"W x 34.5"H x 3/4"D' },
    { id: 'db-cab-37', sku: 'BF6', description: 'Base Filler 6"W x 34.5"H Solid Wood', unitPrice: 58.00, category: 'fillers', dimensions: '6"W x 34.5"H x 3/4"D' },
    { id: 'db-cab-38', sku: 'WF330', description: 'Wall Filler 3"W x 30"H Solid Wood', unitPrice: 38.00, category: 'fillers', dimensions: '3"W x 30"H x 3/4"D' },
    { id: 'db-cab-39', sku: 'WF342', description: 'Wall Filler 3"W x 42"H Solid Wood', unitPrice: 48.00, category: 'fillers', dimensions: '3"W x 42"H x 3/4"D' },
    { id: 'db-cab-40', sku: 'TF384', description: 'Tall Pantry Filler 3"W x 84"H Solid Wood', unitPrice: 68.00, category: 'fillers', dimensions: '3"W x 84"H x 3/4"D' },
    { id: 'db-cab-41', sku: 'CM8', description: 'Crown Molding Cove 8ft Length (96")', unitPrice: 75.00, category: 'fillers', dimensions: '96"L x 3"H' },
    { id: 'db-cab-42', sku: 'TK8', description: 'Toe Kick Board 8ft Length (96")', unitPrice: 32.00, category: 'fillers', dimensions: '96"L x 4.5"H' },
    { id: 'db-cab-43', sku: 'LRM8', description: 'Under Cabinet Light Rail Molding 8ft', unitPrice: 45.00, category: 'fillers', dimensions: '96"L x 1.5"H' },

    // Panels & Skins
    { id: 'db-cab-44', sku: 'REP', description: 'Refrigerator End Panel 3/4" x 24" x 84"', unitPrice: 220.00, category: 'panels', dimensions: '24"W x 84"H x 3/4"D' },
    { id: 'db-cab-45', sku: 'REP-96', description: 'Refrigerator End Panel 3/4" x 24" x 96"', unitPrice: 250.00, category: 'panels', dimensions: '24"W x 96"H x 3/4"D' },
    { id: 'db-cab-46', sku: 'DWP', description: 'Dishwasher Return End Panel 3/4" x 24" x 34.5"', unitPrice: 135.00, category: 'panels', dimensions: '24"W x 34.5"H x 3/4"D' },
    { id: 'db-cab-47', sku: 'BEP', description: 'Base Decorative End Panel 24" x 34.5"', unitPrice: 115.00, category: 'panels', dimensions: '24"W x 34.5"H' },
    { id: 'db-cab-48', sku: 'WEP-30', description: 'Wall Decorative End Panel 12" x 30"', unitPrice: 85.00, category: 'panels', dimensions: '12"W x 30"H' },
    { id: 'db-cab-49', sku: 'ISL-PNL', description: 'Island Beadboard / Wainscot Back Panel 4ft x 8ft', unitPrice: 180.00, category: 'panels', dimensions: '48"W x 96"L x 1/4"D' },

    // Accessories
    { id: 'db-cab-50', sku: 'ROT18', description: 'Soft-Close Roll-Out Tray for 18" Base', unitPrice: 65.00, category: 'accessories', dimensions: 'Fits 18" Base' },
    { id: 'db-cab-51', sku: 'ROT24', description: 'Soft-Close Roll-Out Tray for 24" Base', unitPrice: 75.00, category: 'accessories', dimensions: 'Fits 24" Base' },
    { id: 'db-cab-52', sku: 'TR24', description: 'Double Trash Can Pull-out Unit 24" Base', unitPrice: 165.00, category: 'accessories', dimensions: 'Fits 24" Base' },
    { id: 'db-cab-53', sku: 'TUK-W', description: 'Cabinet Touch-Up Kit (Marker & Fill Stick - White)', unitPrice: 25.00, category: 'accessories' },
  ],
  suppliers: [
    { id: 'sup-1', name: 'Deluxe Cabinetry Studio', contactPerson: 'Michael Vance', email: 'orders@deluxecs.com', phone: '(555) 349-2810', leadTime: '2-3 Weeks', notes: 'Primary high-end supplier with quick freight turnaround.' },
    { id: 'sup-2', name: 'J&K Cabinetry', contactPerson: 'David Chen', email: 'wholesale@jkcabinetry.com', phone: '(555) 782-9011', leadTime: '1-2 Weeks', notes: 'Solid maple plywood box frames, soft-close standard.' },
    { id: 'sup-3', name: 'Fabuwood Cabinetry', contactPerson: 'Rachel Miller', email: 'support@fabuwood.com', phone: '(555) 441-8930', leadTime: '3-4 Weeks', notes: 'Premium designer lines: Allure, Galaxy, Nexus.' },
    { id: 'sup-4', name: 'Wolf Classic Cabinets', contactPerson: 'Thomas Gray', email: 'orders@wolfhomeproducts.com', phone: '(555) 912-3344', leadTime: '2 Weeks', notes: 'Durable finish, competitive cost-effective builder series.' },
    { id: 'sup-5', name: 'CNC Cabinetry', contactPerson: 'Angela Rossi', email: 'sales@cnccabinetry.com', phone: '(555) 234-5678', leadTime: '1-2 Weeks', notes: 'Stock lines ready to ship within 5-7 business days.' },
    { id: 'sup-6', name: 'KraftMaid Designer Series', contactPerson: 'Jason Briggs', email: 'designer@kraftmaid.com', phone: '(555) 800-4321', leadTime: '4-6 Weeks', notes: 'Custom semi-custom configurations with lifetime warranty.' },
  ],
  clients: [
    { id: 'cli-1', name: 'Alexander Wright', email: 'alex.wright@horizondevelop.com', phone: '(555) 621-9844', addressLine1: '4820 Skyline Boulevard', city: 'Denver', state: 'CO', zip: '80204', company: 'Horizon Development Group' },
    { id: 'cli-2', name: 'Sophia Chen & Marcus Vance', email: 'sophia.chen@vancearch.com', phone: '(555) 890-4123', addressLine1: '1244 Pacific Heights Road', city: 'San Francisco', state: 'CA', zip: '94115', company: 'Vance Architecture Studios' },
    { id: 'cli-3', name: 'Julian Gallagher', email: 'j.gallagher@estatebuild.org', phone: '(555) 304-8921', addressLine1: '782 Highland Ridge Lane', city: 'Austin', state: 'TX', zip: '78701', company: 'Gallagher Custom Homes' },
    { id: 'cli-4', name: 'Olivia & Liam Davies', email: 'davies.home@gmail.com', phone: '(555) 472-1109', addressLine1: '315 Magnolia Blossom Way', city: 'Charleston', state: 'SC', zip: '29401' },
    { id: 'cli-5', name: 'Ethan & Maya Bennett', email: 'maya.bennett@bennettdesign.net', phone: '(555) 763-5590', addressLine1: '950 Lakeview Parkway Suite 400', city: 'Chicago', state: 'IL', zip: '60601', company: 'Bennett Interiors' },
  ],
  styles: [
    { id: 'sty-1', name: 'Shaker White / Painted Birch', finishType: 'Painted Satin', species: 'Birch Hardwood', hex: '#F9FAFB' },
    { id: 'sty-2', name: 'Espresso Stained Maple', finishType: 'Rich Dark Stain', species: 'Hard Maple', hex: '#2A1D1A' },
    { id: 'sty-3', name: 'Modern Slab Charcoal Matte', finishType: 'Ultra-Matte Acrylic', species: 'Engineered Core', hex: '#26282B' },
    { id: 'sty-4', name: 'Cobblestone Gray Shaker', finishType: 'Semi-Gloss Enamel', species: 'Birch Hardwood', hex: '#71767E' },
    { id: 'sty-5', name: 'Navy Blue Brass Accent', finishType: 'Deep Matte Navy', species: 'Hard Maple', hex: '#1E293B' },
    { id: 'sty-6', name: 'Warm Honey Natural Oak', finishType: 'Clear Natural Grain', species: 'White Oak', hex: '#D2A26F' },
    { id: 'sty-7', name: 'Forest Green Shaker', finishType: 'Satin Enamel', species: 'Birch Hardwood', hex: '#23382D' },
    { id: 'sty-8', name: 'Cream Off-White Glaze', finishType: 'Hand-Wiped Glaze', species: 'Hard Maple', hex: '#F5EFE6' },
  ]
};

export function loadDataBank(): DataBank {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA_BANK;
    const parsed = JSON.parse(raw);
    return {
      cabinets: Array.isArray(parsed.cabinets) ? parsed.cabinets : DEFAULT_DATA_BANK.cabinets,
      suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : DEFAULT_DATA_BANK.suppliers,
      clients: Array.isArray(parsed.clients) ? parsed.clients : DEFAULT_DATA_BANK.clients,
      styles: Array.isArray(parsed.styles) ? parsed.styles : DEFAULT_DATA_BANK.styles,
    };
  } catch (err) {
    console.warn('Failed to load Data Bank from localStorage:', err);
    return DEFAULT_DATA_BANK;
  }
}

export function saveDataBank(dataBank: DataBank): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataBank));
  } catch (err) {
    console.error('Failed to save Data Bank to localStorage:', err);
  }
}

export function exportDataBankJSON(): string {
  const bank = loadDataBank();
  return JSON.stringify(bank, null, 2);
}

export function importDataBankJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed && (parsed.cabinets || parsed.suppliers || parsed.clients || parsed.styles)) {
      const current = loadDataBank();
      const updated: DataBank = {
        cabinets: Array.isArray(parsed.cabinets) ? parsed.cabinets : current.cabinets,
        suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers : current.suppliers,
        clients: Array.isArray(parsed.clients) ? parsed.clients : current.clients,
        styles: Array.isArray(parsed.styles) ? parsed.styles : current.styles,
      };
      saveDataBank(updated);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to import data bank JSON:', err);
    return false;
  }
}

/**
 * 1-Click extraction: Learns any new items, suppliers, clients, or styles from the current order form
 */
export function extractAndSaveFromOrder(order: OrderData): {
  addedCabinets: number;
  addedClients: number;
  addedSuppliers: number;
  addedStyles: number;
} {
  const bank = loadDataBank();
  let addedCabinets = 0;
  let addedClients = 0;
  let addedSuppliers = 0;
  let addedStyles = 0;

  // 1. Extract supplier
  if (order.brandName && order.brandName.trim() && order.brandName !== 'Supplier Name') {
    const norm = order.brandName.trim().toLowerCase();
    if (!bank.suppliers.some(s => s.name.toLowerCase() === norm)) {
      bank.suppliers.push({
        id: `sup-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: order.brandName.trim(),
      });
      addedSuppliers++;
    }
  }

  // 2. Extract style/color
  if (order.cabinetStyleColor && order.cabinetStyleColor.trim()) {
    const norm = order.cabinetStyleColor.trim().toLowerCase();
    if (!bank.styles.some(s => s.name.toLowerCase() === norm)) {
      bank.styles.push({
        id: `sty-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: order.cabinetStyleColor.trim(),
      });
      addedStyles++;
    }
  }

  // 3. Extract client & address
  const clientName = order.customerDetails?.name?.trim() || order.shippingAddress?.recipientName?.trim();
  const addressLine = order.shippingAddress?.addressLine1?.trim();
  if (clientName && clientName.length > 1) {
    const norm = clientName.toLowerCase();
    const existing = bank.clients.find(c => c.name.toLowerCase() === norm);
    if (!existing) {
      bank.clients.push({
        id: `cli-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: clientName,
        email: order.customerDetails?.email || '',
        phone: order.customerDetails?.phone || '',
        addressLine1: addressLine || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        zip: order.shippingAddress?.zip || '',
      });
      addedClients++;
    }
  }

  // 4. Extract cabinet SKUs & items
  if (Array.isArray(order.items)) {
    for (const it of order.items) {
      const sku = String(it.sku || '').trim();
      const desc = String(it.description || '').trim();
      const price = Number(it.unitPrice) || 0;

      if (sku && sku.length >= 2) {
        const normSku = sku.toUpperCase();
        const existing = bank.cabinets.find(c => c.sku.toUpperCase() === normSku);
        if (!existing) {
          // Identify category from SKU prefix
          let cat: CabinetCategory = 'other';
          if (/^(B|DB|SB|BBC|LS|CB|FSB)/i.test(sku)) cat = 'base';
          else if (/^(W|WW|DCW|WDC|MC)/i.test(sku)) cat = 'wall';
          else if (/^(U|T|PC|OC)/i.test(sku)) cat = 'tall';
          else if (/^(V|VS|VDB)/i.test(sku)) cat = 'vanity';
          else if (/^(BF|WF|TF|CM|TK|LRM)/i.test(sku)) cat = 'fillers';
          else if (/^(REP|BEP|WEP|DWP|PNL)/i.test(sku)) cat = 'panels';
          else if (/^(ROT|TR|SP|TUK)/i.test(sku)) cat = 'accessories';

          bank.cabinets.push({
            id: `cab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            sku,
            description: desc || sku,
            unitPrice: price,
            category: cat,
            supplier: order.brandName !== 'Supplier Name' ? order.brandName : undefined,
            styleColor: order.cabinetStyleColor || undefined,
          });
          addedCabinets++;
        }
      }
    }
  }

  saveDataBank(bank);
  return { addedCabinets, addedClients, addedSuppliers, addedStyles };
}
