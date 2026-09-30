import { useState, useEffect } from 'react';
import type { Slide } from '../data/slides';
import type { TeamTaskItem } from '../services/customTasksService';

interface TaskEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  staticSlides?: Slide[];
  slides?: Slide[];
  initialTask?: TeamTaskItem | null;
  targetInsertAfterSlideId?: string;
  initialInsertAfterSlideId?: string;
  onSave: (taskData: Omit<TeamTaskItem, 'classId' | 'updatedAt'>) => Promise<void>;
  onDelete?: (taskId: string) => Promise<void>;
}

export function TaskEditorModal({
  isOpen,
  onClose,
  staticSlides: propsStaticSlides,
  slides: propsSlides,
  initialTask,
  targetInsertAfterSlideId,
  initialInsertAfterSlideId,
  onSave,
  onDelete
}: TaskEditorModalProps) {
  const staticSlides = propsStaticSlides || propsSlides || [];
  const initialAnchor = targetInsertAfterSlideId || initialInsertAfterSlideId || 'slide-3';
  const [insertAfterSlideId, setInsertAfterSlideId] = useState(initialAnchor);
  const [title, setTitle] = useState('');
  const [scenario, setScenario] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setInsertAfterSlideId(initialTask.insertAfterSlideId || staticSlides[0]?.id || 'slide-1');
      setTitle(initialTask.title || '');
      setScenario(initialTask.scenario || '');
      setIsActive(initialTask.isActive !== false);
    } else {
      // 新建任務
      setInsertAfterSlideId(initialAnchor || staticSlides[2]?.id || 'slide-3');
      setTitle('');
      setScenario('');
      setIsActive(true);
    }
  }, [initialTask, initialAnchor, staticSlides, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('請填寫任務標題！');
      return;
    }

    try {
      setIsSaving(true);
      // 自動根據插入錨點投影片繼承所屬單元 (預設 E)
      const anchorSlide = staticSlides.find((s) => s.id === insertAfterSlideId);
      const derivedModuleId = anchorSlide?.moduleId || initialTask?.moduleId || 'E';

      await onSave({
        id: initialTask?.id || '',
        insertAfterSlideId,
        title: title.trim(),
        subtitle: initialTask?.subtitle || '',
        moduleId: derivedModuleId,
        durationMinutes: initialTask?.durationMinutes || 15,
        badge: initialTask?.badge || '小組演練',
        scenario: scenario.trim(),
        objective: initialTask?.objective || '',
        steps: initialTask?.steps || [],
        deliverable: initialTask?.deliverable || '',
        prompts: initialTask?.prompts || [],
        whiteboardType: initialTask?.whiteboardType,
        isActive,
        createdAt: initialTask?.createdAt || Date.now()
      });
      onClose();
    } catch (err) {
      console.error('[TaskEditorModal] save error:', err);
      alert('儲存失敗，請檢查網路連線');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initialTask || !onDelete) return;
    try {
      setIsSaving(true);
      await onDelete(initialTask.id);
      onClose();
    } catch (err) {
      console.error('[TaskEditorModal] delete error:', err);
      alert('刪除失敗');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩背景 */}
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />

      {/* 編輯器主彈窗 */}
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] text-slate-100 z-10 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <h3 className="text-base font-bold text-white">
              {initialTask ? '編輯團隊演練任務 (Team Task)' : '新增並插入團隊演練 (Team Task)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* 插入位置 */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              📍 插入位置 (在指定頁面之後)：
            </label>
            <select
              value={insertAfterSlideId}
              onChange={(e) => setInsertAfterSlideId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-teal-500"
            >
              <option value="START">【最開頭】在第 1 頁之前</option>
              {staticSlides.map((s) => (
                <option key={s.id} value={s.id}>
                  在 [P{s.page}: {s.title}] 之後
                </option>
              ))}
            </select>
          </div>

          {/* 任務標題 */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              🏷️ 任務標題 <span className="text-rose-400">*</span>：
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：【團隊演練 1】制定我們小組的 DoR 與 DoD"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:border-teal-500 font-medium"
            />
          </div>

          {/* 任務情境背景 (Scenario) - 專供講師輸入給學員閱讀的說明文字 */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              📋 任務情境背景 (Scenario) 說明文字：
            </label>
            <textarea
              rows={6}
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="輸入欲呈現給學員閱讀的業務情境背景、題目指引或說明文字..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 focus:outline-none focus:border-teal-500 resize-none leading-relaxed text-xs"
            />
          </div>

          {/* 啟用開關 */}
          <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 bg-slate-800 border-slate-700 focus:ring-teal-500"
              />
              <div>
                <span className="text-slate-200 font-bold">立即啟用此演練頁面</span>
                <span className="text-[11px] text-slate-400 ml-2">(取消勾選時對全班隱藏)</span>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            {initialTask && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isSaving}
                className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl font-bold transition-all cursor-pointer"
              >
                🗑️ 刪除此演練
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isSaving ? '儲存發布中...' : '💾 儲存並即時發布'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
