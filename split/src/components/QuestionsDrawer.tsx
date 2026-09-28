import { useState, useMemo } from 'react';
import {
  type QuestionItem,
  addQuestion,
  toggleUpvoteQuestion,
  answerQuestion,
  deleteQuestion
} from '../services/questionService';
import type { UserSession } from '../services/notesService';
import type { Slide } from '../data/slides';

interface QuestionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  currentGeneration: number;
  activeSlide: Slide;
  questions: QuestionItem[];
  onNavigateToSlide?: (slideId: string) => void;
}

export function QuestionsDrawer({
  isOpen,
  onClose,
  userSession,
  currentGeneration,
  activeSlide,
  questions,
  onNavigateToSlide
}: QuestionsDrawerProps) {
  // 篩選與排序
  const [scopeFilter, setScopeFilter] = useState<'all' | 'current'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unanswered' | 'answered'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'upvotes'>('newest');

  // 發問表單狀態
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 講師回覆狀態 (key: questionId, value: reply text)
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // 計算待解答數量
  const unansweredCount = useMemo(() => {
    return questions.filter((q) => !q.isAnswered).length;
  }, [questions]);

  // 篩選過濾
  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      // 範圍篩選
      if (scopeFilter === 'current' && q.slideId !== activeSlide.id) {
        return false;
      }
      // 狀態篩選
      if (statusFilter === 'unanswered' && q.isAnswered) {
        return false;
      }
      if (statusFilter === 'answered' && !q.isAnswered) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'upvotes') {
        const diff = (b.upvotes || 0) - (a.upvotes || 0);
        if (diff !== 0) return diff;
      }
      return b.createdAt - a.createdAt;
    });
  }, [questions, scopeFilter, statusFilter, sortBy, activeSlide.id]);

  // 提交新提問
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    try {
      setIsSubmitting(true);
      await addQuestion(userSession.classId, currentGeneration, {
        slideId: activeSlide.id,
        authorName: userSession.name,
        authorTeam: userSession.teamId,
        authorUid: userSession.uid,
        question: questionText.trim()
      });
      setQuestionText('');
    } catch (err) {
      console.error('[QuestionsDrawer] addQuestion error:', err);
      alert('提問送出失敗，請確認網路連線');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 附議切換
  const handleToggleUpvote = async (qId: string) => {
    try {
      await toggleUpvoteQuestion(userSession.classId, currentGeneration, qId, userSession.uid);
    } catch (err) {
      console.error('[QuestionsDrawer] toggleUpvote error:', err);
    }
  };

  // 講師提交回覆
  const handleAnswerSubmit = async (qId: string) => {
    if (!replyText.trim()) return;
    try {
      setIsReplying(true);
      await answerQuestion(userSession.classId, currentGeneration, qId, replyText.trim());
      setReplyingId(null);
      setReplyText('');
    } catch (err) {
      console.error('[QuestionsDrawer] answerQuestion error:', err);
      alert('回覆送出失敗，請稍候再試');
    } finally {
      setIsReplying(false);
    }
  };

  // 刪除提問
  const handleDelete = async (qId: string) => {
    if (!window.confirm('確定要刪除這筆提問嗎？')) return;
    try {
      await deleteQuestion(userSession.classId, currentGeneration, qId);
    } catch (err) {
      console.error('[QuestionsDrawer] deleteQuestion error:', err);
      alert('刪除失敗');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* 遮罩背景 */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* 滑出抽屜面板 */}
      <div className="relative w-full max-w-lg bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col h-full z-10 text-slate-100 animate-in slide-in-from-right duration-300">
        {/* 抽屜頂部標題 */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 backdrop-blur flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <h2 className="text-lg font-bold text-slate-100">課堂提問</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              共 {questions.length} 則
            </span>
            {unansweredCount > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {unansweredCount} 則待解
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            title="關閉提問抽屜"
          >
            ✕
          </button>
        </div>

        {/* 篩選與排序工具列 */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          {/* 範圍標籤 */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setScopeFilter('all')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                scopeFilter === 'all'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              全班提問
            </button>
            <button
              onClick={() => setScopeFilter('current')}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                scopeFilter === 'current'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={`目前頁面：${activeSlide.title}`}
            >
              本頁提問
            </button>
          </div>

          {/* 狀態切換 */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded border transition-colors ${
                statusFilter === 'all'
                  ? 'border-slate-500 text-slate-100 bg-slate-800'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setStatusFilter('unanswered')}
              className={`px-2 py-1 rounded border transition-colors ${
                statusFilter === 'unanswered'
                  ? 'border-amber-500/60 text-amber-300 bg-amber-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              待解答
            </button>
            <button
              onClick={() => setStatusFilter('answered')}
              className={`px-2 py-1 rounded border transition-colors ${
                statusFilter === 'answered'
                  ? 'border-emerald-500/60 text-emerald-300 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              已解答
            </button>
          </div>

          {/* 排序 */}
          <div className="flex items-center gap-1 ml-auto text-slate-400">
            <span>排序:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'upvotes')}
              className="bg-slate-800 text-slate-200 rounded px-2 py-1 border border-slate-700 focus:outline-none focus:border-teal-500 text-xs"
            >
              <option value="newest">最新發問</option>
              <option value="upvotes">最多附議 👍</option>
            </select>
          </div>
        </div>

        {/* 提問清單列表 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 divide-y divide-slate-800/60">
          {filteredQuestions.length === 0 ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center">
              <span className="text-4xl mb-3 opacity-40">💡</span>
              <p className="font-medium text-slate-400">目前沒有符合條件的提問</p>
              <p className="text-xs text-slate-500 mt-1">
                {scopeFilter === 'current'
                  ? '本頁尚無學員提問，有疑問歡迎在下方發問！'
                  : '尚未有人提出問題，歡迎率先提出您的疑惑！'}
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const hasUpvoted = q.upvotedBy?.includes(userSession.uid);
              const isAuthor = q.authorUid === userSession.uid;
              const isInstructor = userSession.role === 'instructor';
              const canDelete = isAuthor || isInstructor;

              return (
                <div key={q.id} className="pt-3.5 first:pt-0 group">
                  {/* 發問者與詮釋資料列 */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-semibold text-[11px] bg-slate-800 text-teal-300 border border-slate-700">
                        第 {q.authorTeam} 組 · {q.authorName}
                      </span>
                      {q.slideId && (
                        <button
                          onClick={() => onNavigateToSlide && onNavigateToSlide(q.slideId)}
                          className="text-[11px] text-slate-400 hover:text-teal-300 underline decoration-dotted transition-colors"
                          title="跳轉至該投影片"
                        >
                          頁面: {q.slideId}
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500">
                        {new Date(q.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(q.id)}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-0.5"
                          title="刪除提問"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 問題內文 */}
                  <div className="text-sm text-slate-200 leading-relaxed font-normal bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                    <p className="whitespace-pre-wrap">{q.question}</p>

                    {/* 附議按鈕列 */}
                    <div className="mt-2.5 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleUpvote(q.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          hasUpvoted
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm'
                            : 'bg-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700 border border-slate-600/40'
                        }`}
                        title={hasUpvoted ? '點擊取消附議' : '點擊 +1 附議此問題'}
                      >
                        <span>👍</span>
                        <span>{q.upvotes || 0}</span>
                        <span className="hidden sm:inline">附議</span>
                      </button>

                      {/* 狀態標籤 */}
                      {q.isAnswered ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <span>✓</span> 已解答
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <span>⌛</span> 待解答
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 講師回覆展示 */}
                  {q.isAnswered && q.answer && (
                    <div className="mt-2 ml-3 pl-3 border-l-2 border-teal-500 bg-slate-800/60 p-2.5 rounded-r-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-teal-400 font-semibold text-[11px]">
                        <span>💡 講師回覆</span>
                        {isInstructor && (
                          <button
                            onClick={() => {
                              setReplyingId(q.id);
                              setReplyText(q.answer || '');
                            }}
                            className="text-slate-400 hover:text-slate-200 text-[10px] underline"
                          >
                            修改回覆
                          </button>
                        )}
                      </div>
                      <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">{q.answer}</p>
                    </div>
                  )}

                  {/* 講師回覆輸入框 */}
                  {isInstructor && replyingId === q.id && (
                    <div className="mt-2 p-2.5 bg-slate-950 border border-teal-500/50 rounded-lg space-y-2">
                      <div className="text-xs font-medium text-teal-300">撰寫解答回覆：</div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="請輸入給學員的解說與回覆..."
                        className="w-full bg-slate-900 text-slate-100 text-xs p-2 rounded border border-slate-700 focus:outline-none focus:border-teal-500 resize-none h-20"
                      />
                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          onClick={() => {
                            setReplyingId(null);
                            setReplyText('');
                          }}
                          className="px-2.5 py-1 text-slate-400 hover:text-slate-200"
                        >
                          取消
                        </button>
                        <button
                          onClick={() => handleAnswerSubmit(q.id)}
                          disabled={isReplying || !replyText.trim()}
                          className="px-3 py-1 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded font-medium"
                        >
                          {isReplying ? '儲存中...' : '送出回覆'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 講師回覆快捷按鈕 (若尚未解答且非正在回覆) */}
                  {isInstructor && !q.isAnswered && replyingId !== q.id && (
                    <div className="mt-1.5 flex justify-end">
                      <button
                        onClick={() => {
                          setReplyingId(q.id);
                          setReplyText('');
                        }}
                        className="text-[11px] text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
                      >
                        ✍️ 立即回覆此提問
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 底部發問區塊 */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur shrink-0">
          <form onSubmit={handleSubmitQuestion} className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <span>📝</span>
                <span>以</span>
                <span className="text-teal-400 font-medium">第 {userSession.teamId} 組 · {userSession.name}</span>
                <span>發問</span>
              </span>
              <span className="text-slate-500 text-[11px] truncate max-w-[180px]" title={activeSlide.title}>
                標記於本頁: {activeSlide.title}
              </span>
            </div>

            <div className="relative">
              <textarea
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="有任何疑問嗎？在此輸入您的問題，全班與講師皆能共同探討..."
                rows={3}
                disabled={isSubmitting}
                className="w-full bg-slate-900 text-slate-100 text-xs p-3 rounded-lg border border-slate-700 focus:outline-none focus:border-teal-500 resize-none transition-colors placeholder:text-slate-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500">
                按 Enter 或點擊「送出提問」
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !questionText.trim()}
                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:hover:bg-teal-600 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
              >
                <span>{isSubmitting ? '送出中...' : '送出提問'}</span>
                <span>💬</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
