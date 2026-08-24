import React, { useState, useRef, useEffect } from "react";

interface StickyNote {
  id: string;
  text: string;
  color: "yellow" | "blue" | "green" | "orange" | "purple";
  x: number;
  y: number;
}

interface StickyBoardProps {
  config: {
    title?: string;
    defaultStickyNotes?: StickyNote[];
  };
  data: any; // Saved notes: StickyNote[]
  onChange: (newData: any) => void;
}

const COLORS: { [key in StickyNote["color"]]: { bg: string; text: string; border: string } } = {
  yellow: { bg: "bg-amber-100", text: "text-amber-900", border: "border-amber-200" },
  blue: { bg: "bg-sky-100", text: "text-sky-900", border: "border-sky-200" },
  green: { bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-200" },
  orange: { bg: "bg-orange-100", text: "text-orange-900", border: "border-orange-200" },
  purple: { bg: "bg-purple-100", text: "text-purple-900", border: "border-purple-200" }
};

export const StickyBoard: React.FC<StickyBoardProps> = ({ config, data, onChange }) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  // Initialize data if empty
  const notes: StickyNote[] = data || config.defaultStickyNotes || [];

  const updateNotes = (updated: StickyNote[]) => {
    onChange(updated);
  };

  const addNote = () => {
    const newNote: StickyNote = {
      id: `note-${Date.now()}`,
      text: "雙擊編輯筆記",
      color: "yellow",
      x: 30 + Math.random() * 50,
      y: 50 + Math.random() * 50
    };
    updateNotes([...notes, newNote]);
  };

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateNotes(notes.filter((n) => n.id !== id));
  };

  const handleTextChange = (id: string, newText: string) => {
    updateNotes(
      notes.map((n) => (n.id === id ? { ...n, text: newText } : n))
    );
  };

  const handleColorChange = (id: string, color: StickyNote["color"], e: React.MouseEvent) => {
    e.stopPropagation();
    updateNotes(
      notes.map((n) => (n.id === id ? { ...n, color } : n))
    );
  };

  // Drag logic
  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    // If the click is inside a textarea, don't trigger dragging
    if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
    e.preventDefault();

    const note = notes.find((n) => n.id === id);
    if (!note) return;

    setActiveDragId(id);
    dragOffset.current = {
      x: e.clientX - note.x,
      y: e.clientY - note.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeDragId || !boardRef.current) return;

      const boardRect = boardRef.current.getBoundingClientRect();
      let x = e.clientX - dragOffset.current.x;
      let y = e.clientY - dragOffset.current.y;

      // Constrain inside board bounds
      x = Math.max(0, Math.min(x, boardRect.width - 120));
      y = Math.max(0, Math.min(y, boardRect.height - 100));

      updateNotes(
        notes.map((n) => (n.id === activeDragId ? { ...n, x, y } : n))
      );
    };

    const handleMouseUp = () => {
      setActiveDragId(null);
    };

    if (activeDragId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [activeDragId, notes]);

  return (
    <div className="w-full flex flex-col border border-slate-200 rounded-2xl overflow-hidden my-4 shadow-sm bg-slate-50 shrink-0 select-none">
      {/* Board Header */}
      <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
        <span className="text-[11px] font-extrabold text-slate-600 tracking-wide uppercase">
          {config.title || "互動便利貼看板"}
        </span>
        <button
          onClick={addNote}
          className="px-3 py-1 bg-fubon-blue hover:bg-fubon-blue-dark text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新增便利貼
        </button>
      </div>

      {/* Board Canvas */}
      <div
        ref={boardRef}
        className="h-72 w-full relative bg-slate-50 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] overflow-hidden"
      >
        {notes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs font-medium">
            點選上方按鈕以新增首張便利貼
          </div>
        ) : (
          notes.map((note) => {
            const theme = COLORS[note.color] || COLORS.yellow;

            return (
              <div
                key={note.id}
                onMouseDown={(e) => handleMouseDown(note.id, e)}
                style={{
                  left: `${note.x}px`,
                  top: `${note.y}px`,
                  position: "absolute"
                }}
                className={`w-32 p-2 rounded-xl border ${theme.bg} ${theme.border} shadow-md flex flex-col group cursor-grab active:cursor-grabbing hover:shadow-lg transition-shadow duration-200 z-10`}
              >
                {/* Note Header / Color picker & Delete (Visible on Hover) */}
                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity mb-1 shrink-0">
                  <div className="flex gap-0.5">
                    {(Object.keys(COLORS) as Array<StickyNote["color"]>).map((c) => (
                      <button
                        key={c}
                        onClick={(e) => handleColorChange(note.id, c, e)}
                        className={`w-2.5 h-2.5 rounded-full border border-black/10 ${
                          c === "yellow" ? "bg-amber-200" :
                          c === "blue" ? "bg-sky-200" :
                          c === "green" ? "bg-emerald-200" :
                          c === "orange" ? "bg-orange-200" : "bg-purple-200"
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={(e) => deleteNote(note.id, e)}
                    className="text-slate-400 hover:text-red-500 rounded p-0.5"
                    title="刪除"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Note Text area */}
                <textarea
                  value={note.text}
                  onChange={(e) => handleTextChange(note.id, e.target.value)}
                  className={`w-full bg-transparent border-none resize-none text-[10px] outline-none text-slate-800 leading-normal font-medium h-12 focus:h-16 transition-all`}
                  placeholder="寫點什麼..."
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
