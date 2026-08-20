import React, { useState, useEffect } from 'react';
import { UserRole } from '../types/geometry';
import { LabAssignment } from '../models/LabAssignment';
import { StudentAssignmentList } from '../components/assignment/StudentAssignmentList';
import { TeacherResultDashboard } from '../components/assignment/TeacherResultDashboard';
import { platformIntegrationAdapter } from '../adapters/PlatformIntegrationAdapter';
import { LocalActivityStore } from '../services/LocalActivityStore';
import { CheckSquare, Users, Award, Eye, Plus } from 'lucide-react';

interface AssignmentsPageProps {
  userRole: UserRole;
  onOpenAssignmentLab: (assignmentId: string, labId: string) => void;
}

export const AssignmentsPage: React.FC<AssignmentsPageProps> = ({
  userRole,
  onOpenAssignmentLab,
}) => {
  const [selectedAssignmentForTeacher, setSelectedAssignmentForTeacher] = useState<LabAssignment | null>(null);
  const [teacherAssignments, setTeacherAssignments] = useState<LabAssignment[]>([]);

  useEffect(() => {
    if (userRole === 'teacher') {
      const all = LocalActivityStore.getAssignments();
      setTeacherAssignments(all);
    }
  }, [userRole]);

  if (userRole === 'student') {
    return (
      <StudentAssignmentList
        studentId="student-101"
        studentName="Học sinh (Lớp 9A)"
        onOpenAssignment={(asg) => onOpenAssignmentLab(asg.id, asg.labId)}
        onViewResult={(asg) => onOpenAssignmentLab(asg.id, asg.labId)}
      />
    );
  }

  // Teacher View: Dashboard or List of Assignments
  if (selectedAssignmentForTeacher) {
    return (
      <TeacherResultDashboard
        assignment={selectedAssignmentForTeacher}
        onBack={() => setSelectedAssignmentForTeacher(null)}
      />
    );
  }

  return (
    <div className="space-y-6 text-slate-100 max-w-5xl mx-auto">
      {/* Teacher Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-amber-400" />
            <h1 className="text-lg font-bold text-white">Quản lý Nhiệm vụ & Kết quả học sinh</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Xem danh sách các bài thí nghiệm đã giao, theo dõi tiến trình và bảng điểm chi tiết.
          </p>
        </div>
      </div>

      {/* Teacher Assignments List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teacherAssignments.map((asg) => {
          const results = LocalActivityStore.getResultsByAssignment(asg.id);
          const completedCount = results.length;

          return (
            <div
              key={asg.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between hover:border-slate-700 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                    GV: {asg.createdByName || 'Thầy Cô'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-950 text-indigo-300 border border-indigo-800">
                    Target: {asg.targetName || 'Lớp 9A'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{asg.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2">{asg.instructions}</p>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400" />
                    Đã nộp: <strong className="text-emerald-400">{completedCount}</strong>
                  </span>
                </div>

                <button
                  onClick={() => setSelectedAssignmentForTeacher(asg)}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 shadow-md"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Xem kết quả</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
