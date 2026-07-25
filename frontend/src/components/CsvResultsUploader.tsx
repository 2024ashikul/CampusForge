import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw, Table as TableIcon } from 'lucide-react';
// @ts-ignore
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface CsvResultsUploaderProps {
  onResultsExtracted: (markdownTable: string, rawData: string[][]) => void;
  initialMarkdown?: string | null;
}

export const CsvResultsUploader: React.FC<CsvResultsUploaderProps> = ({
  onResultsExtracted,
  initialMarkdown
}) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const convertToMarkdown = (parsedHeaders: string[], parsedRows: string[][]): string => {
    if (parsedHeaders.length === 0) return '';
    
    const headerRow = `| ${parsedHeaders.join(' | ')} |`;
    const separatorRow = `| ${parsedHeaders.map(() => '---').join(' | ')} |`;
    const dataRows = parsedRows.map(row => {
      // Ensure row length matches headers
      const filledRow = parsedHeaders.map((_, i) => (row[i] !== undefined && row[i] !== null ? String(row[i]).trim() : ''));
      return `| ${filledRow.join(' | ')} |`;
    });

    return [headerRow, separatorRow, ...dataRows].join('\n');
  };

  const processGridData = (matrix: any[][], name: string) => {
    if (!matrix || matrix.length === 0) {
      setError('File is empty or could not be read properly.');
      return;
    }

    // Filter out empty rows
    const nonNullRows = matrix.filter(r => Array.isArray(r) && r.some(cell => cell !== null && cell !== '' && cell !== undefined));
    if (nonNullRows.length === 0) {
      setError('No valid data rows found in the file.');
      return;
    }

    const parsedHeaders = nonNullRows[0].map(h => String(h || '').trim());
    const parsedDataRows = nonNullRows.slice(1).map(r => r.map(c => String(c ?? '').trim()));

    setHeaders(parsedHeaders);
    setRows(parsedDataRows);
    setFileName(name);
    setError(null);

    const md = convertToMarkdown(parsedHeaders, parsedDataRows);
    onResultsExtracted(md, [parsedHeaders, ...parsedDataRows]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    const name = file.name;

    if (name.endsWith('.csv') || name.endsWith('.txt')) {
      Papa.parse(file, {
        complete: (results: any) => {
          setIsProcessing(false);
          if (results.errors && results.errors.length > 0 && (!results.data || results.data.length === 0)) {
            setError(`CSV Parse Error: ${results.errors[0].message}`);
            return;
          }
          processGridData(results.data as any[][], name);
        },
        error: (err: any) => {
          setIsProcessing(false);
          setError(`Failed to read CSV: ${err.message}`);
        }
      });
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const buffer = evt.target?.result;
          const workbook = XLSX.read(buffer, { type: 'binary' });
          const firstSheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[firstSheetName];
          const sheetData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
          processGridData(sheetData, name);
        } catch (err: any) {
          setError(`Excel parsing failed: ${err.message || 'Invalid format'}`);
        } finally {
          setIsProcessing(false);
        }
      };
      reader.onerror = () => {
        setIsProcessing(false);
        setError('Error reading file.');
      };
      reader.readAsBinaryString(file);
    } else {
      setIsProcessing(false);
      setError('Unsupported file type. Please upload a .csv, .xlsx, or .xls file.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Dropzone / Button */}
      <div className="border-2 border-dashed border-customBorder hover:border-accent/50 transition-colors rounded-2xl p-6 text-center bg-card/40 backdrop-blur-sm relative group">
        <input
          type="file"
          accept=".csv,.xlsx,.xls,.txt"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent group-hover:scale-110 transition-transform">
            {isProcessing ? (
              <RefreshCw className="w-6 h-6 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-mainText">
              {fileName ? `File Selected: ${fileName}` : 'Upload CSV or Excel Leaderboard'}
            </p>
            <p className="text-xs text-subText mt-1">
              Drag & drop or click to upload .csv, .xlsx, .xls (e.g. Winner List, Scores)
            </p>
          </div>
          {fileName && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> Successfully extracted {rows.length} rows
            </span>
          )}
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Live Extracted Table Preview */}
      {headers.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-subText uppercase tracking-wider flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-accent" /> Extracted Data Preview ({rows.length} records)
            </h4>
          </div>
          <div className="overflow-x-auto rounded-xl border border-customBorder bg-card max-h-60">
            <table className="w-full text-left text-xs">
              <thead className="bg-footer text-mainText font-bold border-b border-customBorder sticky top-0">
                <tr>
                  {headers.map((h, idx) => (
                    <th key={idx} className="px-4 py-2.5 whitespace-nowrap border-r border-customBorder/40 last:border-r-0">
                      {h || `Column ${idx + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-customBorder/30">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-accent/5 transition-colors">
                    {headers.map((_, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 whitespace-nowrap text-subText border-r border-customBorder/20 last:border-r-0">
                        {row[cIdx] || '-'}
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
