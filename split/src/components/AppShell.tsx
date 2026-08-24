import React, { useState } from "react";

interface AppShellProps {
  topBar: React.ReactNode;
  sidebar: React.ReactNode;
  slideViewer: React.ReactNode;
  workbookPanel: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  topBar,
  sidebar,
  slideViewer,
  workbookPanel
}) => {
  // Mobile navigation tab: "slide" | "notes" | "nav"
  const [mobileTab, setMobileTab] = useState<"slide" | "notes" | "nav">("slide");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* TopBar fixed height */}
      {topBar}

      {/* Main content grid */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Desktop Sidebar / Mobile Left Drawer */}
        <div className={`
          md:relative md:flex md:translate-x-0 shrink-0 h-full z-20 transition-transform duration-300
          absolute top-0 left-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${mobileTab === "nav" ? "flex w-full md:w-64" : "hidden md:flex"}
        `}>
          {sidebar}
        </div>

        {/* Backdrop for mobile drawer if sidebar is open */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="md:hidden absolute inset-0 bg-slate-900/40 z-10"
          />
        )}

        {/* Center/Right Layout: Adjusts by responsive break points */}
        <div className="flex-1 flex overflow-hidden h-full">
          {/* Slide Viewer Panel */}
          <div className={`
            flex-1 h-full overflow-hidden flex flex-col bg-slate-100 relative
            ${mobileTab === "slide" ? "flex" : "hidden md:flex"}
          `}>
            {/* Mobile Hamburger toggle to open navigation drawer */}
            <div className="md:hidden absolute top-4 left-4 z-10">
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-10 h-10 bg-white/95 border border-slate-200 text-slate-700 rounded-full flex items-center justify-center shadow-md active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            {slideViewer}
          </div>

          {/* Workbook / Note Panel */}
          <div className={`
            w-full md:w-[380px] lg:w-[440px] border-l border-slate-200 bg-white h-full overflow-hidden shrink-0
            ${mobileTab === "notes" ? "flex" : "hidden md:flex"}
          `}>
            {workbookPanel}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Tabs (Only visible on screens < 768px) */}
      <div className="md:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.03)] shrink-0">
        <button
          onClick={() => { setMobileTab("slide"); setSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
            mobileTab === "slide" ? "text-fubon-blue font-bold" : "text-slate-400"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v12a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2-2-2-2 2 2 2z" />
          </svg>
          <span className="text-[10px]">課程講義</span>
        </button>

        <button
          onClick={() => { setMobileTab("notes"); setSidebarOpen(false); }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
            mobileTab === "notes" ? "text-fubon-blue font-bold" : "text-slate-400"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-[10px]">隨堂筆記</span>
        </button>

        <button
          onClick={() => { setMobileTab("nav"); setSidebarOpen(true); }}
          className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors ${
            mobileTab === "nav" ? "text-fubon-blue font-bold" : "text-slate-400"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-[10px]">單元大綱</span>
        </button>
      </div>
    </div>
  );
};
