export type WorkshopStatus =
  | 'SETUP'
  | 'LOBBY'
  | 'ROUND_1_BRIEFING'
  | 'ROUND_1_ACTIVE'
  | 'ROUND_1_FROZEN'
  | 'DEBRIEF_1'
  | 'ITERATION_LEARNING'
  | 'ROUND_2_BRIEFING'
  | 'ROUND_2_ACTIVE'
  | 'ROUND_2_FROZEN'
  | 'RESULTS'
  | 'SUCCESS_DEBRIEF'
  | 'AGILE_MANIFESTO_LEARNING'
  | 'CLOSING'
  | 'COMPLETED';

export interface Workshop {
  id: string;
  name: string;
  joinCode: string;
  status: WorkshopStatus;
  round1DurationSeconds: number;
  round2DurationSeconds: number;
  round1StartedAt: number | null; // epoch timestamp in ms
  round1PausedAt: number | null;  // epoch timestamp in ms
  round1RemainingMs: number | null; // cached remaining time when paused
  round2StartedAt: number | null; // epoch timestamp in ms
  round2PausedAt: number | null;  // epoch timestamp in ms
  round2RemainingMs: number | null; // cached remaining time when paused
  currentProjectionScreen: string; // P01, P02, etc.
  currentRevealIndex: number; // For progressive reveals on teaching slides
  challengeSetId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Team {
  id: string;
  workshopId: string;
  name: string;
  recorderName: string;
  currentChallengeSequence: number; // 1-based index (1 to 10)
  joinedAt: number;
  lastSeenAt: number;
  r1Activities?: string[];
}

export interface TeamVersion {
  id: string;
  idempotencyKey: string;
  workshopId: string;
  teamId: string;
  challengeId: string;
  versionNumber: number; // 1-based index
  challengeStartedAt: number;
  completedAt: number;
  changeRecord: string;
  validationConfirmed: boolean;
  syncStatus: 'synced' | 'saving' | 'error';
  createdAt: number;
  updatedAt: number;
}

export interface Challenge {
  id: string;
  challengeSetId: string;
  sequence: number; // 1-based index
  title: string;
  description: string;
  acceptanceCriteria: string[];
  learningIntent: string;
  isActive: boolean;
}

export interface WorkshopEvidence {
  id: string;
  workshopId: string;
  key: string;
  value: any;
  createdAt: number;
  updatedAt: number;
}
