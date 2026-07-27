import React from 'react';
import * as XLSX from 'xlsx';

interface LeaderboardTabProps {
    memberType: 'admin' | 'member' | 'non_member';
    storedHeaders: string[] | undefined;
    storedRows: any[] | undefined;
    
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

                
                const workbook = XLSX.read(bstr, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                
                const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

                if (rawJson.length > 0) {
                    
                    const dynamicHeaders = Object.keys(rawJson[0]);

                    
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

            {}
            {memberType === 'admin' && (
                
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

            {}
            {!storedRows || storedRows.length === 0 ? (
                
                <div className="bg-card/40 border border-customBorder rounded-xl py-16 text-center text-subText text-xs font-mono">
                    No results uploaded yet or committed to database parameters.
                </div>
            ) : (
                
                <div className="bg-card border border-customBorder rounded-xl overflow-hidden shadow-lg transition-colors duration-200">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            
                            <thead>
                                {}
                                <tr className="bg-footer text-subText border-b border-customBorder text-[11px] transition-colors">
                                    {storedHeaders.map((header: string) => (
                                        <th key={header} className="p-3.5 font-bold uppercase tracking-wider whitespace-nowrap">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            {}
                            <tbody className="divide-y divide-customBorder text-mainText transition-colors">
                                {storedRows.map((row: any, rowIndex: number) => (
                                    
                                    <tr key={rowIndex} className="hover:bg-primary/40 transition-colors">
                                        {storedHeaders.map((header: string) => (
                                            <td key={header} className="p-3.5 font-medium">
                                                {row[header] !== undefined && row[header] !== "" ? (
                                                    String(row[header])
                                                ) : (
                                                    
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