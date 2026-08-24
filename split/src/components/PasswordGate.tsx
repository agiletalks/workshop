import React, { useState, useEffect } from "react";

interface PasswordGateProps {
  onAuthorized: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onAuthorized }) => {
  const [nickname, setNickname] = useState("");
  const [teamId, setTeamId] = useState("Team 1");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Reconnection check on mount
  useEffect(() => {
    const isAuth = localStorage.getItem("split_authorized") === "true";
    if (isAuth && localStorage.getItem("split_teamId") && localStorage.getItem("split_nickname")) {
      onAuthorized();
    }
  }, [onAuthorized]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== "agile-2026") {
      setError(true);
      setErrorMsg("❌ 授權密碼錯誤，請重新輸入！");
      setPassword("");
      return;
    }

    if (!nickname.trim()) {
      setError(true);
      setErrorMsg("❌ 請輸入您的暱稱！");
      return;
    }

    localStorage.setItem("split_role", "student");
    localStorage.setItem("split_nickname", nickname.trim());
    localStorage.setItem("split_teamId", teamId);
    localStorage.setItem("split_authorized", "true");
    onAuthorized();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 z-50 px-4">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50 opacity-70 pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative z-10 transition-all duration-300 transform hover:scale-[1.01]">
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-fubon-blue to-fubon-green" />

        <div className="p-8 md:p-10 flex flex-col items-center">
          {/* Logo container */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-fubon-blue to-fubon-blue-dark flex items-center justify-center text-white shadow-lg mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-slate-900 text-center mb-1">
            SPLIT 需求分解的技術
          </h2>
          <p className="text-slate-500 text-xs text-center mb-6">
            歡迎加入互動工作坊，請驗證登入並選擇您的小組
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1.5 tracking-wider">
                課程授權密碼
              </label>
              <input
                type="password"
                required
                placeholder="請輸入課程授權密碼"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full px-4 py-3 border ${
                  error && password === ""
                    ? "border-red-500 ring-4 ring-red-50"
                    : "border-slate-200 focus:border-fubon-blue focus:ring-4 focus:ring-fubon-blue-glow"
                } rounded-xl outline-none text-center text-sm font-semibold transition-all bg-slate-50 focus:bg-white`}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1.5 tracking-wider">
                您的暱稱
              </label>
              <input
                type="text"
                required
                placeholder="請輸入您的中文或英文暱稱"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setError(false);
                }}
                className="w-full px-4 py-3 border border-slate-200 focus:border-fubon-blue focus:ring-4 focus:ring-fubon-blue-glow rounded-xl outline-none text-center text-sm font-semibold transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1.5 tracking-wider">
                選擇您的小組
              </label>
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 focus:border-fubon-blue focus:ring-4 focus:ring-fubon-blue-glow rounded-xl outline-none text-center text-sm font-bold transition-all bg-slate-50 focus:bg-white cursor-pointer"
              >
                <option value="Team 1">第一組 (Team 1)</option>
                <option value="Team 2">第二組 (Team 2)</option>
                <option value="Team 3">第三組 (Team 3)</option>
                <option value="Team 4">第四組 (Team 4)</option>
                <option value="Team 5">第五組 (Team 5)</option>
              </select>
            </div>

            {error && (
              <p className="text-red-500 text-[10px] mt-1.5 text-center font-medium animate-pulse">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-fubon-blue to-fubon-blue-dark hover:from-fubon-blue-dark hover:to-fubon-blue text-white text-xs font-bold rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none active:scale-[0.98]"
            >
              進入講義與協作
            </button>
          </form>

          {/* Branding Signature */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-slate-400 text-[10px]">
            <span className="font-semibold text-fubon-blue">SPLIT</span>
            <span>數位互動講義平台</span>
          </div>
        </div>
      </div>
    </div>
  );
};
