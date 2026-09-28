import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';

export interface QuestionItem {
  id: string;
  classId: string;
  generation: number;
  slideId: string;
  authorName: string;
  authorTeam: number;
  authorUid?: string;
  question: string;
  answer?: string;
  answeredAt?: number;
  isAnswered: boolean;
  upvotes: number;
  upvotedBy: string[];
  createdAt: number;
}

/**
 * 取得問題集合參照路徑
 * 路徑：split_data/{classId}/generations/{generationId}/questions
 */
export function getQuestionsColPath(classId: string, generationId: number): string {
  return `split_data/${classId}/generations/${generationId}/questions`;
}

/**
 * 即時訂閱指定班級與世代的所有提問
 */
export function subscribeQuestions(
  classId: string,
  generationId: number,
  onData: (questions: QuestionItem[]) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db || !classId) return null;

  const colRef = collection(db, 'split_data', classId, 'generations', String(generationId), 'questions');

  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: QuestionItem[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          classId: d.classId || classId,
          generation: Number(d.generation) || generationId,
          slideId: d.slideId || '',
          authorName: d.authorName || '匿名學員',
          authorTeam: Number(d.authorTeam) || 1,
          authorUid: d.authorUid || '',
          question: d.question || '',
          answer: d.answer || '',
          answeredAt: d.answeredAt,
          isAnswered: Boolean(d.isAnswered),
          upvotes: Number(d.upvotes) || 0,
          upvotedBy: Array.isArray(d.upvotedBy) ? d.upvotedBy : [],
          createdAt: Number(d.createdAt) || Date.now()
        });
      });

      // 預設按建立時間降冪排序
      list.sort((a, b) => b.createdAt - a.createdAt);
      onData(list);
    },
    (err) => {
      console.error('[subscribeQuestions] error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * 學員提出新提問
 */
export async function addQuestion(
  classId: string,
  generationId: number,
  data: {
    slideId: string;
    authorName: string;
    authorTeam: number;
    authorUid: string;
    question: string;
  }
): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  const questionId = 'q_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const qDocRef = doc(db, 'split_data', classId, 'generations', String(generationId), 'questions', questionId);

  const newQuestion: QuestionItem = {
    id: questionId,
    classId,
    generation: generationId,
    slideId: data.slideId,
    authorName: data.authorName,
    authorTeam: data.authorTeam,
    authorUid: data.authorUid,
    question: data.question.trim(),
    isAnswered: false,
    upvotes: 0,
    upvotedBy: [],
    createdAt: Date.now()
  };

  await setDoc(qDocRef, newQuestion);
  return questionId;
}

/**
 * 提問附議 (+1 / 取消)
 */
export async function toggleUpvoteQuestion(
  classId: string,
  generationId: number,
  questionId: string,
  userUid: string
): Promise<boolean> {
  if (!db) return false;
  const qDocRef = doc(db, 'split_data', classId, 'generations', String(generationId), 'questions', questionId);

  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(qDocRef);
      if (!snap.exists()) return false;

      const d = snap.data();
      const upvotedBy: string[] = Array.isArray(d.upvotedBy) ? [...d.upvotedBy] : [];
      const hasUpvoted = upvotedBy.includes(userUid);

      let newUpvotedBy: string[];
      if (hasUpvoted) {
        newUpvotedBy = upvotedBy.filter((u) => u !== userUid);
      } else {
        newUpvotedBy = [...upvotedBy, userUid];
      }

      transaction.update(qDocRef, {
        upvotedBy: newUpvotedBy,
        upvotes: newUpvotedBy.length
      });

      return !hasUpvoted;
    });
  } catch (err) {
    console.error('[toggleUpvoteQuestion] failed:', err);
    throw err;
  }
}

/**
 * 講師回答提問
 */
export async function answerQuestion(
  classId: string,
  generationId: number,
  questionId: string,
  answerText: string
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const qDocRef = doc(db, 'split_data', classId, 'generations', String(generationId), 'questions', questionId);

  await updateDoc(qDocRef, {
    answer: answerText.trim(),
    isAnswered: Boolean(answerText.trim().length > 0),
    answeredAt: Date.now()
  });
}

/**
 * 刪除提問
 */
export async function deleteQuestion(
  classId: string,
  generationId: number,
  questionId: string
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const qDocRef = doc(db, 'split_data', classId, 'generations', String(generationId), 'questions', questionId);
  await deleteDoc(qDocRef);
}
