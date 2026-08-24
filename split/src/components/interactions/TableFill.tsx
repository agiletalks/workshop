import React from "react";

interface TableFillProps {
  config: {
    headers: string[];
    rows: string[][];
  };
  data: any; // Saved table cell values: { [rowIndex-colIndex]: value }
  onChange: (newData: any) => void;
}

export const TableFill: React.FC<TableFillProps> = ({ config, data, onChange }) => {
  const safeData = data || {};

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const key = `${rowIndex}-${colIndex}`;
    onChange({
      ...safeData,
      [key]: value
    });
  };

  return (
    <div className="w-full overflow-x-auto border border-slate-200 rounded-xl my-4 shadow-sm bg-white">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {config.headers.map((header, idx) => (
              <th
                key={idx}
                className="p-3 font-extrabold text-slate-700 tracking-wide"
                style={{ minWidth: idx === 0 ? "140px" : "100px" }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {config.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
              {row.map((cellText, colIndex) => {
                const isEditable = colIndex > 0; // Typically first column is labels, subsequent columns are inputs
                const cellKey = `${rowIndex}-${colIndex}`;
                const cellValue = safeData[cellKey] || "";

                return (
                  <td key={colIndex} className="p-2.5 text-slate-600 align-middle">
                    {isEditable ? (
                      <input
                        type="text"
                        value={cellValue}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        placeholder="請輸入答案..."
                        className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-fubon-blue focus:ring-2 focus:ring-fubon-blue-glow transition-all text-xs bg-slate-50 focus:bg-white"
                      />
                    ) : (
                      <div className="font-semibold text-slate-800 leading-normal pl-1">
                        {cellText}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
