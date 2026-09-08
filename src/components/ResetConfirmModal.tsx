import React from 'react';
import { RotateCcw, AlertTriangle, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSet: () => void;
  onResetMatch: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onResetSet,
  onResetMatch,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#1f222a] border border-white/[0.08] rounded-[28px] w-full max-w-sm p-6 shadow-2xl text-slate-100">
        {/* Header Icon + Title */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-base">
            <div className="w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>Pilihan Reset</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 my-4 leading-relaxed">
          Adakah anda ingin set semula skor set semasa sahaja, atau mulakan perlawanan baharu sepenuhnya?
        </p>

        <div className="space-y-2.5">
          {/* Reset Set button (M3 Tonal Button) */}
          <button
            onClick={() => {
              onResetSet();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-full bg-[#2a2e39] hover:bg-[#343a47] text-teal-300 text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer border border-white/[0.06]"
          >
            <RotateCcw className="w-3.5 h-3.5 text-teal-400" />
            <span>Set Semula Skor Set Sahaja (0 - 0)</span>
          </button>

          {/* Reset Full Match button (M3 Filled Destructive Button) */}
          <button
            onClick={() => {
              onResetMatch();
              onClose();
            }}
            className="w-full py-3 px-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-md shadow-rose-950/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Perlawanan Baharu (Reset Penuh)</span>
          </button>

          {/* Cancel (M3 Text button) */}
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full text-slate-400 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
};

