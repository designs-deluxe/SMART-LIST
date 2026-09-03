/**
 * Saved Lists & Projects Service
 * Enables users to save cabinetry lists, name them, view them in a gallery, and reload them.
 */

import { OrderData } from './types.ts';
import { SAMPLE_CABINETRY_ITEMS } from './components/CabinetryOrganizerModal.tsx';

export interface SavedOrder {
  id: string;
  name: string;
  title?: string;
  orderNumber: string;
  clientName: string;
  supplierName: string;
  cabinetStyleColor: string;
  styleColor?: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  subTotal: number;
  grandTotal: number;
  orderData: OrderData;
  tags?: string[];
}

const STORAGE_KEY = 'deluxe_cabinetry_saved_orders_v1';

const INITIAL_SAMPLE_SAVED_ORDERS: SavedOrder[] = [
  {
    id: 'proj-sample-1',
    name: 'Horizon Villa - Full Kitchen Suite',
    orderNumber: 'PRJ-DEN-2025-01',
    clientName: 'Alexander Wright',
    supplierName: 'Deluxe Cabinetry Studio',
    cabinetStyleColor: 'Shaker White / Painted Birch',
    createdAt: 'Feb 10, 2025, 09:30 AM',
    updatedAt: 'Feb 12, 2025, 02:15 PM',
    itemCount: 12,
    subTotal: 5089.00,
    grandTotal: 5089.00,
    tags: ['Kitchen', 'Shaker', 'Denver Estate'],
    orderData: {
      brandName: 'Deluxe Cabinetry Studio',
      cabinetStyleColor: 'Shaker White / Painted Birch',
      orderNumber: 'PRJ-DEN-2025-01',
      orderDate: 'Feb 12, 2025',
      deliveryDate: 'Mar 05, 2025',
      customerDetails: {
        name: 'Alexander Wright',
        phone: '(555) 621-9844',
        email: 'alex.wright@horizondevelop.com',
      },
      shippingAddress: {
        addressLine1: '4820 Skyline Boulevard',
        recipientName: 'Alexander Wright',
        city: 'Denver',
        state: 'CO',
        zip: '80204',
      },
      columns: [
        { id: 'sku', label: 'SKU/Code', type: 'text' },
        { id: 'description', label: 'Item Description', type: 'text' },
        { id: 'quantity', label: 'Quantity', type: 'number' },
        { id: 'unitPrice', label: 'Unit Price', type: 'price' },
        { id: 'total', label: 'Total', type: 'price' },
      ],
      items: SAMPLE_CABINETRY_ITEMS,
      paymentMethod: 'Wire Transfer / 50% Deposit',
      shippingMethod: 'Dedicated Freight Liftgate',
      subTotal: 5089.00,
      vatTax: 0,
      discount: 0,
      grandTotal: 5089.00,
      termsAndConditions: 'Full payment is required before freight dispatch. Cabinetry is verified to NKBA tolerances.',
    }
  },
  {
    id: 'proj-sample-2',
    name: 'Pacific Heights Penthouse Wet Bar & Pantry',
    orderNumber: 'SF-PAC-884',
    clientName: 'Sophia Chen & Marcus Vance',
    supplierName: 'J&K Cabinetry',
    cabinetStyleColor: 'Modern Slab Charcoal Matte',
    createdAt: 'Jan 28, 2025, 11:00 AM',
    updatedAt: 'Feb 02, 2025, 04:45 PM',
    itemCount: 6,
    subTotal: 2940.00,
    grandTotal: 2940.00,
    tags: ['Wet Bar', 'Modern Slab', 'Commercial Penthouse'],
    orderData: {
      brandName: 'J&K Cabinetry',
      cabinetStyleColor: 'Modern Slab Charcoal Matte',
      orderNumber: 'SF-PAC-884',
      orderDate: 'Feb 02, 2025',
      deliveryDate: 'Feb 24, 2025',
      customerDetails: {
        name: 'Sophia Chen & Marcus Vance',
        phone: '(555) 890-4123',
        email: 'sophia.chen@vancearch.com',
      },
      shippingAddress: {
        addressLine1: '1244 Pacific Heights Road',
        recipientName: 'Sophia Chen',
        city: 'San Francisco',
        state: 'CA',
        zip: '94115',
      },
      columns: [
        { id: 'sku', label: 'SKU/Code', type: 'text' },
        { id: 'description', label: 'Item Description', type: 'text' },
        { id: 'quantity', label: 'Quantity', type: 'number' },
        { id: 'unitPrice', label: 'Unit Price', type: 'price' },
        { id: 'total', label: 'Total', type: 'price' },
      ],
      items: [
        { id: 'sb-1', sku: 'SB30', description: 'Sink Base 30"W 2 False Fronts', quantity: 1, unitPrice: 340.00, total: 340.00 },
        { id: 'sb-2', sku: 'DB18', description: '3-Drawer Base 18"W', quantity: 2, unitPrice: 380.00, total: 760.00 },
        { id: 'sb-3', sku: 'W3030', description: 'Upper Wall 30"W x 30"H', quantity: 2, unitPrice: 260.00, total: 520.00 },
        { id: 'sb-4', sku: 'U2484', description: 'Tall Utility Wine & Glass Pantry 24"W x 84"H', quantity: 1, unitPrice: 650.00, total: 650.00 },
        { id: 'sb-5', sku: 'BF3', description: 'Base Filler 3"W', quantity: 2, unitPrice: 42.00, total: 84.00 },
        { id: 'sb-6', sku: 'DWP', description: 'Dishwasher Return End Panel', quantity: 1, unitPrice: 135.00, total: 135.00 },
      ],
      paymentMethod: 'Credit Card',
      shippingMethod: 'Express Freight',
      subTotal: 2940.00,
      vatTax: 0,
      discount: 0,
      grandTotal: 2940.00,
      termsAndConditions: 'All custom sizes verified on architectural drawings.',
    }
  }
];

export function getSavedOrders(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Save sample projects to storage for immediate user feedback
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SAMPLE_SAVED_ORDERS));
      return INITIAL_SAMPLE_SAVED_ORDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLE_SAVED_ORDERS;
  } catch (err) {
    console.warn('Failed to read saved orders from localStorage:', err);
    return INITIAL_SAMPLE_SAVED_ORDERS;
  }
}

export const loadSavedOrders = getSavedOrders;

export function saveCurrentOrder(orderData: OrderData, customName?: string, existingId?: string): SavedOrder {
  const currentOrders = getSavedOrders();
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
    ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const resolvedName = (customName && customName.trim()) 
    || orderData.orderNumber 
    || (orderData.customerDetails?.name ? `${orderData.customerDetails.name}'s Cabinetry List` : 'Untitled Cabinetry Project');

  if (existingId) {
    const idx = currentOrders.findIndex(o => o.id === existingId);
    if (idx !== -1) {
      const updated: SavedOrder = {
        ...currentOrders[idx],
        name: resolvedName,
        title: resolvedName,
        orderNumber: orderData.orderNumber || currentOrders[idx].orderNumber,
        clientName: orderData.customerDetails?.name || currentOrders[idx].clientName,
        supplierName: orderData.brandName || currentOrders[idx].supplierName,
        cabinetStyleColor: orderData.cabinetStyleColor || currentOrders[idx].cabinetStyleColor,
        styleColor: orderData.cabinetStyleColor || currentOrders[idx].cabinetStyleColor,
        updatedAt: dateStr,
        itemCount: orderData.items?.length || 0,
        subTotal: orderData.subTotal || 0,
        grandTotal: orderData.grandTotal || 0,
        orderData: JSON.parse(JSON.stringify(orderData)),
      };
      currentOrders[idx] = updated;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrders));
      return updated;
    }
  }

  // Create new saved order
  const newOrder: SavedOrder = {
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: resolvedName,
    title: resolvedName,
    orderNumber: orderData.orderNumber || 'PRJ-' + Math.floor(1000 + Math.random() * 9000),
    clientName: orderData.customerDetails?.name || 'Unassigned Client',
    supplierName: orderData.brandName || 'Deluxe Cabinetry Studio',
    cabinetStyleColor: orderData.cabinetStyleColor || '',
    styleColor: orderData.cabinetStyleColor || '',
    createdAt: dateStr,
    updatedAt: dateStr,
    itemCount: orderData.items?.length || 0,
    subTotal: orderData.subTotal || 0,
    grandTotal: orderData.grandTotal || 0,
    orderData: JSON.parse(JSON.stringify(orderData)),
  };

  currentOrders.unshift(newOrder);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrders));
  return newOrder;
}

export function deleteSavedOrder(id: string): void {
  const currentOrders = getSavedOrders().filter(o => o.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentOrders));
}

export function duplicateSavedOrder(id: string): SavedOrder | null {
  const current = getSavedOrders();
  const item = current.find(o => o.id === id);
  if (!item) return null;

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
    ', ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const duplicated: SavedOrder = {
    ...item,
    id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name: `${item.name} (Copy)`,
    orderNumber: `${item.orderNumber}-COPY`,
    createdAt: dateStr,
    updatedAt: dateStr,
    orderData: JSON.parse(JSON.stringify(item.orderData)),
  };

  current.unshift(duplicated);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return duplicated;
}

export function exportSavedOrdersJSON(): string {
  const orders = getSavedOrders();
  return JSON.stringify(orders, null, 2);
}

export function importSavedOrdersJSON(jsonStr: string): number {
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const existing = getSavedOrders();
      const existingIds = new Set(existing.map(e => e.id));
      let added = 0;
      for (const item of parsed) {
        if (item.name && item.orderData) {
          if (!existingIds.has(item.id)) {
            existing.unshift(item);
            existingIds.add(item.id);
            added++;
          }
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      return added;
    }
    return 0;
  } catch (err) {
    console.error('Failed to import saved orders:', err);
    return 0;
  }
}
