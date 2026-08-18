import { openDB, type IDBPDatabase } from 'idb';
import { db, isFirebaseConfigured } from './firebase';
import {
  doc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import type { Workshop, Team, TeamVersion } from '../types';

// IndexedDB configuration
const DB_NAME = 'marshmallow_workshop_db';
const DB_VERSION = 1;

let idbPromise: Promise<IDBPDatabase> | null = null;

function getIDB() {
  if (!idbPromise) {
    idbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('workshops')) {
          db.createObjectStore('workshops', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('teams')) {
          db.createObjectStore('teams', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('versions')) {
          db.createObjectStore('versions', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }
      },
    });
  }
  return idbPromise;
}

// BroadcastChannel for cross-tab sync in Mock Mode
const mockChannel = new BroadcastChannel('marshmallow_mock_sync');

// Listeners Registry
type ListenerCallback<T> = (data: T) => void;
const workshopListeners = new Set<ListenerCallback<Workshop | null>>();
const teamsListeners = new Set<ListenerCallback<Team[]>>();
const versionsListeners = new Set<ListenerCallback<TeamVersion[]>>();

let activeWorkshopId: string | null = null;
let unsubscribes: (() => void)[] = [];

// Setup local cache variables
let cachedWorkshop: Workshop | null = null;
let cachedTeams: Team[] = [];
let cachedVersions: TeamVersion[] = [];

// Helper to notify listeners
function notifyWorkshop(workshop: Workshop | null) {
  cachedWorkshop = workshop;
  workshopListeners.forEach(cb => cb(workshop));
}

function notifyTeams(teams: Team[]) {
  cachedTeams = teams;
  teamsListeners.forEach(cb => cb(teams));
}

function notifyVersions(versions: TeamVersion[]) {
  cachedVersions = versions;
  versionsListeners.forEach(cb => cb(versions));
}

// Intercept BroadcastChannel messages for Local Mock Mode
mockChannel.onmessage = async (event) => {
  if (isFirebaseConfigured) return; // Ignore if using Firebase

  const { type, payload } = event.data;
  console.log('[Mock Sync] Received event:', type, payload);

  const localIDB = await getIDB();

  if (type === 'WORKSHOP_UPDATED') {
    const ws = payload as Workshop;
    if (ws.id === activeWorkshopId) {
      await localIDB.put('workshops', ws);
      notifyWorkshop(ws);
    }
  } else if (type === 'TEAM_JOINED') {
    const team = payload as Team;
    if (team.workshopId === activeWorkshopId) {
      await localIDB.put('teams', team);
      const allTeams = await localIDB.getAll('teams');
      notifyTeams(allTeams.filter(t => t.workshopId === activeWorkshopId));
    }
  } else if (type === 'VERSION_SUBMITTED') {
    const version = payload as TeamVersion;
    if (version.workshopId === activeWorkshopId) {
      await localIDB.put('versions', version);
      const allVersions = await localIDB.getAll('versions');
      notifyVersions(allVersions.filter(v => v.workshopId === activeWorkshopId));
    }
  } else if (type === 'REQUEST_STATE') {
    // Reply with current state if we have it
    if (cachedWorkshop && cachedWorkshop.id === payload.workshopId) {
      mockChannel.postMessage({
        type: 'WORKSHOP_UPDATED',
        payload: cachedWorkshop,
        senderId: 'mock-replier'
      });
      mockChannel.postMessage({
        type: 'STATE_REPLY_TEAMS',
        payload: { workshopId: payload.workshopId, teams: cachedTeams }
      });
      mockChannel.postMessage({
        type: 'STATE_REPLY_VERSIONS',
        payload: { workshopId: payload.workshopId, versions: cachedVersions }
      });
    }
  } else if (type === 'STATE_REPLY_TEAMS') {
    if (payload.workshopId === activeWorkshopId) {
      for (const t of payload.teams) {
        await localIDB.put('teams', t);
      }
      notifyTeams(payload.teams);
    }
  } else if (type === 'STATE_REPLY_VERSIONS') {
    if (payload.workshopId === activeWorkshopId) {
      for (const v of payload.versions) {
        await localIDB.put('versions', v);
      }
      notifyVersions(payload.versions);
    }
  }
};

// Network online event to trigger sync queue
window.addEventListener('online', () => {
  console.log('[Network] System came online. Syncing queue...');
  syncOfflineQueue();
});

// Sync offline queue to cloud DB
export async function syncOfflineQueue() {
  if (!isFirebaseConfigured || !db || !navigator.onLine) return;

  try {
    const localIDB = await getIDB();
    const queuedItems = await localIDB.getAll('syncQueue');
    if (queuedItems.length === 0) return;

    console.log(`[Sync Queue] Syncing ${queuedItems.length} records...`);
    const batch = writeBatch(db);

    for (const item of queuedItems) {
      const versionDocRef = doc(db, 'workshops', item.workshopId, 'versions', item.id);
      
      // Update item status to synced
      const syncedRecord: TeamVersion = {
        ...item,
        syncStatus: 'synced',
        updatedAt: Date.now()
      };

      batch.set(versionDocRef, syncedRecord, { merge: true });
    }

    await batch.commit();

    // Clear local queue and update local store status
    const tx = localIDB.transaction(['syncQueue', 'versions'], 'readwrite');
    for (const item of queuedItems) {
      await tx.objectStore('syncQueue').delete(item.id);
      const version = await tx.objectStore('versions').get(item.id);
      if (version) {
        version.syncStatus = 'synced';
        version.updatedAt = Date.now();
        await tx.objectStore('versions').put(version);
      }
    }
    await tx.done;

    console.log('[Sync Queue] Sync completed successfully.');

    // Fetch latest versions to refresh view
    const allVersions = await localIDB.getAll('versions');
    notifyVersions(allVersions.filter(v => v.workshopId === activeWorkshopId));
  } catch (error) {
    console.error('[Sync Queue] Sync failed:', error);
  }
}

// 1. Subscribe to Workshop
export function subscribeToWorkshop(workshopId: string, callback: ListenerCallback<Workshop | null>): () => void {
  activeWorkshopId = workshopId;
  workshopListeners.add(callback);
  
  // Load initially from local DB
  getIDB().then(async (localIDB) => {
    const localWS = await localIDB.get('workshops', workshopId);
    if (localWS) {
      notifyWorkshop(localWS);
    }
  });

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'workshops', workshopId);
    const unsub = onSnapshot(docRef, async (docSnap) => {
      if (docSnap.exists()) {
        const wsData = docSnap.data() as Workshop;
        const localIDB = await getIDB();
        await localIDB.put('workshops', wsData);
        notifyWorkshop(wsData);
      } else {
        notifyWorkshop(null);
      }
    }, (error) => {
      console.error('Firestore Workshop subscribe error:', error);
    });
    unsubscribes.push(unsub);
  } else {
    // Mock Mode: Request state from other tabs
    setTimeout(() => {
      mockChannel.postMessage({ type: 'REQUEST_STATE', payload: { workshopId } });
    }, 500);
  }

  return () => {
    workshopListeners.delete(callback);
  };
}

// 2. Subscribe to Teams
export function subscribeToTeams(workshopId: string, callback: ListenerCallback<Team[]>): () => void {
  teamsListeners.add(callback);

  getIDB().then(async (localIDB) => {
    const allTeams = await localIDB.getAll('teams');
    const filtered = allTeams.filter(t => t.workshopId === workshopId);
    notifyTeams(filtered);
  });

  if (isFirebaseConfigured && db) {
    const colRef = collection(db, 'workshops', workshopId, 'teams');
    const unsub = onSnapshot(colRef, async (querySnap) => {
      const teamsList: Team[] = [];
      const localIDB = await getIDB();
      const tx = localIDB.transaction('teams', 'readwrite');
      
      querySnap.forEach((docSnap) => {
        const team = docSnap.data() as Team;
        teamsList.push(team);
        tx.objectStore('teams').put(team);
      });
      await tx.done;
      notifyTeams(teamsList);
    });
    unsubscribes.push(unsub);
  }

  return () => {
    teamsListeners.delete(callback);
  };
}

// 3. Subscribe to Versions
export function subscribeToVersions(workshopId: string, callback: ListenerCallback<TeamVersion[]>): () => void {
  versionsListeners.add(callback);

  getIDB().then(async (localIDB) => {
    const allVersions = await localIDB.getAll('versions');
    const filtered = allVersions.filter(v => v.workshopId === workshopId);
    notifyVersions(filtered);
  });

  if (isFirebaseConfigured && db) {
    const colRef = collection(db, 'workshops', workshopId, 'versions');
    const unsub = onSnapshot(colRef, async (querySnap) => {
      const versionsList: TeamVersion[] = [];
      const localIDB = await getIDB();
      const tx = localIDB.transaction('versions', 'readwrite');
      
      querySnap.forEach((docSnap) => {
        const v = docSnap.data() as TeamVersion;
        versionsList.push(v);
        tx.objectStore('versions').put(v);
      });
      await tx.done;
      notifyVersions(versionsList);
    });
    unsubscribes.push(unsub);
  }

  return () => {
    versionsListeners.delete(callback);
  };
}

// Clean up all cloud listeners
export function unsubscribeAll() {
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];
  activeWorkshopId = null;
}

// 4. Update Workshop State (Facilitator)
export async function updateWorkshopState(workshopId: string, updates: Partial<Workshop>): Promise<void> {
  const localIDB = await getIDB();
  const current = await localIDB.get('workshops', workshopId);
  if (!current) return;

  const updatedWS: Workshop = {
    ...current,
    ...updates,
    updatedAt: Date.now()
  };

  // 1. Save locally
  await localIDB.put('workshops', updatedWS);
  notifyWorkshop(updatedWS);

  // 2. Sync to Firebase
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, 'workshops', workshopId);
      await updateDoc(docRef, updates as any);
    } catch (e) {
      console.error('Failed to sync workshop update to Firebase:', e);
    }
  } else {
    // Broadcast mock sync
    mockChannel.postMessage({
      type: 'WORKSHOP_UPDATED',
      payload: updatedWS,
      senderId: 'facilitator'
    });
  }
}

// 5. Create new Workshop
export async function createWorkshop(name: string, joinCode: string): Promise<Workshop> {
  const newWS: Workshop = {
    id: `ws_${Math.random().toString(36).substring(2, 9)}`,
    name,
    joinCode: joinCode.toUpperCase(),
    status: 'SETUP',
    round1DurationSeconds: 1080, // 18 mins (simulating Waterfall expectation)
    round2DurationSeconds: 600, // 10 mins (10 iterations)
    round1StartedAt: null,
    round1PausedAt: null,
    round1RemainingMs: null,
    round2StartedAt: null,
    round2PausedAt: null,
    round2RemainingMs: null,
    currentProjectionScreen: 'P01',
    currentRevealIndex: 0,
    challengeSetId: 'marshmallow_agile_10',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  const localIDB = await getIDB();
  await localIDB.put('workshops', newWS);
  notifyWorkshop(newWS);

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'workshops', newWS.id);
    await setDoc(docRef, newWS);
  }

  return newWS;
}

// 6. Join Team (Team Recorder)
export async function joinTeam(workshopId: string, teamName: string, recorderName: string): Promise<Team> {
  const newTeam: Team = {
    id: `team_${Math.random().toString(36).substring(2, 9)}`,
    workshopId,
    name: teamName.trim(),
    recorderName: recorderName.trim(),
    currentChallengeSequence: 1,
    joinedAt: Date.now(),
    lastSeenAt: Date.now()
  };

  const localIDB = await getIDB();
  await localIDB.put('teams', newTeam);

  // Read all teams to update layout
  const allTeams = await localIDB.getAll('teams');
  notifyTeams(allTeams.filter(t => t.workshopId === workshopId));

  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'workshops', workshopId, 'teams', newTeam.id);
    await setDoc(docRef, newTeam);
  } else {
    // Broadcast mock sync
    mockChannel.postMessage({
      type: 'TEAM_JOINED',
      payload: newTeam,
      senderId: newTeam.id
    });
  }

  return newTeam;
}

// 7. Submit Version Record (Team Recorder)
export async function submitVersionRecord(
  team: Team,
  challengeId: string,
  versionNumber: number,
  challengeStartedAt: number,
  changeRecord: string,
  validationConfirmed: boolean
): Promise<TeamVersion> {
  
  const idempotencyKey = `idemp_${team.id}_c${challengeId}_v${versionNumber}`;
  const localIDB = await getIDB();

  // Create record
  const newVersion: TeamVersion = {
    id: `version_${Math.random().toString(36).substring(2, 9)}`,
    idempotencyKey,
    workshopId: team.workshopId,
    teamId: team.id,
    challengeId,
    versionNumber,
    challengeStartedAt,
    completedAt: Date.now(),
    changeRecord: changeRecord.trim(),
    validationConfirmed,
    syncStatus: 'saving',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // 1. Write to local database (Immediate responsiveness)
  await localIDB.put('versions', newVersion);

  // Update team progress sequence locally
  const nextSeq = versionNumber + 1;
  const updatedTeam: Team = {
    ...team,
    currentChallengeSequence: nextSeq,
    lastSeenAt: Date.now()
  };
  await localIDB.put('teams', updatedTeam);

  // Update versions list cache
  const allVersions = await localIDB.getAll('versions');
  notifyVersions(allVersions.filter(v => v.workshopId === team.workshopId));

  // Update teams list cache
  const allTeams = await localIDB.getAll('teams');
  notifyTeams(allTeams.filter(t => t.workshopId === team.workshopId));

  // 2. Put into local sync queue
  await localIDB.put('syncQueue', newVersion);

  // 3. Update Team document in Firestore
  if (isFirebaseConfigured && db) {
    try {
      const teamRef = doc(db, 'workshops', team.workshopId, 'teams', team.id);
      await updateDoc(teamRef, {
        currentChallengeSequence: nextSeq,
        lastSeenAt: Date.now()
      });
    } catch (e) {
      console.error('Failed to sync team progress sequence:', e);
    }
  }

  // 4. Try syncing to Firebase
  if (isFirebaseConfigured && db && navigator.onLine) {
    // If online, perform sync immediately
    syncOfflineQueue();
  } else {
    // Mock sync broadcast for local multi-tab simulator
    mockChannel.postMessage({
      type: 'VERSION_SUBMITTED',
      payload: newVersion,
      senderId: team.id
    });
    
    // Also mock update team locally for other tabs
    mockChannel.postMessage({
      type: 'TEAM_JOINED',
      payload: updatedTeam,
      senderId: team.id
    });
  }

  return newVersion;
}

// 8. Find Workshop by Join Code
export async function findWorkshopByJoinCode(joinCode: string): Promise<Workshop | null> {
  const localIDB = await getIDB();
  const all = await localIDB.getAll('workshops');
  const foundLocal = all.find(w => w.joinCode === joinCode.toUpperCase().trim());
  if (foundLocal) return foundLocal;

  if (isFirebaseConfigured && db) {
    try {
      const q = query(collection(db, 'workshops'), where('joinCode', '==', joinCode.toUpperCase().trim()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const ws = snap.docs[0].data() as Workshop;
        await localIDB.put('workshops', ws);
        return ws;
      }
    } catch (e) {
      console.error('Failed to query workshop in cloud:', e);
    }
  }
  return null;
}

