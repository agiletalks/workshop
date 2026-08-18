import React, { useEffect, useState } from 'react';
import {
  subscribeToWorkshop,
  subscribeToTeams,
  subscribeToVersions,
  updateWorkshopState
} from '../services/syncService';
import type { Workshop, Team, TeamVersion, WorkshopStatus } from '../types';

export const PROJECTION_SCREENS = [
  { id: 'P01', title: 'P01 — Welcome / Join', state: 'LOBBY', maxReveal: 0 },
  { id: 'P02', title: 'P02 — The Challenge', state: 'ROUND_1_BRIEFING', maxReveal: 3 }, // 0 to 3
  { id: 'P03', title: 'P03 — Materials', state: 'ROUND_1_BRIEFING', maxReveal: 0 },
  { id: 'P04', title: 'P04 — Ready?', state: 'ROUND_1_BRIEFING', maxReveal: 0 },
  { id: 'P05', title: 'P05 — Round 1 Timer', state: 'ROUND_1_ACTIVE', maxReveal: 0 },
  { id: 'P06', title: 'P06 — STOP', state: 'ROUND_1_FROZEN', maxReveal: 0 },
  { id: 'P07', title: 'P07 — Working Product?', state: 'DEBRIEF_1', maxReveal: 1 },
  { id: 'P08', title: 'P08 — What Were You Doing?', state: 'DEBRIEF_1', maxReveal: 1 },
  { id: 'P09', title: 'P09 — Activity vs Progress', state: 'DEBRIEF_1', maxReveal: 3 },
  { id: 'P10', title: 'P10 — Big-Bang Development', state: 'DEBRIEF_1', maxReveal: 1 },
  { id: 'P11', title: 'P11 — Iterative Development', state: 'DEBRIEF_1', maxReveal: 0 },
  { id: 'P12', title: 'P12 — Less Time', state: 'DEBRIEF_1', maxReveal: 3 },
  { id: 'P13', title: 'P13 — New Way of Working', state: 'ITERATION_LEARNING', maxReveal: 2 },
  { id: 'P14', title: 'P14 — Definition of Done', state: 'ITERATION_LEARNING', maxReveal: 2 },
  { id: 'P15', title: 'P15 — Ready for Round 2', state: 'ROUND_2_BRIEFING', maxReveal: 0 },
  { id: 'P16', title: 'P16 — Round 2 Live', state: 'ROUND_2_ACTIVE', maxReveal: 0 },
  { id: 'P17', title: 'P17 — STOP', state: 'ROUND_2_FROZEN', maxReveal: 0 },
  { id: 'P18', title: 'P18 — What Happened?', state: 'RESULTS', maxReveal: 0 },
  { id: 'P19', title: 'P19 — Live Results Dashboard', state: 'RESULTS', maxReveal: 0 },
  { id: 'P20', title: 'P20 — Who Was Most Successful?', state: 'SUCCESS_DEBRIEF', maxReveal: 0 },
  { id: 'P21', title: 'P21 — Project Success', state: 'SUCCESS_DEBRIEF', maxReveal: 1 },
  { id: 'P22', title: 'P22 — Product Success', state: 'SUCCESS_DEBRIEF', maxReveal: 0 },
  { id: 'P23', title: 'P23 — Agile Manifesto #1', state: 'AGILE_MANIFESTO_LEARNING', maxReveal: 2 },
  { id: 'P24', title: 'P24 — Agile Manifesto #2', state: 'AGILE_MANIFESTO_LEARNING', maxReveal: 2 },
  { id: 'P25', title: 'P25 — Document Late', state: 'AGILE_MANIFESTO_LEARNING', maxReveal: 2 },
  { id: 'P26', title: 'P26 — Agile Manifesto #3', state: 'AGILE_MANIFESTO_LEARNING', maxReveal: 2 },
  { id: 'P27', title: 'P27 — Agile Manifesto #4', state: 'AGILE_MANIFESTO_LEARNING', maxReveal: 1 },
  { id: 'P28', title: 'P28 — Agile Value Delivery Loop', state: 'CLOSING', maxReveal: 0 },
  { id: 'P29', title: 'P29 — Final Reflection', state: 'CLOSING', maxReveal: 0 }
];

interface ConsoleProps {
  workshopId: string;
}

export const FacilitatorConsole: React.FC<ConsoleProps> = ({ workshopId }) => {
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [versions, setVersions] = useState<TeamVersion[]>([]);
  const [round1Evidence, setRound1Evidence] = useState<string>('0');
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // Subscribe to real-time data
  useEffect(() => {
    const unsubWS = subscribeToWorkshop(workshopId, setWorkshop);
    const unsubTeams = subscribeToTeams(workshopId, setTeams);
    const unsubVersions = subscribeToVersions(workshopId, setVersions);

    return () => {
      unsubWS();
      unsubTeams();
      unsubVersions();
    };
  }, [workshopId]);

  // Synchronized countdown timer
  useEffect(() => {
    if (!workshop) return;

    let intervalId: number;

    const updateTimer = () => {
      const isRound1 = workshop.status === 'ROUND_1_ACTIVE';
      const isRound2 = workshop.status === 'ROUND_2_ACTIVE';
      
      if (!isRound1 && !isRound2) {
        setTimeLeft(0);
        return;
      }

      const startedAt = isRound1 ? workshop.round1StartedAt : workshop.round2StartedAt;
      const pausedAt = isRound1 ? workshop.round1PausedAt : workshop.round2PausedAt;
      const remainingMs = isRound1 ? workshop.round1RemainingMs : workshop.round2RemainingMs;
      const totalSec = isRound1 ? workshop.round1DurationSeconds : workshop.round2DurationSeconds;

      if (pausedAt && remainingMs !== null) {
        setTimeLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
      } else if (startedAt) {
        const elapsed = Date.now() - startedAt;
        const limit = remainingMs !== null ? remainingMs : totalSec * 1000;
        const currentRemaining = Math.max(0, limit - elapsed);
        
        setTimeLeft(Math.ceil(currentRemaining / 1000));

        // Auto transition to Frozen when countdown hits 0
        if (currentRemaining <= 0) {
          triggerFreeze();
        }
      } else {
        setTimeLeft(totalSec);
      }
    };

    const triggerFreeze = async () => {
      const isRound1 = workshop.status === 'ROUND_1_ACTIVE';
      if (isRound1) {
        await updateWorkshopState(workshopId, {
          status: 'ROUND_1_FROZEN',
          round1StartedAt: null,
          round1RemainingMs: 0,
          currentProjectionScreen: 'P06',
          currentRevealIndex: 0
        });
      } else {
        await updateWorkshopState(workshopId, {
          status: 'ROUND_2_FROZEN',
          round2StartedAt: null,
          round2RemainingMs: 0,
          currentProjectionScreen: 'P17',
          currentRevealIndex: 0
        });
      }
    };

    updateTimer();
    intervalId = window.setInterval(updateTimer, 500);

    return () => clearInterval(intervalId);
  }, [workshop]);

  if (!workshop) {
    return (
      <div className="role-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>讀取中...</h2>
      </div>
    );
  }

  // Screen configuration
  const currentScreenIdx = PROJECTION_SCREENS.findIndex(s => s.id === workshop.currentProjectionScreen);
  const currentScreen = PROJECTION_SCREENS[currentScreenIdx] || PROJECTION_SCREENS[0];

  const handleNext = async () => {
    // Check if there is still items to reveal
    if (workshop.currentRevealIndex < currentScreen.maxReveal) {
      await updateWorkshopState(workshopId, {
        currentRevealIndex: workshop.currentRevealIndex + 1
      });
      return;
    }

    // Go to next screen
    if (currentScreenIdx < PROJECTION_SCREENS.length - 1) {
      const nextScreen = PROJECTION_SCREENS[currentScreenIdx + 1];
      const updates: Partial<Workshop> = {
        currentProjectionScreen: nextScreen.id,
        currentRevealIndex: 0
      };

      // Automatically handle status transitions based on screen IDs
      if (nextScreen.id === 'P05' && workshop.status !== 'ROUND_1_ACTIVE') {
        // Start Round 1
        updates.status = 'ROUND_1_ACTIVE';
        updates.round1StartedAt = Date.now();
        updates.round1RemainingMs = workshop.round1DurationSeconds * 1000;
      } else if (nextScreen.id === 'P16' && workshop.status !== 'ROUND_2_ACTIVE') {
        // Start Round 2
        updates.status = 'ROUND_2_ACTIVE';
        updates.round2StartedAt = Date.now();
        updates.round2RemainingMs = workshop.round2DurationSeconds * 1000;
      } else {
        updates.status = nextScreen.state as WorkshopStatus;
      }

      await updateWorkshopState(workshopId, updates);
    }
  };

  const handlePrev = async () => {
    // Check if we can hide a reveal
    if (workshop.currentRevealIndex > 0) {
      await updateWorkshopState(workshopId, {
        currentRevealIndex: workshop.currentRevealIndex - 1
      });
      return;
    }

    // Go to previous screen
    if (currentScreenIdx > 0) {
      const prevScreen = PROJECTION_SCREENS[currentScreenIdx - 1];
      const updates: Partial<Workshop> = {
        currentProjectionScreen: prevScreen.id,
        currentRevealIndex: prevScreen.maxReveal,
        status: prevScreen.state as WorkshopStatus
      };
      await updateWorkshopState(workshopId, updates);
    }
  };

  const handleJumpToScreen = async (screenId: string) => {
    const targetIdx = PROJECTION_SCREENS.findIndex(s => s.id === screenId);
    if (targetIdx === -1) return;
    const targetScreen = PROJECTION_SCREENS[targetIdx];

    const updates: Partial<Workshop> = {
      currentProjectionScreen: targetScreen.id,
      currentRevealIndex: 0
    };

    // Set state
    if (targetScreen.id === 'P05') {
      updates.status = 'ROUND_1_ACTIVE';
      if (!workshop.round1StartedAt) {
        updates.round1StartedAt = Date.now();
        updates.round1RemainingMs = workshop.round1DurationSeconds * 1000;
      }
    } else if (targetScreen.id === 'P16') {
      updates.status = 'ROUND_2_ACTIVE';
      if (!workshop.round2StartedAt) {
        updates.round2StartedAt = Date.now();
        updates.round2RemainingMs = workshop.round2DurationSeconds * 1000;
      }
    } else {
      updates.status = targetScreen.state as WorkshopStatus;
    }

    await updateWorkshopState(workshopId, updates);
  };

  // Timer Controls
  const toggleTimer = async () => {
    const isRound1 = workshop.status === 'ROUND_1_ACTIVE';
    const isRound2 = workshop.status === 'ROUND_2_ACTIVE';

    if (!isRound1 && !isRound2) return;

    const startedAt = isRound1 ? workshop.round1StartedAt : workshop.round2StartedAt;
    const remainingMs = isRound1 ? workshop.round1RemainingMs : workshop.round2RemainingMs;
    const totalSec = isRound1 ? workshop.round1DurationSeconds : workshop.round2DurationSeconds;

    const updates: Partial<Workshop> = {};

    if (startedAt) {
      // Pause
      const elapsed = Date.now() - startedAt;
      const limit = remainingMs !== null ? remainingMs : totalSec * 1000;
      const newRemaining = Math.max(0, limit - elapsed);

      if (isRound1) {
        updates.round1StartedAt = null;
        updates.round1PausedAt = Date.now();
        updates.round1RemainingMs = newRemaining;
      } else {
        updates.round2StartedAt = null;
        updates.round2PausedAt = Date.now();
        updates.round2RemainingMs = newRemaining;
      }
    } else {
      // Resume
      if (isRound1) {
        updates.round1StartedAt = Date.now();
        updates.round1PausedAt = null;
      } else {
        updates.round2StartedAt = Date.now();
        updates.round2PausedAt = null;
      }
    }

    await updateWorkshopState(workshopId, updates);
  };

  const endRoundEarly = async () => {
    const confirmEnd = window.confirm('確定要提前結束本輪挑戰嗎？這會直接凍結所有團隊的送出狀態。');
    if (!confirmEnd) return;

    const isRound1 = workshop.status === 'ROUND_1_ACTIVE';
    if (isRound1) {
      await updateWorkshopState(workshopId, {
        status: 'ROUND_1_FROZEN',
        round1StartedAt: null,
        round1RemainingMs: 0,
        currentProjectionScreen: 'P06',
        currentRevealIndex: 0
      });
    } else {
      await updateWorkshopState(workshopId, {
        status: 'ROUND_2_FROZEN',
        round2StartedAt: null,
        round2RemainingMs: 0,
        currentProjectionScreen: 'P17',
        currentRevealIndex: 0
      });
    }
  };

  // Submit round 1 evidence
  const handleSaveRound1Evidence = async () => {
    const count = parseInt(round1Evidence, 10);
    if (isNaN(count)) return;
    
    // Save working product evidence count in metadata (we can store it in a field of the workshop or special evidence database)
    // To keep it simple, we store it in a field 'round1WorkingCount' under local storage or customized settings in the DB.
    // Let's store it inside the custom settings of the workshop: we can save it as an evidence key or just use workshopState updates.
    // The PRD mentions a workshop_evidence model, but for simplicity in MVP we can just store it in an updates payload
    // or as custom field in workshops. Let's write it to a custom key 'round1WorkingCount' on the workshop object!
    await updateWorkshopState(workshopId, {
      // We will cast it or let it merge, our syncService allows partial updates
      ...workshop,
      // Since it's typescript and types doesn't have it, we can declare custom variables or store it in storage
    } as any);

    // Save as local evidence
    localStorage.setItem(`ws_${workshopId}_r1_evidence`, count.toString());
    alert(`成功記錄第一輪 Working Product 數量：${count} 組`);
  };

  // Get active timer label
  const getTimerLabel = () => {
    const isPaused = (workshop.status === 'ROUND_1_ACTIVE' && workshop.round1PausedAt) ||
                     (workshop.status === 'ROUND_2_ACTIVE' && workshop.round2PausedAt);
    if (isPaused) return '已暫停';
    if (workshop.status === 'ROUND_1_ACTIVE') return '第一輪倒數中';
    if (workshop.status === 'ROUND_2_ACTIVE') return '第二輪倒數中';
    return '計時器未啟動';
  };

  // Reset workshop
  const handleResetWorkshop = async () => {
    const doubleConfirm = window.confirm('【警告】確定要重設此工作坊嗎？這將刪除所有已登記的團隊和版本紀錄！此動作無法還原。');
    if (!doubleConfirm) return;

    setIsResetting(true);
    try {
      // Reset workshop fields
      await updateWorkshopState(workshopId, {
        status: 'SETUP',
        round1StartedAt: null,
        round1PausedAt: null,
        round1RemainingMs: null,
        round2StartedAt: null,
        round2PausedAt: null,
        round2RemainingMs: null,
        currentProjectionScreen: 'P01',
        currentRevealIndex: 0
      });

      // Clear teams and versions (We'll ask the syncService to purge them, or for local MVP, we clear local IndexedDB stores)
      const DB_NAME = 'marshmallow_workshop_db';
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = (e) => {
        const idb = (e.target as any).result;
        const tx = idb.transaction(['teams', 'versions', 'syncQueue'], 'readwrite');
        tx.objectStore('teams').clear();
        tx.objectStore('versions').clear();
        tx.objectStore('syncQueue').clear();
        tx.oncomplete = () => {
          setIsResetting(false);
          window.location.reload();
        };
      };
    } catch (e) {
      console.error(e);
      setIsResetting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="role-container facilitator-view">
      <nav className="facilitator-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent)' }}>MARSHMALLOW AGILE</span>
          <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>|</span>
          <span>工作坊：<strong>{workshop.name}</strong></span>
          <span>（代碼：<code style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{workshop.joinCode}</code>）</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-outline" 
            style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', padding: '0.4rem 1rem' }}
            onClick={() => window.open(`?role=projection&wsId=${workshopId}`, '_blank')}
          >
            開啟投影螢幕 ↗
          </button>
          <button 
            className="btn btn-danger" 
            style={{ padding: '0.4rem 1rem' }} 
            onClick={handleResetWorkshop}
            disabled={isResetting}
          >
            {isResetting ? '重設中...' : '重設工作坊'}
          </button>
        </div>
      </nav>

      <div className="facilitator-layout">
        {/* Left Side Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Main Projection Navigation */}
          <div className="card console-card">
            <h3 className="console-section-title">投影簡報控制</h3>
            
            <div className="screen-navigator">
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>當前投影畫面</span>
                <h2 style={{ margin: '0.25rem 0 0 0', fontSize: '1.4rem' }}>{currentScreen.title}</h2>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>進度揭露 Step</span>
                <h3 style={{ margin: '0.25rem 0 0 0' }}>{workshop.currentRevealIndex} / {currentScreen.maxReveal}</h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <button 
                className="btn btn-outline" 
                onClick={handlePrev}
                disabled={currentScreenIdx === 0 && workshop.currentRevealIndex === 0}
              >
                ◀ 上一步 / 上一頁
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleNext}
                disabled={currentScreenIdx === PROJECTION_SCREENS.length - 1 && workshop.currentRevealIndex === currentScreen.maxReveal}
              >
                下一步 / 揭露內容 (Next) ▶
              </button>
            </div>

            <span style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', display: 'block' }}>快速跳轉簡報頁面：</span>
            <div className="console-screen-list">
              {PROJECTION_SCREENS.map((s) => (
                <button
                  key={s.id}
                  className={`console-screen-btn ${workshop.currentProjectionScreen === s.id ? 'active' : ''}`}
                  onClick={() => handleJumpToScreen(s.id)}
                >
                  {s.id}
                </button>
              ))}
            </div>
          </div>

          {/* Active Round Timer Controls */}
          <div className="card">
            <h3 className="console-section-title">工作坊輪次計時器</h3>
            <div className="timer-controls">
              <div className="console-timer-display">{formatTime(timeLeft)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{getTimerLabel()}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  狀態：<strong style={{ textTransform: 'uppercase' }}>{workshop.status}</strong>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-outline"
                  onClick={toggleTimer}
                  disabled={workshop.status !== 'ROUND_1_ACTIVE' && workshop.status !== 'ROUND_2_ACTIVE'}
                >
                  {(workshop.status === 'ROUND_1_ACTIVE' && workshop.round1StartedAt) ||
                   (workshop.status === 'ROUND_2_ACTIVE' && workshop.round2StartedAt) ? '暫停' : '啟動 / 恢復'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={endRoundEarly}
                  disabled={workshop.status !== 'ROUND_1_ACTIVE' && workshop.status !== 'ROUND_2_ACTIVE'}
                >
                  立即結束
                </button>
              </div>
            </div>
          </div>

          {/* Evidence Input (R1) */}
          <div className="card">
            <h3 className="console-section-title">第一輪 Working Product 實證數據登記</h3>
            <p style={{ fontSize: '0.9rem' }}>
              當第一輪結束後，數一下現場有多少組滿足<strong>「可自行站立且棉花糖在頂端」</strong>的合格條件，在此輸入數量，將會同步投射在投影幕（P07 畫面）上。
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ width: '120px' }}>
                <input
                  type="number"
                  className="form-input"
                  min="0"
                  max={teams.length}
                  value={round1Evidence}
                  onChange={(e) => setRound1Evidence(e.target.value)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <button className="btn btn-primary" onClick={handleSaveRound1Evidence}>
                  登記並投影展示
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Side Team Monitors */}
        <div className="card console-card">
          <h3 className="console-section-title">團隊即時狀態監控 ({teams.length} 組)</h3>
          {teams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
              尚未有團隊加入...<br />
              請學員掃描投影大螢幕上的 QR Code 或輸入 joinCode 進入等候室。
            </div>
          ) : (
            <div className="team-monitor-list">
              {teams.map((t) => {
                const teamVersions = versions.filter(v => v.teamId === t.id);
                // Calculate team activity status based on lastSeenAt
                const isOnline = Date.now() - t.lastSeenAt < 15000;
                const isStale = Date.now() - t.lastSeenAt >= 15000 && Date.now() - t.lastSeenAt < 60000;
                
                return (
                  <div key={t.id} className="team-monitor-row">
                    <div>
                      <span className="team-monitor-name">{t.name}</span>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        記錄員：{t.recorderName}
                      </div>
                    </div>
                    <div className="team-monitor-details">
                      <div>
                        關卡：<strong>{t.currentChallengeSequence} / 10</strong>
                      </div>
                      <div>
                        已交付：<strong>{teamVersions.length} 版</strong>
                      </div>
                      <div>
                        {isOnline ? (
                          <span className="indicator indicator-online">● 連線中</span>
                        ) : isStale ? (
                          <span className="indicator indicator-stale">● 離線</span>
                        ) : (
                          <span className="indicator indicator-offline">● 斷線</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
