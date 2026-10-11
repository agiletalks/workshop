import React, { useState } from 'react';
import { Course, CourseSlide, CourseModule } from '../../types/course';
import { SlideEditorModal } from './SlideEditorModal';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Download,
  Upload,
  Play,
  Image as ImageIcon,
  ListChecks,
  Layers,
  Sparkles,
  BookOpen
} from 'lucide-react';

interface BuilderViewProps {
  course: Course;
  onChangeCourse: (course: Course) => void;
  onSwitchToPlayer: () => void;
}

export const BuilderView: React.FC<BuilderViewProps> = ({
  course,
  onChangeCourse,
  onSwitchToPlayer,
}) => {
  const [editingSlide, setEditingSlide] = useState<CourseSlide | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');

  // Slide ordering helper
  const updateSlideOrder = (slides: CourseSlide[]): CourseSlide[] => {
    return slides.map((s, idx) => ({ ...s, pageNumber: idx + 1 }));
  };

  const handleOpenAddSlide = () => {
    setEditingSlide(null);
    setIsEditorOpen(true);
  };

  const handleEditSlide = (slide: CourseSlide) => {
    setEditingSlide(slide);
    setIsEditorOpen(true);
  };

  const handleSaveSlide = (savedSlide: CourseSlide) => {
    let updatedSlides = [...course.slides];
    const existingIndex = updatedSlides.findIndex((s) => s.id === savedSlide.id);

    if (existingIndex >= 0) {
      updatedSlides[existingIndex] = savedSlide;
    } else {
      updatedSlides.push(savedSlide);
    }

    updatedSlides = updateSlideOrder(updatedSlides);
    onChangeCourse({
      ...course,
      slides: updatedSlides,
      updatedAt: new Date().toISOString(),
    });
  };

  const handleDeleteSlide = (id: string) => {
    if (!window.confirm('確定要刪除這頁教材嗎？')) return;
    const filtered = course.slides.filter((s) => s.id !== id);
    onChangeCourse({
      ...course,
      slides: updateSlideOrder(filtered),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= course.slides.length) return;

    const newSlides = [...course.slides];
    const [moved] = newSlides.splice(index, 1);
    newSlides.splice(targetIndex, 0, moved);

    onChangeCourse({
      ...course,
      slides: updateSlideOrder(newSlides),
      updatedAt: new Date().toISOString(),
    });
  };

  // Export JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(course, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${course.id || 'course'}-schema.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.slides && Array.isArray(parsed.slides)) {
          onChangeCourse(parsed);
          alert('成功匯入課程規格檔！');
        } else {
          alert('檔案格式錯誤：缺少 slides 欄位');
        }
      } catch (err) {
        alert('無法解析 JSON 檔案');
      }
    };
    reader.readAsText(file);
  };

  const filteredSlides = selectedModuleFilter === 'all'
    ? course.slides
    : course.slides.filter(s => s.moduleId === selectedModuleFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-wide">AgileTalks 教材架構平台</h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Course Engine v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">一頁一頁自訂投影片上傳與任務，跨課程通用教材產生器</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-colors">
            <Upload className="w-3.5 h-3.5 text-slate-400" />
            <span>匯入 JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>

          <button
            onClick={handleExportJson}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>匯出教材檔</span>
          </button>

          <button
            onClick={onSwitchToPlayer}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>學員視角預覽</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto p-6 flex-1 space-y-6">
        {/* Course Info Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden backdrop-blur-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  COURSE ID: {course.id}
                </span>
                <span className="text-xs text-slate-400">總頁數：{course.slides.length} 頁</span>
              </div>
              <h2 className="text-2xl font-black text-white">{course.title}</h2>
              <p className="text-sm text-slate-400 mt-1">{course.subtitle || course.description}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenAddSlide}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>新增一頁教材</span>
              </button>
            </div>
          </div>

          {/* Module Pill Filter */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 mr-2">
              <Layers className="w-3.5 h-3.5" />
              單元過濾：
            </span>
            <button
              onClick={() => setSelectedModuleFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedModuleFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              全部單元 ({course.slides.length})
            </button>
            {course.modules.map((m) => {
              const count = course.slides.filter(s => s.moduleId === m.id).length;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedModuleFilter(m.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                    selectedModuleFilter === m.id
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-mono text-[11px] opacity-75">[{m.code}]</span>
                  <span>{m.title}</span>
                  <span className="text-[10px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Slide List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-2">
            <span>頁面排列清單 (可透過上下按鈕調整播放順序)</span>
            <span>共 {filteredSlides.length} 頁</span>
          </div>

          {filteredSlides.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <div className="text-slate-300 font-bold text-base">目前尚無頁面</div>
              <p className="text-xs text-slate-500 mt-1 mb-4">點擊下方按鈕新增第一頁投影片或小組任務演練卡</p>
              <button
                onClick={handleOpenAddSlide}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>立即新增頁面</span>
              </button>
            </div>
          ) : (
            filteredSlides.map((slide, index) => {
              const currentModule = course.modules.find((m) => m.id === slide.moduleId);
              const originalIndex = course.slides.findIndex((s) => s.id === slide.id);

              return (
                <div
                  key={slide.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 flex items-center gap-4 transition-all group"
                >
                  {/* Order Controls */}
                  <div className="flex flex-col items-center gap-1 pr-2 border-r border-slate-800/80">
                    <button
                      disabled={originalIndex === 0}
                      onClick={() => handleMoveSlide(originalIndex, 'up')}
                      className="p-1 text-slate-500 hover:text-amber-400 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors"
                      title="往上移"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="text-xs font-mono font-black text-amber-400">
                      P.{slide.pageNumber}
                    </span>
                    <button
                      disabled={originalIndex === course.slides.length - 1}
                      onClick={() => handleMoveSlide(originalIndex, 'down')}
                      className="p-1 text-slate-500 hover:text-amber-400 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors"
                      title="往下移"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Thumbnail / Kind Icon */}
                  <div className="w-24 h-16 rounded-xl bg-slate-950 border border-slate-800 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                    {slide.kind === 'lecture' && slide.lecture?.imageUrl ? (
                      <img
                        src={slide.lecture.imageUrl}
                        alt={slide.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500 gap-1">
                        {slide.kind === 'task' ? (
                          <>
                            <ListChecks className="w-5 h-5 text-emerald-400" />
                            <span className="text-[9px] font-bold text-emerald-400">任務頁</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-[9px]">講義頁</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Info Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {currentModule && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
                          {currentModule.code} - {currentModule.title}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          slide.kind === 'task'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {slide.kind === 'task' ? '小組實作任務' : '標準投影片'}
                      </span>
                      {slide.task?.durationMinutes && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          ⏱️ {slide.task.durationMinutes} 分鐘
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-white truncate">{slide.title}</h3>
                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {slide.subtitle ||
                        (slide.kind === 'lecture'
                          ? slide.lecture?.notePrompt || '無提問'
                          : slide.task?.objective || '無設定目標')}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditSlide(slide)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                      title="編輯頁面"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="刪除頁面"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Editor Modal */}
      <SlideEditorModal
        isOpen={isEditorOpen}
        slide={editingSlide}
        modules={course.modules}
        onClose={() => setIsEditorOpen(false)}
        onSave={handleSaveSlide}
      />
    </div>
  );
};
