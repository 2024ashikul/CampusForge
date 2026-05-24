import React from 'react';
import * as XLSX from 'xlsx';

interface LeaderboardTabProps {
    memberType: 'admin' | 'member' | 'non_member';
    storedHeaders: string[] | undefined;
    storedRows: any[] | undefined;
    // Callback event handlers to pipe data arrays cleanly back up to parent database instances
    onUploadSuccess: (payload: { headers: string[]; rows: any[] }) => void;
}

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
    memberType,
    storedHeaders = [],
    storedRows = [],
    onUploadSuccess
}) => {

    const handleSpreadsheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;

                // Processes both structural Excel sheets (.xlsx, .xls) and standard text delimiters (.csv)
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert worksheet matrix nodes into flat structured array maps
                const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (rawJson.length > 0) {
                    // 1. Extract structural headers typed by the coordinator dynamically
                    const dynamicHeaders = Object.keys(rawJson[0]);

                    // 2. Emit payloads up to the parent component context
                    onUploadSuccess({
                        headers: dynamicHeaders,
                        rows: rawJson
                    });
                }
            } catch (error) {
                console.error("Critical breakdown tracking spreadsheet parsing pipeline:", error);
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-6 animate-fade-in">

            {/* 🛠️ ADMIN EXCEL / SPREADSHEET FILES DROPZONE UPLOADER */}
            {memberType === 'admin' && (
                // REFACTORED: Converted panels and dashed upload bounds to semantic tokens
                <div className="bg-card border border-customBorder rounded-xl p-5 transition-colors duration-200">
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-customBorder/60 hover:border-accent bg-primary h-32 rounded-xl cursor-pointer transition-all group">
                        <input 
                            type="file" 
                            accept=".csv, .xlsx, .xls" 
                            className="hidden" 
                            onChange={handleSpreadsheetUpload} 
                        />
                        <span className="text-xs font-bold text-subText group-hover:text-mainText transition-colors">
                            Upload Leaderboard Dataset (.csv, .xlsx)
                        </span>
                        <span className="text-[10px] text-subText/60 mt-1 font-medium">
                            Any structural database layout schema is parsed automatically
                        </span>
                    </label>
                </div>
            )}

            {/* LIVE DATA GRID DISPLAY WINDOW FRAME */}
            {!storedRows || storedRows.length === 0 ? (
                // REFACTORED: Empty state background and colors point to design variables
                <div className="bg-card/40 border border-customBorder rounded-xl py-16 text-center text-subText text-xs font-mono">
                    No results uploaded yet or committed to database parameters.
                </div>
            ) : (
                // REFACTORED: Main table panel skin configured to theme variables
                <div className="bg-card border border-customBorder rounded-xl overflow-hidden shadow-lg transition-colors duration-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            
                            <thead>
                                {/* REFACTORED: Header layout matches dark/light table specifications */}
                                <tr className="bg-footer text-subText border-b border-customBorder text-[11px] transition-colors">
                                    {storedHeaders.map((header: string) => (
                                        <th key={header} className="p-3.5 font-bold uppercase tracking-wider whitespace-nowrap">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            {/* REFACTORED: Text color set to handle body copy transitions gracefully */}
                            <tbody className="divide-y divide-customBorder text-mainText transition-colors">
                                {storedRows.map((row: any, rowIndex: number) => (
                                    // REFACTORED: Row hover effects adapt cleanly to background alphas
                                    <tr key={rowIndex} className="hover:bg-primary/40 transition-colors">
                                        {storedHeaders.map((header: string) => (
                                            <td key={header} className="p-3.5 font-medium">
                                                {row[header] !== undefined && row[header] !== "" ? (
                                                    String(row[header])
                                                ) : (
                                                    // REFACTORED: Fallback dashes drop fixed colors
                                                    <span className="text-subText/40 font-mono">—</span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};