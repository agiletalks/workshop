import React, { useEffect, useState, useCallback } from 'react';
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

interface ProjectionProps {
  workshopId: string;
}

export const ProjectionView: React.FC<ProjectionProps> = ({ workshopId }) => {
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [versions, setVersions] = useState<TeamVersion[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [round1Evidence, setRound1Evidence] = useState<string>('0');
  const [isResetting, setIsResetting] = useState<boolean>(false);

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

  const handleNext = useCallback(async () => {
    if (!workshop) return;
    const currentScreenIdx = PROJECTION_SCREENS.findIndex(s => s.id === workshop.currentProjectionScreen);
    const currentScreen = PROJECTION_SCREENS[currentScreenIdx] || PROJECTION_SCREENS[0];

    if (workshop.currentRevealIndex < currentScreen.maxReveal) {
      await updateWorkshopState(workshopId, {
        currentRevealIndex: workshop.currentRevealIndex + 1
      });
      return;
    }

    if (currentScreenIdx < PROJECTION_SCREENS.length - 1) {
      const nextScreen = PROJECTION_SCREENS[currentScreenIdx + 1];
      const updates: Partial<Workshop> = {
        currentProjectionScreen: nextScreen.id,
        currentRevealIndex: 0
      };

      if (nextScreen.id === 'P05' && workshop.status !== 'ROUND_1_ACTIVE') {
        updates.status = 'ROUND_1_ACTIVE';
        updates.round1StartedAt = Date.now();
        updates.round1RemainingMs = workshop.round1DurationSeconds * 1000;
      } else if (nextScreen.id === 'P16' && workshop.status !== 'ROUND_2_ACTIVE') {
        updates.status = 'ROUND_2_ACTIVE';
        updates.round2StartedAt = Date.now();
        updates.round2RemainingMs = workshop.round2DurationSeconds * 1000;
      } else {
        updates.status = nextScreen.state as WorkshopStatus;
      }
      await updateWorkshopState(workshopId, updates);
    }
  }, [workshop, workshopId]);

  const handlePrev = useCallback(async () => {
    if (!workshop) return;
    const currentScreenIdx = PROJECTION_SCREENS.findIndex(s => s.id === workshop.currentProjectionScreen);

    if (workshop.currentRevealIndex > 0) {
      await updateWorkshopState(workshopId, {
        currentRevealIndex: workshop.currentRevealIndex - 1
      });
      return;
    }

    if (currentScreenIdx > 0) {
      const prevScreen = PROJECTION_SCREENS[currentScreenIdx - 1];
      const updates: Partial<Workshop> = {
        currentProjectionScreen: prevScreen.id,
        currentRevealIndex: prevScreen.maxReveal,
        status: prevScreen.state as WorkshopStatus
      };
      await updateWorkshopState(workshopId, updates);
    }
  }, [workshop, workshopId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsDrawerOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  useEffect(() => {
    if (!workshop) return;
    const isRound1 = workshop.status === 'ROUND_1_ACTIVE';
    const isRound2 = workshop.status === 'ROUND_2_ACTIVE';
    if (!isRound1 && !isRound2) { setTimeLeft(0); return; }
    const triggerFreeze = async () => {
      if (isRound1) {
        await updateWorkshopState(workshopId, { status: 'ROUND_1_FROZEN', round1StartedAt: null, round1RemainingMs: 0, currentProjectionScreen: 'P06', currentRevealIndex: 0 });
      } else {
        await updateWorkshopState(workshopId, { status: 'ROUND_2_FROZEN', round2StartedAt: null, round2RemainingMs: 0, currentProjectionScreen: 'P17', currentRevealIndex: 0 });
      }
    };
    const updateTimer = () => {
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
        if (currentRemaining <= 0) triggerFreeze();
      } else {
        setTimeLeft(totalSec);
      }
    };
    updateTimer();
    const intervalId = setInterval(updateTimer, 500);
    return () => clearInterval(intervalId);
  }, [workshop, workshopId]);

  useEffect(() => {
    if (teams.length > 0 && !selectedTeamId) setSelectedTeamId(teams[0].id);
  }, [teams, selectedTeamId]);

  useEffect(() => {
    const raw = localStorage.getItem(`ws_${workshopId}_r1_evidence`);
    if (raw) setRound1Evidence(raw);
  }, [workshopId]);

  if (!workshop) {
    return (
      <div className="role-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--primary)', color: '#fff' }}>
        <h2>讀取工作坊中...</h2>
      </div>
    );
  }

  const currentScreenIdx = PROJECTION_SCREENS.findIndex(s => s.id === workshop.currentProjectionScreen);
  const currentScreen = PROJECTION_SCREENS[currentScreenIdx] || PROJECTION_SCREENS[0];

  const handleJumpToScreen = async (screenId: string) => {
    const targetIdx = PROJECTION_SCREENS.findIndex(s => s.id === screenId);
    if (targetIdx === -1) return;
    const targetScreen = PROJECTION_SCREENS[targetIdx];
    const updates: Partial<Workshop> = { currentProjectionScreen: targetScreen.id, currentRevealIndex: 0 };
    if (targetScreen.id === 'P05') {
      updates.status = 'ROUND_1_ACTIVE';
      if (!workshop.round1StartedAt) { updates.round1StartedAt = Date.now(); updates.round1RemainingMs = workshop.round1DurationSeconds * 1000; }
    } else if (targetScreen.id === 'P16') {
      updates.status = 'ROUND_2_ACTIVE';
      if (!workshop.round2StartedAt) { updates.round2StartedAt = Date.now(); updates.round2RemainingMs = workshop.round2DurationSeconds * 1000; }
    } else {
      updates.status = targetScreen.state as WorkshopStatus;
    }
    await updateWorkshopState(workshopId, updates);
  };

  const toggleTimer = async () => {
    const isRound1 = workshop.status === 'ROUND_1_ACTIVE';
    const isRound2 = workshop.status === 'ROUND_2_ACTIVE';
    if (!isRound1 && !isRound2) return;
    const startedAt = isRound1 ? workshop.round1StartedAt : workshop.round2StartedAt;
    const remainingMs = isRound1 ? workshop.round1RemainingMs : workshop.round2RemainingMs;
    const totalSec = isRound1 ? workshop.round1DurationSeconds : workshop.round2DurationSeconds;
    const updates: Partial<Workshop> = {};
    if (startedAt) {
      const elapsed = Date.now() - startedAt;
      const limit = remainingMs !== null ? remainingMs : totalSec * 1000;
      const newRemaining = Math.max(0, limit - elapsed);
      if (isRound1) { updates.round1StartedAt = null; updates.round1PausedAt = Date.now(); updates.round1RemainingMs = newRemaining; }
      else { updates.round2StartedAt = null; updates.round2PausedAt = Date.now(); updates.round2RemainingMs = newRemaining; }
    } else {
      if (isRound1) { updates.round1StartedAt = Date.now(); updates.round1PausedAt = null; }
      else { updates.round2StartedAt = Date.now(); updates.round2PausedAt = null; }
    }
    await updateWorkshopState(workshopId, updates);
  };

  const endRoundEarly = async () => {
    const confirmEnd = window.confirm('確定要提前結束本輪挑戰嗎？這會直接凍結所有團隊的送出狀態。');
    if (!confirmEnd) return;
    const isRound1 = workshop.status === 'ROUND_1_ACTIVE';
    if (isRound1) {
      await updateWorkshopState(workshopId, { status: 'ROUND_1_FROZEN', round1StartedAt: null, round1RemainingMs: 0, currentProjectionScreen: 'P06', currentRevealIndex: 0 });
    } else {
      await updateWorkshopState(workshopId, { status: 'ROUND_2_FROZEN', round2StartedAt: null, round2RemainingMs: 0, currentProjectionScreen: 'P17', currentRevealIndex: 0 });
    }
  };

  const handleSaveRound1Evidence = async () => {
    const count = parseInt(round1Evidence, 10);
    if (isNaN(count)) return;
    localStorage.setItem(`ws_${workshopId}_r1_evidence`, count.toString());
    await updateWorkshopState(workshopId, { currentRevealIndex: 1 });
  };

  const handleResetWorkshop = async () => {
    const doubleConfirm = window.confirm('【警告】確定要重設此工作坊嗎？這將刪除所有團隊資料與版本紀錄！');
    if (!doubleConfirm) return;
    setIsResetting(true);
    try {
      await updateWorkshopState(workshopId, { status: 'SETUP', round1StartedAt: null, round1PausedAt: null, round1RemainingMs: null, round2StartedAt: null, round2PausedAt: null, round2RemainingMs: null, currentProjectionScreen: 'P01', currentRevealIndex: 0 });
      const DB_NAME = 'marshmallow_workshop_db';
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = (e) => {
        const idb = (e.target as any).result;
        const tx = idb.transaction(['teams', 'versions', 'syncQueue'], 'readwrite');
        tx.objectStore('teams').clear();
        tx.objectStore('versions').clear();
        tx.objectStore('syncQueue').clear();
        tx.oncomplete = () => { setIsResetting(false); window.location.reload(); };
      };
    } catch (e) { console.error(e); setIsResetting(false); }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const isRevealed = (index: number) => {
    return workshop.currentRevealIndex >= index;
  };

  const getRound1EvidenceCount = () => {
    const raw = localStorage.getItem(`ws_${workshopId}_r1_evidence`);
    return raw ? parseInt(raw, 10) : 0;
  };

  const calculateDashboardMetrics = () => {
    return teams.map(t => {
      const teamVersions = versions.filter(v => v.teamId === t.id && v.syncStatus !== 'error');
      
      let timeToFirstValue = '—';
      if (workshop.round2StartedAt) {
        const v1 = teamVersions.find(v => v.versionNumber === 1);
        if (v1) {
          const diffMs = v1.completedAt - workshop.round2StartedAt;
          const diffSec = Math.floor(diffMs / 1000);
          timeToFirstValue = `${Math.floor(diffSec / 60)}分${diffSec % 60}秒`;
        }
      }

      const versionsDone = teamVersions.length;

      let avgCycleTime = '—';
      if (teamVersions.length > 0) {
        let totalCycleTimeMs = 0;
        let validCyclesCount = 0;
        const sortedVersions = [...teamVersions].sort((a, b) => a.versionNumber - b.versionNumber);

        sortedVersions.forEach((v) => {
          let cycleStart = workshop.round2StartedAt || 0;
          if (v.versionNumber > 1) {
            const prev = sortedVersions.find(p => p.versionNumber === v.versionNumber - 1);
            if (prev) {
              cycleStart = prev.completedAt;
            }
          }
          if (cycleStart > 0) {
            totalCycleTimeMs += (v.completedAt - cycleStart);
            validCyclesCount++;
          }
        });

        if (validCyclesCount > 0) {
          const avgSec = Math.round((totalCycleTimeMs / validCyclesCount) / 1000);
          avgCycleTime = `${Math.floor(avgSec / 60)}分${avgSec % 60}秒`;
        }
      }

      return {
        name: t.name,
        timeToFirstValue,
        versionsDone,
        avgCycleTime
      };
    });
  };

  const dashboardData = calculateDashboardMetrics();

  const getSelectedTeamHistory = () => {
    const team = teams.find(t => t.id === selectedTeamId);
    if (!team) return [];
    
    const teamVersions = versions
      .filter(v => v.teamId === selectedTeamId)
      .sort((a, b) => a.versionNumber - b.versionNumber);

    return teamVersions.map((v) => {
      const start = v.versionNumber === 1 
        ? (workshop.round2StartedAt || v.createdAt) 
        : (teamVersions.find(p => p.versionNumber === v.versionNumber - 1)?.completedAt || v.createdAt);
      
      const cycleSec = Math.round((v.completedAt - start) / 1000);
      const cycleLabel = `${Math.floor(cycleSec / 60)}分${cycleSec % 60}秒`;

      return {
        version: v.versionNumber,
        change: v.changeRecord,
        timeLabel: new Date(v.completedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cycleLabel
      };
    });
  };

  const selectedTeamHistory = getSelectedTeamHistory();

  const joinUrl = `${window.location.origin}${window.location.pathname}?wsId=${workshopId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(joinUrl)}`;

  const materialImgUrl = '/assets/workshop/material.jpg';
  const outcomeImgUrl = '/assets/workshop/outcome.png';

  const renderScreenContent = () => {
    switch (workshop.currentProjectionScreen) {
      case 'P01':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '55vh', textAlign: 'center' }}>
            <span style={{ fontSize: '6rem', marginBottom: '1.5rem' }}>🍡</span>
            <h1 style={{ fontSize: '4.5rem', color: 'var(--accent)', fontWeight: 800, margin: 0 }}>
              棉花糖敏捷挑戰工作坊
            </h1>
            <p style={{ fontSize: '1.8rem', color: 'rgba(255, 255, 255, 0.7)', marginTop: '1.5rem' }}>
              歡迎來到敏捷體驗式教學！請等待講師引導開始挑戰...
            </p>
          </div>
        );

      case 'P02':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem', width: '100%', alignItems: 'start' }}>
            {/* Left side: Rules */}
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '3.2rem', color: 'var(--accent)', marginBottom: '2.5rem' }}>
                THE MARSHMALLOW CHALLENGE
              </h1>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 600, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '2.2rem' }}>①</span>
                  <span>使用提供的材料，建造一個「最高」的獨立結構。</span>
                </div>
                {isRevealed(1) && (
                  <div style={{ fontSize: '1.8rem', fontWeight: 600, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent)', fontSize: '2.2rem' }}>②</span>
                    <span>完整的棉花糖必須放在結構最高處。</span>
                  </div>
                )}
                {isRevealed(2) && (
                  <div style={{ fontSize: '1.8rem', fontWeight: 600, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span style={{ color: 'var(--accent)', fontSize: '2.2rem' }}>③</span>
                    <span>結構最後必須能夠自行站立。</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Registration & QR Code */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: '1.4rem', color: 'var(--accent)', marginBottom: '1rem', fontWeight: 700 }}>📱 掃描 QR Code 加入挑戰</h3>
              <div style={{ display: 'inline-block', background: '#fff', padding: '0.75rem', borderRadius: '12px', marginBottom: '1rem', boxShadow: 'var(--shadow-md)' }}>
                <img src={qrUrl} alt="QR Code Link" width="160" height="160" style={{ display: 'block' }} />
              </div>
              <div style={{ fontSize: '0.95rem', opacity: 0.7, marginBottom: '0.25rem' }}>網址輸入代碼：</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', letterSpacing: '0.05em', margin: '0.15rem 0 1rem' }}>{workshop.joinCode}</div>
              
              {/* Joined teams list */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                  <span>已加入的團隊</span>
                  <span style={{ color: 'var(--accent)' }}>{teams.length} 組</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', maxHeight: '150px', overflowY: 'auto' }}>
                  {teams.map((t) => (
                    <span key={t.id} style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {t.name}
                    </span>
                  ))}
                  {teams.length === 0 && (
                    <span style={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: '0.9rem' }}>等待團隊註冊中...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'P03':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '4rem', width: '100%', alignItems: 'center' }}>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '3.2rem', color: 'var(--accent)', marginBottom: '2.5rem' }}>可用材料與工具</h1>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div>
                  <h3 style={{ color: 'var(--accent)', fontSize: '1.8rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>材料：</h3>
                  <ul style={{ fontSize: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1.5rem', margin: 0 }}>
                    <li>義大利麵 x 20</li>
                    <li>膠帶 x 100 cm</li>
                    <li>棉線 x 100 cm</li>
                    <li>棉花糖 x 1</li>
                  </ul>
                </div>
                <div>
                  <h3 style={{ color: 'var(--accent)', fontSize: '1.8rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>工具：</h3>
                  <ul style={{ fontSize: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingLeft: '1.5rem', margin: 0 }}>
                    <li>剪刀 x 1</li>
                    <li>紙張 x 1疊</li>
                    <li>簽字筆 x 1</li>
                  </ul>
                </div>
              </div>

            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <img 
                src={materialImgUrl} 
                alt="Materials" 
                style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }} 
              />
            </div>
          </div>
        );

      case 'P04':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', opacity: 0.7 }}>我們的目標</h2>
            <h1 style={{ fontSize: '5.5rem', color: 'var(--accent)', margin: '1rem 0 2rem' }}>建造最高的獨立結構</h1>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', padding: '2.5rem 5rem', borderRadius: '20px', display: 'inline-block' }}>
              <div style={{ fontSize: '1.5rem', opacity: 0.6 }}>挑戰時間</div>
              <div style={{ fontSize: '5rem', fontWeight: 800, color: '#fff' }}>6 分鐘</div>
            </div>
          </div>
        );

      case 'P05':
        return (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '3.5rem', opacity: 0.8, letterSpacing: '0.1em' }}>MARSHMALLOW CHALLENGE</h1>
            <div className={`timer-huge ${timeLeft <= 30 ? 'frozen' : ''}`}>{formatTime(timeLeft)}</div>
            <h2 style={{ fontSize: '2.8rem', color: 'var(--accent)' }}>建立最高的獨立結構</h2>
          </div>
        );

      case 'P06':
        return (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '8rem', color: 'var(--error)', fontWeight: 900, letterSpacing: '0.05em', margin: '0 0 2rem 0' }}>STOP</h1>
            <h2 style={{ fontSize: '4rem', fontWeight: 700, color: '#fff' }}>手放開，停止所有動作。</h2>
          </div>
        );

      case 'P07':
        const r1WorkingCount = getRound1EvidenceCount();
        return (
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
            <h1 style={{ fontSize: '3.2rem', marginBottom: '2.5rem' }}>現在有多少組，已經有一個真正可以使用的產品？</h1>
            {isRevealed(1) ? (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '2.5rem', borderRadius: '24px', display: 'inline-block', width: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem', alignItems: 'center' }}>
                  <div style={{ textAlign: 'left' }}>
                    <h2 style={{ fontSize: '2.2rem', color: 'var(--accent)', marginBottom: '1.5rem' }}>
                      符合合格定義：可以自行站立 + 棉花糖位於頂端
                    </h2>
                    <div style={{ fontSize: '6rem', fontWeight: 800, color: '#fff' }}>
                      {r1WorkingCount} <span style={{ fontSize: '2.5rem', fontWeight: 500, opacity: 0.5 }}>/ {teams.length} 組</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <img 
                      src={outcomeImgUrl} 
                      alt="Outcome Example" 
                      style={{ maxWidth: '100%', maxHeight: '35vh', borderRadius: '12px', boxShadow: 'var(--shadow-md)' }} 
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2.5rem 4rem', borderRadius: '16px', display: 'inline-block', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.25rem', fontSize: '1.4rem' }}>登記第一輪合格產品組數：</h3>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    max={teams.length}
                    value={round1Evidence}
                    onChange={(e) => setRound1Evidence(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '0.6rem 1rem', fontSize: '1.6rem', width: '100px', borderRadius: '8px', textAlign: 'center', outline: 'none' }}
                  />
                  <button 
                    className="btn btn-accent" 
                    style={{ padding: '0.8rem 1.8rem', fontSize: '1.1rem' }}
                    onClick={handleSaveRound1Evidence}
                  >
                    確認登記並顯示
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'P08':
        return (
          <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'left' }}>
            <h1 style={{ fontSize: '3.5rem', color: 'var(--accent)', marginBottom: '2rem', textAlign: 'center' }}>剛才六分鐘，你們在做什麼？</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 600, padding: '1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                如果還沒有 Working Product：
                <div style={{ fontSize: '1.3rem', color: 'rgba(255,255,255,0.5)', marginTop: '1rem', lineHeight: 1.6 }}>
                  我們是否有產出任何價值？還是把時間花在了計畫與零件的製作？
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {isRevealed(1) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
                    {['討論', '規劃', '設計', '分工', '製作零件', '嘗試不同方法'].map((s, idx) => (
                      <span key={idx} style={{ fontSize: '1.4rem', fontWeight: 600, padding: '0.6rem 1.2rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'P09':
        return (
          <div style={{ maxWidth: '950px', textAlign: 'left' }}>
            <h1 style={{ fontSize: '3.8rem', color: 'var(--accent)', marginBottom: '3rem', textAlign: 'center' }}>忙碌 vs 進度</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>1. Everyone was busy. (每個人都很忙碌)</div>
              {isRevealed(1) && <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>2. But did we have a product? (但我們有產品嗎？)</div>}
              {isRevealed(2) && <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--error)' }}>3. Activity ≠ Progress (忙碌不等於進度)</div>}
              {isRevealed(3) && <div style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--success)' }}>4. Working Product = Evidence of Progress (可工作產品才是進度唯一的實證)</div>}
            </div>
          </div>
        );

      case 'P10':
        return (
          <div style={{ width: '100%', maxWidth: '1000px' }}>
            <h1 style={{ fontSize: '3.2rem', color: 'var(--accent)', marginBottom: '3rem' }}>大爆炸式開發 (Big-Bang Development)</h1>
            
            <div className="process-visualizer">
              <div className="process-step">PLAN</div>
              <span className="process-arrow">➔</span>
              <div className="process-step">DESIGN</div>
              <span className="process-arrow">➔</span>
              <div className="process-step">BUILD</div>
              <span className="process-arrow">➔</span>
              <div className="process-step">INTEGRATE</div>
              <span className="process-arrow">➔</span>
              <div className="process-step">TEST</div>
            </div>

            {isRevealed(1) && (
              <div style={{ marginTop: '3rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '2rem', borderRadius: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '2rem' }}>如果最後一刻才發現站不起來呢？</h2>
                <p style={{ margin: '1rem 0 0 0', fontSize: '1.3rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  這就是傳統瀑布流的最大風險：將所有的整合與驗證風險，延遲到專案的最後一刻。
                </p>
              </div>
            )}
          </div>
        );

      case 'P11':
        return (
          <div style={{ width: '100%', maxWidth: '1000px' }}>
            <h1 style={{ fontSize: '3.2rem', color: 'var(--accent)', marginBottom: '3rem' }}>迭代式開發 (Iterative Development)</h1>
            
            <div className="process-visualizer">
              <div className="process-step active-step">V1 (MVP)</div>
              <span className="process-arrow">➔</span>
              <div className="process-step active-step">V2</div>
              <span className="process-arrow">➔</span>
              <div className="process-step active-step">V3</div>
              <span className="process-arrow">➔</span>
              <div className="process-step active-step">V4</div>
              <span className="process-arrow">➔</span>
              <div className="process-step active-step">V5</div>
            </div>
            
            <div style={{ marginTop: '2.5rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--success)', padding: '2rem', borderRadius: '12px' }}>
              <h2 style={{ color: 'var(--success)', fontSize: '2.2rem', margin: 0 }}>
                先做出最簡單能用的版本，再一步一步讓它變得更好。
              </h2>
            </div>
          </div>
        );

      case 'P12':
        return (
          <div style={{ maxWidth: '850px', textAlign: 'left' }}>
            <h1 style={{ fontSize: '3.8rem', color: 'var(--accent)', marginBottom: '3rem', textAlign: 'center' }}>第二輪挑戰規則</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>1. 第一輪你們有 6 分鐘。</div>
              {isRevealed(1) && <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>2. 第二輪......</div>}
              {isRevealed(2) && <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--accent)' }}>3. 只有 10 分鐘！</div>}
              {isRevealed(3) && <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--success)' }}>4. But the rules have changed. (但是工作規則改變了)</div>}
            </div>
          </div>
        );

      case 'P13':
        return (
          <div style={{ maxWidth: '900px', textAlign: 'left' }}>
            <h1 style={{ fontSize: '3.5rem', color: 'var(--accent)', marginBottom: '3rem', textAlign: 'center' }}>全新的工作系統</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 600, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent)', fontSize: '2.5rem' }}>①</span>
                <span>這一次，你們的目標不是一次做到最後。</span>
              </div>
              {isRevealed(1) && (
                <div style={{ fontSize: '2.2rem', fontWeight: 600, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '2.5rem' }}>②</span>
                  <span>市場會持續提出新的要求。</span>
                </div>
              )}
              {isRevealed(2) && (
                <div style={{ fontSize: '2.2rem', fontWeight: 600, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: 'var(--accent)', fontSize: '2.5rem' }}>③</span>
                  <span>每完成一個版本，才會收到下一個需求。</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'P14':
        return (
          <div style={{ maxWidth: '900px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '3.2rem', color: 'var(--accent)', marginBottom: '2.5rem' }}>何謂「完成的定義 (Definition of Done)」？</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '16px' }}>
                <h3 style={{ color: 'var(--accent)', fontSize: '1.6rem' }}>1. Product Works</h3>
                <p style={{ fontSize: '1.25rem', margin: '0.5rem 0 0 0' }}>符合本關的 Acceptance Criteria (驗收條件)</p>
              </div>
              {isRevealed(1) && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '16px' }}>
                  <h3 style={{ color: 'var(--accent)', fontSize: '1.6rem' }}>2. Document Completed</h3>
                  <p style={{ fontSize: '1.25rem', margin: '0.5rem 0 0 0' }}>完成這一版的 Version Record 記錄檔案</p>
                </div>
              )}
            </div>
            {isRevealed(2) && (
              <h2 style={{ fontSize: '2.5rem', color: 'var(--success)', marginTop: '2rem' }}>
                「Done」才能取得下一個挑戰！
              </h2>
            )}
          </div>
        );

      case 'P15':
        return (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', opacity: 0.7 }}>第二輪市場挑戰</h2>
            <h1 style={{ fontSize: '5.5rem', color: 'var(--accent)', margin: '1rem 0 2rem' }}>RESPOND TO THE MARKET</h1>
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed rgba(255,255,255,0.2)', padding: '2.5rem 5rem', borderRadius: '20px', display: 'inline-block' }}>
              <div style={{ fontSize: '1.5rem', opacity: 0.6 }}>挑戰時間</div>
              <div style={{ fontSize: '5rem', fontWeight: 800, color: '#fff' }}>10 分鐘</div>
            </div>
          </div>
        );

      case 'P16':
        const activeTeamCount = teams.filter(t => Date.now() - t.lastSeenAt < 15000).length;
        const totalVersionsDone = versions.filter(v => v.syncStatus !== 'error').length;
        
        const versionDistribution = Array(11).fill(0);
        teams.forEach(t => {
          const seq = t.currentChallengeSequence;
          if (seq >= 1 && seq <= 10) {
            versionDistribution[seq]++;
          }
        });

        return (
          <div style={{ width: '100%', maxWidth: '1000px' }}>
            <h1 style={{ fontSize: '3rem', opacity: 0.8 }}>RESPOND TO THE MARKET</h1>
            <div className={`timer-huge ${timeLeft <= 30 ? 'frozen' : ''}`}>{formatTime(timeLeft)}</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', justifyContent: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '1.1rem', opacity: 0.6 }}>目前連線團隊</div>
                  <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--accent)' }}>{activeTeamCount} / {teams.length}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem 2rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '1.1rem', opacity: 0.6 }}>已交付版本總數</div>
                  <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--success)' }}>{totalVersionsDone}</div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'left' }}>
                <h3 style={{ color: 'var(--accent)', fontSize: '1.4rem', marginBottom: '1.5rem' }}>團隊進度分佈</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => {
                    const count = versionDistribution[v];
                    const barPercent = teams.length > 0 ? (count / teams.length) * 100 : 0;
                    return (
                      <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ minWidth: '40px', fontWeight: 'bold' }}>C{v}</span>
                        <div style={{ flex: 1, height: '14px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                          <div style={{ width: `${barPercent}%`, height: '100%', background: 'var(--accent)', borderRadius: '9999px', transition: 'width 0.5s ease' }}></div>
                        </div>
                        <span style={{ minWidth: '30px', textAlign: 'right', fontWeight: 'bold', color: count > 0 ? 'var(--accent)' : 'inherit' }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'P17':
        return (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '8rem', color: 'var(--error)', fontWeight: 900, letterSpacing: '0.05em', margin: '0 0 2rem 0' }}>STOP</h1>
            <h2 style={{ fontSize: '4rem', fontWeight: 700, color: '#fff' }}>手放開，停止所有動作。</h2>
          </div>
        );

      case 'P18':
        return (
          <div style={{ maxWidth: '900px', textAlign: 'left' }}>
            <h1 style={{ fontSize: '3.5rem', color: 'var(--accent)', marginBottom: '3rem', textAlign: 'center' }}>第二輪挑戰回顧</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>• 第一輪時間比較寬裕 (6 分鐘)。</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>• 第二輪時間更少 (10 分鐘，共 10 大市場挑戰)。</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent)', marginTop: '1rem' }}>
                這一次，你們做出了什麼樣的產品演進？結果發生了什麼改變？
              </div>
            </div>
          </div>
        );

      case 'P19':
        return (
          <div style={{ width: '100%', maxWidth: '1100px' }}>
            <h1 style={{ fontSize: '3.2rem', color: 'var(--accent)', marginBottom: '1rem' }}>工作坊數據儀表板 (Live Results)</h1>
            <p style={{ fontSize: '1.2rem', opacity: 0.6, marginBottom: '2rem' }}>
              這份數據展示了各組在面對頻繁需求變更時的交付效能指標，不代表團隊間的排名。
            </p>
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>團隊名稱</th>
                  <th>Time to First Value (首個價值交付時間)</th>
                  <th>Versions Done (交付版本數量)</th>
                  <th>Avg Cycle Time (平均週期時間)</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.map((d, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 'bold' }}>{d.name}</td>
                    <td>{d.timeToFirstValue}</td>
                    <td style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{d.versionsDone}</td>
                    <td>{d.avgCycleTime}</td>
                  </tr>
                ))}
                {dashboardData.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '3rem' }}>
                      無團隊數據紀錄。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'P20':
        return (
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '4.5rem', color: 'var(--accent)', marginBottom: '2rem' }}>
              哪個團隊最成功？
            </h1>
            <p style={{ fontSize: '2rem', maxWidth: '800px', margin: '0 auto', lineHeight: 1.6 }}>
              是做出最高結構的團隊？是交付版本最多的團隊？還是材料耗費最省的團隊？<br />
              我們該如何定義「成功」？
            </p>
          </div>
        );

      case 'P21':
        return (
          <div style={{ maxWidth: '900px', textAlign: 'left' }}>
            <h1 style={{ fontSize: '3.2rem', color: 'var(--accent)', marginBottom: '3rem', textAlign: 'center' }}>傳統專案思維 (Project Thinking)</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>• On Scope (符合原定範疇)</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>• On Time (準時完工)</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>• On Budget (預算內完成)</div>
            </div>
            {isRevealed(1) && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', padding: '2rem', borderRadius: '12px' }}>
                <h2 style={{ margin: 0, fontSize: '2rem' }}>如果這就是成功，團隊會產生什麼行為？</h2>
                <p style={{ margin: '1rem 0 0 0', fontSize: '1.3rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  團隊會想盡辦法吃滿所有時間、延遲對外發佈與驗證、並死守合約範疇，忽略市場的實際需求改變。
                </p>
              </div>
            )}
          </div>
        );

      case 'P22':
        return (
          <div style={{ maxWidth: '950px', textAlign: 'left' }}>
            <h1 style={{ fontSize: '3.2rem', color: 'var(--accent)', marginBottom: '2.5rem', textAlign: 'center' }}>產品思維 (Product Thinking)</h1>
            <h2 style={{ fontSize: '2.2rem', color: '#fff', marginBottom: '2rem', textAlign: 'center' }}>
              我們多快能把真正的市場需求，轉化成可以使用的產品？
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {[
                { title: 'Time to First Value', desc: '我們需要花多少時間，才能為市場帶來第一個基本價值 (MVP)？' },
                { title: 'Feedback Cycles', desc: '在固定時間內，我們能獲得多少次來自客戶/市場的真實驗證回饋？' },
                { title: 'Cycle Time', desc: '從收到新需求開始，到我們再次交付可用新版本，平均需要多久？' },
                { title: 'Resource Efficiency', desc: '我們能用多省的材料或資源，創造出相同的可用度與客戶價值？' }
              ].map((m, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ color: 'var(--accent)', fontSize: '1.4rem', margin: '0 0 0.5rem 0' }}>{m.title}</h3>
                  <p style={{ margin: 0, fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)' }}>{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'P23':
        return (
          <div className="manifesto-layout">
            <div className="manifesto-left">
              <img src="/assets/workshop/manifesto1.png" alt="Manifesto 1" />
            </div>
            <div className="manifesto-right">
              <h2>Individuals and interactions<br />over processes and tools</h2>
              <div className="manifesto-prompt">
                第一輪每個人都很忙，為什麼有些團隊仍然沒有產品？
              </div>
              {isRevealed(1) && (
                <div className="manifesto-reveal-item" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                  分工不等於協作。
                </div>
              )}
              {isRevealed(2) && (
                <div className="manifesto-reveal-item">
                  團隊真正的能力，是快速形成共識、整合工作、解決問題並共同交付成果。
                </div>
              )}
            </div>
          </div>
        );

      case 'P24':
        return (
          <div className="manifesto-layout">
            <div className="manifesto-left">
              <img src="/assets/workshop/manifesto2.png" alt="Manifesto 2" />
            </div>
            <div className="manifesto-right">
              <h2>Working software<br />over comprehensive documentation</h2>
              <div className="manifesto-prompt">
                我們剛才怎麼衡量真正的進展？
              </div>
              {isRevealed(1) && (
                <div className="manifesto-reveal-item" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                  我們沒有問：「計畫完成幾％？」
                </div>
              )}
              {isRevealed(2) && (
                <div className="manifesto-reveal-item">
                  我們一直問：「你們現在交到第幾版？」<br />
                  <strong style={{ color: 'var(--accent)' }}>Working Product is the primary evidence of progress.</strong>
                </div>
              )}
            </div>
          </div>
        );

      case 'P25':
        return (
          <div className="manifesto-layout">
            <div className="manifesto-left" style={{ flexDirection: 'column', justifyContent: 'flex-start', background: 'rgba(255,255,255,0.02)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
              <h3 style={{ color: 'var(--accent)', margin: '0 0 1rem 0', alignSelf: 'flex-start' }}>選擇團隊歷程</h3>
              <select 
                className="team-select-dropdown" 
                value={selectedTeamId} 
                onChange={(e) => setSelectedTeamId(e.target.value)}
                style={{ width: '100%' }}
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              
              <div className="team-history-container">
                {selectedTeamHistory.map((h) => (
                  <div key={h.version} className="team-history-card">
                    <div className="team-history-version">V{h.version}</div>
                    <div className="team-history-content">
                      <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{h.change}</div>
                      <div className="team-history-meta">
                        <span>時間：{h.timeLabel}</span>
                        <span>週期：{h.cycleLabel}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedTeamHistory.length === 0 && (
                  <div style={{ textAlign: 'center', opacity: 0.4, padding: '2rem 0' }}>該組無版本紀錄</div>
                )}
              </div>
            </div>
            
            <div className="manifesto-right">
              <h2>Document Late (延遲填寫必要文件)</h2>
              <div className="manifesto-prompt">
                你們在活動開始前，有可能準確寫出這份文件嗎？
              </div>
              {isRevealed(1) && (
                <div className="manifesto-reveal-item" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                  在最接近事實形成、資訊較充分的時間點，完成必要文件。
                </div>
              )}
              {isRevealed(2) && (
                <div className="manifesto-reveal-item">
                  流程：Build ➔ Validate ➔ Document ➔ Done<br />
                  <strong style={{ color: 'var(--success)' }}>Documentation is part of Done. (文件是完成的一部份)</strong>
                </div>
              )}
            </div>
          </div>
        );

      case 'P26':
        return (
          <div className="manifesto-layout">
            <div className="manifesto-left">
              <img src="/assets/workshop/manifesto3.png" alt="Manifesto 3" />
            </div>
            <div className="manifesto-right">
              <h2>Customer collaboration<br />over contract negotiation</h2>
              <div className="manifesto-prompt">
                為什麼我們沒有一開始就把十大挑戰全部給你？
              </div>
              {isRevealed(1) && (
                <div className="manifesto-reveal-item" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                  產品做出來之後，市場（客戶）才會產生新的回饋與需求。
                </div>
              )}
              {isRevealed(2) && (
                <div className="manifesto-reveal-item">
                  需求透過產品與客戶的持續互動逐步被理解。<br />
                  <strong>Product ➔ Feedback ➔ Conversation ➔ Next Version ➔ ↻</strong>
                </div>
              )}
            </div>
          </div>
        );

      case 'P27':
        return (
          <div className="manifesto-layout">
            <div className="manifesto-left">
              <img src="/assets/workshop/manifesto4.png" alt="Manifesto 4" />
            </div>
            <div className="manifesto-right">
              <h2>Responding to change<br />over following a plan</h2>
              <div className="manifesto-prompt">
                市場提出新要求之後，你們團隊多快能交出下一個可用版本？
              </div>
              {isRevealed(1) && (
                <div className="manifesto-reveal-item" style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
                  The ability to respond is a competitive advantage.<br />
                  (響應變化的能力是核心競爭優勢。)
                </div>
              )}
            </div>
          </div>
        );

      case 'P28':
        return (
          <div style={{ maxWidth: '950px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '3.2rem', color: 'var(--accent)', marginBottom: '3rem' }}>敏捷價值交付循環 (Value Delivery Loop)</h1>
            
            <div className="process-visualizer" style={{ marginBottom: '3rem' }}>
              <div className="process-step">協作 (Collaborate)</div>
              <span className="process-arrow">➔</span>
              <div className="process-step">交付 (Deliver)</div>
              <span className="process-arrow">➔</span>
              <div className="process-step">學習 (Learn)</div>
              <span className="process-arrow">➔</span>
              <div className="process-step">調整 (Adapt)</div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '2rem', borderRadius: '16px', display: 'inline-block' }}>
              <h2 style={{ color: 'var(--accent)', margin: 0, fontSize: '2.2rem' }}>
                敏捷的核心能力，是縮短從需求、交付、學習到調整的循環。
              </h2>
            </div>
          </div>
        );

      case 'P29':
        return (
          <div style={{ maxWidth: '900px', textAlign: 'left', margin: '0 auto' }}>
            <h1 style={{ fontSize: '3.5rem', color: 'var(--accent)', marginBottom: '3.5rem', textAlign: 'center' }}>明天回到工作現場：</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>
                1. 我們多久才會產生第一個真正可用的成果？ (Time to Value)
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>
                2. 我們如何知道自己真的有進展？ (Evidence of Progress)
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 600 }}>
                3. 市場改變之後，我們多久能交出下一個版本？ (Responding to Change)
              </div>
            </div>
          </div>
        );

      default:
        return <div>Unknown Screen</div>;
    }
  };

  const isTimerActive = workshop.status === 'ROUND_1_ACTIVE' || workshop.status === 'ROUND_2_ACTIVE';
  const isTimerPaused = (workshop.status === 'ROUND_1_ACTIVE' && workshop.round1PausedAt) ||
                       (workshop.status === 'ROUND_2_ACTIVE' && workshop.round2PausedAt);

  return (
    <div className="role-container projection-view" style={{ paddingBottom: '7.5rem' }}>
      <div className="projection-header">
        <div className="projection-title" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>國泰金控 敏捷挑戰工作坊</span>
          <span style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.15)', color: 'var(--accent)', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
            {workshop.status}
          </span>
        </div>
        <div style={{ fontSize: '1.2rem', opacity: 0.6 }}>
          {currentScreen.title}
        </div>
      </div>

      <div className="projection-content">
        {renderScreenContent()}
      </div>

      <div className="projection-footer">
        <div>
          專案代碼：<strong>{workshop.joinCode}</strong> | 學員連結：{joinUrl}
        </div>
        <div>
          AGILE TALKS © 2026 | 按「M」鍵開合團隊監控抽屜
        </div>
      </div>

      {/* ==========================================================================
         PRESENTER BOTTOM CONTROLLER BAR (Subtle, slides up on hover)
         ========================================================================== */}
      <div className="presenter-bottom-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', justifyContent: 'space-between', width: '100%' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              className="btn btn-outline btn-control-sm"
              onClick={handlePrev}
              disabled={currentScreenIdx === 0 && workshop.currentRevealIndex === 0}
              title="上一步 (鍵盤 左方向鍵)"
            >
              ◀ Prev
            </button>
            <span style={{ fontSize: '0.9rem', minWidth: '80px', textAlign: 'center', color: '#fff', fontWeight: 600 }}>
              {currentScreen.id} ({workshop.currentRevealIndex}/{currentScreen.maxReveal})
            </span>
            <button 
              className="btn btn-accent btn-control-sm"
              onClick={handleNext}
              disabled={currentScreenIdx === PROJECTION_SCREENS.length - 1 && workshop.currentRevealIndex === currentScreen.maxReveal}
              title="下一步 (鍵盤 右方向鍵)"
            >
              Next ▶
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>快速跳轉：</span>
            <select
              className="presenter-select"
              value={workshop.currentProjectionScreen}
              onChange={(e) => handleJumpToScreen(e.target.value)}
            >
              {PROJECTION_SCREENS.map(s => (
                <option key={s.id} value={s.id}>{s.id} - {s.title.substring(0, 15)}...</option>
              ))}
            </select>
          </div>

          {isTimerActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold', color: 'var(--accent)', fontSize: '1.15rem' }}>
                ⏱ {formatTime(timeLeft)}
              </span>
              <button className="btn btn-outline btn-control-sm" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }} onClick={toggleTimer}>
                {isTimerPaused ? '啟動' : '暫停'}
              </button>
              <button className="btn btn-danger btn-control-sm" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', background: 'var(--error)' }} onClick={endRoundEarly}>
                結束
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className={`btn btn-outline btn-control-sm ${isDrawerOpen ? 'active-control' : ''}`}
              onClick={() => setIsDrawerOpen(prev => !prev)}
              title="開合團隊監控面板 (鍵盤 M 鍵)"
            >
              📊 團隊監控 {isDrawerOpen ? '▲' : '▼'}
            </button>
            <button 
              className="btn btn-outline btn-control-sm btn-danger-hover" 
              onClick={handleResetWorkshop}
              disabled={isResetting}
              title="重設工作坊所有數據"
            >
              ↻ 重設
            </button>
          </div>

        </div>
      </div>

      {/* ==========================================================================
         PRESENTER RIGHT MONITOR DRAWER (Slides in from right)
         ========================================================================== */}
      <div className={`presenter-right-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
          <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '1.15rem' }}>📊 團隊即時狀態監控</h3>
          <button 
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '1.25rem', cursor: 'pointer' }}
            onClick={() => setIsDrawerOpen(false)}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: 'calc(100vh - 120px)' }}>
          {teams.map((t) => {
            const teamVersions = versions.filter(v => v.teamId === t.id && v.syncStatus !== 'error');
            const isOnline = Date.now() - t.lastSeenAt < 15000;
            const isStale = Date.now() - t.lastSeenAt >= 15000 && Date.now() - t.lastSeenAt < 60000;

            return (
              <div key={t.id} className="drawer-team-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{t.name}</span>
                  {isOnline ? (
                    <span className="indicator indicator-online">● 連線中</span>
                  ) : isStale ? (
                    <span className="indicator indicator-stale">● 離線</span>
                  ) : (
                    <span className="indicator indicator-offline">● 斷線</span>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '0.5rem' }}>
                  <span>關卡：<strong>{t.currentChallengeSequence} / 10</strong></span>
                  <span>已交付：<strong>{teamVersions.length} 版</strong></span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.25rem' }}>
                  記錄員：{t.recorderName}
                </div>
              </div>
            );
          })}
          {teams.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', fontSize: '0.9rem' }}>
              尚未有團隊登記加入...
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
