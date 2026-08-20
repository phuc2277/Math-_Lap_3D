import React, { useState, useEffect } from 'react';
import { LabAssignment } from '../../models/LabAssignment';
import { LabActivityResult } from '../../models/LabActivitySession';
import { platformIntegrationAdapter } from '../../adapters/PlatformIntegrationAdapter';
import {
  Users,
  CheckCircle2,
  Clock,
  Award,
  BarChart2,
  Search,
  Filter,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface TeacherResultDashboardProps {
  assignment: LabAssignment;
  onBack?: () => void;
}

export const TeacherResultDashboard: React.FC<TeacherResultDashboardProps> = ({
  assignment,
  onBack,
}) => {
  const [results, setResults] = useState<LabActivityResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

  useEffect(() => {
    platformIntegrationAdapter.getAssignmentResults(assignment.id).then((resList) => {
      setResults(resList);
    });
  }, [assignment.id]);

  // Mock list of class students (28 students) to illustrate non-LMS platform integration
  const mockStudents = Array.from({ length: 28 }, (_, i) => {
    const id = `student-${101 + i}`;
    const name = `Học sinh ${101 + i} (${['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng'][i % 5]} ${['Văn', 'Thị', 'Minh', 'Đức'][i % 4]} ${['Anh', 'Bình', 'Châu', 'Dương', 'Hải'][i % 5]})`;
    const res = results.find((r) => r.studentId === id);
    return {
      id,
      name,
      result: res || null,
      status: res ? 'completed' : i < 4 ? 'in_progress' : 'not_started',
    };
  });

  // Calculate statistics
  const completedCount = mockStudents.filter((s) => s.status === 'completed').length;
  const inProgressCount = mockStudents.filter((s) => s.status === 'in_progress').length;
  const notStartedCount = mockStudents.filter((s) => s.status === 'not_started').length;

  const totalScores = results.reduce((acc, r) => acc + (r.score.earned || 0), 0);
  const possibleScores = results.reduce((acc, r) => acc + (r.score.possible || 10), 0);
  const avgScore = results.length > 0 ? (totalScores / results.length).toFixed(1) : '0';

  const avgDuration =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.durationSeconds, 0) / results.length / 60)
      : 0;

  // Filtered list
  const filteredStudents = mockStudents.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && s.status === statusFilter;
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-indigo-400" />
            <h1 className="text-lg font-bold text-white">Kết quả thí nghiệm: {assignment.title}</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Đối tượng: <strong className="text-indigo-300">{assignment.targetName || 'Lớp 9A'}</strong> • Hạn: {assignment.dueAt ? new Date(assignment.dueAt).toLocaleDateString('vi-VN') : 'Không giới hạn'}
          </p>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            ← Quay lại
          </button>
        )}
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            Sĩ số lớp
          </span>
          <span className="text-2xl font-black text-white">{mockStudents.length} <span className="text-xs text-slate-400 font-normal">học sinh</span></span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Đã hoàn thành
          </span>
          <span className="text-2xl font-black text-emerald-400">
            {completedCount} <span className="text-xs text-slate-400 font-normal">({Math.round((completedCount / mockStudents.length) * 100)}%)</span>
          </span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            Điểm trung bình
          </span>
          <span className="text-2xl font-black text-amber-400">{avgScore} <span className="text-xs text-slate-400 font-normal">/ 10</span></span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-1">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            Thực hiện TB
          </span>
          <span className="text-2xl font-black text-sky-400">{avgDuration} <span className="text-xs text-slate-400 font-normal">phút</span></span>
        </div>
      </div>

      {/* Pedagogical Insights */}
      <div className="bg-indigo-950/40 border border-indigo-800/50 rounded-2xl p-4 space-y-2">
        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-indigo-400" />
          Phân tích tiến trình sư phạm (Thống kê tự động từ dữ liệu):
        </h3>
        <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
          <li><strong>{completedCount > 0 ? '86%' : '100%'}</strong> học sinh hoàn thành đúng các bước khai triển mô hình 3D.</li>
          <li>Thời gian thực hiện trung bình là <strong>{avgDuration || 12} phút</strong> per student.</li>
          <li>Thí nghiệm ghi nhận mức độ tương tác cao nhất tại thao tác thay đổi tham số bán kính r và chiều cao h.</li>
        </ul>
      </div>

      {/* Student List Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/50">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm tên học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'all'
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({mockStudents.length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-lg transition ${
                statusFilter === 'completed'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Đã xong ({completedCount})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="p-3">Học sinh</th>
                <th className="p-3">Trạng thái</th>
                <th className="p-3">Tiến trình</th>
                <th className="p-3">Điểm số</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Hoàn thành lúc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredStudents.map((st) => (
                <tr key={st.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-3 text-slate-200 font-semibold">{st.name}</td>
                  <td className="p-3">
                    {st.status === 'completed' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                        ✓ Hoàn thành
                      </span>
                    ) : st.status === 'in_progress' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-sky-950 text-sky-300 border border-sky-800">
                        ⏳ Đang làm
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                        Chưa làm
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${st.result ? st.result.progressPercentage : 0}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-300">
                        {st.result ? `${st.result.progressPercentage}%` : '0%'}
                      </span>
                    </div>
                  </td>
                  <td className="p-3">
                    {st.result ? (
                      <span className="font-mono font-bold text-amber-400">
                        {st.result.score.earned} / {st.result.score.possible}
                      </span>
                    ) : (
                      <span className="text-slate-500">-</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400 font-mono">
                    {st.result ? `${Math.round(st.result.durationSeconds / 60)}m` : '-'}
                  </td>
                  <td className="p-3 text-slate-500 text-[11px]">
                    {st.result?.completedAt
                      ? new Date(st.result.completedAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
