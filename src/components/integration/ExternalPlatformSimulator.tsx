import React, { useState, useEffect } from 'react';
import { defaultLabDataAdapter } from '../../adapters/LocalLabDataAdapter';
import { LabMetadata } from '../../models/Lab';
import { postMessageBridge, PostMessageData } from '../../integration/postMessage';
import {
  Layers,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Play,
  CheckCircle2,
  Maximize2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ExternalPlatformSimulatorProps {
  onOpenLabWithContext: (labId: string, options: { source: string; lessonId?: string; mode?: string; returnUrl?: string }) => void;
}

export const ExternalPlatformSimulator: React.FC<ExternalPlatformSimulatorProps> = ({
  onOpenLabWithContext,
}) => {
  const [labs, setLabs] = useState<LabMetadata[]>([]);
  const [selectedLesson, setSelectedLesson] = useState('lop9-hinh-tru');
  const [messageLogs, setMessageLogs] = useState<string[]>([]);
  const [iframeMode, setIframeMode] = useState(false);
  const [iframeLabId, setIframeLabId] = useState('lab-cylinder-001');

  useEffect(() => {
    defaultLabDataAdapter.getAllPublishedLabs().then(setLabs);

    // Subscribe to postMessage events from iframe
    const unsubscribe = postMessageBridge.subscribe((data: PostMessageData, origin: string) => {
      const log = `[${new Date().toLocaleTimeString()}] Event received: ${data.type} from origin (${origin})`;
      setMessageLogs((prev) => [log, ...prev.slice(0, 9)]);
    });

    return () => unsubscribe();
  }, []);

  const lessonLabs = labs.filter((l) => l.lessonId === selectedLesson);

  const handleLaunchDeepLink = (lab: LabMetadata, source: 'lesson' | 'teacher' | 'student') => {
    onOpenLabWithContext(lab.id, {
      source,
      lessonId: lab.lessonId,
      mode: source === 'teacher' ? 'presentation' : 'normal',
      returnUrl: '/lessons',
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold text-sky-300 bg-sky-950/80 border border-sky-800 rounded-md">
                Stage 3 Architecture
              </span>
              <h2 className="text-base font-bold text-white">Mô phỏng Nền tảng Giáo dục Mẹ (Main LMS Platform)</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Kiểm thử khả năng nhúng & gọi Math Lab từ ứng dụng giáo dục bên ngoài mà không cần nạp Three.js ở hệ thống mẹ.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIframeMode(false)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              !iframeMode
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Chế độ Deep Link URL
          </button>
          <button
            onClick={() => setIframeMode(true)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              iframeMode
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Chế độ Nhúng iFrame
          </button>
        </div>
      </div>

      {!iframeMode ? (
        /* DEEP LINK SIMULATOR MODE */
        <div className="space-y-6">
          {/* Lesson selector tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Chọn bài học trên Hệ thống Mẹ:</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'lop9-hinh-tru', name: 'Lớp 9 - Bài 1: Hình trụ (3 Labs)' },
                { id: 'lop8-hinh-hop-chu-nhat', name: 'Lớp 8 - Bài 1: Hình hộp chữ nhật' },
                { id: 'lop9-hinh-non', name: 'Lớp 9 - Bài 2: Hình nón' },
                { id: 'lop9-hinh-cau', name: 'Lớp 9 - Bài 3: Hình cầu' },
              ].map((ls) => (
                <button
                  key={ls.id}
                  onClick={() => setSelectedLesson(ls.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition border ${
                    selectedLesson === ls.id
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {ls.name}
                </button>
              ))}
            </div>
          </div>

          {/* List of Labs attached to this lesson */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>🧪 Danh sách Phòng thí nghiệm Toán học thuộc bài học ({selectedLesson}):</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessonLabs.map((lab) => (
                <div
                  key={lab.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-sky-300 bg-sky-950 border border-sky-800 rounded">
                        {lab.id}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                        {lab.status}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-2">{lab.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{lab.description}</p>
                  </div>

                  {/* Actions for launching as Student or Teacher */}
                  <div className="space-y-2 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => handleLaunchDeepLink(lab, 'lesson')}
                      className="w-full py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Học sinh: Khám phá ngay</span>
                    </button>

                    <button
                      onClick={() => handleLaunchDeepLink(lab, 'teacher')}
                      className="w-full py-1.5 px-3 bg-amber-600/80 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Giáo viên: Trình chiếu 3D</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* IFRAME EMBEDDING SIMULATOR */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-bold">Mô phỏng Nhúng iFrame Math Lab:</span>
            <select
              value={iframeLabId}
              onChange={(e) => setIframeLabId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-sky-300 rounded-lg px-2.5 py-1 text-xs font-mono"
            >
              <option value="lab-cylinder-001">lab-cylinder-001 (Hình trụ)</option>
              <option value="lab-cone-001">lab-cone-001 (Hình nón)</option>
              <option value="lab-cuboid-001">lab-cuboid-001 (Hình hộp)</option>
            </select>
          </div>

          <div className="w-full h-[450px] bg-slate-950 border-2 border-purple-500/40 rounded-2xl overflow-hidden relative shadow-2xl">
            <iframe
              src={`${window.location.origin}${window.location.pathname}?lab=${iframeLabId}&source=lesson&lessonId=lop9-hinh-tru`}
              className="w-full h-full border-none"
              title="Math Lab Embedded Frame"
            />
          </div>

          {/* PostMessage Log Viewer */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-purple-300">
              <span className="font-bold flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-400" />
                postMessage Event Bridge Log:
              </span>
              <span>{messageLogs.length} events received</span>
            </div>

            <div className="bg-black/60 p-2.5 rounded-lg text-[11px] font-mono text-slate-300 space-y-1 max-h-28 overflow-y-auto">
              {messageLogs.length === 0 ? (
                <p className="text-slate-500 italic">Đang chờ sự kiện postMessage từ Math Lab iFrame...</p>
              ) : (
                messageLogs.map((log, idx) => <p key={idx} className="text-emerald-400">{log}</p>)
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
