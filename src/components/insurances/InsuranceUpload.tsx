import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { parseInsuranceFile } from '../../lib/insurance-parser';
import { useInsurances } from '../../context/InsurancesContext';
import type { InsurancePolicy } from '../../types';

type ParsedPolicy = Omit<InsurancePolicy, 'id' | 'user_id' | 'created_at'>;

interface InsuranceUploadProps {
  onDone?: () => void;
}

export default function InsuranceUpload({ onDone }: InsuranceUploadProps) {
  const { replacePolicies, uploading } = useInsurances();
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<ParsedPolicy[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setErrors([]);
    setParsed(null);

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv' && ext !== 'xls') {
      setErrors(['Unsupported file type. Please upload an .xlsx or .csv file.']);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const batchId = crypto.randomUUID();
      const result = parseInsuranceFile(buffer, batchId);

      if (result.errors.length > 0) {
        setErrors(result.errors);
        return;
      }

      setParsed(result.policies);
    } catch {
      setErrors(['Failed to parse file. Make sure it is a valid Excel or CSV file.']);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  }, [processFile]);

  const handleConfirm = async () => {
    if (!parsed) return;
    try {
      await replacePolicies(parsed);
      setParsed(null);
      onDone?.();
    } catch {
      setErrors(['Failed to save data. Please try again.']);
    }
  };

  const handleCancel = () => {
    setParsed(null);
    setErrors([]);
  };

  // Get category summary from parsed data
  const categorySummary = parsed
    ? Object.entries(
        parsed.reduce<Record<string, number>>((acc, p) => {
          const cat = p.category || 'Uncategorized';
          acc[cat] = (acc[cat] ?? 0) + 1;
          return acc;
        }, {})
      )
    : [];

  // Preview state
  if (parsed) {
    return (
      <div className="rounded-xl border border-[#1c1928] bg-[#13111c] p-8">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet size={24} className="text-[#ec4899]" />
          <div>
            <h3 className="text-[15px] font-semibold text-white">
              {parsed.length} {parsed.length === 1 ? 'policy' : 'policies'} found
            </h3>
            <p className="text-[13px] text-[#7a7890] mt-0.5">
              {categorySummary.map(([cat, count]) => `${cat} (${count})`).join(', ')}
            </p>
          </div>
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            {errors.map((err, i) => (
              <p key={i} className="text-[13px] text-red-400 flex items-center gap-2">
                <AlertCircle size={14} /> {err}
              </p>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2.5 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-[13px] text-[#7a7890] hover:text-white rounded-lg hover:bg-white/[0.04] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={uploading}
            className="px-5 py-2 text-[13px] bg-[#ec4899] hover:bg-[#db2777] text-white font-medium rounded-full transition-colors disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload & Replace'}
          </button>
        </div>
      </div>
    );
  }

  // Dropzone state
  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed py-16 text-center cursor-pointer transition-all ${
          dragOver
            ? 'border-[#ec4899] bg-[#ec4899]/5'
            : 'border-[#1c1928] bg-[#0f0d18] hover:border-[#2d2a40] hover:bg-[#13111c]'
        }`}
      >
        <Upload size={32} className={`mx-auto mb-4 ${dragOver ? 'text-[#ec4899]' : 'text-[#7a7890]'}`} />
        <p className="text-[14px] text-white font-medium mb-1">
          Drag & drop your insurance file
        </p>
        <p className="text-[13px] text-[#7a7890]">
          or click to browse — accepts .xlsx, .csv
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {errors.length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          {errors.map((err, i) => (
            <p key={i} className="text-[13px] text-red-400 flex items-center gap-2">
              <AlertCircle size={14} /> {err}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
