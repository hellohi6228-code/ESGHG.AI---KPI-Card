import React, { useState, useEffect, useRef } from 'react';
import { CardConfig, KPIType, CardLayout, AIExtractedData, DataSourceType } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronRight, ChevronLeft, LayoutGrid, Settings2, Database, Activity,
  X, Upload, Loader2, CheckCircle, FileText, AlertCircle, RefreshCw,
  HardDrive, Cloud, Building2, Mail, FolderOpen, Cpu,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────
const KPI_TYPES: { value: KPIType; label: string; desc: string }[] = [
  { value: 'price',    label: 'Price',    desc: 'Supply material price tracking' },
  { value: 'time',     label: 'Time',     desc: 'Production, maintenance, fulfilment' },
  { value: 'control',  label: 'Control',  desc: 'Quality & process control' },
  { value: 'training', label: 'Training', desc: 'EHS and SOP compliance' },
  { value: 'emission', label: 'Emission', desc: 'Scope 1, 2, 3 tracking' },
  { value: 'roi',      label: 'ROI',      desc: 'Return on Investment' },
  { value: 'irr',      label: 'IRR',      desc: 'Internal Rate of Return' },
  { value: 'beta',     label: 'Beta',     desc: 'Volatility relative to market' },
];

const DATA_SOURCE_OPTIONS: {
  value: DataSourceType; label: string; desc: string; icon: React.ElementType;
}[] = [
  { value: 'local-upload',  label: 'Local File / Folder',        desc: 'Upload files from your device',                     icon: HardDrive },
  { value: 'shared-drive',  label: 'Shared Drive & Spreadsheet', desc: 'Google Drive, SharePoint, Google Sheets',           icon: Cloud },
  { value: 'company-drive', label: 'Company Shared Drive',       desc: 'Intranet drive — requires IT configuration',        icon: Building2 },
];

const UNITS: Record<KPIType, string[]> = {
  price:    ['USD', 'EUR', 'GBP', 'USD / kg', 'USD / ton', 'USD / unit'],
  time:     ['%', 'hr', 'min', 'days', 'units / hr', 'min / unit'],
  control:  ['%', 'PPM', 'Cpk'],
  training: ['%'],
  emission: ['t CO2e', 'kg CO2e', 'kg CO2e / unit'],
  roi:      ['%'],
  irr:      ['%'],
  beta:     [],
};

const INDICATORS: Record<KPIType, { label: string; desc: string }[]> = {
  price:    [{ label: 'Raw Material Cost', desc: 'Current market price' }, { label: 'Price Variance', desc: 'Deviation from standard' }],
  time:     [{ label: 'Cycle Time', desc: 'Avg time per unit' }, { label: 'OEE Uptime', desc: 'Machine availability' }],
  control:  [{ label: 'Defect Rate', desc: 'PPM defective' }, { label: 'Yield', desc: '% of good parts' }, { label: 'Cpk', desc: 'Process capability' }],
  training: [{ label: 'Compliance Score', desc: 'EHS completion' }, { label: 'SOP Adherence', desc: 'Audit pass rate' }],
  emission: [{ label: 'Carbon Intensity', desc: 'kg CO2e per unit' }, { label: 'Scope 1 & 2', desc: 'Direct/indirect' }, { label: 'Scope 3', desc: 'Supply chain' }],
  roi:      [{ label: 'Annualized ROI', desc: 'Yearly return rate' }, { label: 'Project ROI', desc: 'Total return on project' }],
  irr:      [{ label: 'Project IRR', desc: 'Internal rate of return' }, { label: 'Equity IRR', desc: 'Return on equity invested' }],
  beta:     [{ label: 'Asset Beta', desc: 'Unlevered beta' }, { label: 'Equity Beta', desc: 'Levered beta' }],
};

const LAYOUTS: { value: CardLayout; label: string }[] = [
  { value: 'standard',      label: 'Standard' },
  { value: 'hero-top-left', label: 'Hero Top Left' },
  { value: 'split-metrics', label: 'Split Metrics' },
];

// ── LayoutPreview ──────────────────────────────────────────────────────────
const LayoutPreview: React.FC<{ layout: CardLayout; selected: boolean; onClick: () => void }> = ({ layout, selected, onClick }) => (
  <div
    onClick={onClick}
    className={`cursor-pointer border rounded-xl p-4 transition-all ${selected ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-base)] hover:border-[var(--text-secondary)]'}`}
  >
    <div className="text-sm font-medium mb-3 text-[var(--text-primary)]">{layout === 'standard' ? 'Standard' : layout === 'hero-top-left' ? 'Hero Top Left' : 'Split Metrics'}</div>
    <div className="h-24 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-panel)] p-3 flex flex-col gap-2 opacity-80">
      {layout === 'standard' && (<><div className="flex gap-2 items-center"><div className="w-4 h-4 rounded bg-[var(--text-secondary)]" /><div className="w-16 h-2 bg-[var(--text-secondary)] rounded" /></div><div className="w-24 h-6 bg-[var(--text-primary)] rounded mt-auto" /></>)}
      {layout === 'hero-top-left' && (<><div className="w-16 h-2 bg-[var(--text-secondary)] rounded" /><div className="w-24 h-8 bg-[var(--text-primary)] rounded" /><div className="w-10 h-2 bg-[var(--text-secondary)] rounded self-end mt-auto" /></>)}
      {layout === 'split-metrics' && (<><div className="flex gap-2 items-center"><div className="w-4 h-4 rounded bg-[var(--text-secondary)]" /><div className="w-16 h-2 bg-[var(--text-secondary)] rounded" /></div><div className="flex gap-3 mt-auto items-end"><div className="w-12 h-6 bg-[var(--text-primary)] rounded" /><div className="w-px h-6 bg-[var(--border-subtle)]" /><div className="w-10 h-4 bg-[var(--text-secondary)] rounded" /></div></>)}
    </div>
  </div>
);

// ── LocalUploadPanel ───────────────────────────────────────────────────────
const LocalUploadPanel: React.FC<{
  files: File[];
  onFilesChange: (files: File[]) => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
}> = ({ files, onFilesChange, description, onDescriptionChange }) => {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (incoming: File[]) => {
    const merged = [...files, ...incoming.filter(nf => !files.some(f => f.name === nf.name && f.size === nf.size))];
    onFilesChange(merged);
  };

  return (
    <div className="space-y-3 mt-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${dragOver ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : files.length ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5' : 'border-[var(--border-subtle)] hover:border-[var(--text-secondary)] bg-[var(--bg-panel)]'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.pdf,.txt"
          multiple
          className="hidden"
          onChange={(e) => { if (e.target.files) addFiles(Array.from(e.target.files)); }}
        />
        <FolderOpen className="w-6 h-6 text-[var(--text-secondary)] mx-auto mb-2" />
        <p className="text-sm text-[var(--text-secondary)]">Drag & drop or click to browse</p>
        <p className="text-xs text-[var(--text-secondary)] mt-1 opacity-70">CSV, Excel, PDF, TXT — multiple files supported</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-3 py-2">
              <FileText className="w-3.5 h-3.5 text-[var(--accent-primary)] shrink-0" />
              <span className="text-sm text-[var(--text-primary)] flex-1 truncate">{f.name}</span>
              <span className="text-xs text-[var(--text-secondary)] font-mono shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
              <button
                onClick={(e) => { e.stopPropagation(); onFilesChange(files.filter((_, j) => j !== i)); }}
                className="text-[var(--text-secondary)] hover:text-rose-400 ml-1 shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Describe what you have in your file(s) — e.g. monthly production report, defect counts in column D, cycle time per shift in rows 2–100"
        rows={3}
        className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none"
      />
    </div>
  );
};

// ── SharedDrivePanel ───────────────────────────────────────────────────────
const SharedDrivePanel: React.FC<{
  isGoogleConnected: boolean;
  onGoogleConnect: () => void;
  description: string;
  onDescriptionChange: (desc: string) => void;
}> = ({ isGoogleConnected, onGoogleConnect, description, onDescriptionChange }) => {
  const [msNote, setMsNote] = useState(false);

  return (
    <div className="space-y-3 mt-4">
      <div className="space-y-2">
        <button
          onClick={onGoogleConnect}
          className="w-full flex items-center gap-3 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 hover:border-[var(--text-secondary)] transition-colors text-left"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <div className="flex-1">
            <div className="text-sm font-medium text-[var(--text-primary)]">Google Drive / Google Sheets</div>
            <div className="text-xs text-[var(--text-secondary)]">{isGoogleConnected ? 'Connected' : 'Sign in with Google'}</div>
          </div>
          {isGoogleConnected
            ? <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            : <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />}
        </button>

        <button
          onClick={() => setMsNote(v => !v)}
          className="w-full flex items-center gap-3 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl px-4 py-3 hover:border-[var(--text-secondary)] transition-colors text-left"
        >
          <div className="w-5 h-5 shrink-0 bg-[#0078D4] rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold leading-none">S</span>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-[var(--text-primary)]">Microsoft SharePoint</div>
            <div className="text-xs text-[var(--text-secondary)]">Requires Microsoft 365 admin setup</div>
          </div>
          <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] shrink-0" />
        </button>
        {msNote && (
          <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 leading-relaxed">
            SharePoint integration requires Azure AD app registration.{' '}
            <a href="mailto:support@6kinc.com" className="text-[var(--accent-primary)] underline">Contact us</a>{' '}
            to configure for your organisation.
          </div>
        )}
      </div>

      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="Describe what you have in your file(s) — e.g. monthly production report, defect counts in column D, cycle time per shift in rows 2–100"
        rows={3}
        className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none"
      />
    </div>
  );
};

// ── CompanyDrivePanel ──────────────────────────────────────────────────────
const CompanyDrivePanel: React.FC<{
  description: string;
  onDescriptionChange: (desc: string) => void;
}> = ({ description, onDescriptionChange }) => (
  <div className="space-y-3 mt-4">
    <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-5 space-y-3">
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
        Company intranet drives require a secure API connector configured by your IT team between your internal file server and this dashboard.
      </p>
      
        href="mailto:support@6kinc.com?subject=Company Drive Integration Request"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 rounded-lg text-sm font-medium hover:bg-[var(--accent-primary)]/20 transition-colors"
      >
        <Mail className="w-4 h-4" /> Contact IT / Admin
      </a>
    </div>
    <textarea
      value={description}
      onChange={(e) => onDescriptionChange(e.target.value)}
      placeholder="Describe what you have in your file(s) — e.g. monthly production report, defect counts in column D, cycle time per shift in rows 2–100"
      rows={3}
      className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/60 focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)] resize-none"
    />
  </div>
);

// ── UnitSelector ───────────────────────────────────────────────────────────
const UnitSelector: React.FC<{
  kpiType: KPIType;
  value: string | null;
  onChange: (unit: string) => void;
}> = ({ kpiType, value, onChange }) => {
  const [customUnit, setCustomUnit] = useState('');
  const predefined = UNITS[kpiType];

  if (kpiType === 'beta') {
    if (value !== 'no unit') onChange('no unit');
    return (
      <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-3 py-2">
        Beta is dimensionless — no unit required.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onChange('no unit')}
          className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${value === 'no unit' ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/50' : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'}`}
        >
          No unit / Ratio
        </button>
        {predefined.map(u => (
          <button
            key={u}
            onClick={() => onChange(u)}
            className={`px-3 py-1.5 rounded-lg text-xs border font-mono transition-all ${value === u ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/50' : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'}`}
          >
            {u}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={customUnit}
          onChange={(e) => setCustomUnit(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && customUnit.trim()) { onChange(customUnit.trim()); setCustomUnit(''); } }}
          placeholder="Custom unit..."
          className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-2.5 text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none font-mono"
        />
        <button
          onClick={() => { if (customUnit.trim()) { onChange(customUnit.trim()); setCustomUnit(''); } }}
          className="px-4 py-2 bg-[var(--border-subtle)] hover:bg-[var(--text-secondary)] text-[var(--text-primary)] rounded-lg text-sm font-medium transition-colors"
        >
          Set
        </button>
      </div>
      {value && value !== 'no unit' && !predefined.includes(value) && (
        <div className="text-xs text-[var(--accent-primary)] font-mono">
          Custom unit set: <span className="font-bold">{value}</span>
        </div>
      )}
    </div>
  );
};

// ── FileAnalysisZone ───────────────────────────────────────────────────────
const FileAnalysisZone: React.FC<{
  card: CardConfig;
  files: File[];
  onAIDataExtracted: (data: AIExtractedData) => void;
}> = ({ card, files, onAIDataExtracted }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<AIExtractedData | null>(card.aiData || null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (card.aiData) { setResult(card.aiData); setStatus('done'); }
    else { setResult(null); setStatus('idle'); }
  }, [card.id]);

  const analyze = async () => {
    if (!files.length) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      form.append('kpiType', card.type || '');
      form.append('indicator', card.indicator || '');
      form.append('unit', card.unit || '');
      form.append('description', card.dataSourceDescription || '');
      form.append('cardDescription', card.description || '');

      const res = await fetch('/api/upload-analyze', { method: 'POST', body: form });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Analysis failed'); }
      const data: AIExtractedData = await res.json();
      setResult(data);
      setStatus('done');
      onAIDataExtracted(data);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message);
    }
  };

  if (!files.length) {
    return (
      <div className="text-sm text-[var(--text-secondary)] bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-4 py-3">
        No files uploaded yet. Add files in section 2 to enable AI analysis.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 space-y-1.5">
        <div className="text-xs text-[var(--text-secondary)] mb-2">{files.length} file{files.length > 1 ? 's' : ''} queued</div>
        {files.map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <FileText className="w-3 h-3 text-[var(--accent-primary)] shrink-0" />
            <span className="text-[var(--text-primary)] truncate">{f.name}</span>
            <span className="text-[var(--text-secondary)] font-mono ml-auto shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
          </div>
        ))}
      </div>

      {status !== 'done' && (
        <button
          onClick={analyze}
          disabled={status === 'loading'}
          className="w-full bg-[var(--accent-primary)] text-[var(--bg-base)] py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {status === 'loading'
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            : <><Cpu className="w-4 h-4" /> Analyze with AI</>}
        </button>
      )}

      {status === 'error' && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-rose-400">{errorMsg}</p>
            <button onClick={analyze} className="text-xs text-rose-400 underline mt-1 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {status === 'done' && result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-[var(--accent-primary)]">
            <CheckCircle className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">AI Result</span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-mono font-bold text-[var(--text-primary)]">{result.value}</span>
            {result.unit && result.unit !== 'no unit' && (
              <span className="text-base font-mono text-[var(--text-secondary)]">{result.unit}</span>
            )}
            {result.trend && result.trend !== 'N/A' && (
              <span className={`text-sm font-mono px-2 py-0.5 rounded ${result.trend.startsWith('+') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {result.trend}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{result.insight}</p>
          {result.calculationSteps && (
            <details className="text-xs">
              <summary className="text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] select-none">
                Calculation steps
              </summary>
              <pre className="mt-2 text-[var(--text-secondary)] whitespace-pre-wrap leading-relaxed font-mono text-[10px] bg-[var(--bg-base)] p-2 rounded-lg overflow-x-auto">
                {result.calculationSteps}
              </pre>
            </details>
          )}
          <div className="flex justify-between text-[10px] text-[var(--text-secondary)] font-mono">
            <span>{result.fileName}</span>
            <button
              onClick={() => { setStatus('idle'); setResult(null); }}
              className="hover:text-[var(--accent-primary)] flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Re-analyze
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ── Main Wizard ────────────────────────────────────────────────────────────
export default function SetupWizard({ onComplete }: { onComplete: (cards: CardConfig[]) => void }) {
  const [step, setStep] = useState<'count' | 'configure' | 'layouts' | 'ai-model'>('count');
  const [cardCount, setCardCount] = useState(4);
  const [cards, setCards] = useState<CardConfig[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [customIndicator, setCustomIndicator] = useState('');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [cardFiles, setCardFiles] = useState<Record<string, File[]>>({});

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'OAUTH_AUTH_SUCCESS') setIsGoogleConnected(true);
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => { setCustomIndicator(''); }, [currentCardIndex]);

  const handleGoogleLogin = async () => {
    try {
      const res = await fetch('/api/auth/google/url');
      if (!res.ok) throw new Error('Failed to get auth URL');
      const { url, error } = await res.json();
      if (error) { alert(error); return; }
      const popup = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!popup) alert('Allow popups to connect Google.');
    } catch (err) { console.error(err); }
  };

  const handleStartConfig = () => {
    setCards(Array.from({ length: cardCount }).map((_, i) => ({
      id: `card-${i}`, title: '', type: null, description: '',
      dataSource: null, dataSourceDescription: '',
      indicator: null, unit: null, layout: 'standard',
    })));
    setStep('configure');
  };

  const updateCurrentCard = (updates: Partial<CardConfig>) =>
    setCards(prev => prev.map((c, i) => i === currentCardIndex ? { ...c, ...updates } : c));

  const currentCard = cards[currentCardIndex];
  const canProceed = !!currentCard?.indicator && currentCard?.unit !== null;

  // ── COUNT ──
  if (step === 'count') return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-[var(--accent-primary)]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--accent-primary)]/20">
            <LayoutGrid className="text-[var(--accent-primary)] w-6 h-6" />
          </div>
          <h2 className="text-3xl font-semibold tracking-tight">Design Your Canvas</h2>
          <p className="text-[var(--text-secondary)]">How many metric cards do you need?</p>
        </div>
        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-8 space-y-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] font-medium">Number of Cards</span>
            <span className="text-4xl font-mono text-[var(--accent-primary)]">{cardCount}</span>
          </div>
          <input
            type="range" min="1" max="11" value={cardCount}
            onChange={(e) => setCardCount(parseInt(e.target.value))}
            className="w-full h-2 bg-[var(--bg-base)] rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: 'var(--accent-primary)' }}
          />
          <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono"><span>1</span><span>11</span></div>
          <button onClick={handleStartConfig} className="w-full bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 font-medium rounded-xl px-4 py-3 transition-opacity">
            Configure Cards
          </button>
        </div>
      </div>
    </div>
  );

  // ── LAYOUTS ──
  if (step === 'layouts') return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 font-sans">
      <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col">
        <div className="mb-8 shrink-0">
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Choose Card Layouts</h2>
          <p className="text-[var(--text-secondary)] mt-2">Select how each card is displayed.</p>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-8">
          {cards.map((card, idx) => (
            <div key={card.id} className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-[var(--text-primary)]">{card.title || `Card ${idx + 1}`}</h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {card.indicator || 'No indicator'}
                  {card.unit && card.unit !== 'no unit' ? ` (${card.unit})` : ''}
                  {card.aiData ? ` — AI value: ${card.aiData.value}` : ''}
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {LAYOUTS.map(layout => (
                  <LayoutPreview key={layout.value} layout={layout.value} selected={card.layout === layout.value}
                    onClick={() => setCards(prev => prev.map((c, i) => i === idx ? { ...c, layout: layout.value } : c))} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-between shrink-0 pt-4 border-t border-[var(--border-subtle)]">
          <button onClick={() => { setStep('configure'); setCurrentCardIndex(cards.length - 1); }} className="px-6 py-3 rounded-xl font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={() => setStep('ai-model')} className="px-8 py-3 rounded-xl font-medium bg-[var(--accent-primary)] text-[var(--bg-base)] hover:opacity-90 flex items-center gap-2 shadow-lg">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── AI MODEL ──
  if (step === 'ai-model') return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 font-sans">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-semibold text-[var(--text-primary)]">AI Model</h2>
          <p className="text-[var(--text-secondary)] mt-2">Powered by Gemini. Set GEMINI_API_KEY in Secrets.</p>
        </div>
        <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-xl">
          <div className="border border-[var(--accent-primary)]/30 bg-[var(--accent-primary)]/5 rounded-xl p-6">
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">Gemini 2.0 Flash</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Reads uploaded files, applies your indicator and unit definitions, and returns precise values with step-by-step calculation reasoning.
            </p>
          </div>
        </div>
        <div className="mt-8 flex justify-between">
          <button onClick={() => setStep('layouts')} className="px-6 py-3 rounded-xl font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <button onClick={() => onComplete(cards)} className="px-8 py-3 rounded-xl font-medium bg-[var(--accent-primary)] text-[var(--bg-base)] hover:opacity-90 flex items-center gap-2 shadow-lg">
            Finish Setup <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // ── CONFIGURE CARDS ──
  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 font-sans">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h2 className="text-xl font-semibold">Configuring Card {currentCardIndex + 1} of {cards.length}</h2>
            <div className="flex gap-1 mt-3">
              {cards.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentCardIndex ? 'w-8 bg-[var(--accent-primary)]' : i < currentCardIndex ? 'w-4 bg-[var(--accent-primary)]/40' : 'w-4 bg-[var(--border-subtle)]'}`} />
              ))}
            </div>
          </div>
          <button onClick={() => setStep('count')} className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">Restart</button>
        </div>

        <div className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-6 md:p-8 overflow-y-auto shadow-xl">
          <div className="space-y-10">

            {/* 1. KPI Category */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="font-medium text-[var(--text-primary)]">1. KPI Category</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {KPI_TYPES.map(type => (
                  <button key={type.value}
                    onClick={() => updateCurrentCard({ type: type.value, dataSource: null, indicator: null, unit: null, aiData: undefined })}
                    className={`p-4 rounded-xl border text-left transition-all ${currentCard.type === type.value ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50 text-[var(--accent-primary)]' : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'}`}
                  >
                    <div className="font-medium mb-1">{type.label}</div>
                    <div className="text-xs opacity-70 leading-relaxed">{type.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            <AnimatePresence mode="wait">
              {currentCard.type && (
                <motion.div key="details" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">

                  {/* 2. Data Source */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-[var(--accent-primary)]" />
                      <h3 className="font-medium text-[var(--text-primary)]">2. Details & Data Source</h3>
                    </div>
                    <div className="space-y-5 bg-[var(--bg-base)] p-5 rounded-xl border border-[var(--border-subtle)]">
                      <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Card Title</label>
                        <input
                          type="text" value={currentCard.title}
                          onChange={(e) => updateCurrentCard({ title: e.target.value })}
                          placeholder="e.g., Line 3 Defect Rate"
                          className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">What do you want to track?</label>
                        <textarea
                          value={currentCard.description}
                          onChange={(e) => updateCurrentCard({ description: e.target.value })}
                          placeholder="e.g., Daily defect rate on Line 3 — target below 0.5%"
                          className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none resize-none h-20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-3">Select Data Source</label>
                        <div className="space-y-2">
                          {DATA_SOURCE_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            const isSelected = currentCard.dataSource === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => updateCurrentCard({ dataSource: opt.value, dataSourceDescription: '', aiData: undefined })}
                                className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${isSelected ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50' : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] hover:border-[var(--text-secondary)]'}`}
                              >
                                <Icon className={`w-5 h-5 shrink-0 ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} />
                                <div>
                                  <div className={`font-medium text-sm ${isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>{opt.label}</div>
                                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">{opt.desc}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <AnimatePresence mode="wait">
                          {currentCard.dataSource === 'local-upload' && (
                            <motion.div key="local" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                              <LocalUploadPanel
                                files={cardFiles[currentCard.id] || []}
                                onFilesChange={(files) => setCardFiles(prev => ({ ...prev, [currentCard.id]: files }))}
                                description={currentCard.dataSourceDescription}
                                onDescriptionChange={(desc) => updateCurrentCard({ dataSourceDescription: desc })}
                              />
                            </motion.div>
                          )}
                          {currentCard.dataSource === 'shared-drive' && (
                            <motion.div key="shared" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                              <SharedDrivePanel
                                isGoogleConnected={isGoogleConnected}
                                onGoogleConnect={handleGoogleLogin}
                                description={currentCard.dataSourceDescription}
                                onDescriptionChange={(desc) => updateCurrentCard({ dataSourceDescription: desc })}
                              />
                            </motion.div>
                          )}
                          {currentCard.dataSource === 'company-drive' && (
                            <motion.div key="company" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}>
                              <CompanyDrivePanel
                                description={currentCard.dataSourceDescription}
                                onDescriptionChange={(desc) => updateCurrentCard({ dataSourceDescription: desc })}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </section>

                  {/* 3. Indicator & Unit */}
                  {currentCard.dataSource && (
                    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[var(--accent-primary)]" />
                        <h3 className="font-medium text-[var(--text-primary)]">3. Indicator & Unit</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {INDICATORS[currentCard.type].map(ind => (
                          <button key={ind.label}
                            onClick={() => updateCurrentCard({ indicator: currentCard.indicator === ind.label ? null : ind.label, unit: null })}
                            className={`p-4 rounded-xl border text-left transition-all ${currentCard.indicator === ind.label ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50 text-[var(--accent-primary)]' : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'}`}
                          >
                            <div className="font-medium mb-1">{ind.label}</div>
                            <div className="text-xs opacity-70">{ind.desc}</div>
                          </button>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-[var(--border-subtle)]">
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Or define a custom indicator</label>
                        <div className="flex gap-2">
                          <input
                            type="text" value={customIndicator}
                            onChange={(e) => setCustomIndicator(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && customIndicator.trim()) {
                                updateCurrentCard({ indicator: customIndicator.trim(), unit: null });
                                setCustomIndicator('');
                              }
                            }}
                            placeholder="e.g., Nickel purity"
                            className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none"
                          />
                          <button
                            onClick={() => {
                              if (customIndicator.trim()) {
                                updateCurrentCard({ indicator: customIndicator.trim(), unit: null });
                                setCustomIndicator('');
                              }
                            }}
                            className="px-4 py-2 bg-[var(--border-subtle)] hover:bg-[var(--text-secondary)] text-[var(--text-primary)] rounded-lg text-sm font-medium transition-colors"
                          >
                            Set
                          </button>
                        </div>
                      </div>

                      {currentCard.indicator && (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t border-[var(--border-subtle)]">
                          <label className="block text-sm text-[var(--text-secondary)] mb-3">
                            Unit for <span className="text-[var(--text-primary)] font-medium">{currentCard.indicator}</span>
                          </label>
                          <UnitSelector
                            kpiType={currentCard.type!}
                            value={currentCard.unit}
                            onChange={(u) => updateCurrentCard({ unit: u })}
                          />
                        </motion.div>
                      )}
                    </motion.section>
                  )}

                  {/* 4. AI Analysis */}
                  {currentCard.indicator && currentCard.unit !== null && currentCard.dataSource !== 'company-drive' && (
                    <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-[var(--accent-primary)]" />
                        <h3 className="font-medium text-[var(--text-primary)]">4. AI Analysis</h3>
                        <span className="text-xs bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 px-2 py-0.5 rounded-full">optional</span>
                      </div>
                      <div className="bg-[var(--bg-base)] p-5 rounded-xl border border-[var(--border-subtle)]">
                        <FileAnalysisZone
                          card={currentCard}
                          files={cardFiles[currentCard.id] || []}
                          onAIDataExtracted={(data) => updateCurrentCard({ aiData: data })}
                        />
                      </div>
                    </motion.section>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6 flex justify-between shrink-0">
          <button
            onClick={() => setCurrentCardIndex(c => Math.max(0, c - 1))}
            disabled={currentCardIndex === 0}
            className="px-6 py-3 rounded-xl font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <button
            onClick={() => {
              if (currentCardIndex < cards.length - 1) setCurrentCardIndex(c => c + 1);
              else setStep('layouts');
            }}
            disabled={!canProceed}
            className="px-8 py-3 rounded-xl font-medium bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            {currentCardIndex === cards.length - 1 ? 'Choose Layouts' : 'Next Card'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
