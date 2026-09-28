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
  const [subtitle, setSubtitle] = useState('');
  const [moduleId, setModuleId] = useState<"E" | "S" | "P" | "L" | "I" | "T">("E");
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [badge, setBadge] = useState('小組討論 & 成果上傳');
  const [scenario, setScenario] = useState('');
  const [objective, setObjective] = useState('');
  const [steps, setSteps] = useState<string[]>(['']);
  const [deliverable, setDeliverable] = useState('');
  const [prompts, setPrompts] = useState<string[]>(['']);
  const [whiteboardType, setWhiteboardType] = useState<string>('main');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setInsertAfterSlideId(initialTask.insertAfterSlideId || staticSlides[0]?.id || 'slide-1');
      setTitle(initialTask.title || '');
      setSubtitle(initialTask.subtitle || '');
      setModuleId(initialTask.moduleId || 'E');
      setDurationMinutes(initialTask.durationMinutes || 15);
      setBadge(initialTask.badge || '小組演練');
      setScenario(initialTask.scenario || '');
      setObjective(initialTask.objective || '');
      setSteps(initialTask.steps && initialTask.steps.length > 0 ? initialTask.steps : ['']);
      setDeliverable(initialTask.deliverable || '');
      setPrompts(initialTask.prompts && initialTask.prompts.length > 0 ? initialTask.prompts : ['']);
      setWhiteboardType(initialTask.whiteboardType || 'none');
      setIsActive(initialTask.isActive !== false);
    } else {
      // 新建任務
      setInsertAfterSlideId(initialAnchor || staticSlides[2]?.id || 'slide-3');
      setTitle('');
      setSubtitle('');
      setModuleId('E');
      setDurationMinutes(15);
      setBadge('小組討論 & 成果上傳');
      setScenario('');
      setObjective('');
      setSteps([
        '小組共同審閱情境，並在右側筆記快速發想想法',
        '進行小組討論，凝聚共識並整理成果結論',
        '將最終結論記錄於隨堂筆記，並於下方上傳白板或產出截圖'
      ]);
      setDeliverable('右側填寫完整小組共識，並上傳至少 1 份成果截圖');
      setPrompts(['你是一位敏捷教練，請檢視以下由小組拆解的產出是否符合 INVEST 原則...']);
      setWhiteboardType('main');
      setIsActive(true);
    }
  }, [initialTask, initialAnchor, staticSlides, isOpen]);

  if (!isOpen) return null;

  const handleStepChange = (index: number, val: string) => {
    const updated = [...steps];
    updated[index] = val;
    setSteps(updated);
  };

  const handleAddStep = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handlePromptChange = (index: number, val: string) => {
    const updated = [...prompts];
    updated[index] = val;
    setPrompts(updated);
  };

  const handleAddPrompt = () => {
    setPrompts([...prompts, '']);
  };

  const handleRemovePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !objective.trim()) {
      alert('請填寫任務標題與核心目標！');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        id: initialTask?.id || '',
        insertAfterSlideId,
        title: title.trim(),
        subtitle: subtitle.trim(),
        moduleId,
        durationMinutes: Number(durationMinutes) || 15,
        badge: badge.trim(),
        scenario: scenario.trim(),
        objective: objective.trim(),
        steps: steps.map((s) => s.trim()).filter(Boolean),
        deliverable: deliverable.trim(),
        prompts: prompts.map((p) => p.trim()).filter(Boolean),
        whiteboardType: whiteboardType === 'none' ? undefined : whiteboardType,
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
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] text-slate-100 z-10 overflow-hidden animate-in zoom-in-95 duration-200">
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
          {/* 插入位置 & 單元 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                📍 插入位置 (在指定頁面之後)：
              </label>
              <select
                value={insertAfterSlideId}
                onChange={(e) => setInsertAfterSlideId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="START">【最開頭】在第 1 頁之前</option>
                {staticSlides.map((s) => (
                  <option key={s.id} value={s.id}>
                    在 [P{s.page}: {s.title}] 之後
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">
                📚 所屬核心單元：
              </label>
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value as "E" | "S" | "P" | "L" | "I" | "T")}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-teal-500 font-bold"
              >
                <option value="E">E ｜ Essential 敏捷需求概念</option>
                <option value="S">S ｜ Structure 結構分解</option>
                <option value="P">P ｜ Process 流程分析</option>
                <option value="L">L ｜ Learn 實驗學習</option>
                <option value="I">I ｜ Increment 增量交付</option>
                <option value="T">T ｜ Task 工作拆解</option>
              </select>
            </div>
          </div>

          {/* 標題 & 演練時間 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-bold mb-1">
                任務標題 <span className="text-rose-400">*</span>：
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：【團隊演練 1】制定我們小組的 DoR 與 DoD"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">
                ⏱️ 建議時間 (分鐘)：
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-100 focus:outline-none focus:border-teal-500 font-mono font-bold"
              />
            </div>
          </div>

          {/* 副標題 & 標籤 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-medium mb-1">
                副標題 (可選)：
              </label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="例如：Module 1 · 核心標準建立"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">
                類型標籤：
              </label>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="例如：小組討論 & 成果上傳"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* 任務情境背景 (Scenario) */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              📋 任務情境背景 (Scenario)：
            </label>
            <textarea
              rows={2}
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="說明本題演練的業務情境與背景，協助學員帶入思考..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 resize-none leading-relaxed"
            />
          </div>

          {/* 核心目標 (Objective) */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              🎯 核心挑戰目標 (Objective) <span className="text-rose-400">*</span>：
            </label>
            <textarea
              rows={2}
              required
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="清楚說明小組本次演練需要達成什麼共識或產出..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-teal-500 resize-none leading-relaxed"
            />
          </div>

          {/* 執行步驟指引 (Steps) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-300 font-bold">
                🔢 執行步驟清單：
              </label>
              <button
                type="button"
                onClick={handleAddStep}
                className="text-[11px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
              >
                + 新增步驟
              </button>
            </div>
            <div className="space-y-1.5">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 text-center font-bold text-slate-500 text-[11px]">{idx + 1}.</span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => handleStepChange(idx, e.target.value)}
                    placeholder={`步驟 ${idx + 1}...`}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStep(idx)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="移除此步驟"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 成果交付標準 (Deliverable) */}
          <div>
            <label className="block text-slate-300 font-bold mb-1">
              📦 成果交付驗收要求 (Deliverable)：
            </label>
            <input
              type="text"
              value={deliverable}
              onChange={(e) => setDeliverable(e.target.value)}
              placeholder="例如：右側填寫完整清單，並上傳至少 1 張小組共識截圖"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* 白板連動 & 啟用開關 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 font-bold mb-1">
                🎨 連動小組協作白板：
              </label>
              <select
                value={whiteboardType}
                onChange={(e) => setWhiteboardType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-teal-500"
              >
                <option value="none">無 (不連動白板)</option>
                <option value="main">通用協作白板 (Main)</option>
                <option value="wbs">WBS 需求分解白板</option>
                <option value="story-map">User Story Map 故事地圖</option>
                <option value="impact-map">Impact Map 影響地圖</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-teal-600 bg-slate-800 border-slate-700 focus:ring-teal-500"
                />
                <span className="text-slate-200 font-bold">立即啟用此演練頁面</span>
              </label>
              <span className="text-[10px] text-slate-500">(關閉時對全班隱藏)</span>
            </div>
          </div>

          {/* 課堂提示詞範本 (Prompts) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-slate-300 font-bold">
                💡 課堂提示詞範本 (供學員一鍵複製)：
              </label>
              <button
                type="button"
                onClick={handleAddPrompt}
                className="text-[11px] text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1"
              >
                + 新增提示詞
              </button>
            </div>
            <div className="space-y-1.5">
              {prompts.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={p}
                    onChange={(e) => handlePromptChange(idx, e.target.value)}
                    placeholder="輸入提示詞內容..."
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePrompt(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="移除"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
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
