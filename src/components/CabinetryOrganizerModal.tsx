import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  Loader2, 
  Check, 
  ArrowUpDown, 
  Wand2, 
  Layers, 
  RotateCcw,
  Boxes,
  HelpCircle,
  Settings2,
  Plus,
  Trash2,
  Save,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OrderItem } from '../types.ts';
import { 
  classifyCabinetItem, 
  CABINET_CATEGORY_INFO, 
  CabinetCategory,
  getSavedPrefixes,
  saveCustomPrefixes,
  resetPrefixesToDefault,
  DEFAULT_CABINET_PREFIXES
} from '../cabinetryUtils.ts';
import { rearrangeCabinetryItemsWithAI } from '../geminiService.ts';

interface CabinetryOrganizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onApplyRearrangedItems: (rearrangedItems: OrderItem[], summary: string) => void;
  onLoadSampleCabinetry?: () => void;
}

const PRESET_PROMPTS = [
  {
    label: "Base → Wall → Tall → Fillers → Panels",
    prompt: "Organize the list: base cabinets first, then wall cabinets, tall utility/pantries, fillers, and panels.",
    badge: "Industry Standard",
  },
  {
    label: "Panels → Fillers → Tall → Wall → Base (Vice Versa)",
    prompt: "Organize the list in reverse order (vice versa): panels first, then fillers, tall cabinets, wall cabinets, and base cabinets.",
    badge: "Reverse",
  },
  {
    label: "Wall (Upper) → Base → Tall → Panels → Fillers",
    prompt: "Organize the list wall cabinets first, then base cabinets, tall cabinets, panels, and fillers.",
    badge: "Top-Down",
  },
  {
    label: "Tall (Pantries) → Base → Wall → Fillers & Panels",
    prompt: "Organize the list tall utility and pantry cabinets first, then base cabinets, wall cabinets, fillers, and end panels.",
    badge: "Pantry First",
  },
  {
    label: "Group by Type & Sort by Width (Smallest to Largest)",
    prompt: "Organize base, wall, tall, fillers, and panels, and sort items within each category by cabinet width (smallest to largest).",
    badge: "By Dimension",
  },
];

export const SAMPLE_CABINETRY_ITEMS: OrderItem[] = [
  { id: 'cab-1', sku: 'W3630', description: 'Wall Cabinet 36"W x 30"H 2-Door', quantity: 2, unitPrice: 285.00, total: 570.00 },
  { id: 'cab-2', sku: 'BF3', description: 'Base Filler 3"W x 34.5"H', quantity: 3, unitPrice: 42.00, total: 126.00 },
  { id: 'cab-3', sku: 'B30', description: 'Standard Base Cabinet 30"W 2-Door 1-Drawer', quantity: 3, unitPrice: 340.00, total: 1020.00 },
  { id: 'cab-4', sku: 'REP', description: 'Refrigerator End Panel 3/4" x 24" x 84"', quantity: 1, unitPrice: 220.00, total: 220.00 },
  { id: 'cab-5', sku: 'U2484', description: 'Tall Utility / Pantry Cabinet 24"W x 84"H', quantity: 1, unitPrice: 650.00, total: 650.00 },
  { id: 'cab-6', sku: 'SB36', description: 'Sink Base Cabinet 36"W 2-Door', quantity: 1, unitPrice: 380.00, total: 380.00 },
  { id: 'cab-7', sku: 'WF330', description: 'Wall Filler 3"W x 30"H', quantity: 2, unitPrice: 38.00, total: 76.00 },
  { id: 'cab-8', sku: 'DB24', description: '3-Drawer Base Cabinet 24"W', quantity: 2, unitPrice: 410.00, total: 820.00 },
  { id: 'cab-9', sku: 'W3018', description: 'Wall Bridge Cabinet (Over Refrigerator) 30"W x 18"H', quantity: 1, unitPrice: 210.00, total: 210.00 },
  { id: 'cab-10', sku: 'DWP', description: 'Dishwasher Return End Panel 24" x 34.5"', quantity: 1, unitPrice: 135.00, total: 135.00 },
  { id: 'cab-11', sku: 'B18', description: 'Base Cabinet 18"W 1-Door 1-Drawer', quantity: 2, unitPrice: 260.00, total: 520.00 },
  { id: 'cab-12', sku: 'TK8', description: 'Toe Kick Board 8ft Long x 4.5"H', quantity: 4, unitPrice: 32.00, total: 128.00 }
];

export const CabinetryOrganizerModal: React.FC<CabinetryOrganizerModalProps> = ({
  isOpen,
  onClose,
  items,
  onApplyRearrangedItems,
  onLoadSampleCabinetry,
}) => {
  const [activeTab, setActiveTab] = useState<'rearrange' | 'prefixes'>('rearrange');
  const [instruction, setInstruction] = useState("Organize base, wall, tall, fillers, and panels");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastSummary, setLastSummary] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [prefixSaveFeedback, setPrefixSaveFeedback] = useState<string | null>(null);

  // Custom prefixes state
  const [customPrefixes, setCustomPrefixes] = useState<Record<CabinetCategory, string[]>>(getSavedPrefixes());
  const [selectedCategory, setSelectedCategory] = useState<CabinetCategory>('base');
  const [newPrefixInput, setNewPrefixInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCustomPrefixes(getSavedPrefixes());
      setErrorMessage(null);
      setPrefixSaveFeedback(null);
    }
  }, [isOpen]);

  // Group current items to show detected breakdown using saved prefixes
  const categoryCounts = useMemo(() => {
    const counts: Record<CabinetCategory, number> = {
      base: 0,
      wall: 0,
      tall: 0,
      vanity: 0,
      fillers: 0,
      panels: 0,
      accessories: 0,
      other: 0,
    };
    for (const item of items) {
      const { category } = classifyCabinetItem(item, customPrefixes);
      counts[category] = (counts[category] || 0) + 1;
    }
    return counts;
  }, [items, customPrefixes]);

  const handleSelectPreset = (promptText: string) => {
    setInstruction(promptText);
    setErrorMessage(null);
  };

  const handleAddPrefix = () => {
    const trimmed = newPrefixInput.trim().toUpperCase();
    if (!trimmed) return;
    if (customPrefixes[selectedCategory]?.includes(trimmed)) {
      setErrorMessage(`Prefix "${trimmed}" is already in ${CABINET_CATEGORY_INFO[selectedCategory].label}`);
      return;
    }
    const updated = {
      ...customPrefixes,
      [selectedCategory]: [...(customPrefixes[selectedCategory] || []), trimmed],
    };
    setCustomPrefixes(updated);
    setNewPrefixInput('');
    setErrorMessage(null);
  };

  const handleRemovePrefix = (category: CabinetCategory, prefixToRemove: string) => {
    const updated = {
      ...customPrefixes,
      [category]: (customPrefixes[category] || []).filter(p => p !== prefixToRemove),
    };
    setCustomPrefixes(updated);
  };

  const handleSavePrefixes = () => {
    saveCustomPrefixes(customPrefixes);
    setPrefixSaveFeedback("Custom cabinetry prefixes saved successfully! The AI will now prioritize these prefixes.");
    setTimeout(() => setPrefixSaveFeedback(null), 3500);
  };

  const handleResetPrefixes = () => {
    const defaults = resetPrefixesToDefault();
    setCustomPrefixes(defaults);
    setPrefixSaveFeedback("Cabinetry prefixes reset to NKBA industry standard defaults.");
    setTimeout(() => setPrefixSaveFeedback(null), 3500);
  };

  const handleExecuteRearrange = async () => {
    if (!instruction.trim()) {
      setErrorMessage("Please enter an instruction for the AI.");
      return;
    }

    if (!items || items.length === 0) {
      setErrorMessage("The item list is currently empty. Please add items or load sample cabinetry items first.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setLastSummary(null);

    try {
      const result = await rearrangeCabinetryItemsWithAI(items, instruction, customPrefixes);
      setLastSummary(result.summary);
      onApplyRearrangedItems(result.items, result.summary);
      // Brief pause so user sees confirmation before close
      setTimeout(() => {
        setIsProcessing(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error("Failed to re-arrange items:", err);
      setErrorMessage(err?.message || "An error occurred while re-arranging items. Please try again.");
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const totalDetected: number = (Object.values(categoryCounts) as number[]).reduce((a: number, b: number) => a + b, 0);

  const prefixCategories: CabinetCategory[] = ['base', 'wall', 'tall', 'vanity', 'fillers', 'panels', 'accessories'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl shadow-2xl border border-black/10 w-full max-w-2xl overflow-hidden my-6"
        >
          {/* Header */}
          <div className="bg-[#151619] p-6 text-white flex items-center justify-between border-b border-[#D4AF37]/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37] flex items-center justify-center text-black font-bold shadow-md">
                <Wand2 className="w-5 h-5 text-black" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 font-serif">
                  A.I. Cabinetry Re-arrange
                  <span className="text-[10px] font-mono font-normal uppercase tracking-widest text-[#D4AF37] px-2 py-0.5 rounded-full bg-white/10">
                    Smart Notation
                  </span>
                </h2>
                <p className="text-xs text-gray-400">
                  NKBA architectural classification & custom sequence organizer
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-100 bg-gray-50/75 px-6 pt-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('rearrange')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'rearrange'
                  ? 'border-[#D4AF37] text-gray-900 bg-white rounded-t-xl'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              AI Re-order & Presets
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('prefixes')}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'prefixes'
                  ? 'border-[#D4AF37] text-gray-900 bg-white rounded-t-xl'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              Custom Prefixes & Rules
              <span className="px-1.5 py-0.2 bg-[#D4AF37]/20 text-black text-[10px] font-mono rounded-full font-bold">
                Saved
              </span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {activeTab === 'rearrange' ? (
              <>
                {/* Live Category Breakdown Badge Bar */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Detected in Current Order ({totalDetected} Items)
                    </span>
                    {onLoadSampleCabinetry && items.length < 3 && (
                      <button
                        type="button"
                        onClick={onLoadSampleCabinetry}
                        className="text-[11px] font-bold text-[#151619] hover:text-[#D4AF37] flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm transition-colors cursor-pointer"
                      >
                        <Boxes className="w-3 h-3" />
                        Load 12 Sample Kitchen Cabinets
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(Object.keys(CABINET_CATEGORY_INFO) as CabinetCategory[]).map(cat => {
                      const count = categoryCounts[cat] || 0;
                      const info = CABINET_CATEGORY_INFO[cat];
                      return (
                        <span
                          key={cat}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 ${
                            count > 0 ? info.badgeColor : 'bg-gray-100 text-gray-400 border-gray-200 opacity-60'
                          }`}
                        >
                          <span>{info.label}:</span>
                          <strong className="font-mono">{count}</strong>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Instruction Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-800 flex items-center justify-between">
                    <span>What sequence do you want?</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('prefixes')}
                      className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 lowercase font-normal cursor-pointer"
                    >
                      <Settings2 className="w-3 h-3" />
                      manage supported prefixes
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={instruction}
                      onChange={e => {
                        setInstruction(e.target.value);
                        setErrorMessage(null);
                      }}
                      placeholder='e.g., "organize base, wall, tall, fillers, and panels vice versa"'
                      className="w-full text-sm p-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all text-gray-900 font-medium placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Presets Grid */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">
                    Quick Cabinetry Presets
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {PRESET_PROMPTS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectPreset(preset.prompt)}
                        className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 group cursor-pointer ${
                          instruction === preset.prompt
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-gray-900 group-hover:text-[#151619]">
                            {preset.label}
                          </span>
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {preset.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 line-clamp-1 font-mono">
                          {preset.prompt}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* Custom Prefixes Tab */
              <div className="space-y-5">
                <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-950">
                    <Tag className="w-4 h-4 text-[#D4AF37]" />
                    Custom Cabinetry Prefixes & Classification Engine
                  </p>
                  <p>
                    Add manufacturer codes or custom prefixes (e.g. <code>MYBASE</code>, <code>SPB</code>, <code>WDC</code>, <code>FEP</code>).
                    The AI and local rule engines use these saved prefixes to classify every item accurately.
                  </p>
                </div>

                {/* Category selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 block">
                    Select Category to Edit Prefixes
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {prefixCategories.map(cat => {
                      const isSelected = selectedCategory === cat;
                      const count = customPrefixes[cat]?.length || 0;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                            isSelected
                              ? 'bg-[#151619] text-[#D4AF37] border-[#151619] shadow-sm'
                              : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                          }`}
                        >
                          <span>{CABINET_CATEGORY_INFO[cat].label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full font-mono">
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Current prefixes for selected category */}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                      Prefixes for <span className="text-[#D4AF37]">{CABINET_CATEGORY_INFO[selectedCategory].label}</span>
                    </h4>
                    <span className="text-[11px] text-gray-500 font-mono">
                      {customPrefixes[selectedCategory]?.length || 0} active prefixes
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-white rounded-xl border border-gray-200">
                    {(customPrefixes[selectedCategory] || []).length === 0 ? (
                      <span className="text-xs text-gray-400 italic p-2">No prefixes assigned yet. Add one below.</span>
                    ) : (
                      (customPrefixes[selectedCategory] || []).map(pfx => (
                        <span
                          key={pfx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-300 text-xs font-mono font-bold text-gray-900 group hover:border-red-300 hover:bg-red-50 transition-colors"
                        >
                          <span>{pfx}</span>
                          <button
                            type="button"
                            onClick={() => handleRemovePrefix(selectedCategory, pfx)}
                            className="text-gray-400 hover:text-red-600 p-0.5 rounded transition-colors cursor-pointer"
                            title={`Remove prefix ${pfx}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Add prefix input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newPrefixInput}
                      onChange={e => setNewPrefixInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddPrefix();
                        }
                      }}
                      placeholder={`Add prefix to ${CABINET_CATEGORY_INFO[selectedCategory].label} (e.g. ${selectedCategory === 'base' ? 'B, DB, 3DB' : selectedCategory === 'wall' ? 'W, DCW, MC' : 'TF, BF'})`}
                      className="flex-1 text-xs px-3 py-2 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#D4AF37] font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleAddPrefix}
                      disabled={!newPrefixInput.trim()}
                      className="px-4 py-2 bg-[#151619] hover:bg-black text-[#D4AF37] rounded-xl text-xs font-bold transition-all disabled:opacity-40 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Prefix
                    </button>
                  </div>
                </div>

                {/* Save & Reset buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleResetPrefixes}
                    className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset to NKBA Defaults
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePrefixes}
                    className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#e2bc3d] text-black rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-black" />
                    Save Prefixes
                  </button>
                </div>
              </div>
            )}

            {/* Feedback / Alerts */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {prefixSaveFeedback && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{prefixSaveFeedback}</span>
              </div>
            )}

            {lastSummary && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium">{lastSummary}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-gray-100 gap-3">
              <div className="text-xs text-gray-400">
                Supports all cabinetry prefixes: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">B</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">W</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">U/T</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">BF/WF</code>, <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-700 font-mono">REP/DWP</code> + custom prefixes
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-5 py-3 rounded-2xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider transition-all flex-1 sm:flex-initial cursor-pointer"
                >
                  Close
                </button>
                {activeTab === 'rearrange' ? (
                  <button
                    type="button"
                    onClick={handleExecuteRearrange}
                    disabled={isProcessing}
                    className="px-6 py-3 rounded-2xl bg-[#151619] hover:bg-black text-[#D4AF37] text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 cursor-pointer flex-1 sm:flex-initial"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
                        <span>Re-arranging...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                        <span>Apply AI Re-order</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSavePrefixes}
                    className="px-6 py-3 rounded-2xl bg-[#D4AF37] hover:bg-[#e0b93b] text-black text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl hover:scale-105 active:scale-95 cursor-pointer flex-1 sm:flex-initial"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Prefixes</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
