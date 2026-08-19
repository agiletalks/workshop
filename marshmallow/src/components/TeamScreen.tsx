import React, { useState, useEffect } from 'react';
import {
  subscribeToWorkshop,
  subscribeToTeams,
  subscribeToVersions,
  joinTeam,
  submitVersionRecord,
  updateTeamR1Activities
} from '../services/syncService';
import { challengesData } from '../data/challengesData';
import type { Workshop, Team, TeamVersion } from '../types';

interface TeamScreenProps {
  workshopId: string;
}

export const TeamScreen: React.FC<TeamScreenProps> = ({ workshopId }) => {
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [versions, setVersions] = useState<TeamVersion[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Registration fields
  const [teamName, setTeamName] = useState<string>('');
  const [recorderName, setRecorderName] = useState<string>('');
  const [inputJoinCode, setInputJoinCode] = useState<string>('');
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Active challenge state (T05 vs T06 vs T07)
  const [screenState, setScreenState] = useState<'T05' | 'T06' | 'T07'>('T05');

  // Form fields for Version Record (T06)
  const [criteriaChecked, setCriteriaChecked] = useState<Record<number, boolean>>({});
  const [validationConfirmed, setValidationConfirmed] = useState<boolean>(false);
  const [changeRecord, setChangeRecord] = useState<string>('');

  // Active countdown timer
  const [timeLeft, setTimeLeft] = useState<number>(0);
  
  // Online/Offline tracking
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Tag cloud input states
  const [r1Activities, setR1Activities] = useState<string[]>([]);
  const [customActivity, setCustomActivity] = useState<string>('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to real-time sync data
  useEffect(() => {
    const unsubWS = subscribeToWorkshop(workshopId, setWorkshop);
    const unsubTeams = subscribeToTeams(workshopId, setTeams);
    const unsubVersions = subscribeToVersions(workshopId, setVersions);

    // Restore team session if saved locally
    const savedTeamId = localStorage.getItem(`ws_${workshopId}_teamId`);
    if (savedTeamId) {
      // Fetch latest team info
      const DB_NAME = 'marshmallow_workshop_db';
      const req = indexedDB.open(DB_NAME);
      req.onsuccess = (e) => {
        const idb = (e.target as any).result;
        const tx = idb.transaction('teams', 'readonly');
        tx.objectStore('teams').get(savedTeamId).then((t: Team | undefined) => {
          if (t) {
            setTeam(t);
          }
        });
      };
    }

    return () => {
      unsubWS();
      unsubTeams();
      unsubVersions();
    };
  }, [workshopId]);

  // Sync active team state with teams collection
  useEffect(() => {
    if (team) {
      const updated = teams.find(t => t.id === team.id);
      if (updated) {
        setTeam(updated);
      }
    }
  }, [teams, team?.id]);

  // Sync local activities input state with latest team data
  useEffect(() => {
    if (team?.r1Activities) {
      setR1Activities(team.r1Activities);
    } else {
      setR1Activities([]);
    }
  }, [team?.r1Activities]);

  // Synchronized Timer for Team screen
  useEffect(() => {
    if (!workshop) return;

    const isRound1 = workshop.status === 'ROUND_1_ACTIVE';
    const isRound2 = workshop.status === 'ROUND_2_ACTIVE';

    if (!isRound1 && !isRound2) {
      setTimeLeft(0);
      return;
    }

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
      } else {
        setTimeLeft(totalSec);
      }
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 500);
    return () => clearInterval(intervalId);
  }, [workshop]);

  if (!workshop) {
    return (
      <div className="role-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>讀取中...</h2>
      </div>
    );
  }

  // Handle Team Register (T01)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputJoinCode.trim() || inputJoinCode.length !== 4) {
      alert('請輸入 4 位專案代碼。');
      return;
    }
    if (!workshop) {
      alert('正在讀取工作坊資訊，請稍候重試。');
      return;
    }
    if (inputJoinCode.toUpperCase() !== workshop.joinCode) {
      alert('專案代碼錯誤，請確認投影大螢幕上顯示的大寫四位字母！');
      return;
    }
    if (!teamName.trim() || !recorderName.trim()) {
      alert('請填寫完整團隊名稱與記錄員姓名。');
      return;
    }

    setIsJoining(true);
    try {
      const newTeam = await joinTeam(workshopId, teamName, recorderName);
      setTeam(newTeam);
      localStorage.setItem(`ws_${workshopId}_teamId`, newTeam.id);
    } catch (e) {
      console.error(e);
      alert('加入失敗，請重試。');
    } finally {
      setIsJoining(false);
    }
  };

  // Determine current challenge active for the team
  const currentSeq = team ? team.currentChallengeSequence : 1;
  const currentChallenge = challengesData.find(c => c.sequence === currentSeq);
  const teamVersions = team ? versions.filter(v => v.teamId === team.id) : [];

  // Submit Version Record (T06)
  const handleSubmitVersion = async () => {
    if (!team || !currentChallenge) return;

    // Validation checks
    const allChecked = currentChallenge.acceptanceCriteria.every((_, idx) => criteriaChecked[idx]);
    if (!allChecked || !validationConfirmed || !changeRecord.trim()) {
      alert('請先確認符合所有驗收條件，並填寫改變紀錄。');
      return;
    }

    // Capture start timestamp
    // For Challenge 1, start timestamp is the Round 2 startedAt time.
    // For Challenge N (N > 1), start timestamp is the completedAt of Version N-1.
    let challengeStartedAt = workshop.round2StartedAt || Date.now();
    if (currentSeq > 1) {
      const prevVer = teamVersions.find(v => v.versionNumber === currentSeq - 1);
      if (prevVer) {
        challengeStartedAt = prevVer.completedAt;
      }
    }

    try {
      await submitVersionRecord(
        team,
        currentChallenge.id,
        currentSeq,
        challengeStartedAt,
        changeRecord,
        validationConfirmed
      );

      // Instantly transition to T07 Done page
      setScreenState('T07');
      // Reset form fields
      setCriteriaChecked({});
      setValidationConfirmed(false);
      setChangeRecord('');
    } catch (e) {
      console.error(e);
      alert('提交失敗，請重試。');
    }
  };

  // Sync Status label
  const getSyncStatusBadge = () => {
    // If offline, show offline warning
    if (!isOnline) {
      return <span className="sync-badge sync-error">⚠️ 離線 (等候連線)</span>;
    }

    // Check if there are any versions with 'saving' status
    const hasSaving = versions.some(v => v.teamId === team?.id && v.syncStatus === 'saving');
    if (hasSaving) {
      return <span className="sync-badge sync-saving">⏳ 同步中...</span>;
    }

    return <span className="sync-badge sync-synced">✓ 雲端已同步</span>;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // T01 — Team Join Registration
  if (!team) {
    return (
      <div className="role-container team-view" style={{ justifyContent: 'center' }}>
        <div className="card" style={{ maxWidth: '450px', margin: '0 auto', width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span style={{ fontSize: '3rem' }}>🍡</span>
            <h2 style={{ marginTop: '1rem', marginBottom: '0.25rem' }}>加入工作坊挑戰</h2>
            <p style={{ color: 'var(--text-secondary)' }}>請輸入專案代碼並登記團隊資訊</p>
          </div>
          
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label className="form-label">專案代碼 (Join Code - 大寫 4 位字母)</label>
              <input
                type="text"
                className="form-input"
                maxLength={4}
                placeholder="請輸入大螢幕上的代碼"
                style={{ textTransform: 'uppercase', textAlign: 'center', fontSize: '1.4rem', fontWeight: 'bold', letterSpacing: '0.1em' }}
                value={inputJoinCode}
                onChange={(e) => setInputJoinCode(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">團隊名稱 (Team Name)</label>
              <input
                type="text"
                className="form-input"
                placeholder="例如：敏捷極客組"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">記錄員姓名 (Recorder Name)</label>
              <input
                type="text"
                className="form-input"
                placeholder="負責填寫版本日誌的人員"
                value={recorderName}
                onChange={(e) => setRecorderName(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isJoining}>
              {isJoining ? '加入中...' : '登記並加入'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ATTENTION MODE / TEACHING SCREENS ROUTING
  // ----------------------------------------------------
  const teachingStates = [
    'SETUP',
    'ROUND_1_BRIEFING',
    'ROUND_1_FROZEN',
    'ITERATION_LEARNING',
    'ROUND_2_BRIEFING',
    'ROUND_2_FROZEN',
    'RESULTS',
    'SUCCESS_DEBRIEF',
    'AGILE_MANIFESTO_LEARNING',
    'CLOSING',
    'COMPLETED'
  ];

  const showAttentionMode = teachingStates.includes(workshop.status);

  // Render attention screen (T04 / T08)
  if (showAttentionMode) {
    let title = '請看大螢幕';
    let subtitle = '引導講師正在講解課程，請暫停手邊討論並專注於主投影幕。';

    if (workshop.status === 'ROUND_1_FROZEN') {
      title = '第一輪挑戰結束';
      subtitle = '時間到！手放開，請專注看大螢幕，與講師一起進行第一輪回顧。';
    } else if (workshop.status === 'ROUND_2_FROZEN' || workshop.status === 'RESULTS' || workshop.status === 'COMPLETED') {
      title = '工作坊挑戰完成';
      subtitle = `恭喜！你們一共交付了 ${teamVersions.length} 個產品版本。現在請專注大螢幕查看即時效能指標。`;
    }

    return (
      <div className="role-container team-view">
        <header className="team-header">
          <span className="team-header-name">
            {team ? `${team.name} (學員端)` : (workshop?.name || '棉花糖敏捷工作坊')}
          </span>
          {team && getSyncStatusBadge()}
        </header>
        <div className="team-main">
          <div className="card attention-mode">
            <div className="attention-icon">👀</div>
            <h1 className="attention-headline">{title}</h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>{subtitle}</p>
          </div>
        </div>
      </div>
    );
  }

  // T08 — Debrief 1 Tag Submission
  if (workshop.status === 'DEBRIEF_1' && team) {
    const presetActivities = ['討論', '規劃', '設計', '分工', '製作零件', '嘗試不同方法', '黏土', '折麵', '站立測試'];
    
    const handleAddPreset = async (act: string) => {
      if (r1Activities.includes(act)) return;
      if (r1Activities.length >= 5) {
        alert('最多只能選擇 5 個活動喔！');
        return;
      }
      const next = [...r1Activities, act];
      setR1Activities(next);
      await updateTeamR1Activities(team, next);
    };

    const handleAddCustom = async (e: React.FormEvent) => {
      e.preventDefault();
      const val = customActivity.trim();
      if (!val) return;
      if (val.length > 8) {
        alert('每個標籤字數請在 8 個字以內！');
        return;
      }
      if (r1Activities.includes(val)) return;
      if (r1Activities.length >= 5) {
        alert('最多只能選擇 5 個活動喔！');
        return;
      }
      const next = [...r1Activities, val];
      setR1Activities(next);
      setCustomActivity('');
      await updateTeamR1Activities(team, next);
    };

    const handleRemove = async (act: string) => {
      const next = r1Activities.filter(a => a !== act);
      setR1Activities(next);
      await updateTeamR1Activities(team, next);
    };

    return (
      <div className="role-container team-view">
        <header className="team-header">
          <span className="team-header-name">{team.name} (學員端)</span>
          {getSyncStatusBadge()}
        </header>
        <div className="team-main" style={{ justifyContent: 'flex-start' }}>
          <div className="card">
            <h2 style={{ marginBottom: '0.5rem' }}>剛才六分鐘，你們在做什麼？</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.4 }}>
              請選擇或輸入你們剛才完成第一輪挑戰中花費最多時間的活動（最多 5 個），大螢幕上將會即時匯總所有小組的結果！
            </p>

            {/* Current Tags */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>已選擇的活動 ({r1Activities.length}/5)：</div>
              {r1Activities.length === 0 ? (
                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', padding: '0.75rem', background: 'hsl(0, 0%, 96%)', borderRadius: '8px', textAlign: 'center', border: '1px dashed #ddd' }}>
                  尚未選擇，請點選下方推薦標籤或自行輸入
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {r1Activities.map((act) => (
                    <span key={act} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: 'var(--primary)', color: '#fff', padding: '0.4rem 0.8rem', borderRadius: '20px', fontSize: '0.95rem', fontWeight: 600 }}>
                      {act}
                      <button onClick={() => handleRemove(act)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.1rem', cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Preset Tags */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>推薦活動：</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {presetActivities.map((act) => {
                  const isSelected = r1Activities.includes(act);
                  return (
                    <button
                      key={act}
                      onClick={() => handleAddPreset(act)}
                      disabled={isSelected || r1Activities.length >= 5}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '20px',
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--primary)' : '#ddd',
                        background: isSelected ? 'rgba(255, 152, 0, 0.1)' : '#fff',
                        color: isSelected ? 'var(--primary)' : 'var(--text-primary)',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        fontWeight: isSelected ? 600 : 400
                      }}
                    >
                      {act} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Tag Form */}
            <form onSubmit={handleAddCustom} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-input"
                placeholder="輸入其他活動（限 8 字）"
                value={customActivity}
                onChange={(e) => setCustomActivity(e.target.value)}
                maxLength={8}
                disabled={r1Activities.length >= 5}
                style={{ flex: 1, margin: 0 }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!customActivity.trim() || r1Activities.length >= 5}
                style={{ padding: '0 1.25rem', whiteSpace: 'nowrap' }}
              >
                新增
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }



  // T02 — Waiting Room
  if (workshop.status === 'LOBBY') {
    return (
      <div className="role-container team-view">
        <header className="team-header">
          <span className="team-header-name">{team.name}</span>
          {getSyncStatusBadge()}
        </header>
        <div className="team-main">
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
            <h2>歡迎，{team.name}！</h2>
            <p style={{ fontSize: '1.1rem', margin: '1rem 0' }}>我們已經成功連線進入大廳。</p>
            <div style={{ background: 'hsl(210, 16%, 96%)', padding: '1.25rem', borderRadius: '12px', display: 'inline-block', width: '100%', maxWidth: '300px' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>等待講師啟動挑戰</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.25rem' }}>請看大螢幕...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // T03 — Round 1 Active Timer
  if (workshop.status === 'ROUND_1_ACTIVE') {
    return (
      <div className="role-container team-view">
        <header className="team-header">
          <span className="team-header-name">{team.name}</span>
          {getSyncStatusBadge()}
        </header>
        <div className="team-main">
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>第一輪挑戰倒數</span>
            <div style={{ fontSize: '5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', margin: '1rem 0', color: timeLeft <= 30 ? 'var(--error)' : 'var(--text-primary)' }}>
              {formatTime(timeLeft)}
            </div>
            <h2>建造最高的獨立結構</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              請依照物理材料開始動手建造！請記住：棉花糖必須置於最頂端。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ROUND 2 ACTIVE FLOW (T05, T06, T07)
  // ----------------------------------------------------
  if (workshop.status === 'ROUND_2_ACTIVE') {
    if (!currentChallenge) {
      // Completed all 10 challenges
      return (
        <div className="role-container team-view">
          <header className="team-header">
            <span className="team-header-name">{team.name}</span>
            {getSyncStatusBadge()}
          </header>
          <div className="team-main">
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <span style={{ fontSize: '3rem' }}>🏆</span>
              <h2 style={{ marginTop: '1.5rem' }}>所有關卡已完成！</h2>
              <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>
                你們已經成功交付了全部 10 個迭代版本。
              </p>
              <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '1rem', borderRadius: '12px', fontWeight: 'bold' }}>
                請抬頭看大螢幕，等待講師進行回顧。
              </div>
            </div>
          </div>
        </div>
      );
    }

    // T05 — Current Challenge screen
    if (screenState === 'T05') {
      return (
        <div className="role-container team-view">
          <header className="team-header">
            <div>
              <span className="team-header-name">{team.name}</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                當前進度：Version {currentSeq} / 10
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
              {getSyncStatusBadge()}
              <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                ⏱ {formatTime(timeLeft)}
              </span>
            </div>
          </header>
          
          <div className="team-main" style={{ justifyContent: 'flex-start' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Market Request {currentSeq}
              </span>
              <h2 style={{ margin: '0.25rem 0 0.75rem 0', fontSize: '1.6rem' }}>{currentChallenge.title}</h2>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                {currentChallenge.description}
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, display: 'block', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                驗收標準 (Acceptance Criteria)：
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentChallenge.acceptanceCriteria.map((ac, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.02)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.95rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>•</span>
                    <span>{ac}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 'auto', background: 'hsl(210, 16%, 95%)', padding: '1rem', borderRadius: '12px', textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-secondary)' }}>動手建造。實際驗收。</span>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setScreenState('T06')}>
              去登記版本日誌 (DoD 驗收) ➔
            </button>
          </div>
        </div>
      );
    }

    // T06 — Version Record & DoD Checklist
    if (screenState === 'T06') {
      const allChecked = currentChallenge.acceptanceCriteria.every((_, idx) => criteriaChecked[idx]);
      const canSubmit = allChecked && validationConfirmed && changeRecord.trim().length > 0;

      return (
        <div className="role-container team-view">
          <header className="team-header">
            <div>
              <span className="team-header-name">DoD 驗收與版本日誌</span>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                挑戰：{currentChallenge.title}
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem' }}>
              {getSyncStatusBadge()}
              <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                ⏱ {formatTime(timeLeft)}
              </span>
            </div>
          </header>

          <div className="team-main" style={{ justifyContent: 'flex-start', overflowY: 'auto' }}>
            
            {/* Checklist 1: Acceptance Criteria */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="form-label" style={{ fontSize: '0.95rem' }}>1. 逐項實測產品驗收條件 (自我檢驗)：</span>
              <div className="checklist">
                {currentChallenge.acceptanceCriteria.map((ac, idx) => (
                  <label key={idx} className="checklist-item">
                    <input
                      type="checkbox"
                      checked={!!criteriaChecked[idx]}
                      onChange={(e) => setCriteriaChecked({ ...criteriaChecked, [idx]: e.target.checked })}
                    />
                    <span className="checklist-text">{ac}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Form Input: What changed */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label" style={{ fontSize: '0.95rem' }}>
                2. 版本異動紀錄 (What changed in this version?):
              </label>
              <textarea
                className="form-input version-record-input"
                placeholder="請簡短記錄這一版做了什麼改變（例如：加強了底座結構、將高度提升了5公分、移除了最下方的斜撐支架等）。"
                value={changeRecord}
                onChange={(e) => setChangeRecord(e.target.value)}
                required
              />
            </div>

            {/* Checklist 2: Legal validation */}
            <div style={{ marginBottom: '2rem' }}>
              <label className="checklist-item" style={{ borderLeft: '4px solid var(--primary)' }}>
                <input
                  type="checkbox"
                  checked={validationConfirmed}
                  onChange={(e) => setValidationConfirmed(e.target.checked)}
                />
                <span className="checklist-text" style={{ fontWeight: 'bold' }}>
                  我們已實際驗證產品符合本關的所有 Acceptance Criteria。
                </span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginTop: 'auto' }}>
              <button className="btn btn-outline" onClick={() => setScreenState('T05')}>
                返回挑戰
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmitVersion}
                disabled={!canSubmit}
              >
                完成版本 (Complete) ✓
              </button>
            </div>
          </div>
        </div>
      );
    }

    // T07 — Done Screen
    if (screenState === 'T07') {
      const lastVer = teamVersions[teamVersions.length - 1];
      let cycleTimeLabel = '0分0秒';
      let elapsedLabel = '0分0秒';

      if (lastVer) {
        const cycleSec = Math.round((lastVer.completedAt - lastVer.challengeStartedAt) / 1000);
        cycleTimeLabel = `${Math.floor(cycleSec / 60)}分${cycleSec % 60}秒`;

        if (workshop.round2StartedAt) {
          const totalSec = Math.round((lastVer.completedAt - workshop.round2StartedAt) / 1000);
          elapsedLabel = `${Math.floor(totalSec / 60)}分${totalSec % 60}秒`;
        }
      }

      const handleNextMarketFeedback = () => {
        setScreenState('T05');
      };

      return (
        <div className="role-container team-view" style={{ background: 'var(--success-light)' }}>
          <header className="team-header" style={{ borderColor: 'rgba(34, 197, 94, 0.2)' }}>
            <span className="team-header-name" style={{ color: 'var(--success)' }}>VERSION {currentSeq - 1} DONE!</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {getSyncStatusBadge()}
              <span style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                ⏱ {formatTime(timeLeft)}
              </span>
            </div>
          </header>

          <div className="team-main">
            <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', boxShadow: '0 10px 25px -5px rgba(34, 197, 94, 0.1)' }}>
              <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '1rem' }}>🎉</span>
              <h2 style={{ color: 'var(--success)' }}>版本成功提交！</h2>
              <p style={{ color: 'var(--text-secondary)' }}>您已經完成本輪第 {currentSeq - 1} 個版本的開發與 DoD 文件備份。</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', margin: '2rem 0', background: 'hsl(210, 16%, 97%)', padding: '1.25rem', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>工作坊累計時間</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{elapsedLabel}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>本關開發週期 (Cycle Time)</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{cycleTimeLabel}</div>
                </div>
              </div>

              <button className="btn btn-primary" style={{ width: '100%', padding: '1rem' }} onClick={handleNextMarketFeedback}>
                接收下一個市場回饋 (Next) ➔
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="role-container team-view" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <h2>狀態未定義</h2>
    </div>
  );
};
