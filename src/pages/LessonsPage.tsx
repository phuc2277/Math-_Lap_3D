import React, { useState, useEffect } from 'react';
import { LESSONS } from '../data/lessons';
import { defaultLabDataAdapter } from '../adapters/LocalLabDataAdapter';
import { LabMetadata } from '../models/Lab';
import { ExternalPlatformSimulator } from '../components/integration/ExternalPlatformSimulator';
import {
  BookOpen,
  ArrowRight,
  GraduationCap,
  FlaskConical,
  Layers,
  Sparkles,
} from 'lucide-react';

interface LessonsPageProps {
  onSelectLab: (labId: string) => void;
  onOpenLabWithContext?: (labId: string, options: { source: string; lessonId?: string; mode?: string; returnUrl?: string }) => void;
}

export const LessonsPage: React.FC<LessonsPageProps> = ({ onSelectLab, onOpenLabWithContext }) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [viewTab, setViewTab] = useState<'lessons' | 'integration'>('lessons');
  const [allLabs, setAllLabs] = useState<LabMetadata[]>([]);

  useEffect(() => {
    defaultLabDataAdapter.getAllPublishedLabs().then(setAllLabs);
  }, []);

  const filteredLessons = LESSONS.filter((l) =>
    selectedGrade === 'all' ? true : l.grade === selectedGrade
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            <span>Chương trình SGK THCS & Tích hợp LMS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Liên Kết Bài Học & Phòng Thí Nghiệm
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Một bài học có thể gắn 1 hoặc nhiều Math Lab 3D độc lập (Khai triển, Thí nghiệm thể tích, Quan sát 3D).
          </p>
        </div>

        {/* View mode toggle (Lessons vs Stage 3 Simulator) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewTab('lessons')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewTab === 'lessons'
                  ? 'bg-sky-500 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Chương trình Bài học</span>
            </button>
            <button
              onClick={() => setViewTab('integration')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                viewTab === 'integration'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Mô phỏng LMS Mẹ (Stage 3)</span>
            </button>
          </div>
        </div>
      </div>

      {viewTab === 'lessons' ? (
        <div className="space-y-6">
          {/* Grade Filter Tabs */}
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-sm font-bold text-slate-300">Danh Sách Bài Học SGK:</h2>
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setSelectedGrade('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedGrade === 'all' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả khối lớp
              </button>
              <button
                onClick={() => setSelectedGrade(7)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedGrade === 7 ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Lớp 7
              </button>
              <button
                onClick={() => setSelectedGrade(8)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedGrade === 8 ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Lớp 8
              </button>
              <button
                onClick={() => setSelectedGrade(9)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedGrade === 9 ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Lớp 9
              </button>
            </div>
          </div>

          {/* Lesson List with Multi-Lab Section */}
          <div className="space-y-6">
            {filteredLessons.map((lesson) => {
              // Find all labs attached to this lesson's lessonId or labId
              const attachedLabs = allLabs.filter(
                (l) => l.lessonId === lesson.id || l.lessonId === lesson.labId || l.id === lesson.labId
              );

              return (
                <div
                  key={lesson.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 transition-all space-y-4 shadow-xl"
                >
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold text-amber-300 bg-amber-950/80 border border-amber-800 rounded-md uppercase">
                          Lớp {lesson.grade}
                        </span>
                        <span className="text-xs font-medium text-slate-400 font-mono">
                          {lesson.chapter}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white">
                        {lesson.title}
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed">
                        {lesson.description}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-lg border border-sky-800">
                        Lesson ID: {lesson.id}
                      </span>
                    </div>
                  </div>

                  {/* Section XVII: Multi-Lab listing attached to lesson */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                      <FlaskConical className="w-4 h-4 text-emerald-400" />
                      <span>🧪 Các Phòng thí nghiệm Toán học (Math Labs) thuộc bài này:</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {attachedLabs.length > 0 ? (
                        attachedLabs.map((lab) => (
                          <div
                            key={lab.id}
                            className="bg-slate-950 border border-slate-800 hover:border-sky-500/50 rounded-xl p-3 flex items-center justify-between gap-3 transition group"
                          >
                            <div className="space-y-0.5 min-w-0">
                              <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-300 truncate">
                                🧪 {lab.title}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate">{lab.description}</p>
                            </div>

                            <button
                              onClick={() => onSelectLab(lab.id)}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 shadow shrink-0"
                            >
                              <span>Mở</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div
                          className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3 col-span-full"
                        >
                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-200">
                              🧪 Khám phá 3D {lesson.title}
                            </h4>
                            <p className="text-[11px] text-slate-500">Mô hình không gian tương tác</p>
                          </div>
                          <button
                            onClick={() => onSelectLab(lesson.labId)}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 shadow"
                          >
                            <span>Mở Lab</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Stage 3 Integration Simulator */
        <ExternalPlatformSimulator
          onOpenLabWithContext={(labId, options) => {
            if (onOpenLabWithContext) {
              onOpenLabWithContext(labId, options);
            } else {
              onSelectLab(labId);
            }
          }}
        />
      )}
    </div>
  );
};
