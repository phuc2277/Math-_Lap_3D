import React from 'react';
import { QrCode, X, ExternalLink, Sparkles } from 'lucide-react';

interface CasioQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  expression: string;
  result: string;
  mode: string;
}

export const CasioQrModal: React.FC<CasioQrModalProps> = ({
  isOpen,
  onClose,
  expression,
  result,
  mode,
}) => {
  if (!isOpen) return null;

  const encodedData = encodeURIComponent(`Casiofx580:${mode}:${expression}=${result}`);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}&bgcolor=ffffff&color=0f172a&margin=1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center justify-center space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-black text-amber-400">
            Casio ClassWiz QR Code
          </span>
          <h3 className="font-extrabold text-base text-white flex items-center gap-1.5">
            <QrCode className="w-5 h-5 text-sky-400" />
            <span>Mã QR Đồ Thị & Kết Quả</span>
          </h3>
        </div>

        {/* QR Code Container */}
        <div className="p-4 bg-white rounded-2xl inline-block shadow-lg mx-auto">
          <img
            src={qrUrl}
            alt="Casio ClassWiz QR"
            className="w-44 h-44 mx-auto rounded-lg"
            loading="lazy"
          />
        </div>

        {/* Expression info */}
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-left space-y-1">
          <div className="text-slate-400 truncate">
            Biểu thức: <span className="text-white font-bold">{expression || '0'}</span>
          </div>
          <div className="text-sky-400 font-bold truncate">
            Kết quả: <span className="text-white">{result}</span>
          </div>
          <div className="text-slate-500 text-[10px]">Chế độ: {mode}</div>
        </div>

        <p className="text-[11px] text-slate-400">
          Quét mã bằng camera điện thoại hoặc ứng dụng Casio EDU+ để vẽ đồ thị hàm số và xem bảng số liệu trực quan.
        </p>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs shadow-lg transition-all"
        >
          Đóng cửa sổ
        </button>
      </div>
    </div>
  );
};
