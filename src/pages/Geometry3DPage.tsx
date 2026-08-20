import React, { useState } from 'react';
import { GEOMETRY_MODELS } from '../data/geometryModels';
import { ModelCard } from '../components/model-cards/ModelCard';
import { Box, Filter } from 'lucide-react';

interface Geometry3DPageProps {
  onExploreLab: (labId: string) => void;
}

export const Geometry3DPage: React.FC<Geometry3DPageProps> = ({ onExploreLab }) => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'polyhedron' | 'revolute'>('all');

  const filteredModels = GEOMETRY_MODELS.filter((m) => {
    if (selectedGrade !== 'all' && m.grade !== selectedGrade) return false;
    if (selectedCategory === 'polyhedron' && !['cuboid', 'cube', 'prism', 'prism_quad', 'pyramid', 'pyramid_triangular'].includes(m.modelType)) return false;
    if (selectedCategory === 'revolute' && !['cylinder', 'cone', 'sphere'].includes(m.modelType)) return false;
    return true;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider">
            <Box className="w-4 h-4" />
            <span>Thư viện 3D</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Hình Học Không Gian 3D
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Khám phá các khối đa diện và khối tròn xoay với khả năng tương tác xoay 360°, cắt lát và khai triển phẳng.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-2" />
            <button
              onClick={() => setSelectedGrade('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedGrade === 'all' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả lớp
            </button>
            <button
              onClick={() => setSelectedGrade(7)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedGrade === 7 ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lớp 7
            </button>
            <button
              onClick={() => setSelectedGrade(8)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedGrade === 8 ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lớp 8
            </button>
            <button
              onClick={() => setSelectedGrade(9)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedGrade === 9 ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Lớp 9
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedCategory === 'all' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả khối
            </button>
            <button
              onClick={() => setSelectedCategory('polyhedron')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedCategory === 'polyhedron' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Khối đa diện
            </button>
            <button
              onClick={() => setSelectedCategory('revolute')}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                selectedCategory === 'revolute' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Khối tròn xoay
            </button>
          </div>
        </div>
      </div>

      {/* Grid Display */}
      {filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <ModelCard key={model.id} model={model} onExplore={onExploreLab} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400 text-sm">
          Không tìm thấy mô hình thỏa mãn bộ lọc.
        </div>
      )}
    </div>
  );
};
