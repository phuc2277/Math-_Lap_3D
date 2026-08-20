import React, { useState } from 'react';
import { TeacherLabPermissions } from '../../types/teacher';
import {
  Settings,
  RotateCw,
  Sliders,
  Scissors,
  Eye,
  CheckSquare,
  Clock,
  Projector,
  Send,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react';

interface TeacherControlPanelProps {
  permissions: TeacherLabPermissions;
  onPermissionChange: (newPermissions: TeacherLabPermissions) => void;
  onStartPresentation: () => void;
  onOpenAssignModal: () => void;
  onClose?: () => void;
}

export const TeacherControlPanel: React.FC<TeacherControlPanelProps> = ({
  permissions,
  onPermissionChange,
  onStartPresentation,
  onOpenAssignModal,
  onClose,
}) => {
  const [localPerms, setLocalPerms] = useState<TeacherLabPermissions>(permissions);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const toggle = (key: keyof TeacherLabPermissions) => {
    if (typeof localPerms[key] === 'boolean') {
      const updated = { ...localPerms, [key]: !localPerms[key] };
      setLocalPerms(updated);
      onPermissionChange(updated);
    }
  };

  const handleTimeChange = (mins: number) => {
    const updated = { ...localPerms, timeLimitMinutes: Math.max(1, mins) };
    setLocalPerms(updated);
    onPermissionChange(updated);
  };

  const handleSave = () => {
    onPermissionChange(localPerms);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="bg-slate-900/95 border border-amber-500/40 rounded-2xl p-5 shadow-2xl backdrop-blur-md text-white max-w-sm w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">⚙ Chế độ giáo viên</h2>
            <p className="text-[11px] text-amber-300/80">Quyền hạn & giao diện học sinh</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Permissions Checkboxes */}
      <div className="space-y-2.5 text-xs">
        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
          <div className="flex items-center gap-2 text-slate-200">
            <RotateCw className="w-4 h-4 text-sky-400" />
            <span>Cho phép xoay 3D</span>
          </div>
          <input
            type="checkbox"
            checked={localPerms.allowRotate}
            onChange={() => toggle('allowRotate')}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
          <div className="flex items-center gap-2 text-slate-200">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Cho phép thay đổi tham số</span>
          </div>
          <input
            type="checkbox"
            checked={localPerms.allowParameterChange}
            onChange={() => toggle('allowParameterChange')}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
          <div className="flex items-center gap-2 text-slate-200">
            <Scissors className="w-4 h-4 text-rose-400" />
            <span>Cho phép mặt cắt</span>
          </div>
          <input
            type="checkbox"
            checked={localPerms.allowSectionCut}
            onChange={() => toggle('allowSectionCut')}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
          <div className="flex items-center gap-2 text-slate-200">
            <Eye className="w-4 h-4 text-purple-400" />
            <span>Hiện công thức & tính toán</span>
          </div>
          <input
            type="checkbox"
            checked={localPerms.showFormulas}
            onChange={() => toggle('showFormulas')}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>Hiện đáp án / Gợi ý</span>
          </div>
          <input
            type="checkbox"
            checked={localPerms.showAnswers}
            onChange={() => toggle('showAnswers')}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 accent-amber-500 cursor-pointer"
          />
        </label>
      </div>

      {/* Timer Configuration */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Thời gian làm bài:
          </span>
          <span className="font-bold text-amber-300">{localPerms.timeLimitMinutes} phút</span>
        </div>
        <input
          type="range"
          min={1}
          max={60}
          step={1}
          value={localPerms.timeLimitMinutes}
          onChange={(e) => handleTimeChange(Number(e.target.value))}
          className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onStartPresentation}
          className="px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20"
        >
          <Projector className="w-4 h-4" />
          <span>Trình chiếu</span>
        </button>

        <button
          onClick={onOpenAssignModal}
          className="px-3 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20"
        >
          <Send className="w-4 h-4" />
          <span>Giao nhiệm vụ</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>Đã lưu cấu hình lớp học!</span>
        </div>
      )}
    </div>
  );
};
