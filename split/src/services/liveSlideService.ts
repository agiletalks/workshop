import { doc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';

export interface InstructorLiveSlide {
  slideId: string;
  pageNumber: number;
  slideTitle: string;
  updatedAt: number;
}

let lastBroadcastSlideId = '';

/**
 * 講師廣播當前投影片狀態至 Firestore 與本機 BroadcastChannel
 */
export async function broadcastInstructorSlide(classId: string, slideInfo: InstructorLiveSlide): Promise<void> {
  if (!classId) return;

  // 1. 本機 BroadcastChannel 即時通訊 (跨同瀏覽器分頁零延遲)
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel(`split_live_slide_${classId}`);
      channel.postMessage(slideInfo);
      channel.close();
    }
  } catch (err) {
    console.warn('[liveSlideService] BroadcastChannel postMessage failed:', err);
  }

  // 2. 避免重複向 Firestore 發送相同頁面
  if (lastBroadcastSlideId === `${slideInfo.slideId}_${classInfoKey(slideInfo)}`) {
    return;
  }
  lastBroadcastSlideId = `${slideInfo.slideId}_${classInfoKey(slideInfo)}`;

  // 3. 雲端同步至 Firestore
  if (!db) return;
  try {
    const liveDocRef = doc(db, 'split_data', classId, 'live', 'instructor');
    await setDoc(liveDocRef, slideInfo, { merge: true });
  } catch (err) {
    console.error('[liveSlideService] Failed to broadcast to Firestore:', err);
  }
}

function classInfoKey(info: InstructorLiveSlide): string {
  return `${info.pageNumber}_${info.slideTitle}`;
}

/**
 * 學員訂閱講師當前投影投影片
 */
export function subscribeInstructorSlide(
  classId: string,
  onUpdate: (info: InstructorLiveSlide | null) => void
): Unsubscribe {
  if (!classId) return () => {};

  let currentInfo: InstructorLiveSlide | null = null;

  // 1. 監聽 BroadcastChannel (同機快速反應)
  let channel: BroadcastChannel | null = null;
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      channel = new BroadcastChannel(`split_live_slide_${classId}`);
      channel.onmessage = (event) => {
        if (event.data && event.data.slideId) {
          currentInfo = event.data as InstructorLiveSlide;
          onUpdate(currentInfo);
        }
      };
    }
  } catch (err) {
    console.warn('[liveSlideService] BroadcastChannel subscribe failed:', err);
  }

  // 2. 監聽 Firestore 文件
  let firestoreUnsub: Unsubscribe = () => {};
  if (db) {
    try {
      const liveDocRef = doc(db, 'split_data', classId, 'live', 'instructor');
      firestoreUnsub = onSnapshot(liveDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as InstructorLiveSlide;
          if (data && data.slideId) {
            // 如果比本機目前資料更新或尚未有本機資料
            if (!currentInfo || data.updatedAt >= (currentInfo.updatedAt || 0)) {
              currentInfo = data;
              onUpdate(data);
            }
          }
        }
      }, (err) => {
        console.warn('[liveSlideService] Firestore subscribe error:', err);
      });
    } catch (err) {
      console.warn('[liveSlideService] Firestore listen init error:', err);
    }
  }

  return () => {
    if (channel) {
      channel.close();
    }
    firestoreUnsub();
  };
}
