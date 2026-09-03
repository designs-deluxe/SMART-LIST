import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  Loader2,
  Save,
  Grid,
  FileSpreadsheet,
  Undo2,
  Redo2,
  X,
  Files,
  FilePlus,
  GripVertical,
  ArrowUp,
  ArrowDown,
  PenLine,
  Check,
  Sparkles,
  Wand2,
  Layers,
  Boxes,
  Database,
  FolderArchive,
  BookmarkCheck,
  RotateCcw,
  Sparkle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toPng, toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { OrderData, OrderItem, INITIAL_ORDER_DATA } from './types.ts';
import { parseOrderImage } from './geminiService.ts';
import { SignatureModal } from './components/SignatureModal.tsx';
import { CabinetryOrganizerModal, SAMPLE_CABINETRY_ITEMS } from './components/CabinetryOrganizerModal.tsx';
import { DataBankModal } from './components/DataBankModal.tsx';
import { SavedListsModal } from './components/SavedListsModal.tsx';
import { AutoFillSuggestions, SuggestionItem } from './components/AutoFillSuggestions.tsx';
import { 
  DataBank, 
  CabinetCatalogItem, 
  ClientEntry, 
  loadDataBank, 
  extractAndSaveFromOrder 
} from './dataBank.ts';
import { saveCurrentOrder, loadSavedOrders } from './savedListsService.ts';
import { CABINET_CATEGORY_INFO } from './cabinetryUtils.ts';

const getQtyColumnId = (columns: any[]): string => {
  const col = columns.find(c => c.id === 'quantity' || c.id.toLowerCase().includes('qty') || c.label.toLowerCase().includes('qty') || c.label.toLowerCase().includes('quantity'));
  return col?.id || 'quantity';
};

const getUnitPriceColumnId = (columns: any[]): string => {
  const col = columns.find(c => c.id === 'unitPrice' || c.id.toLowerCase().includes('unit') || (c.label.toLowerCase().includes('price') && !c.id.toLowerCase().includes('total') && !c.label.toLowerCase().includes('total')));
  return col?.id || 'unitPrice';
};

const getTotalColumnId = (columns: any[]): string => {
  // 1. Look for ID 'total'
  if (columns.some(c => c.id === 'total')) return 'total';
  
  // 2. Look for ID or label containing 'total' or 'amount' (case insensitive)
  const totalCol = columns.find(c => 
    c.id.toLowerCase().includes('total') || 
    c.id.toLowerCase().includes('amount') ||
    c.label.toLowerCase().includes('total') || 
    c.label.toLowerCase().includes('amount')
  );
  if (totalCol) return totalCol.id;

  // 3. Look for any column of type 'price' that is not 'unitPrice' or 'rate'
  const priceCol = columns.find(c => 
    c.type === 'price' && 
    c.id !== 'unitPrice' && 
    !c.id.toLowerCase().includes('unit') &&
    !c.label.toLowerCase().includes('unit') &&
    !c.label.toLowerCase().includes('rate')
  );
  if (priceCol) return priceCol.id;

  // 4. Fallback to the last column of type 'price'
  const lastPriceCol = [...columns].reverse().find(c => c.type === 'price');
  if (lastPriceCol) return lastPriceCol.id;

  return 'total';
};

export default function App() {
  const [data, setData] = useState<OrderData>(INITIAL_ORDER_DATA);
  const [history, setHistory] = useState<OrderData[]>([]);
  const [redoStack, setRedoStack] = useState<OrderData[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStatus, setParsingStatus] = useState("Scanning...");
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [isExporting, setIsExporting] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [isCabinetryModalOpen, setIsCabinetryModalOpen] = useState(false);
  const [aiReorderSummary, setAiReorderSummary] = useState<string | null>(null);
  const [dataBank, setDataBank] = useState<DataBank>(() => loadDataBank());
  const [isDataBankModalOpen, setIsDataBankModalOpen] = useState(false);
  const [isSavedListsModalOpen, setIsSavedListsModalOpen] = useState(false);
  const [quickSaveFeedback, setQuickSaveFeedback] = useState<string | null>(null);

  interface AutoFillState {
    target: 'brandName' | 'cabinetStyleColor' | 'clientName' | 'shippingAddress' | 'itemSku' | 'itemDesc';
    itemId?: string;
    colId?: string;
    query: string;
    suggestions: SuggestionItem[];
    selectedIndex: number;
  }
  const [autoFillState, setAutoFillState] = useState<AutoFillState | null>(null);

  const refreshDataBank = () => {
    setDataBank(loadDataBank());
  };

  const getSuggestions = useCallback((target: string, query: string): SuggestionItem[] => {
    const q = (query || '').toLowerCase().trim();
    if (target === 'brandName') {
      const list = dataBank.suppliers.filter(s => !q || s.name.toLowerCase().includes(q) || (s.notes && s.notes.toLowerCase().includes(q)));
      return list.slice(0, 6).map(s => ({
        id: s.id,
        type: 'supplier' as const,
        title: s.name,
        subtitle: [s.contactPerson, s.phone, s.notes].filter(Boolean).join(' • ') || 'Supplier',
        badge: 'Supplier',
        data: s,
      }));
    }
    if (target === 'cabinetStyleColor') {
      const list = dataBank.styles.filter(st => !q || st.name.toLowerCase().includes(q) || (st.finishType && st.finishType.toLowerCase().includes(q)));
      return list.slice(0, 6).map(st => ({
        id: st.id,
        type: 'style' as const,
        title: st.name,
        subtitle: [st.finishType, st.species].filter(Boolean).join(' • ') || 'Finish Style',
        badge: 'Finish',
        data: st,
      }));
    }
    if (target === 'clientName') {
      const list = dataBank.clients.filter(c => !q || c.name.toLowerCase().includes(q) || (c.company && c.company.toLowerCase().includes(q)) || (c.addressLine1 && c.addressLine1.toLowerCase().includes(q)));
      return list.slice(0, 6).map(c => ({
        id: c.id,
        type: 'client' as const,
        title: c.name,
        subtitle: `${c.company ? c.company + ' • ' : ''}${c.addressLine1 || ''}${c.city ? ', ' + c.city : ''} ${c.state || ''}`,
        badge: 'Client',
        data: c,
      }));
    }
    if (target === 'shippingAddress') {
      const list = dataBank.clients.filter(c => !q || (c.addressLine1 && c.addressLine1.toLowerCase().includes(q)) || c.name.toLowerCase().includes(q) || (c.city && c.city.toLowerCase().includes(q)));
      return list.slice(0, 6).map(c => ({
        id: c.id,
        type: 'address' as const,
        title: `${c.addressLine1 || ''}${c.city ? ', ' + c.city : ''} ${c.state || ''} ${c.zip || ''}`.trim(),
        subtitle: `Client: ${c.name} ${c.company ? '(' + c.company + ')' : ''}`,
        badge: 'Address',
        data: c,
      }));
    }
    if (target === 'itemSku') {
      const list = dataBank.cabinets.filter(cab => !q || cab.sku.toLowerCase().includes(q) || cab.description.toLowerCase().includes(q));
      return list.slice(0, 8).map(cab => {
        const catInfo = CABINET_CATEGORY_INFO[cab.category] || CABINET_CATEGORY_INFO.other;
        return {
          id: cab.id,
          type: 'cabinet' as const,
          title: cab.sku,
          subtitle: cab.description,
          badge: catInfo.label.split(' ')[0],
          badgeColor: catInfo.badgeColor,
          price: cab.unitPrice,
          data: cab,
        };
      });
    }
    if (target === 'itemDesc') {
      const list = dataBank.cabinets.filter(cab => !q || cab.description.toLowerCase().includes(q) || cab.sku.toLowerCase().includes(q));
      return list.slice(0, 8).map(cab => {
        const catInfo = CABINET_CATEGORY_INFO[cab.category] || CABINET_CATEGORY_INFO.other;
        return {
          id: cab.id,
          type: 'cabinet' as const,
          title: cab.description,
          subtitle: `SKU: ${cab.sku}`,
          badge: catInfo.label.split(' ')[0],
          badgeColor: catInfo.badgeColor,
          price: cab.unitPrice,
          data: cab,
        };
      });
    }
    return [];
  }, [dataBank]);

  const triggerAutoFill = (
    target: AutoFillState['target'],
    query: string,
    itemId?: string,
    colId?: string
  ) => {
    const suggestions = getSuggestions(target, query);
    if (suggestions.length > 0) {
      setAutoFillState({
        target,
        itemId,
        colId,
        query,
        suggestions,
        selectedIndex: 0,
      });
    } else {
      setAutoFillState(null);
    }
  };

  const handleAutoFillKeyDown = (e: React.KeyboardEvent) => {
    if (!autoFillState || autoFillState.suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAutoFillState(prev => prev ? ({ ...prev, selectedIndex: Math.min(prev.selectedIndex + 1, prev.suggestions.length - 1) }) : null);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAutoFillState(prev => prev ? ({ ...prev, selectedIndex: Math.max(prev.selectedIndex - 1, 0) }) : null);
    } else if (e.key === 'Enter') {
      if (autoFillState.selectedIndex >= 0 && autoFillState.suggestions[autoFillState.selectedIndex]) {
        e.preventDefault();
        handleSelectAutoFill(autoFillState.suggestions[autoFillState.selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setAutoFillState(null);
    }
  };

  const handleSelectAutoFill = (suggestion: SuggestionItem) => {
    if (!autoFillState) return;
    const { target, itemId } = autoFillState;

    if (target === 'brandName') {
      handleInputChange('brandName', suggestion.title);
    } else if (target === 'cabinetStyleColor') {
      handleInputChange('cabinetStyleColor', suggestion.title);
    } else if (target === 'clientName') {
      const client = suggestion.data as ClientEntry;
      pushToHistory(data);
      setData(prev => ({
        ...prev,
        customerDetails: {
          ...prev.customerDetails,
          name: client.name,
          phone: client.phone || prev.customerDetails.phone,
          email: client.email || prev.customerDetails.email,
        },
        shippingAddress: {
          ...prev.shippingAddress,
          recipientName: client.name || prev.shippingAddress.recipientName,
          addressLine1: client.addressLine1 || prev.shippingAddress.addressLine1,
          city: client.city || prev.shippingAddress.city,
          state: client.state || prev.shippingAddress.state,
          zip: client.zip || prev.shippingAddress.zip,
        }
      }));
    } else if (target === 'shippingAddress') {
      const client = suggestion.data as ClientEntry;
      pushToHistory(data);
      setData(prev => ({
        ...prev,
        shippingAddress: {
          ...prev.shippingAddress,
          recipientName: client.name || prev.shippingAddress.recipientName,
          addressLine1: client.addressLine1 || prev.shippingAddress.addressLine1,
          city: client.city || prev.shippingAddress.city,
          state: client.state || prev.shippingAddress.state,
          zip: client.zip || prev.shippingAddress.zip,
        }
      }));
    } else if (target === 'itemSku' || target === 'itemDesc') {
      const cabinet = suggestion.data as CabinetCatalogItem;
      if (itemId) {
        pushToHistory(data);
        setData(prev => {
          const qtyColId = getQtyColumnId(prev.columns);
          const unitPriceColId = getUnitPriceColumnId(prev.columns);
          const totalColId = getTotalColumnId(prev.columns);
          const skuCol = prev.columns.find(c => c.id === 'sku' || c.id.toLowerCase().includes('sku') || c.label.toLowerCase().includes('sku'))?.id || 'sku';
          const descCol = prev.columns.find(c => c.id === 'description' || c.id.toLowerCase().includes('desc') || c.label.toLowerCase().includes('desc'))?.id || 'description';

          return {
            ...prev,
            items: prev.items.map(item => {
              if (item.id === itemId) {
                const qty = Number(item[qtyColId]) || 1;
                const unitPrice = cabinet.unitPrice || Number(item[unitPriceColId]) || 0;
                return {
                  ...item,
                  [skuCol]: cabinet.sku,
                  [descCol]: cabinet.description,
                  [unitPriceColId]: unitPrice,
                  [qtyColId]: item[qtyColId] ? item[qtyColId] : 1,
                  [totalColId]: qty * unitPrice,
                };
              }
              return item;
            })
          };
        });
      }
    }

    setAutoFillState(null);
  };

  const handleQuickSaveList = () => {
    const title = data.orderNumber || data.customerDetails?.name || 'Cabinetry Order';
    saveCurrentOrder(data, title);
    extractAndSaveFromOrder(data);
    refreshDataBank();
    setQuickSaveFeedback(`Saved "${title}" to project archive & synced to Data Bank!`);
    setTimeout(() => setQuickSaveFeedback(null), 3500);
  };

  const handleLoadSavedOrder = (loadedOrder: OrderData) => {
    pushToHistory(data);
    setData(loadedOrder);
    setQuickSaveFeedback(`Loaded project "${loadedOrder.orderNumber || loadedOrder.customerDetails?.name || 'Saved Order'}"`);
    setTimeout(() => setQuickSaveFeedback(null), 3500);
  };

  const formRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleApplyRearrangedItems = (rearrangedItems: OrderItem[], summary: string) => {
    pushToHistory(data);
    setData(prev => {
      const qtyCol = getQtyColumnId(prev.columns);
      const priceCol = getUnitPriceColumnId(prev.columns);
      const calculatedSubTotal = rearrangedItems.reduce((acc, curr) => {
        const q = Number(curr[qtyCol]) || 0;
        const p = Number(curr[priceCol]) || 0;
        return acc + (q * p);
      }, 0);
      const finalSubTotal = calculatedSubTotal > 0 ? calculatedSubTotal : prev.subTotal;
      const finalGrandTotal = finalSubTotal + (Number(prev.vatTax) || 0) - (Number(prev.discount) || 0);

      return {
        ...prev,
        items: rearrangedItems,
        subTotal: finalSubTotal,
        grandTotal: finalGrandTotal,
      };
    });
    setAiReorderSummary(summary);
  };

  const handleLoadSampleCabinetry = () => {
    pushToHistory(data);
    const sampleItems = SAMPLE_CABINETRY_ITEMS;
    const calculatedSubTotal = sampleItems.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
    const finalGrandTotal = calculatedSubTotal + (Number(data.vatTax) || 0) - (Number(data.discount) || 0);

    setData(prev => ({
      ...prev,
      brandName: prev.brandName === "Supplier Name" ? "Deluxe Cabinetry Studio" : prev.brandName,
      cabinetStyleColor: prev.cabinetStyleColor || "Shaker White / Painted Birch",
      items: sampleItems,
      subTotal: calculatedSubTotal,
      grandTotal: finalGrandTotal,
    }));
    setAiReorderSummary("Loaded 12 sample kitchen cabinetry items (Base, Wall, Tall, Fillers & Panels).");
  };

  const handleSaveSignature = ({ signatureUrl, signerName, signedDate }: { signatureUrl: string; signerName: string; signedDate: string }) => {
    pushToHistory(data);
    setData(prev => ({
      ...prev,
      signatureUrl,
      signerName,
      signedDate,
    }));
  };

  const handleClearSignature = () => {
    pushToHistory(data);
    setData(prev => ({
      ...prev,
      signatureUrl: "",
      signerName: "",
      signedDate: "",
    }));
  };

  // History management
  const pushToHistory = useCallback((newState: OrderData) => {
    setHistory(prev => [...prev.slice(-49), data]);
    setRedoStack([]);
  }, [data]);

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack(prev => [data, ...prev]);
    setHistory(prev => prev.slice(0, -1));
    setData(previous);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory(prev => [...prev, data]);
    setRedoStack(prev => prev.slice(1));
    setData(next);
  };

  // Auto-calculate totals
  useEffect(() => {
    const totalColId = getTotalColumnId(data.columns);
    const subTotal = data.items.reduce((sum, item) => {
      const val = Number(item[totalColId]) || 0;
      return sum + val;
    }, 0);
    const vat = Number(data.vatTax) || 0;
    const discount = Number(data.discount) || 0;
    const grandTotal = subTotal + vat - discount;
    
    if (subTotal !== data.subTotal || grandTotal !== data.grandTotal) {
      setData(prev => ({ ...prev, subTotal, grandTotal }));
    }
  }, [data.items, data.columns, data.vatTax, data.discount, data.subTotal, data.grandTotal]);

  const handleInputChange = (path: string, value: any) => {
    pushToHistory(data);
    setData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current: any = newData;
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    pushToHistory(data);
    setData(prev => {
      const qtyColId = getQtyColumnId(prev.columns);
      const unitPriceColId = getUnitPriceColumnId(prev.columns);
      const totalColId = getTotalColumnId(prev.columns);

      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id === id) {
            const newItem = { ...item, [field]: value };
            if (field === qtyColId || field === unitPriceColId) {
              const qty = Number(newItem[qtyColId]) || 0;
              const price = Number(newItem[unitPriceColId]) || 0;
              newItem[totalColId] = qty * price;
            }
            return newItem;
          }
          return item;
        })
      };
    });
  };

  const handleHeaderChange = (colId: string, newLabel: string) => {
    pushToHistory(data);
    setData(prev => ({
      ...prev,
      columns: prev.columns.map(c => c.id === colId ? { ...c, label: newLabel } : c)
    }));
  };

  const addItem = () => {
    pushToHistory(data);
    const newItem: OrderItem = {
      id: Math.random().toString(36).substr(2, 9),
    };
    data.columns.forEach(col => {
      newItem[col.id] = col.type === 'text' ? "" : 0;
    });
    setData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeItem = (id: string) => {
    pushToHistory(data);
    setData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const addColumn = () => {
    pushToHistory(data);
    const id = `col_${Math.random().toString(36).substr(2, 5)}`;
    const newCol = { id, label: "New Column", type: 'text' as const };
    setData(prev => ({
      ...prev,
      columns: [...prev.columns, newCol],
      items: prev.items.map(item => ({ ...item, [id]: "" }))
    }));
  };

  const removeColumn = (colId: string) => {
    pushToHistory(data);
    setData(prev => {
      const newColumns = prev.columns.filter(c => c.id !== colId);
      const newItems = prev.items.map(item => {
        const { [colId]: _, ...rest } = item;
        return rest as OrderItem;
      });
      return { ...prev, columns: newColumns, items: newItems };
    });
  };

  const moveColumn = (draggedId: string, overId: string) => {
    if (draggedId === overId) return;
    pushToHistory(data);
    setData(prev => {
      const oldIndex = prev.columns.findIndex(c => c.id === draggedId);
      const newIndex = prev.columns.findIndex(c => c.id === overId);
      const newColumns = [...prev.columns];
      const [draggedItem] = newColumns.splice(oldIndex, 1);
      newColumns.splice(newIndex, 0, draggedItem);
      return { ...prev, columns: newColumns };
    });
  };

  const moveRow = (draggedId: string, overId: string) => {
    if (!draggedId || !overId || draggedId === overId) return;
    pushToHistory(data);
    setData(prev => {
      const oldIndex = prev.items.findIndex(i => i.id === draggedId);
      const newIndex = prev.items.findIndex(i => i.id === overId);
      if (oldIndex === -1 || newIndex === -1) return prev;
      const newItems = [...prev.items];
      const [draggedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, draggedItem);
      return { ...prev, items: newItems };
    });
  };

  const moveRowByOffset = (index: number, offset: number) => {
    const newIndex = index + offset;
    if (newIndex < 0 || newIndex >= data.items.length) return;
    pushToHistory(data);
    setData(prev => {
      const newItems = [...prev.items];
      const [item] = newItems.splice(index, 1);
      newItems.splice(newIndex, 0, item);
      return { ...prev, items: newItems };
    });
  };

  const processFiles = async (files: File[], mode: 'replace' | 'append' = 'replace') => {
    if (files.length === 0) return;

    setIsParsing(true);
    setParsingStatus(files.length > 1 ? `Scanning ${files.length} documents...` : "Scanning document...");

    try {
      const base64List = await Promise.all(
        files.map(file => new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
          reader.readAsDataURL(file);
        }))
      );

      const result = await parseOrderImage(base64List);
      console.log("Parsing Result Received:", result);

      if (!result || (!result.items && !result.brandName)) {
        throw new Error("No meaningful data extracted from document(s)");
      }

      // Sanitize result to replace any null values with empty strings/defaults
      const sanitize = (obj: any): any => {
        if (Array.isArray(obj)) return obj.map(sanitize);
        if (obj !== null && typeof obj === 'object') {
          const newObj: any = {};
          for (const key in obj) {
            newObj[key] = sanitize(obj[key]);
          }
          return newObj;
        }
        return obj === null ? "" : obj;
      };

      const sanitizedResult = sanitize(result);

      pushToHistory(data);
      setData(prev => {
        const newColumns = sanitizedResult.columns && sanitizedResult.columns.length > 0 ? sanitizedResult.columns : prev.columns;
        const newItems = (sanitizedResult.items || []).map((item: any) => ({
          ...item,
          id: Math.random().toString(36).substr(2, 9)
        }));

        if (mode === 'append') {
          return {
            ...prev,
            items: [...prev.items, ...newItems],
            brandName: sanitizedResult.brandName || prev.brandName,
            cabinetStyleColor: sanitizedResult.cabinetStyleColor || prev.cabinetStyleColor,
            orderNumber: sanitizedResult.orderNumber || prev.orderNumber,
            orderDate: sanitizedResult.orderDate || prev.orderDate,
            deliveryDate: sanitizedResult.deliveryDate || prev.deliveryDate,
            vatTax: sanitizedResult.vatTax ?? prev.vatTax,
            discount: sanitizedResult.discount ?? prev.discount,
            customerDetails: { ...prev.customerDetails, ...(sanitizedResult.customerDetails || {}) },
            shippingAddress: { ...prev.shippingAddress, ...(sanitizedResult.shippingAddress || {}) }
          };
        }

        // Replace mode: Merge result with previous structure defaults
        return {
          ...prev,
          ...sanitizedResult,
          columns: newColumns,
          items: newItems.length > 0 ? newItems : prev.items,
          cabinetStyleColor: sanitizedResult.cabinetStyleColor || prev.cabinetStyleColor,
          customerDetails: { ...prev.customerDetails, ...(sanitizedResult.customerDetails || {}) },
          shippingAddress: { ...prev.shippingAddress, ...(sanitizedResult.shippingAddress || {}) }
        };
      });
    } catch (error) {
      console.error("Upload Error:", error);
      alert(error instanceof Error ? error.message : "Failed to parse documents. Please try clearer images.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? (Array.from(e.target.files) as File[]) : [];
    processFiles(files, 'replace');
    e.target.value = '';
  };

  const handleAppendUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? (Array.from(e.target.files) as File[]) : [];
    processFiles(files, 'append');
    e.target.value = '';
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      handleInputChange('logoUrl', base64);
    };
    reader.readAsDataURL(file);
  };

  const exportAsImage = async (format: 'png' | 'jpeg') => {
    if (!formRef.current) return;
    setIsExporting(true);
    try {
      const exportFn = format === 'png' ? toPng : toJpeg;
      const dataUrl = await exportFn(formRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `order-form.${format}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export Error:", err);
      alert("Failed to export image. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsPDF = async () => {
    if (!formRef.current) return;
    setIsExporting(true);
    try {
      const imgData = await toPng(formRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('order-form.pdf');
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsCSV = () => {
    const headers = data.columns.map(col => `"${col.label}"`).join(",");
    const rows = data.items.map(item => 
      data.columns.map(col => `"${String(item[col.id] || '').replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "order_data.csv");
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#F5F2ED] text-[#1a1a1a] font-sans">
      <header className="bg-[#151619] text-white py-6 px-8 flex justify-between items-center shadow-lg border-b border-[#D4AF37]/30 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => logoInputRef.current?.click()}
            className="w-10 h-10 bg-[#D4AF37] rounded-lg flex items-center justify-center font-bold text-black text-xl hover:rotate-12 transition-transform overflow-hidden cursor-pointer"
          >
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              "S"
            )}
          </button>
          <input 
            type="file" 
            ref={logoInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleLogoUpload} 
          />
          <h1 className="text-2xl font-medium tracking-tight">Smart <span className="text-[#D4AF37]">List</span></h1>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex bg-[#2a2b30] rounded-md p-1 border border-white/10 mr-4">
            <button 
              onClick={undo}
              disabled={history.length === 0}
              className={`p-2 rounded-md transition-all ${history.length > 0 ? 'text-[#D4AF37] hover:bg-white/5 active:scale-95' : 'text-gray-600 cursor-not-allowed'}`}
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button 
              onClick={redo}
              disabled={redoStack.length === 0}
              className={`p-2 rounded-md transition-all ${redoStack.length > 0 ? 'text-[#D4AF37] hover:bg-white/5 active:scale-95' : 'text-gray-600 cursor-not-allowed'}`}
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSavedListsModalOpen(true)}
              className="flex items-center gap-2 bg-[#2a2b30] hover:bg-[#34363d] text-[#D4AF37] px-3.5 py-2 rounded-md font-bold transition-all text-xs uppercase tracking-wider border border-[#D4AF37]/30 cursor-pointer shadow-md active:scale-95"
              title="View, load, or duplicate saved cabinet lists"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Saved Lists</span>
            </button>

            <button 
              onClick={() => setIsDataBankModalOpen(true)}
              className="flex items-center gap-2 bg-[#2a2b30] hover:bg-[#34363d] text-white px-3.5 py-2 rounded-md font-bold transition-all text-xs uppercase tracking-wider border border-white/10 hover:border-[#D4AF37]/50 cursor-pointer shadow-md active:scale-95"
              title="Open Cabinet Catalog & Auto-Fill Data Bank"
            >
              <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline">Data Bank</span>
            </button>

            <button
              onClick={handleQuickSaveList}
              className="flex items-center gap-1.5 bg-[#2a2b30] hover:bg-emerald-950/60 text-emerald-400 px-3 py-2 rounded-md font-bold transition-all text-xs uppercase tracking-wider border border-emerald-500/30 cursor-pointer shadow-md active:scale-95"
              title="Save current order & update Data Bank"
            >
              <BookmarkCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Save</span>
            </button>
          </div>

          <label className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#C5A028] text-black px-4 py-2 rounded-md font-medium cursor-pointer transition-all shadow-lg active:scale-95 text-sm">
            {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Files className="w-4 h-4" />}
            {isParsing ? parsingStatus : "Upload Document(s)"}
            <input 
              type="file" 
              className="hidden" 
              accept="image/*,application/pdf" 
              multiple 
              onChange={handleImageUpload} 
              disabled={isParsing} 
            />
          </label>
          
          <div className="flex bg-[#2a2b30] rounded-md p-1 border border-white/10 ml-2">
            <button 
              onClick={() => setActiveTab('edit')}
              className={`px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === 'edit' ? 'bg-[#D4AF37] text-black font-medium shadow-inner' : 'text-gray-400 hover:text-white'}`}
            >
              Editor
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === 'preview' ? 'bg-[#D4AF37] text-black font-medium shadow-inner' : 'text-gray-400 hover:text-white'}`}
            >
              Preview
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Controls Panel */}
          <div className="w-full lg:w-72 space-y-6 shrink-0 order-2 lg:order-1 sticky top-28">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-black/5 space-y-6">
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
                  <Save className="w-3 h-3" /> Export Options
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button onClick={exportAsPDF} disabled={isExporting} className="flex items-center gap-3 w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm border border-gray-100 transition-all active:scale-95">
                    <FileText className="w-4 h-4 text-red-500" /> PDF Document
                  </button>
                  <button onClick={() => exportAsImage('png')} disabled={isExporting} className="flex items-center gap-3 w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm border border-gray-100 transition-all active:scale-95">
                    <ImageIcon className="w-4 h-4 text-blue-500" /> PNG Image
                  </button>
                  <button onClick={() => exportAsImage('jpeg')} disabled={isExporting} className="flex items-center gap-3 w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm border border-gray-100 transition-all active:scale-95">
                    <ImageIcon className="w-4 h-4 text-blue-400" /> JPEG Image
                  </button>
                  <button onClick={exportAsCSV} disabled={isExporting} className="flex items-center gap-3 w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm border border-gray-100 transition-all active:scale-95">
                    <FileSpreadsheet className="w-4 h-4 text-green-500" /> CSV Fields
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
                  <Files className="w-3 h-3" /> Multi-Page Order
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-800 rounded-xl text-sm border border-gray-200 transition-all cursor-pointer active:scale-95 font-medium">
                    {isParsing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FilePlus className="w-4 h-4 text-[#D4AF37]" />}
                    Append Page(s)
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*,application/pdf" 
                      multiple 
                      onChange={handleAppendUpload} 
                      disabled={isParsing} 
                    />
                  </label>
                  <p className="text-[10px] text-gray-400 leading-relaxed">
                    Upload multiple files at once or append additional pages to merge item lists into one form.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-4 flex items-center gap-2">
                  <Grid className="w-3 h-3" /> Structure
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  <button 
                    onClick={addItem}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#1a1a1a] hover:bg-black text-white rounded-xl text-sm transition-all shadow-lg active:scale-95"
                  >
                    <Plus className="w-4 h-4" /> Add Row
                  </button>
                  <button 
                    onClick={addColumn}
                    className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-white border-2 border-[#1a1a1a] hover:bg-gray-50 text-[#1a1a1a] rounded-xl text-sm transition-all active:scale-95"
                  >
                    <Grid className="w-4 h-4" /> Add Column
                  </button>
                </div>
              </div>

              {/* AI Cabinetry Assistant Card */}
              <div className="p-4 bg-gradient-to-br from-[#151619] to-black rounded-2xl text-white space-y-3 shadow-xl border border-[#D4AF37]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                    <span className="text-xs font-black uppercase tracking-wider text-white">Cabinetry AI</span>
                  </div>
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#D4AF37] text-black">
                    NKBA
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Re-arrange order items by Base, Wall, Tall, Fillers & Panels or custom notation criteria.
                </p>
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCabinetryModalOpen(true)}
                    className="w-full py-2.5 px-3 bg-[#D4AF37] hover:bg-[#e0b93b] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 hover:scale-[1.02]"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    Re-arrange List
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSavedListsModalOpen(true)}
                    className="w-full py-2 px-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FolderArchive className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Saved Lists</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#D4AF37]">
                      {loadSavedOrders().length} saved
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsDataBankModalOpen(true)}
                    className="w-full py-2 px-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Data Bank</span>
                    </div>
                    <span className="text-[10px] font-mono text-gray-400">
                      {dataBank.cabinets.length} SKUs
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 w-full order-1 lg:order-2 overflow-hidden relative">
            <div className={`${activeTab === 'edit' ? 'block' : 'hidden'}`}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-white rounded-3xl shadow-xl border border-black/5 overflow-hidden">
                  <div className="bg-[#151619] p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4 w-2/3">
                      <button 
                        onClick={() => logoInputRef.current?.click()}
                        className="h-14 w-14 bg-[#D4AF37] rounded-xl overflow-hidden flex items-center justify-center font-bold text-black border border-white/10 hover:scale-105 transition-transform shrink-0"
                      >
                        {data.logoUrl ? (
                          <img src={data.logoUrl} className="w-full h-full object-cover" alt="Logo" />
                        ) : (
                          <Plus className="w-6 h-6" />
                        )}
                      </button>
                      <div className="flex flex-col flex-1 gap-1.5">
                        <div className="relative w-full">
                          <input 
                            className="bg-transparent text-[#D4AF37] font-serif italic text-2xl border-none focus:ring-0 w-full px-2 py-0.5 rounded hover:bg-white/5 transition-colors placeholder-[#D4AF37]/50" 
                            value={data.brandName || ""} 
                            onChange={e => {
                              handleInputChange('brandName', e.target.value);
                              triggerAutoFill('brandName', e.target.value);
                            }}
                            onFocus={e => triggerAutoFill('brandName', e.target.value)}
                            onKeyDown={handleAutoFillKeyDown}
                            onBlur={() => setTimeout(() => setAutoFillState(null), 250)}
                            placeholder="Supplier Name"
                          />
                          <AutoFillSuggestions
                            isOpen={autoFillState?.target === 'brandName'}
                            suggestions={autoFillState?.suggestions || []}
                            selectedIndex={autoFillState?.selectedIndex || 0}
                            onSelect={handleSelectAutoFill}
                            onClose={() => setAutoFillState(null)}
                            headerTitle="Suggested Suppliers (Data Bank)"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="relative w-full">
                            <input 
                              className="bg-white/10 text-white text-xs px-2.5 py-1 rounded-md border border-white/10 focus:border-[#D4AF37] focus:ring-0 focus:outline-none placeholder-white/40 w-full transition-colors"
                              value={data.cabinetStyleColor || ""}
                              onChange={e => {
                                handleInputChange('cabinetStyleColor', e.target.value);
                                triggerAutoFill('cabinetStyleColor', e.target.value);
                              }}
                              onFocus={e => triggerAutoFill('cabinetStyleColor', e.target.value)}
                              onKeyDown={handleAutoFillKeyDown}
                              onBlur={() => setTimeout(() => setAutoFillState(null), 250)}
                              placeholder="Cabinet Style & Color (e.g. Shaker Style - Pure White)"
                            />
                            <AutoFillSuggestions
                              isOpen={autoFillState?.target === 'cabinetStyleColor'}
                              suggestions={autoFillState?.suggestions || []}
                              selectedIndex={autoFillState?.selectedIndex || 0}
                              onSelect={handleSelectAutoFill}
                              onClose={() => setAutoFillState(null)}
                              headerTitle="Cabinet Styles & Finishes"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-gray-400 font-sans text-[10px] font-bold uppercase tracking-[0.3em] px-4">Digital Order Interface</div>
                  </div>
                  <div className="p-8 grid grid-cols-3 gap-8">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block mb-2">Project Name</label>
                      <input className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm p-3 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all" value={data.orderNumber || ""} onChange={e => handleInputChange('orderNumber', e.target.value)} placeholder="Project Name" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block mb-2">Issue Date</label>
                      <input className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm p-3 focus:ring-[#D4AF37] border-none" value={data.orderDate || ""} onChange={e => handleInputChange('orderDate', e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block mb-2">Estimated Arrival</label>
                      <input className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm p-3 focus:ring-[#D4AF37] border-none" value={data.deliveryDate || ""} onChange={e => handleInputChange('deliveryDate', e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-black/5 space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] pb-4 border-b border-gray-50">Billing Info</h3>
                    <div className="space-y-4">
                      <div className="relative">
                        <input 
                          placeholder="Full Name / Company" 
                          className="w-full text-sm p-2 border-b-2 border-gray-50 hover:border-[#D4AF37] transition-all focus:outline-none" 
                          value={data.customerDetails.name || ""} 
                          onChange={e => {
                            handleInputChange('customerDetails.name', e.target.value);
                            triggerAutoFill('clientName', e.target.value);
                          }} 
                          onFocus={e => triggerAutoFill('clientName', e.target.value)}
                          onKeyDown={handleAutoFillKeyDown}
                          onBlur={() => setTimeout(() => setAutoFillState(null), 250)}
                        />
                        <AutoFillSuggestions
                          isOpen={autoFillState?.target === 'clientName'}
                          suggestions={autoFillState?.suggestions || []}
                          selectedIndex={autoFillState?.selectedIndex || 0}
                          onSelect={handleSelectAutoFill}
                          onClose={() => setAutoFillState(null)}
                          headerTitle="Client Data Bank (Auto-fills Address)"
                        />
                      </div>
                      <input placeholder="Phone Number" className="w-full text-sm p-2 border-b-2 border-gray-50 hover:border-[#D4AF37] transition-all focus:outline-none" value={data.customerDetails.phone || ""} onChange={e => handleInputChange('customerDetails.phone', e.target.value)} />
                      <input placeholder="Email Address" className="w-full text-sm p-2 border-b-2 border-gray-50 hover:border-[#D4AF37] transition-all focus:outline-none" value={data.customerDetails.email || ""} onChange={e => handleInputChange('customerDetails.email', e.target.value)} />
                    </div>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-xl border border-black/5 space-y-6">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] pb-4 border-b border-gray-50">Shipping Info</h3>
                    <div className="space-y-4">
                      <div className="relative">
                        <input 
                          placeholder="Street Address" 
                          className="w-full text-sm p-2 border-b-2 border-gray-50 hover:border-[#D4AF37] transition-all focus:outline-none" 
                          value={data.shippingAddress.addressLine1 || ""} 
                          onChange={e => {
                            handleInputChange('shippingAddress.addressLine1', e.target.value);
                            triggerAutoFill('shippingAddress', e.target.value);
                          }} 
                          onFocus={e => triggerAutoFill('shippingAddress', e.target.value)}
                          onKeyDown={handleAutoFillKeyDown}
                          onBlur={() => setTimeout(() => setAutoFillState(null), 250)}
                        />
                        <AutoFillSuggestions
                          isOpen={autoFillState?.target === 'shippingAddress'}
                          suggestions={autoFillState?.suggestions || []}
                          selectedIndex={autoFillState?.selectedIndex || 0}
                          onSelect={handleSelectAutoFill}
                          onClose={() => setAutoFillState(null)}
                          headerTitle="Client Shipping Addresses"
                        />
                      </div>
                      <input placeholder="Recipient Name" className="w-full text-sm p-2 border-b-2 border-gray-50 hover:border-[#D4AF37] transition-all focus:outline-none" value={data.shippingAddress.recipientName || ""} onChange={e => handleInputChange('shippingAddress.recipientName', e.target.value)} />
                      <div className="grid grid-cols-3 gap-4">
                        <input placeholder="City" className="text-sm p-2 border-b-2 border-gray-50 focus:outline-none" value={data.shippingAddress.city || ""} onChange={e => handleInputChange('shippingAddress.city', e.target.value)} />
                        <input placeholder="Postal Code" className="text-sm p-2 border-b-2 border-gray-50 focus:outline-none" value={data.shippingAddress.zip || ""} onChange={e => handleInputChange('shippingAddress.zip', e.target.value)} />
                        <input placeholder="State/Region" className="text-sm p-2 border-b-2 border-gray-50 focus:outline-none" value={data.shippingAddress.state || ""} onChange={e => handleInputChange('shippingAddress.state', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Save Feedback Banner */}
                <AnimatePresence>
                  {quickSaveFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-amber-50 border border-[#D4AF37]/50 text-gray-950 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-[#D4AF37] flex items-center justify-center text-black font-black shrink-0">
                          <BookmarkCheck className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-gray-900">{quickSaveFeedback}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setQuickSaveFeedback(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* AI Reorder Feedback Banner if present */}
                <AnimatePresence>
                  {aiReorderSummary && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-emerald-50 border border-emerald-200 text-emerald-950 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-900">{aiReorderSummary}</p>
                          <p className="text-[10px] text-emerald-700">List items have been organized according to cabinetry specifications.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            undo();
                            setAiReorderSummary(null);
                          }}
                          className="px-3 py-1.5 bg-white border border-emerald-300 hover:bg-emerald-100/50 text-emerald-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Undo2 className="w-3 h-3" />
                          Undo
                        </button>
                        <button
                          type="button"
                          onClick={() => setAiReorderSummary(null)}
                          className="p-1.5 text-emerald-600 hover:text-emerald-900 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Items Table Header Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xl border border-black/5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#151619] text-[#D4AF37] border border-[#D4AF37]/20 flex flex-col items-center justify-center font-black shadow-md">
                      <span className="text-base leading-none font-mono">{data.items.length}</span>
                      <span className="text-[9px] uppercase tracking-wider text-gray-400">Rows</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black uppercase tracking-wider text-[#151619]">
                          Cabinetry & Order Line Items
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                          Interactive
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Drag rows by the <GripVertical className="w-3 h-3 inline text-gray-400 mx-0.5" /> grip, or tell AI to reorganize by Base, Wall, Tall, Fillers & Panels.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {data.items.length <= 1 && (
                      <button
                        type="button"
                        onClick={handleLoadSampleCabinetry}
                        className="flex items-center gap-1.5 px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                        title="Load 12 real-world kitchen cabinets"
                      >
                        <Boxes className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>Load Sample Cabinets</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsCabinetryModalOpen(true)}
                      className="flex items-center gap-2 px-5 py-3 bg-[#151619] hover:bg-black text-[#D4AF37] hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer border border-[#D4AF37]/30"
                      title="Organize by Base, Wall, Tall, Fillers, Panels & vice versa"
                    >
                      <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                      <span>AI Cabinetry Re-arrange</span>
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-black/5 overflow-x-auto min-h-[500px]">
                  <div className="min-w-full inline-block align-middle">
                    <table className="min-w-full text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-[#151619] text-white text-xs md:text-sm uppercase tracking-wider font-black">
                          <th className="p-4 w-16 text-center text-[#D4AF37] font-black text-xs md:text-sm border-r border-white/10">#</th>
                          {data.columns.map((col) => (
                            <th 
                              key={col.id} 
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData('colId', col.id)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                const draggedId = e.dataTransfer.getData('colId');
                                moveColumn(draggedId, col.id);
                              }}
                              className="relative p-0 h-16 border-r border-white/10 cursor-move hover:bg-[#D4AF37]/20 transition-all min-w-[150px] group text-left"
                            >
                              <div className="flex items-center h-full px-4 pr-10">
                                <input 
                                  className="bg-transparent border-none focus:ring-0 text-[#D4AF37] font-black w-full h-full uppercase text-xs md:text-sm tracking-wider placeholder-[#D4AF37]/30"
                                  value={col.label || ""}
                                  onChange={(e) => handleHeaderChange(col.id, e.target.value)}
                                  placeholder="Rename Column"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <button 
                                onClick={(e) => { e.stopPropagation(); removeColumn(col.id); }}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/30 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-white/10 rounded-full"
                                title="Delete Column"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </th>
                          ))}
                          <th className="p-4 w-28 sticky right-0 bg-[#151619] z-10 text-center text-[#D4AF37] font-black text-xs md:text-sm">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {data.items.map((item, idx) => (
                          <tr 
                            key={item.id} 
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('rowId', item.id);
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              const draggedId = e.dataTransfer.getData('rowId');
                              if (draggedId) {
                                moveRow(draggedId, item.id);
                              }
                            }}
                            className="hover:bg-gray-50/80 group transition-colors cursor-grab active:cursor-grabbing"
                          >
                            <td className="p-2 w-16 text-center border-r border-gray-100 font-mono select-none bg-gray-50/40 group-hover:bg-gray-100/80 transition-colors">
                              <div className="flex items-center justify-center gap-1" title="Drag row to rearrange">
                                <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-[#D4AF37] transition-colors" />
                                <span className="font-black text-base text-gray-900">{idx + 1}</span>
                              </div>
                            </td>
                            {data.columns.map((col) => {
                              const isSku = col.id === 'sku' || col.id.toLowerCase().includes('sku') || col.id.toLowerCase().includes('code');
                              const isDesc = col.id === 'description' || col.id.toLowerCase().includes('desc');
                              const targetType = isSku ? ('itemSku' as const) : isDesc ? ('itemDesc' as const) : null;

                              return (
                                <td key={col.id} className="p-1 border-r border-gray-100 min-w-[150px] relative">
                                  <input 
                                    type={col.type === 'text' ? 'text' : 'number'}
                                    className={`w-full p-4 h-full text-base md:text-lg font-bold text-gray-950 bg-transparent border-none focus:ring-2 focus:ring-[#D4AF37]/20 focus:bg-white rounded-lg transition-all placeholder:text-gray-300 ${col.type === 'price' || col.type === 'number' ? 'text-right font-mono font-black text-gray-950' : ''}`}
                                    value={item[col.id] ?? ''} 
                                    onChange={e => {
                                      const val = col.type === 'text' ? e.target.value : (e.target.value === '' ? '' : Number(e.target.value));
                                      handleItemChange(item.id, col.id, val);
                                      if (targetType) {
                                        triggerAutoFill(targetType, String(val), item.id, col.id);
                                      }
                                    }}
                                    onFocus={() => {
                                      if (targetType) {
                                        triggerAutoFill(targetType, String(item[col.id] ?? ''), item.id, col.id);
                                      }
                                    }}
                                    onKeyDown={targetType ? handleAutoFillKeyDown : undefined}
                                    onBlur={() => {
                                      if (targetType) {
                                        setTimeout(() => setAutoFillState(null), 250);
                                      }
                                    }}
                                    placeholder="-" 
                                  />
                                  {targetType && (
                                    <AutoFillSuggestions
                                      isOpen={autoFillState?.target === targetType && autoFillState?.itemId === item.id && autoFillState?.colId === col.id}
                                      suggestions={autoFillState?.suggestions || []}
                                      selectedIndex={autoFillState?.selectedIndex || 0}
                                      onSelect={handleSelectAutoFill}
                                      onClose={() => setAutoFillState(null)}
                                      headerTitle={isSku ? "Cabinet SKU Data Bank" : "Matching Cabinets"}
                                    />
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-2 w-28 text-center sticky right-0 bg-white group-hover:bg-gray-50 transition-colors z-10">
                              <div className="flex items-center justify-center gap-1 opacity-60 group-hover:opacity-100 transition-all">
                                <button 
                                  onClick={() => moveRowByOffset(idx, -1)} 
                                  disabled={idx === 0}
                                  className="p-1.5 text-gray-400 hover:text-[#D4AF37] disabled:opacity-20 disabled:hover:text-gray-400 transition-colors rounded-lg hover:bg-gray-100"
                                  title="Move Row Up"
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => moveRowByOffset(idx, 1)} 
                                  disabled={idx === data.items.length - 1}
                                  className="p-1.5 text-gray-400 hover:text-[#D4AF37] disabled:opacity-20 disabled:hover:text-gray-400 transition-colors rounded-lg hover:bg-gray-100"
                                  title="Move Row Down"
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => removeItem(item.id)} 
                                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" 
                                  title="Delete Row"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row justify-between items-start pt-4 gap-8">
                  {/* Electronic Signature Box in Edit Mode */}
                  <div className="w-full lg:w-96 bg-white p-8 rounded-3xl shadow-xl border border-black/5 space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">Authorized Signature</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${data.signatureUrl ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                        {data.signatureUrl ? 'Signed' : 'Not Signed'}
                      </span>
                    </div>

                    {data.signatureUrl ? (
                      <div className="space-y-3">
                        <div 
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center min-h-[90px] cursor-pointer hover:border-[#D4AF37] transition-all group"
                          title="Click to change signature"
                        >
                          <img src={data.signatureUrl} alt="Signature Preview" className="max-h-16 max-w-full object-contain" />
                        </div>
                        <div className="text-xs space-y-1">
                          {data.signerName && (
                            <p className="font-bold text-gray-800">Signer: <span className="font-normal">{data.signerName}</span></p>
                          )}
                          {data.signedDate && (
                            <p className="text-gray-500 font-mono text-[11px]">Date: {data.signedDate}</p>
                          )}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setIsSignatureModalOpen(true)}
                            className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-[#151619] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
                          >
                            <PenLine className="w-3.5 h-3.5 text-[#D4AF37]" />
                            Update Signature
                          </button>
                          <button
                            type="button"
                            onClick={handleClearSignature}
                            className="py-2.5 px-3 text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-colors"
                          >
                            Clear
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Add a verified electronic drawing or typed script signature to approve and authorize this order.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="w-full py-3.5 px-4 bg-[#151619] hover:bg-black text-[#D4AF37] rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <PenLine className="w-4 h-4 text-[#D4AF37]" />
                          Add Electronic Signature
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Totals Summary */}
                  <div className="w-full lg:w-80 bg-white p-8 rounded-3xl shadow-xl border border-black/5 space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                      <span>Aggregate Sum</span>
                      <span className="text-[#1a1a1a] font-bold font-mono text-base">${data.subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                      <span>Fiscal Tax</span>
                      <input type="number" className="w-24 text-right p-2 bg-gray-50 border-none rounded-xl text-sm font-mono font-bold text-gray-900" value={data.vatTax ?? ""} onChange={e => handleInputChange('vatTax', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-gray-400">
                      <span>Reduction</span>
                      <input type="number" className="w-24 text-right p-2 bg-gray-50 border-none rounded-xl text-sm font-mono font-bold text-red-500" value={data.discount ?? ""} onChange={e => handleInputChange('discount', parseFloat(e.target.value) || 0)} />
                    </div>
                    <div className="pt-6 border-t-2 border-gray-50 flex justify-between items-center">
                      <span className="font-bold text-[10px] uppercase tracking-widest text-[#1a1a1a]">Final Payable</span>
                      <span className="font-bold text-3xl text-[#D4AF37] font-serif">${data.grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div 
              className={`${activeTab === 'preview' ? 'block' : 'absolute top-0 left-0 -z-50 opacity-0 pointer-events-none'}`}
              style={{ width: activeTab === 'preview' ? 'auto' : '1024px' }}
            >
              <div 
                className="bg-white shadow-2xl min-h-[1000px] flex flex-col mx-auto border border-black/10 origin-top overflow-x-auto rounded-[2rem]"
                ref={formRef}
              >
                <div className="min-w-[900px] bg-white">
                  <div className="bg-[#151619] p-16 flex justify-between items-start text-white">
                    <div className="flex gap-8">
                      <button 
                        onClick={() => logoInputRef.current?.click()}
                        className={`w-24 h-24 rounded-2xl flex items-center justify-center border border-white/10 transition-all ${data.logoUrl ? 'bg-white/5' : 'bg-[#D4AF37] text-black hover:scale-105 cursor-pointer'}`}
                      >
                        {data.logoUrl ? (
                          <img src={data.logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" />
                        ) : (
                          <Upload className="w-8 h-8" />
                        )}
                      </button>
                      <div>
                        <h1 className="text-[#D4AF37] text-5xl font-serif italic mb-2 uppercase tracking-tight">{data.brandName || "Supplier Name"}</h1>
                        {data.cabinetStyleColor && (
                          <p className="text-white/80 text-sm font-medium tracking-wide mb-3 flex items-center gap-2">
                            <span className="text-[#D4AF37]/80 text-[11px] uppercase tracking-widest font-sans font-semibold">Cabinet Style & Color:</span>
                            <span className="text-white">{data.cabinetStyleColor}</span>
                          </p>
                        )}
                        <div className="h-1.5 w-32 bg-[#D4AF37] mb-6"></div>
                        <div className="text-white/40 text-[10px] font-bold uppercase tracking-[0.4em]">Official Order Documentation</div>
                      </div>
                    </div>
                    <div className="text-right text-[#D4AF37]">
                      <h2 className="text-2xl font-bold uppercase tracking-[0.2em] mb-6">Order Invoice</h2>
                      <div className="space-y-2 opacity-60 text-white">
                        <p className="text-[10px] uppercase tracking-widest">PROJECT: {data.orderNumber || "N/A"}</p>
                        <p className="text-[10px] uppercase tracking-widest">DATE: {data.orderDate}</p>
                        <p className="text-[10px] uppercase tracking-widest">DELIVERY: {data.deliveryDate}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-16 space-y-16 bg-white flex-1">
                    <div className="grid grid-cols-2 gap-24">
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] pb-3 border-b-2 border-[#151619] text-[#151619]">Billing Info</h3>
                        <div className="space-y-2">
                          <p className="text-lg font-medium text-[#151619]">{data.customerDetails.name || "—"}</p>
                          <p className="text-sm text-gray-500 font-mono">{data.customerDetails.phone || "—"}</p>
                          <p className="text-sm text-gray-500">{data.customerDetails.email || "—"}</p>
                        </div>
                      </div>
                      <div className="space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] pb-3 border-b-2 border-[#151619] text-[#151619]">Shipping Info</h3>
                        <div className="space-y-1 text-gray-600">
                          <p className="text-lg font-medium text-[#151619]">{data.shippingAddress.recipientName || "—"}</p>
                          <p className="text-sm leading-relaxed">{data.shippingAddress.addressLine1 || "—"}</p>
                          <p className="text-sm uppercase tracking-wider">{[data.shippingAddress.city, data.shippingAddress.state, data.shippingAddress.zip].filter(Boolean).join(', ') || "—"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-hidden border-2 border-[#151619]/10 rounded-2xl shadow-sm">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-[#151619] text-white">
                            {data.columns.map((col) => (
                              <th 
                                key={col.id} 
                                className={`p-6 font-black text-sm uppercase tracking-wider text-[#D4AF37] border-r border-white/10 last:border-0 ${col.type === 'price' || col.type === 'number' ? 'text-right' : ''}`}
                              >
                                {col.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#151619]/10">
                          {data.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                              {data.columns.map((col) => (
                                <td 
                                  key={col.id} 
                                  className={`p-6 text-base md:text-lg border-r border-[#151619]/10 last:border-0 ${col.type === 'price' || col.type === 'number' ? 'text-right font-mono font-black text-[#151619]' : 'font-bold text-[#151619]'}`}
                                >
                                  {col.type === 'price' ? `$${(Number(item[col.id]) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : (item[col.id] || '—')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-between items-start pt-12 gap-16">
                      <div className="space-y-10 flex-1">
                        <div className="grid grid-cols-2 gap-12">
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Settlement</h4>
                            <p className="text-sm flex items-center gap-3 font-medium text-[#151619]">
                              <span className={`w-3 h-3 rounded-full ${data.paymentMethod ? 'bg-[#D4AF37]' : 'bg-gray-100'}`}></span>
                              {data.paymentMethod || "Not Selected"}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4">Transport</h4>
                            <p className="text-sm flex items-center gap-3 font-medium text-[#151619]">
                              <span className={`w-3 h-3 rounded-full ${data.shippingMethod ? 'bg-[#D4AF37]' : 'bg-gray-100'}`}></span>
                              {data.shippingMethod || "Not Selected"}
                            </p>
                          </div>
                        </div>
                        <div className="max-w-xl group">
                          <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 mb-4 border-b border-gray-50 pb-2">Terms & Legalities</h4>
                          <textarea 
                            className="text-xs leading-relaxed text-gray-500 w-full bg-transparent border-none focus:ring-0 p-4 resize-none min-h-[120px] hover:bg-gray-50 rounded-xl transition-all"
                            value={data.termsAndConditions || ""}
                            onChange={e => handleInputChange('termsAndConditions', e.target.value)}
                            placeholder="Define transaction terms..."
                          />
                        </div>
                      </div>

                      <div className="w-80 space-y-0 shadow-2xl bg-white shrink-0 rounded-3xl overflow-hidden border border-[#151619]/5">
                        <div className="p-6 bg-gray-50/50 flex justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 self-center">Sub-Total</span>
                          <span className="text-lg font-mono font-bold text-[#151619]">${data.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="p-6 bg-white flex justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 self-center">Service Tax</span>
                          <span className="text-sm font-mono font-medium">${(Number(data.vatTax) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="p-6 bg-white flex justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400 self-center">Discounts</span>
                          <span className="text-sm font-mono font-medium text-red-500">-${(Number(data.discount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="bg-[#151619] p-10 flex justify-between items-center text-white">
                          <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#D4AF37]">Payable</span>
                          <span className="text-4xl font-serif text-[#D4AF37] font-bold">${data.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-16 flex justify-end">
                    <div className="w-80 text-center">
                      {data.signatureUrl ? (
                        <div 
                          onClick={() => setIsSignatureModalOpen(true)}
                          className="group relative cursor-pointer mb-3 p-2 rounded-2xl hover:bg-black/5 transition-all"
                          title="Click to modify electronic signature"
                        >
                          <img 
                            src={data.signatureUrl} 
                            alt="Authorized Electronic Signature" 
                            className="h-20 max-w-full mx-auto object-contain select-none" 
                          />
                          {!isExporting && (
                            <div className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white shadow-md border border-gray-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-[#151619]">
                              <PenLine className="w-3 h-3 text-[#D4AF37]" />
                              <span>Edit</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        !isExporting ? (
                          <button
                            type="button"
                            onClick={() => setIsSignatureModalOpen(true)}
                            className="h-20 w-full mb-3 border-2 border-dashed border-[#D4AF37]/70 hover:border-[#D4AF37] bg-[#D4AF37]/5 hover:bg-[#D4AF37]/15 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all text-[#151619] cursor-pointer group"
                          >
                            <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#151619]">
                              <PenLine className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform" />
                              <span>Sign Electronically</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-medium">Click to draw or type signature</span>
                          </button>
                        ) : (
                          <div className="h-20 w-full mb-3" />
                        )
                      )}

                      <div className="border-t-4 border-[#151619] pt-3 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#151619]">Authorized Signature</p>
                        {data.signerName && (
                          <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mt-1">{data.signerName}</p>
                        )}
                        {data.signedDate && (
                          <p className="text-[10px] font-mono text-gray-500 mt-0.5">Date: {data.signedDate}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Electronic Signature Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={handleSaveSignature}
        initialSignerName={data.signerName || data.customerDetails.name || ''}
        initialDate={data.signedDate || ''}
        existingSignatureUrl={data.signatureUrl || ''}
      />

      {/* AI Cabinetry Organizer Modal */}
      <CabinetryOrganizerModal
        isOpen={isCabinetryModalOpen}
        onClose={() => setIsCabinetryModalOpen(false)}
        items={data.items}
        onApplyRearrangedItems={handleApplyRearrangedItems}
        onLoadSampleCabinetry={handleLoadSampleCabinetry}
      />

      {/* Data Bank Modal */}
      <DataBankModal
        isOpen={isDataBankModalOpen}
        onClose={() => setIsDataBankModalOpen(false)}
        onDataBankUpdated={refreshDataBank}
        onInsertCabinetToOrder={(cabinet) => {
          const qtyColId = getQtyColumnId(data.columns);
          const unitPriceColId = getUnitPriceColumnId(data.columns);
          const totalColId = getTotalColumnId(data.columns);
          const skuCol = data.columns.find(c => c.id === 'sku' || c.id.toLowerCase().includes('sku'))?.id || 'sku';
          const descCol = data.columns.find(c => c.id === 'description' || c.id.toLowerCase().includes('desc'))?.id || 'description';

          pushToHistory(data);
          setData(prev => ({
            ...prev,
            items: [
              ...prev.items,
              {
                id: crypto.randomUUID(),
                [skuCol]: cabinet.sku,
                [descCol]: cabinet.description,
                [unitPriceColId]: cabinet.unitPrice,
                [qtyColId]: 1,
                [totalColId]: cabinet.unitPrice,
              }
            ]
          }));
          setQuickSaveFeedback(`Added ${cabinet.sku} to order list!`);
          setTimeout(() => setQuickSaveFeedback(null), 3000);
        }}
      />

      {/* Saved Lists Modal */}
      <SavedListsModal
        isOpen={isSavedListsModalOpen}
        onClose={() => setIsSavedListsModalOpen(false)}
        currentOrder={data}
        onLoadOrder={handleLoadSavedOrder}
      />

      {isParsing && (
        <div className="fixed inset-0 bg-[#151619]/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-white">
          <Loader2 className="w-16 h-16 text-[#D4AF37] animate-spin mb-8" />
          <h2 className="text-2xl font-serif italic text-[#D4AF37] mb-2">Analyzing Document</h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Mapping structural columns & extracting data</p>
        </div>
      )}

      {isExporting && (
        <div className="fixed inset-0 bg-white/40 backdrop-blur-sm z-[100] flex items-center justify-center pointer-events-none">
          <div className="bg-[#151619] text-[#D4AF37] px-10 py-5 rounded-full flex items-center gap-4 shadow-2xl border border-[#D4AF37]/20">
            <Download className="w-5 h-5 animate-bounce" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Exporting High-Resolution Asset...</span>
          </div>
        </div>
      )}
    </div>
  );
}
