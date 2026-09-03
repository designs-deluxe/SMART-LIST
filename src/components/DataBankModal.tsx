import React, { useState, useMemo } from 'react';
import { 
  Database, 
  X, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  Download, 
  Upload, 
  Check, 
  Building2, 
  User, 
  MapPin, 
  Palette, 
  Boxes, 
  Sparkles,
  Save,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DataBank, 
  CabinetCatalogItem, 
  SupplierEntry, 
  ClientEntry, 
  StyleColorEntry,
  loadDataBank,
  saveDataBank,
  extractAndSaveFromOrder,
  exportDataBankJSON,
  importDataBankJSON,
  DEFAULT_DATA_BANK
} from '../dataBank.ts';
import { CABINET_CATEGORY_INFO, CabinetCategory } from '../cabinetryUtils.ts';
import { OrderData } from '../types.ts';

interface DataBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentOrder: OrderData;
  onDataBankUpdated: () => void;
}

export const DataBankModal: React.FC<DataBankModalProps> = ({
  isOpen,
  onClose,
  currentOrder,
  onDataBankUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'cabinets' | 'suppliers' | 'clients' | 'styles'>('cabinets');
  const [dataBank, setDataBank] = useState<DataBank>(loadDataBank());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [feedback, setFeedback] = useState<string | null>(null);

  // New Cabinet Form State
  const [isAddingCabinet, setIsAddingCabinet] = useState(false);
  const [newCabinetSku, setNewCabinetSku] = useState('');
  const [newCabinetDesc, setNewCabinetDesc] = useState('');
  const [newCabinetPrice, setNewCabinetPrice] = useState('');
  const [newCabinetCategory, setNewCabinetCategory] = useState<CabinetCategory>('base');
  const [newCabinetDims, setNewCabinetDims] = useState('');

  // New Supplier Form State
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierContact, setNewSupplierContact] = useState('');
  const [newSupplierEmail, setNewSupplierEmail] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [newSupplierNotes, setNewSupplierNotes] = useState('');

  // New Client Form State
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [newClientState, setNewClientState] = useState('');
  const [newClientZip, setNewClientZip] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');

  // New Style Form State
  const [isAddingStyle, setIsAddingStyle] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleFinish, setNewStyleFinish] = useState('');
  const [newStyleSpecies, setNewStyleSpecies] = useState('');

  const refreshData = () => {
    const loaded = loadDataBank();
    setDataBank(loaded);
    onDataBankUpdated();
  };

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // 1-Click Sync Current Order into Data Bank
  const handleExtractFromOrder = () => {
    const result = extractAndSaveFromOrder(currentOrder);
    refreshData();
    showNotification(
      `Extracted: ${result.addedCabinets} new cabinets, ${result.addedSuppliers} suppliers, ${result.addedClients} clients, ${result.addedStyles} finishes into Data Bank!`
    );
  };

  // Add Cabinet
  const handleSaveNewCabinet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCabinetSku.trim()) return;
    const item: CabinetCatalogItem = {
      id: `cab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      sku: newCabinetSku.trim().toUpperCase(),
      description: newCabinetDesc.trim() || newCabinetSku.trim().toUpperCase(),
      unitPrice: Number(newCabinetPrice) || 0,
      category: newCabinetCategory,
      dimensions: newCabinetDims.trim() || undefined,
    };
    const updated = { ...dataBank, cabinets: [item, ...dataBank.cabinets] };
    saveDataBank(updated);
    setDataBank(updated);
    onDataBankUpdated();
    setIsAddingCabinet(false);
    setNewCabinetSku('');
    setNewCabinetDesc('');
    setNewCabinetPrice('');
    setNewCabinetDims('');
    showNotification(`Cabinet ${item.sku} added to catalog.`);
  };

  const handleDeleteCabinet = (id: string) => {
    const updated = { ...dataBank, cabinets: dataBank.cabinets.filter(c => c.id !== id) };
    saveDataBank(updated);
    setDataBank(updated);
    onDataBankUpdated();
  };

  // Add Supplier
  const handleSaveNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplierName.trim()) return;
    const sup: SupplierEntry = {
      id: `sup-${Date.now()}`,
      name: newSupplierName.trim(),
      contactPerson: newSupplierContact.trim() || undefined,
      email: newSupplierEmail.trim() || undefined,
      phone: newSupplierPhone.trim() || undefined,
      notes: newSupplierNotes.trim() || undefined,
    };
    const updated = { ...dataBank, suppliers: [sup, ...dataBank.suppliers] };
    saveDataBank(updated);
    setDataBank(updated);
    onDataBankUpdated();
    setIsAddingSupplier(false);
    setNewSupplierName('');
    setNewSupplierContact('');
    setNewSupplierEmail('');
    setNewSupplierPhone('');
    setNewSupplierNotes('');
    showNotification(`Supplier "${sup.name}" added.`);
  };

  const handleDeleteSupplier = (id: string) => {
    const updated = { ...dataBank, suppliers: dataBank.suppliers.filter(s => s.id !== id) };
    saveDataBank(updated);
    setDataBank(updated);
    onDataBankUpdated();
  };

  // Add Client
  const handleSaveNewClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    const cli: ClientEntry = {
      id: `cli-${Date.now()}`,
      name: newClientName.trim(),
      email: newClientEmail.trim() || undefined,
      phone: newClientPhone.trim() || undefined,
      addressLine1: newClientAddress.trim(),
      city: newClientCity.trim(),
      state: newClientState.trim().toUpperCase(),
      zip: newClientZip.trim(),
      company: newClientCompany.trim() || undefined,
    };
    const updated = { ...dataBank, clients: [cli, ...dataBank.clients] };
    saveDataBank(updated);
    setDataBank(updated);
    onDataBankUpdated();
    setIsAddingClient(false);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientPhone('');
    setNewClientAddress('');
    setNewClientCity('');
    setNewClientState('');
    setNewClientZip('');
    setNewClientCompany('');
    showNotification(`Client "${cli.name}" and address saved.`);
  };

  const handleDeleteClient = (id: string) => {
    const updated = { ...dataBank, clients: dataBank.clients.filter(c => c.id !== id) };
    saveDataBank(updated);
    setDataBank(updated);
    onDataBankUpdated();
  };

  // Add Style
  const handleSaveNewStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyleName.trim()) return;
    const sty: StyleColorEntry = {
      id: `sty-${Date.now()}`,
      name: newStyleName.trim(),
      finishType: newStyleFinish.trim() || undefined,
      species: newStyleSpecies.trim() || undefined,
    };
    const updated = { ...dataBank, styles: [sty, ...dataBank.styles] };
    saveDataBank(updated);
    setDataBank(updated);
    onDataBankUpdated();
    setIsAddingStyle(false);
    setNewStyleName('');
    setNewStyleFinish('');
    setNewStyleSpecies('');
    showNotification(`Style & Color "${sty.name}" added.`);
  };

  const handleDeleteStyle = (id: string) => {
    const updated = { ...dataBank, styles: dataBank.styles.filter(s => s.id !== id) };
    saveDataBank(updated);
    setDataBank(updated);
    onDataBankUpdated();
  };

  // Export / Import
  const handleExportJSON = () => {
    const jsonStr = exportDataBankJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cabinetry_DataBank_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification("Data Bank exported to JSON file.");
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (importDataBankJSON(content)) {
        refreshData();
        showNotification("Data Bank imported successfully!");
      } else {
        alert("Could not import file. Please check JSON format.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredCabinets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dataBank.cabinets.filter(c => {
      const matchesCat = categoryFilter === 'all' || c.category === categoryFilter;
      const matchesQuery = !q || c.sku.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [dataBank.cabinets, searchQuery, categoryFilter]);

  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dataBank.suppliers.filter(s => !q || s.name.toLowerCase().includes(q) || (s.notes && s.notes.toLowerCase().includes(q)));
  }, [dataBank.suppliers, searchQuery]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dataBank.clients.filter(c => 
      !q || 
      c.name.toLowerCase().includes(q) || 
      c.addressLine1.toLowerCase().includes(q) || 
      c.city.toLowerCase().includes(q) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  }, [dataBank.clients, searchQuery]);

  const filteredStyles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return dataBank.styles.filter(s => !q || s.name.toLowerCase().includes(q));
  }, [dataBank.styles, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-black/10 w-full max-w-4xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-[#151619] p-6 text-white flex items-center justify-between border-b border-[#D4AF37]/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-black font-bold shadow-md">
                <Database className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                  Cabinetry Data Bank
                  <span className="text-[10px] font-mono font-normal uppercase tracking-widest text-[#D4AF37] px-2 py-0.5 rounded-full bg-white/10">
                    Master Catalog & Auto-Fill
                  </span>
                </h2>
                <p className="text-xs text-gray-400">
                  Cabinets, SKUs, Suppliers, Clients, Addresses & Colors powering intelligent auto-fill
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExtractFromOrder}
                className="px-3 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-black rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-[#D4AF37]/40 cursor-pointer"
                title="Scan and save the current project's supplier, client, addresses, and cabinet items into the Data Bank"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Save Current Order to Bank</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center justify-between border-b border-gray-100 bg-gray-50/75 px-6 pt-3 gap-2 shrink-0">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setActiveTab('cabinets'); setSearchQuery(''); }}
                className={`pb-3 px-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'cabinets'
                    ? 'border-[#D4AF37] text-gray-900 bg-white rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Boxes className="w-3.5 h-3.5 text-[#D4AF37]" />
                Cabinets & SKUs ({dataBank.cabinets.length})
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('suppliers'); setSearchQuery(''); }}
                className={`pb-3 px-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'suppliers'
                    ? 'border-[#D4AF37] text-gray-900 bg-white rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                Suppliers ({dataBank.suppliers.length})
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('clients'); setSearchQuery(''); }}
                className={`pb-3 px-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'clients'
                    ? 'border-[#D4AF37] text-gray-900 bg-white rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                Clients & Addresses ({dataBank.clients.length})
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('styles'); setSearchQuery(''); }}
                className={`pb-3 px-3.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'styles'
                    ? 'border-[#D4AF37] text-gray-900 bg-white rounded-t-xl'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Palette className="w-3.5 h-3.5 text-[#D4AF37]" />
                Colors & Styles ({dataBank.styles.length})
              </button>
            </div>

            <div className="flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={handleExportJSON}
                className="text-[11px] font-bold text-gray-600 hover:text-black flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white transition-colors cursor-pointer"
                title="Export Data Bank as JSON backup"
              >
                <Download className="w-3 h-3 text-[#D4AF37]" />
                Backup JSON
              </button>
              <label className="text-[11px] font-bold text-gray-600 hover:text-black flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white transition-colors cursor-pointer">
                <Upload className="w-3 h-3 text-[#D4AF37]" />
                Import JSON
                <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
              </label>
            </div>
          </div>

          {/* Notification Feedback Banner */}
          {feedback && (
            <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs text-emerald-800 font-medium flex items-center gap-2 shrink-0">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedback}</span>
            </div>
          )}

          {/* Search & Actions Bar */}
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white shrink-0">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}... (e.g. B30, Shaker, Alexander, Fabuwood)`}
                className="w-full text-xs pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#D4AF37] focus:outline-none"
              />
            </div>

            {activeTab === 'cabinets' && (
              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="text-xs px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="all">All Categories</option>
                  <option value="base">Base Cabinets</option>
                  <option value="wall">Wall Cabinets</option>
                  <option value="tall">Tall / Pantries</option>
                  <option value="vanity">Vanities</option>
                  <option value="fillers">Fillers & Trim</option>
                  <option value="panels">Panels & Skins</option>
                  <option value="accessories">Accessories</option>
                </select>
                <button
                  type="button"
                  onClick={() => setIsAddingCabinet(!isAddingCabinet)}
                  className="px-3 py-2 bg-[#151619] hover:bg-black text-[#D4AF37] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Cabinet
                </button>
              </div>
            )}

            {activeTab === 'suppliers' && (
              <button
                type="button"
                onClick={() => setIsAddingSupplier(!isAddingSupplier)}
                className="px-3 py-2 bg-[#151619] hover:bg-black text-[#D4AF37] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Supplier
              </button>
            )}

            {activeTab === 'clients' && (
              <button
                type="button"
                onClick={() => setIsAddingClient(!isAddingClient)}
                className="px-3 py-2 bg-[#151619] hover:bg-black text-[#D4AF37] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Client & Address
              </button>
            )}

            {activeTab === 'styles' && (
              <button
                type="button"
                onClick={() => setIsAddingStyle(!isAddingStyle)}
                className="px-3 py-2 bg-[#151619] hover:bg-black text-[#D4AF37] rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Style / Finish
              </button>
            )}
          </div>

          {/* Form Add Panels */}
          {activeTab === 'cabinets' && isAddingCabinet && (
            <form onSubmit={handleSaveNewCabinet} className="bg-amber-50/70 border-b border-amber-200 p-4 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Add New Cabinet to Catalog
                </span>
                <button type="button" onClick={() => setIsAddingCabinet(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <input
                  type="text"
                  placeholder="SKU (e.g. B30, W3630)"
                  value={newCabinetSku}
                  onChange={e => setNewCabinetSku(e.target.value)}
                  required
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl font-mono uppercase font-bold"
                />
                <input
                  type="text"
                  placeholder="Description (e.g. Base 30 2-Door)"
                  value={newCabinetDesc}
                  onChange={e => setNewCabinetDesc(e.target.value)}
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl sm:col-span-2"
                />
                <select
                  value={newCabinetCategory}
                  onChange={e => setNewCabinetCategory(e.target.value as CabinetCategory)}
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl"
                >
                  <option value="base">Base</option>
                  <option value="wall">Wall</option>
                  <option value="tall">Tall</option>
                  <option value="vanity">Vanity</option>
                  <option value="fillers">Fillers & Moldings</option>
                  <option value="panels">Panels & Skins</option>
                  <option value="accessories">Accessories</option>
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price $"
                    value={newCabinetPrice}
                    onChange={e => setNewCabinetPrice(e.target.value)}
                    className="text-xs p-2 bg-white border border-gray-200 rounded-xl w-24 font-mono"
                  />
                  <button type="submit" className="px-3 py-2 bg-[#D4AF37] hover:bg-[#e0b93b] text-black font-bold text-xs rounded-xl flex-1 cursor-pointer">
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'suppliers' && isAddingSupplier && (
            <form onSubmit={handleSaveNewSupplier} className="bg-amber-50/70 border-b border-amber-200 p-4 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Add New Supplier
                </span>
                <button type="button" onClick={() => setIsAddingSupplier(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Supplier / Brand Name *"
                  value={newSupplierName}
                  onChange={e => setNewSupplierName(e.target.value)}
                  required
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl font-bold"
                />
                <input
                  type="text"
                  placeholder="Contact Person"
                  value={newSupplierContact}
                  onChange={e => setNewSupplierContact(e.target.value)}
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Phone or Email"
                  value={newSupplierPhone}
                  onChange={e => setNewSupplierPhone(e.target.value)}
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Notes (e.g. 2-3 wks lead)"
                    value={newSupplierNotes}
                    onChange={e => setNewSupplierNotes(e.target.value)}
                    className="text-xs p-2 bg-white border border-gray-200 rounded-xl flex-1"
                  />
                  <button type="submit" className="px-3 py-2 bg-[#D4AF37] hover:bg-[#e0b93b] text-black font-bold text-xs rounded-xl cursor-pointer">
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'clients' && isAddingClient && (
            <form onSubmit={handleSaveNewClient} className="bg-amber-50/70 border-b border-amber-200 p-4 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Add Client & Shipping Address
                </span>
                <button type="button" onClick={() => setIsAddingClient(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Client Full Name *"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                  required
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl font-bold"
                />
                <input
                  type="text"
                  placeholder="Street Address *"
                  value={newClientAddress}
                  onChange={e => setNewClientAddress(e.target.value)}
                  required
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl sm:col-span-2"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={newClientCompany}
                  onChange={e => setNewClientCompany(e.target.value)}
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={newClientCity}
                  onChange={e => setNewClientCity(e.target.value)}
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="State (e.g. CA, CO)"
                  value={newClientState}
                  onChange={e => setNewClientState(e.target.value)}
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl uppercase font-bold"
                />
                <input
                  type="text"
                  placeholder="Zip Code"
                  value={newClientZip}
                  onChange={e => setNewClientZip(e.target.value)}
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl font-mono"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Phone"
                    value={newClientPhone}
                    onChange={e => setNewClientPhone(e.target.value)}
                    className="text-xs p-2 bg-white border border-gray-200 rounded-xl flex-1"
                  />
                  <button type="submit" className="px-3 py-2 bg-[#D4AF37] hover:bg-[#e0b93b] text-black font-bold text-xs rounded-xl cursor-pointer">
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'styles' && isAddingStyle && (
            <form onSubmit={handleSaveNewStyle} className="bg-amber-50/70 border-b border-amber-200 p-4 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Add Cabinet Style / Finish
                </span>
                <button type="button" onClick={() => setIsAddingStyle(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <input
                  type="text"
                  placeholder="Style Name (e.g. Shaker White) *"
                  value={newStyleName}
                  onChange={e => setNewStyleName(e.target.value)}
                  required
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl sm:col-span-2 font-bold"
                />
                <input
                  type="text"
                  placeholder="Finish Type (e.g. Matte Enamel)"
                  value={newStyleFinish}
                  onChange={e => setNewStyleFinish(e.target.value)}
                  className="text-xs p-2 bg-white border border-gray-200 rounded-xl"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Species (e.g. Birch Maple)"
                    value={newStyleSpecies}
                    onChange={e => setNewStyleSpecies(e.target.value)}
                    className="text-xs p-2 bg-white border border-gray-200 rounded-xl flex-1"
                  />
                  <button type="submit" className="px-3 py-2 bg-[#D4AF37] hover:bg-[#e0b93b] text-black font-bold text-xs rounded-xl cursor-pointer">
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Tab Content List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeTab === 'cabinets' && (
              <div className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-2xl overflow-hidden">
                {filteredCabinets.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs">
                    No cabinets matching your search. Click "Add Cabinet" to record a new SKU.
                  </div>
                ) : (
                  filteredCabinets.map(item => {
                    const info = CABINET_CATEGORY_INFO[item.category] || CABINET_CATEGORY_INFO.other;
                    return (
                      <div key={item.id} className="p-3 hover:bg-gray-50 flex items-center justify-between gap-4 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase shrink-0 ${info.badgeColor}`}>
                            {info.label.split(' ')[0]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-gray-950">{item.sku}</span>
                              {item.dimensions && (
                                <span className="text-[10px] text-gray-400 font-mono">({item.dimensions})</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 truncate">{item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs font-mono font-bold text-gray-950">
                            ${item.unitPrice.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteCabinet(item.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete cabinet from catalog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === 'suppliers' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSuppliers.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs col-span-2">
                    No suppliers found. Click "Add Supplier" to add one.
                  </div>
                ) : (
                  filteredSuppliers.map(sup => (
                    <div key={sup.id} className="p-4 rounded-2xl border border-gray-200 hover:border-[#D4AF37] transition-all bg-white flex flex-col justify-between gap-2 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-black font-bold">
                            <Building2 className="w-4 h-4 text-[#D4AF37]" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-950">{sup.name}</h4>
                            {sup.contactPerson && (
                              <p className="text-[11px] text-gray-500">{sup.contactPerson}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(sup.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-[11px] text-gray-600 space-y-0.5 pt-1 border-t border-gray-50 font-mono">
                        {sup.phone && <p>📞 {sup.phone}</p>}
                        {sup.email && <p>✉️ {sup.email}</p>}
                        {sup.notes && <p className="text-gray-400 font-sans italic">{sup.notes}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'clients' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredClients.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs col-span-2">
                    No clients found. Click "Add Client & Address" to save one.
                  </div>
                ) : (
                  filteredClients.map(cli => (
                    <div key={cli.id} className="p-4 rounded-2xl border border-gray-200 hover:border-[#D4AF37] transition-all bg-white flex flex-col justify-between gap-2 shadow-sm">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center font-bold">
                            <User className="w-4 h-4 text-sky-700" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-gray-950">{cli.name}</h4>
                            {cli.company && (
                              <p className="text-[11px] text-gray-500 font-medium">{cli.company}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteClient(cli.id)}
                          className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Remove client"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[11px] text-gray-600 space-y-0.5 pt-1 border-t border-gray-50">
                        <p className="font-medium flex items-center gap-1 text-gray-800">
                          <MapPin className="w-3 h-3 text-[#D4AF37] shrink-0" />
                          <span>{cli.addressLine1}, {cli.city} {cli.state} {cli.zip}</span>
                        </p>
                        {cli.phone && <p className="font-mono text-gray-500">📞 {cli.phone}</p>}
                        {cli.email && <p className="font-mono text-gray-500">✉️ {cli.email}</p>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'styles' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredStyles.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-xs col-span-3">
                    No finishes found. Click "Add Style / Finish" to record one.
                  </div>
                ) : (
                  filteredStyles.map(sty => (
                    <div key={sty.id} className="p-3 rounded-2xl border border-gray-200 hover:border-[#D4AF37] transition-all bg-white flex items-center justify-between gap-2 shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="w-7 h-7 rounded-lg border border-gray-300 shrink-0 shadow-inner"
                          style={{ backgroundColor: sty.hex || '#e5e7eb' }}
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-950 truncate">{sty.name}</h4>
                          <p className="text-[10px] text-gray-500 truncate">
                            {[sty.finishType, sty.species].filter(Boolean).join(' • ') || 'Standard Finish'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteStyle(sty.id)}
                        className="p-1 text-gray-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                        title="Delete finish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-gray-500">
              Auto-fill actively suggests items as you type across all inputs.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-[#151619] hover:bg-black text-[#D4AF37] rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
