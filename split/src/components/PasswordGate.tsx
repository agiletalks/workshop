import React, { useState } from "react";
import { appConfig } from "../data/app-config";

interface PasswordGateProps {
  onAuthorized: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onAuthorized }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === appConfig.password) {
      sessionStorage.setItem("split_courseware_authorized", "true");
      onAuthorized();
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 z-50 px-4">
      {/* Background patterns */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-fubon-blue-light via-slate-50 to-slate-50 opacity-70 pointer-events-none" />
      
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden relative z-10 transition-all duration-300 transform hover:scale-[1.01]">
        {/* Top Accent Bar */}
        <div className="h-2 bg-gradient-to-r from-fubon-blue to-fubon-green" />
        
        <div className="p-8 md:p-10 flex flex-col items-center">
          {/* Logo container */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-fubon-blue to-fubon-blue-dark flex items-center justify-center text-white shadow-lg mb-6">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            SPLIT 需求分解的技術
          </h2>
          <p className="text-slate-500 text-sm text-center mb-8">
            本課程互動講義受密碼保護，請輸入授權密碼以開啟學習畫布
          </p>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="mb-6 relative">
              <input
                type="password"
                placeholder="請輸入課程授權密碼"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className={`w-full px-5 py-4 border ${
                  error
                    ? "border-red-500 ring-4 ring-red-50"
                    : "border-slate-200 focus:border-fubon-blue focus:ring-4 focus:ring-fubon-blue-glow"
                } rounded-2xl outline-none text-center text-lg tracking-[0.2em] font-medium transition-all bg-slate-50 focus:bg-white`}
                autoFocus
              />
              {error && (
                <p className="text-red-500 text-xs mt-2 text-center font-medium animate-pulse">
                  ❌ 密碼錯誤，請重新輸入！
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-fubon-blue to-fubon-blue-dark hover:from-fubon-blue-dark hover:to-fubon-blue text-white font-bold rounded-2xl transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none active:scale-[0.98]"
            >
              驗證並解鎖講義
            </button>
          </form>

          {/* Branding Signature */}
          <div className="mt-8 flex items-center justify-center gap-1.5 text-slate-400 text-xs">
            <span className="font-semibold text-fubon-blue">SPLIT</span>
            <span>數位互動講義平台</span>
          </div>
        </div>
      </div>
    </div>
  );
};
