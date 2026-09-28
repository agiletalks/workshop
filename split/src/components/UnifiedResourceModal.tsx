import React, { useState, useEffect } from 'react';
import type { SlidePromptItem, SlideAttachmentItem } from '../services/lectureNoteService';

interface UnifiedResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  slideId: string;
  slideTitle: string;
  initialType?: 'prompt' | 'attachment';
  onSavePrompt: (prompt: SlidePromptItem) => Promise<void>;
  onSaveAttachment: (attachment: SlideAttachmentItem) => Promise<void>;
  editingResource?: {
    type: 'prompt' | 'attachment';
    item: SlidePromptItem | SlideAttachmentItem;
  } | null;
}

export const UnifiedResourceModal: React.FC<UnifiedResourceModalProps> = ({
  isOpen,
  onClose,
  slideId,
  slideTitle,
  initialType = 'prompt',
  onSavePrompt,
  onSaveAttachment,
  editingResource
}) => {
  const [resourceType, setResourceType] = useState<'prompt' | 'attachment'>(initialType);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Prompt specific
  const [promptText, setPromptText] = useState('');

  // Attachment specific
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'doc' | 'other'>('image');
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingResource) {
        setResourceType(editingResource.type);
        setTitle(editingResource.item.title || '');
        setDescription(editingResource.item.description || '');
        if (editingResource.type === 'prompt') {
          const p = editingResource.item as SlidePromptItem;
          setPromptText(p.promptText || '');
        } else {
          const a = editingResource.item as SlideAttachmentItem;
          setFileUrl(a.fileUrl || '');
          setFileType(a.fileType || 'image');
          setUploadMode(a.fileUrl?.startsWith('data:') ? 'upload' : 'url');
        }
      } else {
        setResourceType('prompt');
        setTitle('');
        setDescription('');
        setPromptText('');
        setFileUrl('');
        setFileType('image');
        setUploadMode('upload');
      }
      setIsSaving(false);
      setError('');
    }
  }, [isOpen, editingResource]);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('圖片大小限制為 2MB 以內，請壓縮後再上傳');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFileUrl(base64);
      setFileType(file.type.includes('pdf') ? 'pdf' : 'image');
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('請輸入資源名稱');
      return;
    }

    if (resourceType === 'prompt' && !promptText.trim()) {
      setError('請填寫 Prompt 提示詞內容');
      return;
    }

    if (resourceType === 'attachment' && !fileUrl.trim()) {
      setError('請上傳檔案或填入圖片網址');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (resourceType === 'prompt') {
        const promptItem: SlidePromptItem = {
          id: editingResource?.type === 'prompt' ? editingResource.item.id : `prompt_${Date.now()}`,
          title: title.trim(),
          description: description.trim(),
          promptText: promptText.trim(),
          createdAt: editingResource?.item?.createdAt || Date.now()
        };
        await onSavePrompt(promptItem);
      } else {
        const attachmentItem: SlideAttachmentItem = {
          id: editingResource?.type === 'attachment' ? editingResource.item.id : `attach_${Date.now()}`,
          title: title.trim(),
          description: description.trim(),
          fileUrl: fileUrl.trim(),
          fileType: fileType,
          createdAt: editingResource?.item?.createdAt || Date.now()
        };
        await onSaveAttachment(attachmentItem);
      }
      onClose();
    } catch (err: any) {
      console.error('[UnifiedResourceModal] Save error:', err);
      setError(err?.message || '儲存失敗，請檢查網路連線');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl p-6 relative text-slate-100 flex flex-col gap-4 max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {resourceType === 'prompt' ? '💡' : '📎'}
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                {editingResource ? '編輯教材資源' : '上傳教材資源'}
              </h3>
              <p className="text-[10px] text-slate-400">
                本頁 ({slideId})：{slideTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Type Selector (Segmented Button) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">資源類型</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setResourceType('prompt')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  resourceType === 'prompt'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>💡 AI 提示詞</span>
              </button>
              <button
                type="button"
                onClick={() => setResourceType('attachment')}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  resourceType === 'attachment'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>📎 實戰範例 / 附件</span>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              資源名稱 (標題) <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={resourceType === 'prompt' ? '例如：INVEST 故事品質評估 Prompt' : '例如：User Story 拆分 10 法架構示意圖'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-300 mb-1">
              適用情境說明 <span className="text-slate-500 font-normal">(選填)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="例如：可於小組討論或課後驗收 Story 時使用"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Dynamic Content: Prompt vs Attachment */}
          {resourceType === 'prompt' ? (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-300">
                  Prompt 提示詞內容 <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-amber-400 font-mono">
                  {promptText.length} 字
                </span>
              </div>
              <textarea
                required
                rows={7}
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder="請輸入給 AI 執行的具體 Prompt 內容...&#10;💡 提示：可使用 [請填入需求] 等中括號標註讓學員自行代換的變數。"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                  上傳方式
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUploadMode('upload')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      uploadMode === 'upload'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    本機圖片上傳
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMode('url')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      uploadMode === 'url'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    圖片/檔案連結
                  </button>
                </div>
              </div>

              {uploadMode === 'upload' ? (
                <div>
                  <label className="block w-full border-2 border-dashed border-slate-700 hover:border-emerald-500/70 rounded-2xl p-4 text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all">
                    <span className="text-2xl block mb-1">🖼️</span>
                    <span className="text-xs font-bold text-slate-300 block">
                      點擊選擇本機圖片檔案
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      支援 PNG, JPG, WebP（上限 2MB）
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    value={fileUrl}
                    onChange={(e) => {
                      setFileUrl(e.target.value);
                      setFileType(e.target.value.endsWith('.pdf') ? 'pdf' : 'image');
                    }}
                    placeholder="https://example.com/sample.png"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              )}

              {/* Preview */}
              {fileUrl && (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 p-2 text-center">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-800 mb-2 px-1">
                    <span className="text-[10px] text-slate-400 font-bold">預覽</span>
                    <button
                      type="button"
                      onClick={() => setFileUrl('')}
                      className="text-[10px] text-rose-400 hover:underline cursor-pointer"
                    >
                      移除
                    </button>
                  </div>
                  {fileType === 'pdf' ? (
                    <div className="py-4 text-xs font-bold text-slate-300 flex items-center justify-center gap-2">
                      <span>📄 PDF 檔案已附加</span>
                    </div>
                  ) : (
                    <img
                      src={fileUrl}
                      alt="預覽"
                      className="max-h-36 mx-auto rounded-lg object-contain"
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl font-medium">
              ⚠️ {error}
            </p>
          )}

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSaving ? '儲存同步中...' : '💾 儲存並同步給全班'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
