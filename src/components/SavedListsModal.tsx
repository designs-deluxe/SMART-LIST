import React, { useState, useEffect } from 'react';
import { 
  FolderArchive, 
  X, 
  Search, 
  Clock, 
  Trash2, 
  Copy, 
  ArrowRight, 
  Check, 
  PlusCircle, 
  Layers, 
  DollarSign,
  Save,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  SavedOrder, 
  getSavedOrders, 
  saveCurrentOrder, 
  deleteSavedOrder, 
  duplicateSavedOrder 
} from '../savedListsService.ts';
import { OrderData } from '../types.ts';

interface SavedListsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrder: OrderData;
  onLoadOrder: (order: OrderData) => void;
  onNewOrder: () => void;
}

export const SavedListsModal: React.FC<SavedListsModalProps> = ({
  isOpen,
  onClose,
  currentOrder,
  onLoadOrder,
  onNewOrder,
}) => {
  const [savedOrders, setSavedOrders] = useState<SavedOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveTitleInput, setSaveTitleInput] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const refreshList = () => {
    const list = getSavedOrders();
    setSavedOrders(list);
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setSaveTitleInput(currentOrder.invoiceNumber || currentOrder.customerDetails?.name || 'Kitchen Cabinetry Order');
      setFeedback(null);
    }
  }, [isOpen, currentOrder]);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveCurrent = () => {
    const saved = saveCurrentOrder(currentOrder, saveTitleInput);
    refreshList();
    showNotification(`Order "${saved.name || saved.title}" saved to your list archive!`);
  };

  const handleLoad = (order: SavedOrder) => {
    onLoadOrder(order.orderData);
    onClose();
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this saved cabinetry list?")) {
      deleteSavedOrder(id);
      refreshList();
      showNotification("List removed.");
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const dup = duplicateSavedOrder(id);
    if (dup) {
      refreshList();
      showNotification(`Duplicated as "${dup.name || dup.title}".`);
    }
  };

  const filteredOrders = savedOrders.filter(o => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const title = (o.name || o.title || '').toLowerCase();
    const supplier = (o.supplierName || '').toLowerCase();
    const client = (o.clientName || '').toLowerCase();
    const style = (o.cabinetStyleColor || o.styleColor || '').toLowerCase();
    return (
      title.includes(q) ||
      supplier.includes(q) ||
      client.includes(q) ||
      style.includes(q)
    );
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-black/10 w-full max-w-3xl overflow-hidden my-6 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="bg-[#151619] p-6 text-white flex items-center justify-between border-b border-[#D4AF37]/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-black font-bold shadow-md">
                <FolderArchive className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                  Saved Cabinetry Lists & Projects
                  <span className="text-[10px] font-mono font-normal uppercase tracking-widest text-[#D4AF37] px-2 py-0.5 rounded-full bg-white/10">
                    Archive
                  </span>
                </h2>
                <p className="text-xs text-gray-400">
                  Save current orders and quickly switch between your client projects
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Save Current Bar */}
          <div className="p-4 bg-amber-50/70 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-950 shrink-0 flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5 text-[#D4AF37]" />
                Save Current List:
              </span>
              <input
                type="text"
                value={saveTitleInput}
                onChange={e => setSaveTitleInput(e.target.value)}
                placeholder="Project or Order Name (e.g. Smith Kitchen Remodel)"
                className="text-xs px-3 py-2 bg-white border border-gray-300 rounded-xl flex-1 focus:outline-none focus:border-[#D4AF37] font-semibold"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCurrent}
                className="px-4 py-2 bg-[#151619] hover:bg-black text-[#D4AF37] text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                Save to Archive
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm("Start a new blank order? Be sure to save your current order first!")) {
                    onNewOrder();
                    onClose();
                  }
                }}
                className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-xl border border-gray-300 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Clear and create a fresh blank order"
              >
                <PlusCircle className="w-3.5 h-3.5 text-gray-500" />
                New Blank Order
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {feedback && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 font-medium flex items-center gap-2 shrink-0">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="p-4 border-b border-gray-100 bg-white shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search saved lists by project name, supplier, client, or finish style..."
                className="w-full text-xs pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>
          </div>

          {/* Orders List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-400 space-y-2">
                <FolderArchive className="w-10 h-10 mx-auto text-gray-300" />
                <p className="text-sm font-medium text-gray-600">No saved cabinetry lists found</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Click "Save to Archive" above to save your current order, or search with different keywords.
                </p>
              </div>
            ) : (
              filteredOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => handleLoad(order)}
                  className="p-4 rounded-2xl border border-gray-200 hover:border-[#D4AF37] hover:bg-amber-50/20 transition-all bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group cursor-pointer shadow-sm"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-black">
                        {order.name || order.title}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-bold">
                        {order.itemCount} items
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      {order.supplierName && (
                        <span>Supplier: <strong className="text-gray-700">{order.supplierName}</strong></span>
                      )}
                      {order.clientName && (
                        <span>Client: <strong className="text-gray-700">{order.clientName}</strong></span>
                      )}
                      {(order.cabinetStyleColor || order.styleColor) && (
                        <span>Style: <strong className="text-gray-700">{order.cabinetStyleColor || order.styleColor}</strong></span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        Saved: {new Date(order.updatedAt).toLocaleDateString()} {new Date(order.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Total Value</div>
                      <div className="text-sm font-mono font-black text-gray-950">
                        ${order.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
                      <button
                        type="button"
                        onClick={e => handleDuplicate(order.id, e)}
                        className="p-2 text-gray-400 hover:text-gray-800 rounded-xl hover:bg-gray-100 transition-colors"
                        title="Duplicate this list"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={e => handleDelete(order.id, e)}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                        title="Delete list"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="px-3.5 py-2 bg-[#151619] group-hover:bg-black text-[#D4AF37] rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-gray-500 font-mono">
              {savedOrders.length} saved order{savedOrders.length === 1 ? '' : 's'} in archive
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
