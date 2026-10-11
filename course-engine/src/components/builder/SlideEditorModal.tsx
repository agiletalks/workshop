import React, { useState } from 'react';
import { CourseSlide, CourseModule, PageKind } from '../../types/course';
import { X, Upload, Image as ImageIcon, CheckCircle, Clock, ListChecks, Plus, Trash2, HelpCircle } from 'lucide-react';

interface SlideEditorModalProps {
  slide: CourseSlide | null;
  modules: CourseModule[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (slide: CourseSlide) => void;
}

export const SlideEditorModal: React.FC<SlideEditorModalProps> = ({
  slide,
  modules,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(slide && slide.id);

  const [kind, setKind] = useState<PageKind>(slide?.kind || 'lecture');
  const [moduleId, setModuleId] = useState<string>(slide?.moduleId || modules[0]?.id || '');
  const [title, setTitle] = useState<string>(slide?.title || '');
  const [subtitle, setSubtitle] = useState<string>(slide?.subtitle || '');
  const [keywordsInput, setKeywordsInput] = useState<string>((slide?.keywords || []).join(', '));

  // Lecture states
  const [imageUrl, setImageUrl] = useState<string>(slide?.lecture?.imageUrl || '');
  const [notePrompt, setNotePrompt] = useState<string>(slide?.lecture?.notePrompt || '');
  const [notePlaceholder, setNotePlaceholder] = useState<string>(slide?.lecture?.notePlaceholder || '');
  const [caseEnabled, setCaseEnabled] = useState<boolean>(slide?.lecture?.caseEnabled || false);
  const [casePrompt, setCasePrompt] = useState<string>(slide?.lecture?.casePrompt || '');
  const [casePlaceholder, setCasePlaceholder] = useState<string>(slide?.lecture?.casePlaceholder || '');

  // Task states
  const [taskBadge, setTaskBadge] = useState<string>(slide?.task?.taskBadge || 'TASK 01');
  const [durationMinutes, setDurationMinutes] = useState<number>(slide?.task?.durationMinutes || 20);
  const [scenario, setScenario] = useState<string>(slide?.task?.scenario || '');
  const [objective, setObjective] = useState<string>(slide?.task?.objective || '');
  const [steps, setSteps] = useState<string[]>(slide?.task?.steps?.length ? slide.task.steps : ['步驟 1：', '步驟 2：']);
  const [deliverable, setDeliverable] = useState<string>(slide?.task?.deliverable || '');
  const [whiteboardUrl, setWhiteboardUrl] = useState<string>(slide?.task?.whiteboardUrl || '');

  // Handle local image upload via FileReader
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('請上傳圖片格式檔案 (PNG, JPG, SVG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setImageUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddStep = () => {
    setSteps([...steps, `步驟 ${steps.length + 1}：`]);
  };

  const handleUpdateStep = (index: number, val: string) => {
    const newSteps = [...steps];
    newSteps[index] = val;
    setSteps(newSteps);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('請填寫頁面標題');
      return;
    }

    const parsedKeywords = keywordsInput
      .split(/[,，]/)
      .map(k => k.trim())
      .filter(Boolean);

    const updatedSlide: CourseSlide = {
      id: slide?.id || `slide-${Date.now()}`,
      pageNumber: slide?.pageNumber || 1,
      moduleId,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      kind,
      keywords: parsedKeywords.length ? parsedKeywords : undefined,
    };

    if (kind === 'lecture') {
      updatedSlide.lecture = {
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
        notePrompt: notePrompt.trim() || undefined,
        notePlaceholder: notePlaceholder.trim() || undefined,
        caseEnabled,
        casePrompt: caseEnabled ? casePrompt.trim() : undefined,
        casePlaceholder: caseEnabled ? casePlaceholder.trim() : undefined,
      };
    } else if (kind === 'task') {
      updatedSlide.task = {
        taskBadge: taskBadge.trim(),
        durationMinutes: Number(durationMinutes) || 15,
        scenario: scenario.trim(),
        objective: objective.trim(),
        steps: steps.map(s => s.trim()).filter(Boolean),
        deliverable: deliverable.trim(),
        whiteboardUrl: whiteboardUrl.trim() || undefined,
      };
    }

    onSave(updatedSlide);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-3xl w-full my-8 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>{isEditing ? '編輯頁面內容' : '新增課程頁面'}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {kind === 'lecture' ? '投影片講義' : '小組實作任務'}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">自訂頁面型別、圖片上傳與學員互動欄位</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Step 1: 選擇頁面型態 */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              1. 頁面型別 (Page Kind)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setKind('lecture')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  kind === 'lecture'
                    ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${kind === 'lecture' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">投影片講義頁 (Lecture)</div>
                  <div className="text-xs text-slate-400 mt-0.5">上傳單張簡報圖片，搭配個人筆記與反思提問</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setKind('task')}
                className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                  kind === 'task'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className={`p-2 rounded-lg ${kind === 'task' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm">小組實作任務頁 (Team Task)</div>
                  <div className="text-xs text-slate-400 mt-0.5">具備演練時間倒數、情境、操作步驟與成果標準</div>
                </div>
              </button>
            </div>
          </div>

          {/* 基本欄位：標題、單元所屬 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                所屬單元 (Module) <span className="text-rose-400">*</span>
              </label>
              <select
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 focus:outline-none"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    [{m.code}] {m.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                標籤關鍵字 (以逗號分隔)
              </label>
              <input
                type="text"
                placeholder="例如: INVEST, DoD, 故事地圖"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 focus:outline-none placeholder-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              頁面標題 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例如: 需求切分基本概念"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 focus:outline-none placeholder-slate-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              副標題 / 摘要 (可選)
            </label>
            <input
              type="text"
              placeholder="例如: 垂直切片 vs 水平切片"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 focus:outline-none placeholder-slate-600"
            />
          </div>

          {/* 情況 A：講義頁（圖片上傳 + 筆記設定） */}
          {kind === 'lecture' && (
            <div className="space-y-5 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  投影片圖片上傳 (Slide Image)
                </label>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Image Preview Box */}
                  <div className="w-full sm:w-64 h-40 bg-slate-950 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center overflow-hidden relative group">
                    {imageUrl ? (
                      <>
                        <img src={imageUrl} alt="Slide Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs text-white">
                          點擊或拖曳更換圖片
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4 text-slate-500">
                        <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <span className="text-xs">尚未上傳圖片</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>

                  {/* Upload Controls & URL Input */}
                  <div className="flex-1 space-y-3 w-full">
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors border border-slate-700">
                      <Upload className="w-4 h-4 text-amber-400" />
                      <span>從電腦選擇圖片上傳</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>

                    <div>
                      <span className="text-[11px] text-slate-500 block mb-1">或是貼上公開圖片網址 (Image URL)：</span>
                      <input
                        type="url"
                        placeholder="https://example.com/slide.png"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 思考引導提問 */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <span>思考反思提問 (Note Prompt)</span>
                    <span title="這段提示會出現在學員右側個人筆記區上方" className="cursor-help inline-flex">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="例如: 🎯 本頁思考：你認為此工具能為目前專案帶來什麼價值？"
                    value={notePrompt}
                    onChange={(e) => setNotePrompt(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    輸入框預設文字 (Placeholder，可選)
                  </label>
                  <input
                    type="text"
                    placeholder="例如: 請在此記錄你的反思觀點..."
                    value={notePlaceholder}
                    onChange={(e) => setNotePlaceholder(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* 案例演練區開關 */}
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">啟用案例演練輸入區 (Case Exercise)</div>
                    <div className="text-[11px] text-slate-400">開啟後學員右側將會額外多出專題實作案例作答框</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={caseEnabled}
                      onChange={(e) => setCaseEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {caseEnabled && (
                  <div className="pt-2 space-y-2">
                    <input
                      type="text"
                      placeholder="案例題目：例如【案例演練】請為此功能撰寫一則 User Story"
                      value={casePrompt}
                      onChange={(e) => setCasePrompt(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                    <textarea
                      rows={2}
                      placeholder="預設範本文字 (Placeholder)"
                      value={casePlaceholder}
                      onChange={(e) => setCasePlaceholder(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 focus:border-amber-400 focus:outline-none resize-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 情況 B：任務頁（情境、目標、步驟、交付物） */}
          {kind === 'task' && (
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    任務代號 (Badge)
                  </label>
                  <input
                    type="text"
                    value={taskBadge}
                    onChange={(e) => setTaskBadge(e.target.value)}
                    placeholder="例如: TASK 01"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>演練時間 (分鐘)</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:border-emerald-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  任務情境 (Scenario)
                </label>
                <textarea
                  rows={2}
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  placeholder="說明小組面臨的情境挑戰..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-emerald-400 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  核心挑戰與目標 (Objective)
                </label>
                <textarea
                  rows={2}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="本次演練要達成的明確成果..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-emerald-400 focus:outline-none resize-none"
                />
              </div>

              {/* 實作步驟清單 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
                    <span>操作步驟清單</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>增加步驟</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {steps.map((st, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 w-6 text-right">{idx + 1}.</span>
                      <input
                        type="text"
                        value={st}
                        onChange={(e) => handleUpdateStep(idx, e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-emerald-400 focus:outline-none"
                      />
                      {steps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  預期產出與交付標準 (Deliverable)
                </label>
                <input
                  type="text"
                  value={deliverable}
                  onChange={(e) => setDeliverable(e.target.value)}
                  placeholder="例如: 完成故事地圖第一條主幹路徑切線"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-emerald-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  協作白板/雲端範本連結 (可選)
                </label>
                <input
                  type="url"
                  value={whiteboardUrl}
                  onChange={(e) => setWhiteboardUrl(e.target.value)}
                  placeholder="https://miro.com/app/board/..."
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-emerald-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isEditing ? '儲存更新' : '建立頁面'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
