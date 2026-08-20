import React, { useState, useEffect } from 'react';
import { LabAssignment } from '../../models/LabAssignment';
import { platformIntegrationAdapter } from '../../adapters/PlatformIntegrationAdapter';
import { LocalActivityStore } from '../../services/LocalActivityStore';
import {
  FlaskConical,
  Calendar,
  CheckCircle2,
  Clock,
  Play,
  RotateCcw,
  BookOpen,
  Award,
} from 'lucide-react';

interface StudentAssignmentListProps {
  studentId?: string;
  studentName?: string;
  onOpenAssignment: (assignment: LabAssignment) => void;
  onViewResult?: (assignment: LabAssignment) => void;
}

export const StudentAssignmentList: React.FC<StudentAssignmentListProps> = ({
  studentId = 'student-101',
  studentName = 'Học sinh 101',
  onOpenAssignment,
  onViewResult,
}) => {
  const [assignments, setAssignments] = useState<LabAssignment[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    platformIntegrationAdapter.getStudentAssignments(studentId).then((list) => {
      setAssignments(list);
    });
  }, [studentId]);

  const filtered = assignments.filter((a) => {
    const res = LocalActivityStore.getResultsByAssignment(a.id).find((r) => r.studentId === studentId);
    const isCompleted = Boolean(res);

    if (activeFilter === 'pending') return !isCompleted;
    if (activeFilter === 'completed') return isCompleted;
    return true;
  });

  return (
    <div className="space-y-6 text-slate-100 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold text-white">Nhiệm vụ Thí nghiệm 3D được giao</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Xin chào <strong className="text-indigo-300">{studentName}</strong> • Hoàn thành các thí nghiệm để ghi nhận tiến trình học tập.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeFilter === 'all'
                ? 'bg-indigo-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Tất cả ({assignments.length})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeFilter === 'pending'
                ? 'bg-amber-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Cần làm
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeFilter === 'completed'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Đã hoàn thành
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
          <p className="text-sm font-semibold">Hiện chưa có bài thí nghiệm nào theo bộ lọc này.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((asg) => {
            const res = LocalActivityStore.getResultsByAssignment(asg.id).find((r) => r.studentId === studentId);
            const session = LocalActivityStore.getSessionByAssignmentAndStudent(asg.id, studentId);
            const isCompleted = Boolean(res);
            const isInProgress = Boolean(session && session.status === 'in_progress');

            const dueTime = asg.dueAt ? new Date(asg.dueAt).toLocaleDateString('vi-VN') : undefined;

            return (
              <div
                key={asg.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg hover:border-slate-700 transition flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                      {asg.targetName || 'Lớp 9A'}
                    </span>

                    {isCompleted ? (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
                      </span>
                    ) : isInProgress ? (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Đang làm (Bước {session.currentStep})
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                        Chưa bắt đầu
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white">{asg.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{asg.instructions}</p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      Hạn nộp: {dueTime || 'Không giới hạn'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      Thang điểm: 10
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {isCompleted ? (
                      <>
                        {onViewResult && (
                          <button
                            onClick={() => onViewResult(asg)}
                            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
                          >
                            📊 Xem kết quả
                          </button>
                        )}
                        <button
                          onClick={() => onOpenAssignment(asg)}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 font-semibold transition flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Mở lại 3D</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onOpenAssignment(asg)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{isInProgress ? 'Tiếp tục thí nghiệm' : ' Bắt đầu thí nghiệm'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
