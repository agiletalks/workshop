import React, { useState, useEffect } from 'react';
import { ProjectionView } from './components/ProjectionView';
import { TeamScreen } from './components/TeamScreen';
import { createWorkshop, findWorkshopByJoinCode } from './services/syncService';

function App() {
  const [role, setRole] = useState<'projection' | 'team' | null>(null);
  const [workshopId, setWorkshopId] = useState<string | null>(null);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);
  
  // Home page fields
  const [createCode, setCreateCode] = useState<string>('');
  const [newWSName, setNewWSName] = useState<string>('平地起高樓大挑戰');
  const [loading, setLoading] = useState<boolean>(false);

  // Password fields
  const [password, setPassword] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('facilitator_unlocked') === 'true';
  });

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'agile-2026') {
      setIsUnlocked(true);
      sessionStorage.setItem('facilitator_unlocked', 'true');
    } else {
      alert('密碼錯誤！請輸入正確的引導講師密碼。');
      setPassword('');
    }
  };

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
      const readOnlyParam = params.get('readOnly') === 'true' || params.get('isReadOnly') === 'true';

      if (roleParam === 'projection' || roleParam === 'team') {
        setRole(roleParam);
      } else if (wsIdParam) {
        // Default to student team view if wsId is present but role is not specified
        setRole('team');
      } else {
        setRole(null);
      }

      if (wsIdParam) {
        setWorkshopId(wsIdParam);
      } else {
        setWorkshopId(null);
      }

      setIsReadOnly(readOnlyParam);
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



  // 2. Render Projection Screen
  if (role === 'projection' && workshopId) {
    return <ProjectionView workshopId={workshopId} isReadOnly={isReadOnly} />;
  }

  // 3. Render Team Device Screen
  if (role === 'team' && workshopId) {
    return <TeamScreen workshopId={workshopId} />;
  }

  // 4. Render Password Login if locked
  if (!isUnlocked) {
    return (
      <div className="role-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem', background: 'var(--bg-app)' }}>
        <div className="card" style={{ maxWidth: '400px', width: '100%', padding: '2.5rem 2rem', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem' }}>🍡</span>
          <h2 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', fontWeight: 800 }}>工作坊引導主控登入</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>此頁面僅限講師操作。請輸入密碼以初始化工作坊。</p>
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">講師密碼 (Password)</label>
              <input
                type="password"
                className="form-input"
                placeholder="請輸入密碼"
                style={{ textAlign: 'center', fontSize: '1.1rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}>
              登入解鎖
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            預設密碼為：agile2026
          </div>
        </div>
      </div>
    );
  }

  // 5. Render Default Setup Home Page (Only Facilitator Creation Card)
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '4rem 1.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      
      {/* Banner / Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <span style={{ fontSize: '4rem' }}>🍡</span>
        <h1 style={{ fontSize: '2.4rem', marginTop: '1rem', marginBottom: '0.5rem', fontWeight: 800 }}>
          棉花糖敏捷挑戰工作坊
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>
          引導講師主控端 — 初始化工作坊專案
        </p>
      </div>

      {/* Card: Facilitator Create */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '2.5rem 2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', textAlign: 'center' }}>建立全新工作坊</h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', textAlign: 'center' }}>
          設定工作坊名稱與連線專案代碼，掌控投影畫面進度、操作兩輪挑戰計時器，並實時監控所有團隊的交付績效。
        </p>

        <form onSubmit={handleCreateWorkshop}>
          <div className="form-group">
            <label className="form-label">工作坊名稱 (Workshop Name)</label>
            <input
              type="text"
              className="form-input"
              placeholder="例如：敏捷實戰工作坊"
              value={newWSName}
              onChange={(e) => setNewWSName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group" style={{ marginTop: '1.25rem' }}>
            <label className="form-label">指定專案代碼 (Join Code - 4位大寫字母)</label>
            <input
              type="text"
              className="form-input"
              maxLength={4}
              placeholder="例如：ABCD"
              style={{ textTransform: 'uppercase', textAlign: 'center', fontWeight: 'bold', letterSpacing: '0.1em', fontSize: '1.2rem' }}
              value={createCode}
              onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '1rem', marginTop: '1.5rem' }}
            disabled={loading}
          >
            {loading ? '建立中...' : '初始化並開啟投影幕'}
          </button>
        </form>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        AGILE TALKS © 2026 | 專為敏捷體驗式教學設計之工具網頁
      </div>
    </div>
  );
}

export default App;
