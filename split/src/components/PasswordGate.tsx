import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { appConfig } from "../data/app-config";
import type { UserSession } from "../services/notesService";

/**
 * 輕量快速且無額外依賴的 SHA-256 同步雜湊算法
 */
function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  const hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += '\x80';
  while (ascii.length % 64 !== 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length;) {
    const w = words.slice(j, j += 16);
    const oldHash = [...hash];
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ ((~e) & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w[i - 16]
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w[i - 7]
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += ((b < 16) ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

interface PasswordGateProps {
  onAuthorized: (session: UserSession) => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onAuthorized }) => {
  const [classId, setClassId] = useState("");
  const [teamId, setTeamId] = useState(1);
  const [name, setName] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [verifyingSession, setVerifyingSession] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const cParam = params.get('c') || params.get('class') || 'default-split';
    const normalizedClass = cParam.trim().toLowerCase();
    const classKey = `split_user_session_${normalizedClass}`;
    return Boolean(localStorage.getItem(classKey) || localStorage.getItem('split_user_session'));
  });

  useEffect(() => {
    // 從 URL 取得 classId 與 teamId 參數 (例如 ?c=202610-split&team=team-2)
    const params = new URLSearchParams(window.location.search);
    const cParam = params.get('c') || params.get('class') || 'default-split';
    setClassId(cParam);

    const tParam = params.get('team') || 'team-1';
    const parsedTeam = parseInt(tParam.replace(/\D/g, ''), 10) || 1;
    setTeamId(parsedTeam);

    const normalizedClass = cParam.trim().toLowerCase();

    // --- 中央管理後台一鍵免密直通 (Admin Direct Bypass) ---
    const roleParam = params.get('role') || params.get('r');
    const admToken = params.get('adm') || params.get('admin');
    const hasAdminSession = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('agiletalks_central_admin_auth') === 'true';
    const isValidAdmin = admToken === 'agile-2026' || admToken === '24721942@Ai' || hasAdminSession;

    if (roleParam === 'instructor' && isValidAdmin) {
      const instructorSession: UserSession = {
        uid: "inst_" + Math.random().toString(36).substring(2, 9),
        sessionId: "sess_inst_" + Math.random().toString(36).substring(2, 9),
        name: "課程講師 (Percy)",
        teamId: parsedTeam,
        classId: normalizedClass,
        passcodeHash: "admin_direct_verified",
        role: "instructor"
      };
      localStorage.setItem('split_user_session', JSON.stringify(instructorSession));
      localStorage.setItem(`split_user_session_${normalizedClass}`, JSON.stringify(instructorSession));
      sessionStorage.setItem("split_courseware_authorized", "true");
      setVerifyingSession(false);
      onAuthorized(instructorSession);
      return;
    }

    const classKey = `split_user_session_${normalizedClass}`;
    const rawCached = localStorage.getItem(classKey) || localStorage.getItem('split_user_session');

    if (!rawCached) {
      setVerifyingSession(false);
      return;
    }

    let s: UserSession | null = null;
    try {
      s = JSON.parse(rawCached) as UserSession;
    } catch (e) {
      setVerifyingSession(false);
      return;
    }

    if (s.classId?.toLowerCase() !== normalizedClass) {
      setVerifyingSession(false);
      return;
    }

    // 嚴格非同步校驗既有快取 session (防止舊無效或停用班 session 繞過門禁)
    let isMounted = true;
    (async () => {
      try {
        if (db) {
          const classRef = doc(db, 'split_classes', normalizedClass);
          const snap = await getDoc(classRef);
          if (!snap.exists()) {
            localStorage.removeItem(classKey);
            localStorage.removeItem('split_user_session');
            sessionStorage.removeItem("split_courseware_authorized");
            if (isMounted) {
              setError(`找不到班級【${normalizedClass}】`);
              setVerifyingSession(false);
            }
            return;
          }

          const classData = snap.data();
          // 1. 若班級處於停用狀態，立即清除快取並阻擋
          if (classData.status === 'inactive') {
            localStorage.removeItem(classKey);
            localStorage.removeItem('split_user_session');
            sessionStorage.removeItem("split_courseware_authorized");
            if (isMounted) {
              setError(`班級【${normalizedClass}】目前處於停用狀態，暫停開放學員進入。`);
              setVerifyingSession(false);
            }
            return;
          }
          // 2. 若班級設有專屬 passcodeHash，檢查 session 中的 passcodeHash 是否吻合 (且不能為空，講師身分豁免)
          if (s.role !== 'instructor' && classData.passcodeHash) {
            if (!s.passcodeHash || s.passcodeHash !== classData.passcodeHash) {
              console.warn('[PasswordGate] 清除密碼不符或過期之舊 session 快取:', normalizedClass);
              localStorage.removeItem(classKey);
              localStorage.removeItem('split_user_session');
              sessionStorage.removeItem("split_courseware_authorized");
              if (isMounted) {
                setError("班級通行密碼已更新或已失效，請重新輸入密碼驗證");
                setVerifyingSession(false);
              }
              return;
            }
          } else if (s.role !== 'instructor' && appConfig.passwordEnabled) {
            // 舊班級需具備預設密碼雜湊
            if (!s.passcodeHash || s.passcodeHash !== appConfig.defaultPasscodeHash) {
              localStorage.removeItem(classKey);
              localStorage.removeItem('split_user_session');
              sessionStorage.removeItem("split_courseware_authorized");
              if (isMounted) {
                setError("通行密碼已失效，請重新輸入");
                setVerifyingSession(false);
              }
              return;
            }
          }
        }
        if (isMounted) {
          setVerifyingSession(false);
          onAuthorized(s);
        }
      } catch (err) {
        console.warn('[PasswordGate] Session validation failed:', err);
        if (isMounted) setVerifyingSession(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [onAuthorized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedClass = classId.trim().toLowerCase();
    if (!normalizedClass) {
      setError("請填寫班級代碼");
      return;
    }

    // 檢查密碼輸入是否為空
    if (appConfig.passwordEnabled && !passcode.trim()) {
      setError("請輸入進班驗證密碼");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let classData: any = null;
      if (db) {
        try {
          const classRef = doc(db, 'split_classes', normalizedClass);
          const snap = await getDoc(classRef);
          if (snap.exists()) {
            classData = snap.data();
          }
        } catch (dbErr) {
          console.warn('[PasswordGate] Failed to fetch class info from Firestore:', dbErr);
        }
      }

      // 檢查班級狀態：若為停用狀態則阻擋學員進入
      if (classData && classData.status === 'inactive') {
        setError(`班級【${normalizedClass}】目前處於停用狀態，暫停開放學員進入。`);
        setLoading(false);
        return;
      }

      // 密碼安全雜湊比對 (專屬班級絕無通用密碼旁路)
      const inputTrimmed = passcode.trim();
      const inputHash = sha256Sync(inputTrimmed);

      if (appConfig.passwordEnabled) {
        if (classData?.passcodeHash) {
          // 專屬班級：嚴格要求輸入之雜湊等於該班 passcodeHash，絕不允許通用密碼旁路！
          if (inputHash !== classData.passcodeHash) {
            setError("驗證密碼不符，請重新確認");
            setLoading(false);
            return;
          }
        } else {
          // 未設定專屬雜湊之舊班級：比對預設通行密碼 "split-2026"
          if (inputTrimmed !== appConfig.defaultPasscode && inputHash !== appConfig.defaultPasscodeHash) {
            setError("驗證密碼不符，請重新確認");
            setLoading(false);
            return;
          }
        }
      }

      const session: UserSession = {
        uid: "usr_" + Math.random().toString(36).substring(2, 9),
        sessionId: "sess_" + Math.random().toString(36).substring(2, 9),
        name: name.trim() || `學員 (第 ${teamId} 組)`,
        teamId: teamId,
        classId: normalizedClass,
        passcodeHash: inputHash,
        role: "student"
      };

      localStorage.setItem('split_user_session', JSON.stringify(session));
      localStorage.setItem(`split_user_session_${normalizedClass}`, JSON.stringify(session));
      sessionStorage.setItem("split_courseware_authorized", "true");
      onAuthorized(session);
    } catch (err: any) {
      console.error('[PasswordGate] Submit error:', err);
      setError("驗證程序發生異常，請重試");
    } finally {
      setLoading(false);
    }
  };

  if (verifyingSession) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-medium tracking-wide">正在驗證班級通行資訊...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950 z-50 px-4">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.08),transparent_50%)] pointer-events-none" />
      
      <div className="w-full max-w-md bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden relative z-10">
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 to-indigo-500" />
        
        <div className="p-8 flex flex-col items-center">
          {/* Logo container */}
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-1">
            SPLIT 需求拆解實戰工作坊
          </h2>
          <p className="text-slate-400 text-xs text-center mb-6">
            請輸入班級與組別資訊以開啟個人與小組協作筆記
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">班級代碼 (Class Code)</label>
              <input
                type="text"
                required
                value={classId}
                onChange={(e) => {
                  setClassId(e.target.value);
                  setError("");
                }}
                placeholder="例如：202610-split"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">我的小組</label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <option key={num} value={num}>第 {num} 組</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">我的姓名 / 暱稱</label>
                <input
                  type="text"
                  placeholder="例如：Alex"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">進班驗證密碼</label>
              <input
                type="password"
                placeholder="預設：split-2026"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setError("");
                }}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 font-bold bg-rose-500/10 border border-rose-500/30 p-2.5 rounded-xl">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "進班驗證中..." : "進入工作坊講義與小組筆記 →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
