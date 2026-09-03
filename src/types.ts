/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TableColumn {
  id: string;
  label: string;
  type: 'text' | 'number' | 'price';
}

export interface OrderItem {
  id: string;
  [key: string]: any;
}

export interface OrderData {
  brandName: string;
  cabinetStyleColor?: string;
  orderNumber: string;
  orderDate: string;
  deliveryDate: string;
  customerDetails: {
    name: string;
    phone: string;
    email: string;
  };
  shippingAddress: {
    addressLine1: string;
    recipientName: string;
    city: string;
    zip: string;
    state: string;
  };
  columns: TableColumn[];
  items: OrderItem[];
  paymentMethod: string;
  shippingMethod: string;
  subTotal: number;
  vatTax: number;
  discount: number;
  grandTotal: number;
  termsAndConditions: string;
  logoUrl?: string;
  signatureUrl?: string;
  signerName?: string;
  signedDate?: string;
}

export const INITIAL_ORDER_DATA: OrderData = {
  brandName: "Supplier Name",
  cabinetStyleColor: "",
  logoUrl: "",
  signatureUrl: "",
  signerName: "",
  signedDate: "",
  orderNumber: "Project Name",
  orderDate: "Feb 12, 2025",
  deliveryDate: "Feb 20, 2025",
  customerDetails: {
    name: "",
    phone: "",
    email: "",
  },
  shippingAddress: {
    addressLine1: "",
    recipientName: "",
    city: "",
    zip: "",
    state: "",
  },
  columns: [
    { id: 'description', label: 'Item Description', type: 'text' },
    { id: 'sku', label: 'SKU/Code', type: 'text' },
    { id: 'quantity', label: 'Quantity', type: 'number' },
    { id: 'unitPrice', label: 'Unit Price', type: 'price' },
    { id: 'total', label: 'Total', type: 'price' },
  ],
  items: [
    { id: '1', description: "Product name here", sku: "TS-1001", quantity: 5, unitPrice: 50, total: 250 }
  ],
  paymentMethod: "Credit Card",
  shippingMethod: "Standard Delivery",
  subTotal: 250,
  vatTax: 0,
  discount: 0,
  grandTotal: 250,
  termsAndConditions: "Full payment is required before processing the order. Returns are accepted within 14 days in original packaging. By signing, you confirm that the order details are correct.",
};
