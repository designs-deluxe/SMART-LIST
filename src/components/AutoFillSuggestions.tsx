import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Palette, 
  User, 
  MapPin, 
  Boxes, 
  Tag, 
  DollarSign, 
  ArrowRight,
  Check
} from 'lucide-react';
import { 
  CabinetCatalogItem, 
  SupplierEntry, 
  ClientEntry, 
  StyleColorEntry 
} from '../dataBank.ts';
import { CABINET_CATEGORY_INFO } from '../cabinetryUtils.ts';

export type SuggestionType = 'cabinet' | 'supplier' | 'client' | 'style' | 'address';

export interface SuggestionItem {
  id: string;
  type: SuggestionType;
  title: string;
  subtitle?: string;
  badge?: string;
  badgeColor?: string;
  price?: number;
  data: CabinetCatalogItem | SupplierEntry | ClientEntry | StyleColorEntry | any;
}

interface AutoFillSuggestionsProps {
  isOpen: boolean;
  suggestions: SuggestionItem[];
  selectedIndex: number;
  onSelect: (item: SuggestionItem) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
  headerTitle?: string;
  className?: string;
}

export const AutoFillSuggestions: React.FC<AutoFillSuggestionsProps> = ({
  isOpen,
  suggestions,
  selectedIndex,
  onSelect,
  onClose,
  headerTitle = "Data Bank Auto-Fill Suggestions",
  className = ""
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current && selectedIndex >= 0) {
      const selectedEl = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen || suggestions.length === 0) return null;

  return (
    <div 
      className={`absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-2xl shadow-2xl border border-black/10 overflow-hidden text-left ${className}`}
      style={{ maxHeight: '280px' }}
      onMouseDown={e => {
        // Prevent input blur before click handler fires
        e.preventDefault();
      }}
    >
      <div className="bg-gray-900 px-3.5 py-2 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] flex items-center justify-between border-b border-white/10">
        <span className="flex items-center gap-1.5">
          <Tag className="w-3 h-3 text-[#D4AF37]" />
          {headerTitle}
        </span>
        <span className="text-[9px] font-mono text-gray-400 font-normal">
          {suggestions.length} match{suggestions.length === 1 ? '' : 'es'} • Click or Enter
        </span>
      </div>

      <div 
        ref={listRef}
        className="overflow-y-auto max-h-[230px] divide-y divide-gray-100/80 p-1"
      >
        {suggestions.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                isSelected 
                  ? 'bg-[#151619] text-white shadow-sm' 
                  : 'hover:bg-amber-50/70 text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Icon based on suggestion type */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected 
                    ? 'bg-[#D4AF37] text-black font-bold' 
                    : 'bg-gray-100 text-gray-600 group-hover:bg-[#D4AF37]/20 group-hover:text-black'
                }`}>
                  {item.type === 'cabinet' && <Boxes className="w-3.5 h-3.5" />}
                  {item.type === 'supplier' && <Building2 className="w-3.5 h-3.5" />}
                  {item.type === 'client' && <User className="w-3.5 h-3.5" />}
                  {item.type === 'address' && <MapPin className="w-3.5 h-3.5" />}
                  {item.type === 'style' && <Palette className="w-3.5 h-3.5" />}
                </div>

                {/* Main text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold truncate ${
                      isSelected ? 'text-[#D4AF37]' : 'text-gray-950 group-hover:text-black'
                    }`}>
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded font-mono shrink-0 ${
                        item.badgeColor || (isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700')
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {item.subtitle && (
                    <p className={`text-[11px] truncate ${
                      isSelected ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {item.subtitle}
                    </p>
                  )}
                </div>
              </div>

              {/* Price or Action arrow */}
              <div className="flex items-center gap-2 shrink-0">
                {item.price !== undefined && (
                  <span className={`text-xs font-mono font-bold ${
                    isSelected ? 'text-white' : 'text-gray-900 font-black'
                  }`}>
                    ${item.price.toFixed(2)}
                  </span>
                )}
                <div className={`p-1 rounded-lg transition-transform ${
                  isSelected 
                    ? 'text-[#D4AF37] translate-x-0.5' 
                    : 'text-gray-400 group-hover:text-[#D4AF37] group-hover:translate-x-0.5'
                }`}>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
