import React, { useState, useEffect } from 'react';
import { CardConfig, KPIType, CardLayout } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, LayoutGrid, Settings2, Database, Activity, LayoutTemplate, X } from 'lucide-react';

const KPI_TYPES: { value: KPIType; label: string; desc: string }[] = [
  { value: 'price', label: 'Price', desc: 'Supply material price tracking' },
  { value: 'time', label: 'Time', desc: 'Production, maintenance, fulfilment' },
  { value: 'control', label: 'Control', desc: 'Quality & process control' },
  { value: 'training', label: 'Training', desc: 'EHS and SOP compliance' },
  { value: 'emission', label: 'Emission', desc: 'Scope 1, 2, 3 tracking' },
  { value: 'roi', label: 'ROI', desc: 'Return on Investment' },
  { value: 'irr', label: 'IRR', desc: 'Internal Rate of Return' },
  { value: 'beta', label: 'Beta', desc: 'Volatility relative to market' },
];

const DATA_SOURCES: Record<KPIType, string[]> = {
  price: ['Bloomberg API', 'Google Drive', 'xox'],
  time: ['Spreadsheet Upload', 'Calendar Integration', 'Google Drive', 'xox'],
  control: ['Manual Input', 'Sensor (MODBUS/OPC-UA)', 'Spreadsheet Upload', 'Google Drive', 'xox'],
  training: ['Company Directory Folder', 'Google Drive', 'xox'],
  emission: ['Income Statement', 'Document Proofs', 'Google Drive', 'xox'],
  roi: ['Financial Statements', 'ERP System', 'Google Drive', 'xox'],
  irr: ['Project Cash Flows', 'Accounting Software', 'Google Drive', 'xox'],
  beta: ['Market Data API', 'Historical Prices', 'Google Drive', 'xox'],
};

const INDICATORS: Record<KPIType, { label: string; desc: string }[]> = {
  price: [
    { label: 'Raw Material Cost', desc: 'Current market price' },
    { label: 'Price Variance', desc: 'Deviation from standard' }
  ],
  time: [
    { label: 'Cycle Time', desc: 'Avg time per unit' },
    { label: 'OEE Uptime', desc: 'Machine availability' }
  ],
  control: [
    { label: 'Defect Rate', desc: 'PPM defective' },
    { label: 'Yield', desc: '% of good parts' },
    { label: 'Cpk', desc: 'Process capability' }
  ],
  training: [
    { label: 'Compliance Score', desc: 'EHS completion' },
    { label: 'SOP Adherence', desc: 'Audit pass rate' }
  ],
  emission: [
    { label: 'Carbon Intensity', desc: 'kg CO2e per unit' },
    { label: 'Scope 1 & 2', desc: 'Direct/indirect' },
    { label: 'Scope 3', desc: 'Supply chain' }
  ],
  roi: [
    { label: 'Annualized ROI', desc: 'Yearly return rate' },
    { label: 'Project ROI', desc: 'Total return on project' }
  ],
  irr: [
    { label: 'Project IRR', desc: 'Internal rate of return' },
    { label: 'Equity IRR', desc: 'Return on equity invested' }
  ],
  beta: [
    { label: 'Asset Beta', desc: 'Unlevered beta' },
    { label: 'Equity Beta', desc: 'Levered beta' }
  ]
};

const LAYOUTS: { value: CardLayout; label: string; desc: string }[] = [
  { value: 'standard', label: 'Standard', desc: 'Icon top left, big number center' },
  { value: 'hero-top-left', label: 'Hero Top Left', desc: 'Big number top left, secondary bottom right' },
  { value: 'split-metrics', label: 'Split Metrics', desc: 'Two metrics side-by-side' }
];

const LayoutPreview: React.FC<{ layout: CardLayout, selected: boolean, onClick: () => void }> = ({ layout, selected, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer border rounded-xl p-4 transition-all ${selected ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10' : 'border-[var(--border-subtle)] bg-[var(--bg-base)] hover:border-[var(--text-secondary)]'}`}
    >
      <div className="text-sm font-medium mb-3 text-[var(--text-primary)]">{layout === 'standard' ? 'Standard' : layout === 'hero-top-left' ? 'Hero Top Left' : 'Split Metrics'}</div>
      
      <div className="h-24 border border-[var(--border-subtle)] rounded-lg bg-[var(--bg-panel)] p-3 flex flex-col gap-2 opacity-80">
        {layout === 'standard' && (
          <>
            <div className="flex gap-2 items-center"><div className="w-4 h-4 rounded bg-[var(--text-secondary)]"></div><div className="w-16 h-2 bg-[var(--text-secondary)] rounded"></div></div>
            <div className="w-24 h-6 bg-[var(--text-primary)] rounded mt-auto"></div>
          </>
        )}
        {layout === 'hero-top-left' && (
          <>
            <div className="w-16 h-2 bg-[var(--text-secondary)] rounded"></div>
            <div className="w-24 h-8 bg-[var(--text-primary)] rounded"></div>
            <div className="w-10 h-2 bg-[var(--text-secondary)] rounded self-end mt-auto"></div>
          </>
        )}
        {layout === 'split-metrics' && (
          <>
            <div className="flex gap-2 items-center"><div className="w-4 h-4 rounded bg-[var(--text-secondary)]"></div><div className="w-16 h-2 bg-[var(--text-secondary)] rounded"></div></div>
            <div className="flex gap-3 mt-auto items-end">
              <div className="w-12 h-6 bg-[var(--text-primary)] rounded"></div>
              <div className="w-px h-6 bg-[var(--border-subtle)]"></div>
              <div className="w-10 h-4 bg-[var(--text-secondary)] rounded"></div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function SetupWizard({ onComplete }: { onComplete: (cards: CardConfig[]) => void }) {
  const [step, setStep] = useState<'count' | 'configure' | 'layouts' | 'connect' | 'contact' | 'ai-model'>('count');
  const [cardCount, setCardCount] = useState<number>(4);
  const [cards, setCards] = useState<CardConfig[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [customIndicator, setCustomIndicator] = useState('');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setIsGoogleConnected(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const response = await fetch('/api/auth/google/url');
      if (!response.ok) throw new Error('Failed to get auth URL');
      const { url } = await response.json();
      const authWindow = window.open(url, 'oauth_popup', 'width=600,height=700');
      if (!authWindow) {
        alert('Please allow popups for this site to connect your account.');
      }
    } catch (error) {
      console.error('OAuth error:', error);
    }
  };

  useEffect(() => {
    setCustomIndicator('');
  }, [currentCardIndex]);

  const handleStartConfig = () => {
    const initialCards: CardConfig[] = Array.from({ length: cardCount }).map((_, i) => ({
      id: `card-${i}`,
      title: '',
      type: null,
      description: '',
      dataSources: [],
      indicator: null,
      secondaryIndicator: null,
      layout: 'standard'
    }));
    setCards(initialCards);
    setStep('configure');
  };

  const updateCurrentCard = (updates: Partial<CardConfig>) => {
    const newCards = [...cards];
    newCards[currentCardIndex] = { ...newCards[currentCardIndex], ...updates };
    setCards(newCards);
  };

  const currentCard = cards[currentCardIndex];

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(c => c + 1);
    } else {
      setStep('layouts');
    }
  };

  if (step === 'count') {
    return (
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
              type="range" 
              min="1" 
              max="11" 
              value={cardCount}
              onChange={(e) => setCardCount(parseInt(e.target.value))}
              className="w-full h-2 bg-[var(--bg-base)] rounded-lg appearance-none cursor-pointer"
              style={{ accentColor: 'var(--accent-primary)' }}
            />
            
            <div className="flex justify-between text-xs text-[var(--text-secondary)] font-mono">
              <span>1</span>
              <span>11</span>
            </div>

            <button 
              onClick={handleStartConfig}
              className="w-full bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 font-medium rounded-xl px-4 py-3 transition-opacity"
            >
              Configure Cards
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'layouts') {
    return (
      <div className="min-h-screen flex flex-col p-4 md:p-8 font-sans">
        <div className="max-w-5xl w-full mx-auto flex-1 flex flex-col">
          <div className="mb-8 shrink-0">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Choose Card Layouts</h2>
            <p className="text-[var(--text-secondary)] mt-2">Select how you want each card to be displayed on your dashboard.</p>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-8">
            {cards.map((card, idx) => (
              <div key={card.id} className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-6 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-[var(--text-primary)]">{card.title || `Card ${idx + 1}`}</h3>
                  <p className="text-sm text-[var(--text-secondary)]">Primary: {card.indicator || 'None'} {card.secondaryIndicator ? `| Secondary: ${card.secondaryIndicator}` : ''}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {LAYOUTS.map(layout => (
                    <LayoutPreview 
                      key={layout.value} 
                      layout={layout.value} 
                      selected={card.layout === layout.value} 
                      onClick={() => {
                        const newCards = [...cards];
                        newCards[idx] = { ...newCards[idx], layout: layout.value };
                        setCards(newCards);
                      }} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between shrink-0 pt-4 border-t border-[var(--border-subtle)]">
            <button 
              onClick={() => { setStep('configure'); setCurrentCardIndex(cards.length - 1); }}
              className="px-6 py-3 rounded-xl font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Config
            </button>
            
            <button 
              onClick={() => {
                const hasGoogleDrive = cards.some(c => c.dataSources?.includes('Google Drive'));
                if (hasGoogleDrive) {
                  setStep('connect');
                } else {
                  setStep('contact');
                }
              }}
              className="px-8 py-3 rounded-xl font-medium bg-[var(--accent-primary)] text-[var(--bg-base)] hover:opacity-90 flex items-center gap-2 transition-opacity shadow-lg"
            >
              Connect Data <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'connect') {
    return (
      <div className="min-h-screen flex flex-col p-4 md:p-8 font-sans">
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-[var(--text-primary)]">Connect Your Data</h2>
            <p className="text-[var(--text-secondary)] mt-2">Link your Google Drive to enable drag-and-drop data imports for your configured cards.</p>
          </div>

          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 bg-[var(--accent-primary)]/10 rounded-full flex items-center justify-center mx-auto border border-[var(--accent-primary)]/20">
              <Database className="text-[var(--accent-primary)] w-10 h-10" />
            </div>
            
            <div>
              <h3 className="text-xl font-medium text-[var(--text-primary)] mb-2">Google Drive Integration</h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                Connect your Google Drive account to seamlessly drag-and-drop spreadsheets and documents directly into your dashboard.
              </p>
            </div>

            <button 
              onClick={handleGoogleLogin}
              className="mx-auto flex items-center gap-3 bg-white text-black px-6 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {isGoogleConnected ? 'Google Drive Connected' : 'Connect Google Drive'}
            </button>

            <div className="mt-8 pt-8 border-t border-[var(--border-subtle)]">
              <div className={`border-2 border-dashed rounded-xl p-8 transition-colors ${isGoogleConnected ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' : 'border-[var(--border-subtle)] bg-[var(--bg-base)]'}`}>
                <p className="text-[var(--text-secondary)] text-sm">
                  {isGoogleConnected ? 'Ready! Drag and drop files here to map them to your KPIs.' : 'Once connected, you can drag and drop files here to map them to your KPIs.'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button 
              onClick={() => setStep('layouts')}
              className="px-6 py-3 rounded-xl font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Layouts
            </button>
            
            <button 
              onClick={() => setStep('ai-model')}
              className="px-8 py-3 rounded-xl font-medium bg-[var(--accent-primary)] text-[var(--bg-base)] hover:opacity-90 flex items-center gap-2 transition-opacity shadow-lg"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'contact') {
    return (
      <div className="min-h-screen flex flex-col p-4 md:p-8 font-sans">
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-[var(--text-primary)]">Contact Us for Custom Integration</h2>
            <p className="text-[var(--text-secondary)] mt-2">You selected data sources that require custom setup. Please contact our team.</p>
          </div>

          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-xl text-center space-y-6">
            <form onSubmit={(e) => { e.preventDefault(); window.location.href = 'mailto:slau@esghg.ai'; }} className="space-y-4 max-w-md mx-auto">
              <div>
                <input type="email" placeholder="Your Email Address" required className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-3 text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] outline-none" />
              </div>
              <button type="submit" className="w-full bg-[var(--text-primary)] text-[var(--bg-base)] px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">
                Contact slau@esghg.ai
              </button>
            </form>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button 
              onClick={() => setStep('layouts')}
              className="px-6 py-3 rounded-xl font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back to Layouts
            </button>
            
            <button 
              onClick={() => setStep('ai-model')}
              className="px-8 py-3 rounded-xl font-medium bg-[var(--accent-primary)] text-[var(--bg-base)] hover:opacity-90 flex items-center gap-2 transition-opacity shadow-lg"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'ai-model') {
    return (
      <div className="min-h-screen flex flex-col p-4 md:p-8 font-sans">
        <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-semibold text-[var(--text-primary)]">Select AI Model</h2>
            <p className="text-[var(--text-secondary)] mt-2">Choose the AI platform to power your dashboard insights.</p>
          </div>

          <div className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-8 shadow-xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--accent-primary)] transition-colors cursor-pointer bg-[var(--bg-base)]">
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Gemini 3.1</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Powered by Google. Requires Google Login.</p>
                <button onClick={handleGoogleLogin} className="w-full bg-white text-black border border-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {isGoogleConnected ? 'Connected' : 'Login to Google'}
                </button>
              </div>
              <div className="border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--accent-primary)] transition-colors cursor-pointer bg-[var(--bg-base)]">
                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Google Vertex AI</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">Enterprise AI platform. Requires Google Login.</p>
                <button onClick={handleGoogleLogin} className="w-full bg-white text-black border border-gray-200 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {isGoogleConnected ? 'Connected' : 'Login to Google'}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button 
              onClick={() => {
                const hasGoogleDrive = cards.some(c => c.dataSources?.includes('Google Drive'));
                if (hasGoogleDrive) setStep('connect');
                else setStep('contact');
              }}
              className="px-6 py-3 rounded-xl font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            
            <button 
              onClick={() => onComplete(cards)}
              className="px-8 py-3 rounded-xl font-medium bg-[var(--accent-primary)] text-[var(--bg-base)] hover:opacity-90 flex items-center gap-2 transition-opacity shadow-lg"
            >
              Finish Setup <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 font-sans">
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div>
            <h2 className="text-xl font-semibold">Configuring Card {currentCardIndex + 1} of {cards.length}</h2>
            <div className="flex gap-1 mt-3">
              {cards.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all ${i === currentCardIndex ? 'w-8 bg-[var(--accent-primary)]' : i < currentCardIndex ? 'w-4 bg-[var(--accent-primary)]/40' : 'w-4 bg-[var(--border-subtle)]'}`}
                />
              ))}
            </div>
          </div>
          <button 
            onClick={() => setStep('count')}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Restart Setup
          </button>
        </div>

        <div className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-2xl p-6 md:p-8 overflow-y-auto shadow-xl">
          <div className="space-y-10">
            
            {/* 1. KPI Type */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <Settings2 className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="font-medium text-[var(--text-primary)]">1. Select KPI Category</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {KPI_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => updateCurrentCard({ type: type.value, dataSources: [], indicator: null, secondaryIndicator: null })}
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
                <motion.div 
                  key="details"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-10"
                >
                  {/* 2. Details & Data Source */}
                  <section className="space-y-4">
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Database className="w-5 h-5 text-[var(--accent-primary)]" />
                      <h3 className="font-medium text-[var(--text-primary)]">2. Details & Data Source</h3>
                    </div>
                    
                    <div className="space-y-6 bg-[var(--bg-base)] p-5 rounded-xl border border-[var(--border-subtle)]">
                      <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Card Title</label>
                        <input 
                          type="text"
                          value={currentCard.title}
                          onChange={(e) => updateCurrentCard({ title: e.target.value })}
                          placeholder="e.g., Nickel compound"
                          className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Describe what you want to track</label>
                        <textarea 
                          value={currentCard.description}
                          onChange={(e) => updateCurrentCard({ description: e.target.value })}
                          placeholder="e.g., Track the daily price of aluminum..."
                          className="w-full bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none resize-none h-24 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Select Data Source</label>
                        <div className="flex flex-wrap gap-2">
                          {DATA_SOURCES[currentCard.type].map(source => {
                            const isSelected = currentCard.dataSources?.includes(source);
                            return (
                              <button
                                key={source}
                                onClick={() => {
                                  const currentSources = currentCard.dataSources || [];
                                  if (isSelected) {
                                    updateCurrentCard({ dataSources: currentSources.filter(s => s !== source) });
                                  } else {
                                    updateCurrentCard({ dataSources: [...currentSources, source] });
                                  }
                                }}
                                className={`px-4 py-2 rounded-lg text-sm border transition-all ${isSelected ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/50' : 'bg-[var(--bg-panel)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]'}`}
                              >
                                {source}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* 3. Indicators */}
                  {(currentCard.dataSources && currentCard.dataSources.length > 0) && (
                    <motion.section 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                        <Activity className="w-5 h-5 text-[var(--accent-primary)]" />
                        <h3 className="font-medium text-[var(--text-primary)]">3. Indicators</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {INDICATORS[currentCard.type].map(ind => (
                          <button
                            key={ind.label}
                            onClick={() => {
                              if (currentCard.indicator === ind.label) {
                                updateCurrentCard({ indicator: null });
                              } else if (!currentCard.indicator) {
                                updateCurrentCard({ indicator: ind.label });
                              } else if (currentCard.secondaryIndicator === ind.label) {
                                updateCurrentCard({ secondaryIndicator: null });
                              } else {
                                updateCurrentCard({ secondaryIndicator: ind.label });
                              }
                            }}
                            className={`p-4 rounded-xl border text-left transition-all ${
                              currentCard.indicator === ind.label 
                                ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]/50 text-[var(--accent-primary)]' 
                                : currentCard.secondaryIndicator === ind.label
                                ? 'bg-[var(--accent-primary)]/5 border-[var(--accent-primary)]/30 text-[var(--accent-primary)]/80'
                                : 'bg-[var(--bg-base)] border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-secondary)]'
                            }`}
                          >
                            <div className="font-medium mb-1 flex justify-between">
                              {ind.label}
                              {currentCard.indicator === ind.label && <span className="text-xs bg-[var(--accent-primary)] text-[var(--bg-base)] px-2 py-0.5 rounded">Primary</span>}
                              {currentCard.secondaryIndicator === ind.label && <span className="text-xs border border-[var(--accent-primary)] px-2 py-0.5 rounded">Secondary</span>}
                            </div>
                            <div className="text-xs opacity-70">{ind.desc}</div>
                          </button>
                        ))}
                      </div>

                      {/* Custom Indicator Input */}
                      <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                        <label className="block text-sm text-[var(--text-secondary)] mb-2">Or define your own custom indicator</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={customIndicator}
                            onChange={(e) => setCustomIndicator(e.target.value)}
                            placeholder="e.g., Nickel compound purity"
                            className="flex-1 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] outline-none transition-all"
                          />
                          <button 
                            onClick={() => {
                              if (customIndicator.trim()) {
                                if (!currentCard.indicator) {
                                  updateCurrentCard({ indicator: customIndicator.trim() });
                                } else if (currentCard.indicator !== customIndicator.trim() && currentCard.secondaryIndicator !== customIndicator.trim()) {
                                  updateCurrentCard({ secondaryIndicator: customIndicator.trim() });
                                }
                                setCustomIndicator('');
                              }
                            }}
                            className="px-4 py-2 bg-[var(--border-subtle)] hover:bg-[var(--text-secondary)] text-[var(--text-primary)] rounded-lg text-sm font-medium transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        
                        {/* Show selected custom indicators */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {[currentCard.indicator, currentCard.secondaryIndicator].filter(Boolean).map(ind => {
                            const isDefault = INDICATORS[currentCard.type!].some(i => i.label === ind);
                            if (isDefault) return null;
                            return (
                              <div key={ind} className="flex items-center gap-2 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/50 text-[var(--accent-primary)] px-3 py-1.5 rounded-lg text-sm">
                                <span>{ind}</span>
                                <button 
                                  onClick={() => {
                                    if (currentCard.indicator === ind) updateCurrentCard({ indicator: null });
                                    if (currentCard.secondaryIndicator === ind) updateCurrentCard({ secondaryIndicator: null });
                                  }}
                                  className="hover:text-[var(--text-primary)]"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.section>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between shrink-0">
          <button 
            onClick={() => setCurrentCardIndex(c => Math.max(0, c - 1))}
            disabled={currentCardIndex === 0}
            className="px-6 py-3 rounded-xl font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:hover:text-[var(--text-secondary)] flex items-center gap-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          
          <button 
            onClick={handleNextCard}
            disabled={!currentCard.indicator}
            className="px-8 py-3 rounded-xl font-medium bg-[var(--text-primary)] text-[var(--bg-base)] hover:opacity-90 disabled:opacity-50 flex items-center gap-2 transition-opacity shadow-lg"
          >
            {currentCardIndex === cards.length - 1 ? 'Choose Layouts' : 'Next Card'} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

