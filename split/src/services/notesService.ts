import {
  doc,
  collection,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  runTransaction,
  type Unsubscribe,
  type Firestore
} from 'firebase/firestore';
import { db } from './firebase';

export interface NoteAttachment {
  id: string;
  name: string;
  size: number;
  mime: string;
  createdAt: number;
  dataUrl?: string; // Base64 或 Storage 下載網址
}

export interface NoteLock {
  isLocked: boolean;
  holderUid: string;
  sessionId: string;
  holderName: string;
  leasedAt: number;
  expiresAt: number;
}

export interface TeamNote {
  slideId: string;
  teamId: number;
  generation: number;
  memo: string;
  lock: NoteLock;
  attachments: NoteAttachment[];
  updatedAt: number;
  updatedBy?: string;
}

export interface UserSession {
  uid: string;
  sessionId: string;
  name: string;
  teamId: number;
  role: 'student' | 'instructor';
  classId: string;
  passcodeHash?: string;
}

export interface ClassMetadata {
  id: string;
  name: string;
  teamCount: number;
  status: 'active' | 'inactive';
  currentGeneration: number;
  passcodeHash?: string;
  notes?: string;
}

// ==========================================
// 模組 5：提問服務與資料型別 (Questions)
// ==========================================
export type { QuestionItem } from './questionService';
export {
  subscribeQuestions,
  addQuestion,
  toggleUpvoteQuestion,
  answerQuestion,
  deleteQuestion
} from './questionService';

export interface QuestionStickyNote {
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
  upvotes?: number;
  upvotedBy?: string[];
  createdAt: number;
}


// ==========================================
// 預留架構：錄音中繼資料 (Audio Recording)
// ==========================================
export interface AudioRecordingMeta {
  id: string;
  classId: string;
  generation: number;
  teamId: number;
  slideId: string;
  durationSeconds: number;
  storagePath: string; // /split_recordings/{classId}/{genId}/{teamId}/{audioId}.webm
  status: 'uploading' | 'ready' | 'failed';
  createdAt: number;
}

/**
 * 取得筆記文件參照路徑
 * 路徑結構：split_data/{classId}/generations/{generationId}/notes/{slideId}_team_{teamId}
 */
export function getNoteDocPath(classId: string, generationId: number, slideId: string, teamId: number) {
  return `split_data/${classId}/generations/${generationId}/notes/${slideId}_team_${teamId}`;
}

export function getNoteDocRef(firestore: Firestore, classId: string, generationId: number, slideId: string, teamId: number) {
  return doc(firestore, 'split_data', classId, 'generations', String(generationId), 'notes', `${slideId}_team_${teamId}`);
}

/**
 * 監聽班級中繼資料與目前世代 (即時偵測演練重設與停用)
 */
export function subscribeClassMetadata(
  classId: string,
  onUpdate: (meta: ClassMetadata) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db || !classId) return null;
  const classRef = doc(db, 'split_classes', classId);
  return onSnapshot(classRef, (snap) => {
    if (snap.exists()) {
      const d = snap.data();
      onUpdate({
        id: snap.id,
        name: d.name || '未命名班級',
        teamCount: Number(d.teamCount) || 6,
        status: d.status === 'active' ? 'active' : 'inactive',
        currentGeneration: Number(d.currentGeneration) || 1,
        notes: d.notes || ''
      });
    }
  }, (err) => {
    console.error('[subscribeClassMetadata] error:', err);
    if (onError) onError(err);
  });
}

/**
 * 即時訂閱特定頁面與組別的隨堂筆記
 */
export function subscribeTeamNote(
  classId: string,
  generationId: number,
  slideId: string,
  teamId: number,
  onData: (note: TeamNote) => void,
  onError?: (err: Error) => void
): Unsubscribe | null {
  if (!db || !classId || !slideId || !teamId) return null;

  const noteRef = getNoteDocRef(db, classId, generationId, slideId, teamId);
  return onSnapshot(noteRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as Partial<TeamNote>;
      let lock = data.lock || {
        isLocked: false,
        holderUid: '',
        sessionId: '',
        holderName: '',
        leasedAt: 0,
        expiresAt: 0
      };

      // 檢查過期鎖 (35 秒逾時)
      if (lock.isLocked && Date.now() > lock.expiresAt) {
        lock = {
          isLocked: false,
          holderUid: '',
          sessionId: '',
          holderName: '',
          leasedAt: 0,
          expiresAt: 0
        };
      }

      onData({
        slideId: slideId,
        teamId: teamId,
        generation: generationId,
        memo: data.memo || '',
        lock: lock,
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
        updatedAt: data.updatedAt || 0,
        updatedBy: data.updatedBy
      });
    } else {
      // 筆記尚未建立，回傳預設空白
      onData({
        slideId: slideId,
        teamId: teamId,
        generation: generationId,
        memo: '',
        lock: {
          isLocked: false,
          holderUid: '',
          sessionId: '',
          holderName: '',
          leasedAt: 0,
          expiresAt: 0
        },
        attachments: [],
        updatedAt: 0
      });
    }
  }, (err) => {
    console.error('[subscribeTeamNote] error:', err);
    if (onError) onError(err);
  });
}

/**
 * 讀取特定世代 (或特定組別) 的所有隨堂小組筆記 (供手冊列印與成果彙整)
 */
export async function fetchAllTeamNotes(
  classId: string,
  generationId: number,
  teamId?: number
): Promise<Record<string, TeamNote>> {
  if (!db || !classId) return {};
  try {
    const colRef = collection(db, 'split_data', classId, 'generations', String(generationId), 'notes');
    const snap = await getDocs(colRef);
    const result: Record<string, TeamNote> = {};
    snap.forEach((docSnap) => {
      const data = docSnap.data() as TeamNote;
      if (teamId === undefined || Number(data.teamId) === Number(teamId)) {
        result[data.slideId] = data;
      }
    });
    return result;
  } catch (err) {
    console.warn('[fetchAllTeamNotes] error:', err);
    return {};
  }
}

/**
 * 爭取編輯鎖 (Lease-based 35 秒)
 */
export async function acquireNoteLock(
  classId: string,
  generationId: number,
  slideId: string,
  teamId: number,
  user: UserSession
): Promise<boolean> {
  if (!db) return false;
  const noteRef = getNoteDocRef(db, classId, generationId, slideId, teamId);

  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(noteRef);
      const now = Date.now();
      const expiresAt = now + 35000;

      if (!snap.exists()) {
        transaction.set(noteRef, {
          slideId,
          teamId,
          generation: generationId,
          memo: '',
          lock: {
            isLocked: true,
            holderUid: user.uid,
            sessionId: user.sessionId,
            holderName: user.name,
            leasedAt: now,
            expiresAt: expiresAt
          },
          attachments: [],
          updatedAt: now,
          updatedBy: user.uid
        });
        return true;
      }

      const d = snap.data();
      const lock = d.lock as NoteLock | undefined;

      // 檢查是否可取鎖：未鎖定、或原鎖已逾期、或本 session 已持有鎖、或講師強制取鎖
      const canAcquire = !lock ||
        !lock.isLocked ||
        now > (lock.expiresAt || 0) ||
        (lock.holderUid === user.uid && lock.sessionId === user.sessionId) ||
        user.role === 'instructor';

      if (!canAcquire) {
        return false;
      }

      transaction.update(noteRef, {
        lock: {
          isLocked: true,
          holderUid: user.uid,
          sessionId: user.sessionId,
          holderName: user.name,
          leasedAt: now,
          expiresAt: expiresAt
        },
        updatedAt: now
      });

      return true;
    });
  } catch (err) {
    console.error('[acquireNoteLock] failed:', err);
    return false;
  }
}

/**
 * 心跳續租編輯鎖 (每 15 秒更新一次 expiresAt)
 */
export async function renewNoteLock(
  classId: string,
  generationId: number,
  slideId: string,
  teamId: number,
  _user: UserSession
): Promise<boolean> {
  if (!db) return false;
  const noteRef = getNoteDocRef(db, classId, generationId, slideId, teamId);
  const now = Date.now();
  const expiresAt = now + 35000;

  try {
    await updateDoc(noteRef, {
      'lock.expiresAt': expiresAt
    });
    return true;
  } catch (err) {
    console.warn('[renewNoteLock] renewal failed:', err);
    return false;
  }
}

/**
 * 釋放編輯鎖
 */
export async function releaseNoteLock(
  classId: string,
  generationId: number,
  slideId: string,
  teamId: number,
  _user: UserSession
): Promise<void> {
  if (!db) return;
  const noteRef = getNoteDocRef(db, classId, generationId, slideId, teamId);

  try {
    await updateDoc(noteRef, {
      lock: {
        isLocked: false,
        holderUid: '',
        sessionId: '',
        holderName: '',
        leasedAt: 0,
        expiresAt: 0
      }
    });
  } catch (err) {
    console.warn('[releaseNoteLock] release failed:', err);
  }
}

/**
 * 儲存筆記內容 (回傳 Promise 以供前端驗證伺服器 ACK)
 */
export async function saveTeamMemo(
  classId: string,
  generationId: number,
  slideId: string,
  teamId: number,
  memo: string,
  user: UserSession
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const noteRef = getNoteDocRef(db, classId, generationId, slideId, teamId);
  const now = Date.now();

  await setDoc(noteRef, {
    slideId,
    teamId,
    generation: generationId,
    memo,
    updatedAt: now,
    updatedBy: user.uid
  }, { merge: true });
}

/**
 * 新增附件至筆記
 */
export async function addNoteAttachment(
  classId: string,
  generationId: number,
  slideId: string,
  teamId: number,
  attachment: NoteAttachment,
  user: UserSession
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const noteRef = getNoteDocRef(db, classId, generationId, slideId, teamId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(noteRef);
    const now = Date.now();

    if (!snap.exists()) {
      transaction.set(noteRef, {
        slideId,
        teamId,
        generation: generationId,
        memo: '',
        lock: { isLocked: false, holderUid: '', sessionId: '', holderName: '', leasedAt: 0, expiresAt: 0 },
        attachments: [attachment],
        updatedAt: now,
        updatedBy: user.uid
      });
    } else {
      const d = snap.data();
      const existing = Array.isArray(d.attachments) ? d.attachments : [];
      transaction.update(noteRef, {
        attachments: [...existing, attachment],
        updatedAt: now,
        updatedBy: user.uid
      });
    }
  });
}

/**
 * 刪除附件
 */
export async function removeNoteAttachment(
  classId: string,
  generationId: number,
  slideId: string,
  teamId: number,
  attachmentId: string,
  user: UserSession
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const noteRef = getNoteDocRef(db, classId, generationId, slideId, teamId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(noteRef);
    if (!snap.exists()) return;
    const d = snap.data();
    const existing = Array.isArray(d.attachments) ? d.attachments : [];
    const filtered = existing.filter(a => a.id !== attachmentId);
    transaction.update(noteRef, {
      attachments: filtered,
      updatedAt: Date.now(),
      updatedBy: user.uid
    });
  });
}
