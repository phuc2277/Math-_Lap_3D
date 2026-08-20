import React from 'react';
import { Casio580Calculator } from './Casio580Calculator';
import { X, Calculator, Sparkles } from 'lucide-react';

interface CasioCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAIExplanation?: (problem: string) => void;
}

export const CasioCalculatorModal: React.FC<CasioCalculatorModalProps> = ({
  isOpen,
  onClose,
  onOpenAIExplanation,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-sky-500 p-0.5 flex items-center justify-center shadow-md">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Calculator className="w-5 h-5 text-sky-400" />
              </div>
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
                <span>Máy Tính Casio fx-580 VN X</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  CLASSWIZ
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tính toán số học, giải phương trình, bảng giá trị & thống kê
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Casio 580 Simulator Body */}
        <Casio580Calculator
          isModal={true}
          onClose={onClose}
          onOpenAIExplanation={onOpenAIExplanation}
        />
      </div>
    </div>
  );
};

export default CasioCalculatorModal;
