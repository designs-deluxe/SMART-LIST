import React, { useState, useRef, useEffect } from 'react';
import { X, PenLine, Type, RotateCcw, Check, ShieldCheck } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { signatureUrl: string; signerName: string; signedDate: string }) => void;
  initialSignerName?: string;
  initialDate?: string;
  existingSignatureUrl?: string;
}

const INK_COLORS = [
  { label: 'Obsidian Black', value: '#151619' },
  { label: 'Royal Navy', value: '#1e3a8a' },
  { label: 'Luxury Gold', value: '#b48a1d' },
];

const SCRIPT_FONTS = [
  { id: 'great-vibes', name: 'Classic Calligraphy', family: "'Great Vibes', cursive" },
  { id: 'dancing-script', name: 'Modern Cursive', family: "'Dancing Script', cursive" },
  { id: 'caveat', name: 'Natural Signature', family: "'Caveat', cursive" },
];

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSignerName = '',
  initialDate = '',
  existingSignatureUrl = '',
}) => {
  const [mode, setMode] = useState<'draw' | 'type'>('draw');
  const [signerName, setSignerName] = useState(initialSignerName);
  const [signedDate, setSignedDate] = useState(
    initialDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  );
  const [selectedColor, setSelectedColor] = useState(INK_COLORS[0].value);
  const [selectedFont, setSelectedFont] = useState(SCRIPT_FONTS[0].id);
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize and scale canvas for high DPI
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual size in memory
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale all drawing operations
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Line style
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2.5;

    // If existing signature exists and we haven't drawn yet, load it
    if (existingSignatureUrl && !hasDrawn) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = existingSignatureUrl;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSignerName(initialSignerName);
      if (!initialDate) {
        setSignedDate(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      }
      // Small timeout to ensure DOM is rendered before reading getBoundingClientRect
      const timer = setTimeout(() => {
        initCanvas();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Update stroke color when selectedColor changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = selectedColor;
    }
  }, [selectedColor]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
  };

  // Drawing event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPointRef.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = selectedColor;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasDrawn(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !lastPointRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Midpoint smoothing
    const midX = (lastPointRef.current.x + currentX) / 2;
    const midY = (lastPointRef.current.y + currentY) / 2;

    ctx.quadraticCurveTo(lastPointRef.current.x, lastPointRef.current.y, midX, midY);
    ctx.stroke();

    lastPointRef.current = { x: currentX, y: currentY };
    setHasDrawn(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current && lastPointRef.current) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const rect = canvas.getBoundingClientRect();
          const currentX = e.clientX - rect.left;
          const currentY = e.clientY - rect.top;
          ctx.lineTo(currentX, currentY);
          ctx.stroke();
        }
      }
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleSave = () => {
    let finalDataUrl = '';

    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawn) {
        alert('Please draw a signature before adopting.');
        return;
      }
      finalDataUrl = canvas.toDataURL('image/png');
    } else {
      // Render typed text to an offscreen canvas
      if (!signerName.trim()) {
        alert('Please enter your full name to generate a signature.');
        return;
      }
      const offscreen = document.createElement('canvas');
      const width = 600;
      const height = 200;
      offscreen.width = width;
      offscreen.height = height;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      const fontObj = SCRIPT_FONTS.find(f => f.id === selectedFont) || SCRIPT_FONTS[0];
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = selectedColor;
      ctx.font = `64px ${fontObj.family}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(signerName.trim(), width / 2, height / 2);

      finalDataUrl = offscreen.toDataURL('image/png');
    }

    onSave({
      signatureUrl: finalDataUrl,
      signerName: signerName.trim(),
      signedDate: signedDate.trim(),
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-black/10 overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#151619] p-6 text-white flex justify-between items-center border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#151619] flex items-center justify-center">
              <PenLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-wide">Electronic Signature</h3>
              <p className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-sans">Authorized Order Verification</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mode Switch & Ink Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('draw')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === 'draw'
                    ? 'bg-white text-[#151619] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <PenLine className="w-3.5 h-3.5" />
                Draw
              </button>
              <button
                type="button"
                onClick={() => setMode('type')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  mode === 'type'
                    ? 'bg-white text-[#151619] shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                Type
              </button>
            </div>

            {/* Ink Color Selection */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Ink:</span>
              <div className="flex gap-1.5">
                {INK_COLORS.map(c => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setSelectedColor(c.value)}
                    title={c.label}
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      selectedColor === c.value
                        ? 'border-[#D4AF37] scale-110 shadow-sm'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.value }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Draw Mode */}
          {mode === 'draw' && (
            <div className="space-y-2">
              <div className="relative border-2 border-dashed border-gray-200 hover:border-[#D4AF37]/50 rounded-2xl bg-gray-50/50 overflow-hidden transition-colors">
                <canvas
                  ref={canvasRef}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="w-full h-44 cursor-crosshair touch-none block"
                  style={{ touchAction: 'none' }}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-gray-400">
                    <PenLine className="w-6 h-6 mb-2 stroke-1 opacity-50" />
                    <span className="text-xs font-medium tracking-wide">Sign with mouse, trackpad, or touch</span>
                  </div>
                )}
                {/* Signature line guide */}
                <div className="absolute bottom-6 left-12 right-12 border-b border-gray-300 pointer-events-none flex justify-between text-[10px] text-gray-400 pt-1">
                  <span>Sign above</span>
                  <span className="text-gray-300">✕</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs px-1">
                <span className="text-gray-400 font-medium">Digital drawing will be embedded on the invoice</span>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-red-600 transition-colors font-semibold py-1 px-2 rounded-lg hover:bg-gray-100"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Type Mode */}
          {mode === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 block mb-1.5">
                  Type Your Signature Name
                </label>
                <input
                  type="text"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder="e.g. Alexander Hamilton"
                  className="w-full text-base p-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none font-medium"
                />
              </div>

              {/* Style Selection */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-widest text-gray-500 block mb-2">
                  Choose Handwriting Style
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {SCRIPT_FONTS.map(font => (
                    <button
                      key={font.id}
                      type="button"
                      onClick={() => setSelectedFont(font.id)}
                      className={`p-3 text-left rounded-xl border transition-all flex items-center justify-between ${
                        selectedFont === font.id
                          ? 'border-[#D4AF37] bg-[#D4AF37]/5 ring-1 ring-[#D4AF37]'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <span
                        className="text-2xl"
                        style={{ fontFamily: font.family, color: selectedColor }}
                      >
                        {signerName.trim() || 'Your Signature Here'}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        {font.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Signer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block mb-1">
                Authorized Signer Name
              </label>
              <input
                type="text"
                value={signerName}
                onChange={e => setSignerName(e.target.value)}
                placeholder="Full Legal Name"
                className="w-full text-sm p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#D4AF37] outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] block mb-1">
                Signature Date
              </label>
              <input
                type="text"
                value={signedDate}
                onChange={e => setSignedDate(e.target.value)}
                placeholder="e.g. Sep 2, 2026"
                className="w-full text-sm p-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:border-[#D4AF37] outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>This electronic signature will be bound to this official order and stamped onto exported PDFs & invoices.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-200/60 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#151619] hover:bg-black text-[#D4AF37] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-black/10 flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            Apply Signature
          </button>
        </div>
      </div>
    </div>
  );
};
