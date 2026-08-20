import React, { useState } from 'react';
import { Experiment } from '../../models/Experiment';
import { LabAssignment, AssignmentTargetType, ScoringMode } from '../../models/LabAssignment';
import { platformIntegrationAdapter } from '../../adapters/PlatformIntegrationAdapter';
import { Send, X, Calendar, Users, Award, FileText, Check } from 'lucide-react';

interface TeacherAssignmentModalProps {
  experiment: Experiment;
  onClose: () => void;
  onAssigned?: (assignment: LabAssignment) => void;
}

export const TeacherAssignmentModal: React.FC<TeacherAssignmentModalProps> = ({
  experiment,
  onClose,
  onAssigned,
}) => {
  const [title, setTitle] = useState(`Bài tập: ${experiment.title}`);
  const [instructions, setInstructions] = useState(
    'Em hãy thực hiện lần lượt các bước thí nghiệm 3D và hoàn thành các câu hỏi quan sát.'
  );
  const [targetType, setTargetType] = useState<AssignmentTargetType>('class');
  const [targetName, setTargetName] = useState('Lớp 9A');
  const [startAt, setStartAt] = useState(new Date().toISOString().substring(0, 10));
  const [dueAt, setDueAt] = useState(
    new Date(Date.now() + 86400000 * 7).toISOString().substring(0, 10)
  );
  const [allowRetake, setAllowRetake] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState<number>(3);
  const [scoringMode, setScoringMode] = useState<ScoringMode>('points');
  const [isPublishing, setIsPublishing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);

    const assignment: LabAssignment = {
      id: `assignment_${Date.now()}`,
      labId: experiment.labId,
      experimentId: experiment.id,
      lessonId: experiment.lessonId,
      title,
      instructions,
      targetType,
      targetId: 'class-9A',
      targetName,
      createdBy: 'teacher-01',
      createdByName: 'Giáo viên bộ môn',
      startAt: new Date(startAt).toISOString(),
      dueAt: new Date(dueAt).toISOString(),
      status: 'published',
      allowRetake,
      maxAttempts: allowRetake ? maxAttempts : 1,
      scoringMode,
      totalPossiblePoints: 10,
      showAnswersAfterSubmit: true,
      createdAt: new Date().toISOString(),
    };

    await platformIntegrationAdapter.saveAssignment(assignment);
    setIsPublishing(false);
    setSuccessMsg(true);

    setTimeout(() => {
      if (onAssigned) onAssigned(assignment);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Giao bài thí nghiệm cho học sinh</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {successMsg && (
            <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 p-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Đã giao thí nghiệm thành công cho học sinh!</span>
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Tên bài tập nhiệm vụ:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Hướng dẫn thực hiện:</label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Đối tượng giao:
              </label>
              <select
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-medium"
              >
                <option value="Lớp 9A">Lớp 9A (28 HS)</option>
                <option value="Lớp 9B">Lớp 9B (30 HS)</option>
                <option value="Lớp 8A">Lớp 8A (32 HS)</option>
                <option value="Nhóm Khám phá">Nhóm Khám phá Nâng cao</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                Chế độ tính điểm:
              </label>
              <select
                value={scoringMode}
                onChange={(e) => setScoringMode(e.target.value as ScoringMode)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-medium"
              >
                <option value="points">Chấm điểm theo câu hỏi</option>
                <option value="completion">Tính hoàn thành (Đã làm / Chưa làm)</option>
                <option value="none">Thí nghiệm tự do (Không tính điểm)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Ngày bắt đầu:
              </label>
              <input
                type="date"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-400" />
                Hạn hoàn thành:
              </label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div>
              <span className="font-semibold text-slate-200">Cho phép làm lại</span>
              <p className="text-[11px] text-slate-400">Học sinh có thể cải thiện kết quả sau lượt đầu</p>
            </div>
            <input
              type="checkbox"
              checked={allowRetake}
              onChange={(e) => setAllowRetake(e.target.checked)}
              className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
            />
          </div>

          {allowRetake && (
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Số lần làm tối đa:</label>
              <select
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100"
              >
                <option value={1}>1 lần</option>
                <option value={2}>2 lần</option>
                <option value={3}>3 lần</option>
                <option value={5}>5 lần</option>
              </select>
            </div>
          )}

          {/* Footer Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPublishing}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
            >
              <Send className="w-4 h-4" />
              <span>{isPublishing ? 'Đang giao...' : '📤 Giao nhiệm vụ'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
