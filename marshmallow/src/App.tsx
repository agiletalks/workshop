import React, { useState, useEffect } from 'react';
import { ProjectionView } from './components/ProjectionView';
import { TeamScreen } from './components/TeamScreen';
import { createWorkshop, findWorkshopByJoinCode } from './services/syncService';

function App() {
  const [role, setRole] = useState<'projection' | 'team' | null>(null);
  const [workshopId, setWorkshopId] = useState<string | null>(null);
  
  // Home page fields
  const [joinCode, setJoinCode] = useState<string>('');
  const [createCode, setCreateCode] = useState<string>('');
  const [newWSName, setNewWSName] = useState<string>('棉花糖敏捷挑戰工作坊');
  const [loading, setLoading] = useState<boolean>(false);

  // Parse parameters on load and when URL changes
  useEffect(() => {
    setCreateCode(generateJoinCode());
  }, []);

  // Parse parameters on load and when URL changes
  useEffect(() => {
    const handleUrlParams = () => {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role');
      const wsIdParam = params.get('wsId');
      const joinCodeParam = params.get('joinCode');

      if (roleParam === 'projection' || roleParam === 'team') {
        setRole(roleParam);
      } else {
        setRole(null);
      }

      if (wsIdParam) {
        setWorkshopId(wsIdParam);
      } else {
        setWorkshopId(null);
      }

      if (joinCodeParam) {
        setJoinCode(joinCodeParam);
      }
    };

    handleUrlParams();
    window.addEventListener('popstate', handleUrlParams);
    return () => window.removeEventListener('popstate', handleUrlParams);
  }, []);

  // Update URL manually to support browser history without React Router
  const navigateTo = (newRole: 'projection' | 'team', newWsId: string) => {
    const newUrl = `${window.location.origin}${window.location.pathname}?role=${newRole}&wsId=${newWsId}`;
    window.history.pushState({}, '', newUrl);
    setRole(newRole);
    setWorkshopId(newWsId);
  };

  // Helper to generate a 4-letter uppercase join code
  const generateJoinCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Create Workshop (Facilitator)
  const handleCreateWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWSName.trim()) return;
    if (!createCode.trim() || createCode.length !== 4) {
      alert('專案代碼必須為 4 位大寫英文字母。');
      return;
    }

    setLoading(true);
    try {
      const code = createCode.toUpperCase();
      const existing = await findWorkshopByJoinCode(code);
      if (existing) {
        alert(`代碼 "${code}" 已被佔用，請更換另一個代碼。`);
        setLoading(false);
        return;
      }
      
      const ws = await createWorkshop(newWSName.trim(), code);
      navigateTo('projection', ws.id);
    } catch (err) {
      console.error(err);
      alert('建立工作坊失敗，請重試。');
    } finally {
      setLoading(false);
    }
  };

  // Join Workshop (Team)
  const handleJoinWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || joinCode.length !== 4) {
      alert('請輸入 4 位大寫英文字母的專案代碼。');
      return;
    }

    setLoading(true);
    try {
      const ws = await findWorkshopByJoinCode(joinCode.toUpperCase());
      if (ws) {
        navigateTo('team', ws.id);
      } else {
        alert(`找不到代碼為 "${joinCode.toUpperCase()}" 的工作坊，請確認代碼是否正確。`);
      }
    } catch (err) {
      console.error(err);
      alert('加入工作坊失敗，請重試。');
    } finally {
      setLoading(false);
    }
  };



  // 2. Render Projection Screen
  if (role === 'projection' && workshopId) {
    return <ProjectionView workshopId={workshopId} />;
  }

  // 3. Render Team Device Screen
  if (role === 'team' && workshopId) {
    return <TeamScreen workshopId={workshopId} />;
  }

  // 4. Render Default Setup Home Page
  return (
    <div className="role-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', justifyContent: 'center', padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Banner / Header */}
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <span style={{ fontSize: '4.5rem' }}>🍡</span>
        <h1 style={{ fontSize: '2.8rem', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 800 }}>
          棉花糖敏捷挑戰工作坊
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>
          Marshmallow Agile Challenge Simulation Web Application
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        
        {/* Card 1: Team Join */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '2.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>學員團隊端加入</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>
            輸入講師螢幕上顯示的 4 位大寫英文字母工作坊代碼，加入挑戰並開始記錄版本日誌。
          </p>
          
          <form onSubmit={handleJoinWorkshop} style={{ marginTop: 'auto' }}>
            <div className="form-group">
              <label className="form-label">專案代碼 (Join Code)</label>
              <input
                type="text"
                className="form-input"
                maxLength={4}
                placeholder="例如：ABCD"
                style={{ textTransform: 'uppercase', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '0.1em' }}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem' }}
              disabled={loading}
            >
              {loading ? '連線中...' : '加入工作坊 (Join)'}
            </button>
          </form>
        </div>

        {/* Card 2: Facilitator Create */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '2.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>講師引導者主控端</h2>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', flex: 1 }}>
            開立一個全新的工作坊，掌控投影畫面進度、操作兩輪挑戰計時器，並實時監控所有團隊的交付績效。
          </p>

          <form onSubmit={handleCreateWorkshop} style={{ marginTop: 'auto' }}>
            <div className="form-group">
              <label className="form-label">工作坊名稱 (Workshop Name)</label>
              <input
                type="text"
                className="form-input"
                placeholder="請輸入工作坊名稱"
                value={newWSName}
                onChange={(e) => setNewWSName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">指定專案代碼 (Join Code - 4位大寫字母)</label>
              <input
                type="text"
                className="form-input"
                maxLength={4}
                placeholder="例如：ABCD"
                style={{ textTransform: 'uppercase', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.1em' }}
                value={createCode}
                onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="btn btn-outline"
              style={{ width: '100%', padding: '1rem', borderStyle: 'dashed', borderWidth: '2px', marginTop: '0.5rem' }}
              disabled={loading}
            >
              {loading ? '建立中...' : '開立新工作坊 (Create)'}
            </button>
          </form>
        </div>

      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        AGILE TALKS © 2026 | 專為敏捷體驗式教學設計之工具網頁
      </div>
    </div>
  );
}

export default App;
