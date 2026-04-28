import { useState } from 'react';
import { CardConfig, User, Theme, Timeframe, KPIType, CardLayout } from '../types';
import {
  Settings, LogOut, Activity, DollarSign, Clock, ShieldCheck, BookOpen,
  Factory, Palette, Edit2, Check, X, TrendingUp, BarChart, LineChart,
  MessageSquare, Cpu, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ICONS: Record<string, React.ElementType> = {
  price: DollarSign, time: Clock, control: ShieldCheck, training: BookOpen,
  emission: Factory, roi: TrendingUp, irr: BarChart, beta: LineChart,
};

const THEMES: { value: Theme; label: string; color: string }[] = [
  { value: 'dark',           label: 'Dark',        color: '#09090b' },
  { value: 'light',          label: 'Light',       color: '#f4f4f5' },
  { value: 'grey',           label: 'Grey',        color: '#52525b' },
  { value: 'blue-yellow',    label: 'Blue/Yellow', color: '#1e3a8a' },
  { value: 'mandarin-green', label: 'Mandarin',    color: '#ea580c' },
];

function getGridClass(count: number) {
  if (count === 1) return 'grid-cols-1 grid-rows-1';
  if (count === 2) return 'grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1';
  if (count <= 4) return 'grid-cols-2 grid-rows-2';
  if (count <= 6) return 'grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2';
  if (count <= 9) return 'grid-cols-2 md:grid-cols-3 grid-rows-auto md:grid-rows-3';
  return 'grid-cols-2 md:grid-cols-4 grid-rows-auto md:grid-rows-3';
}

// Stable mock data — does NOT use Math.random() so it stops flickering
function getMockData(type: KPIType | null, tf: Timeframe) {
  const m = tf === 'daily' ? 1 : tf === 'weekly' ? 7 : 30;
  if (type === 'price')    return { val: `$${(1240.50 + m * 3.2).toFixed(2)}`,     trend: '+2.4%' };
  if (type === 'time')     return { val: `${(94.2 - m * 0.1).toFixed(1)}%`,        trend: '+1.1%' };
  if (type === 'control')  return { val: `${(0.02 * m).toFixed(2)}%`,              trend: '-0.01%' };
  if (type === 'training') return { val: `${Math.min(100, 85 + m)}%`,              trend: '+5%' };
  if (type === 'emission') return { val: `${(12.4 * m).toFixed(1)}t`,              trend: '-2.1%' };
  if (type === 'roi')      return { val: `${(15.4 + m * 0.04).toFixed(1)}%`,      trend: '+1.2%' };
  if (type === 'irr')      return { val: `${(12.1 + m * 0.02).toFixed(1)}%`,      trend: '+0.5%' };
  if (type === 'beta')     return { val: `${(1.15 + m * 0.001).toFixed(2)}`,       trend: '-0.05' };
  return { val: '--', trend: '' };
}

export default function Dashboard({
  cards, setCards, user, theme, setTheme, onReset, onLogout,
}: {
  cards: CardConfig[];
  setCards: (cards: CardConfig[]) => void;
  user: User;
  theme: Theme;
  setTheme: (t: Theme) => void;
  onReset: () => void;
  onLogout: () => void;
}) {
  const [timeframes, setTimeframes] = useState<Record<string, Timeframe>>({});
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  const updateCard = (cardId: string, updates: Partial<CardConfig>) =>
    setCards(cards.map(c => c.id === cardId ? { ...c, ...updates } : c));

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-14 border-b border-[var(--border-subtle)] flex items-center justify-between px-4 shrink-0 bg-[var(--bg-panel)]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--accent-primary)]/10 rounded-lg flex items-center justify-center border border-[var(--accent-primary)]/20">
            <Factory className="text-[var(--accent-primary)] w-4 h-4" />
          </div>
          <span className="font-semibold tracking-tight">6K Inc</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4 relative">
          <button
            onClick={() => window.open('https://console.cloud.google.com/vertex-ai', '_blank')}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg text-xs font-medium transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" /> Vertex AI
          </button>
          <div className="text-xs text-[var(--text-secondary)] hidden sm:block font-mono">{user.email}</div>

          {/* Theme switcher */}
          <div className="relative">
            <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-lg transition-colors">
              <Palette className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {showThemeMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {THEMES.map(t => (
                    <button
                      key={t.value}
                      onClick={() => { setTheme(t.value); setShowThemeMenu(false); }}
                      className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 hover:bg-[var(--bg-base)] transition-colors ${theme === t.value ? 'text-[var(--accent-primary)] font-medium' : 'text-[var(--text-secondary)]'}`}
                    >
                      <div className="w-4 h-4 rounded-full border border-[var(--border-subtle)]" style={{ backgroundColor: t.color }} />
                      {t.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={onReset} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-lg transition-colors" title="Reconfigure">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={onLogout} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] rounded-lg transition-colors" title="Logout">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Dashboard canvas */}
      <main className="flex-1 p-2 md:p-4 overflow-y-auto md:overflow-hidden">
        <div className={`grid gap-2 md:gap-4 h-full w-full ${getGridClass(cards.length)}`}>
          {cards.map((card) => {
            const Icon = card.type ? (ICONS[card.type] ?? Activity) : Activity;
            const tf = timeframes[card.id] ?? 'daily';

            // Use AI-extracted value when available, otherwise mock
                const hasAI = !!card.aiData;
                const displayVal = hasAI
                  ? (card.aiData!.unit && card.aiData!.unit !== 'no unit'
                      ? `${card.aiData!.value} ${card.aiData!.unit}`
                      : card.aiData!.value)
                  : getMockData(card.type, tf).val;
                const displayTrend = hasAI ? card.aiData!.trend : getMockData(card.type, tf).trend;

            const isPositive =
              (displayTrend.startsWith('+') && card.type !== 'emission' && card.type !== 'price' && card.type !== 'control') ||
              (displayTrend.startsWith('-') && (card.type === 'emission' || card.type === 'control'));

            const isEditing = editingCardId === card.id;
            const isInsightExpanded = expandedInsight === card.id;

            return (
              <motion.div
                layout key={card.id}
                className="bg-[var(--bg-panel)] border border-[var(--border-subtle)] rounded-xl p-3 md:p-5 flex flex-col relative overflow-hidden group hover:border-[var(--accent-primary)]/50 transition-colors shadow-sm"
              >
                {isEditing ? (
                  <div className="flex flex-col h-full z-20 bg-[var(--bg-panel)]">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium text-[var(--text-primary)]">Edit Card</h4>
                      <button onClick={() => setEditingCardId(null)} className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                      <div>
                        <label className="text-xs text-[var(--text-secondary)] block mb-1">Card Title</label>
                        <input
                          type="text" value={card.title}
                          onChange={(e) => updateCard(card.id, { title: e.target.value })}
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-2 text-sm text-[var(--text-primary)] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-secondary)] block mb-1">Layout Style</label>
                        <select
                          value={card.layout}
                          onChange={(e) => updateCard(card.id, { layout: e.target.value as CardLayout })}
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-2 text-sm text-[var(--text-primary)] outline-none"
                        >
                          <option value="standard">Standard</option>
                          <option value="hero-top-left">Hero Top Left</option>
                          <option value="split-metrics">Split Metrics</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-secondary)] block mb-1">Description</label>
                        <textarea
                          value={card.description}
                          onChange={(e) => updateCard(card.id, { description: e.target.value })}
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-2 text-sm text-[var(--text-primary)] outline-none resize-none h-16"
                        />
                      </div>
                    </div>
                    <button onClick={() => setEditingCardId(null)} className="mt-2 w-full bg-[var(--accent-primary)] text-[var(--bg-base)] py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90">
                      <Check className="w-4 h-4" /> Done
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Hover actions */}
                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                      {card.aiData && (
                        <button
                          onClick={() => setExpandedInsight(isInsightExpanded ? null : card.id)}
                          className="p-1.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] shadow-sm"
                          title="AI Insight"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => window.open('https://ai.studio/apps/578e7c95-80e9-4011-9091-7ecba534c3e8', '_blank')}
                        className="p-1.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)] hover:text-emerald-500 hover:border-emerald-500 shadow-sm"
                        title="Send to xox"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingCardId(card.id)}
                        className="p-1.5 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-md text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] shadow-sm"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Timeframe toggle — only shown when using mock data */}
                    {!hasAI && (
                      <div className="absolute bottom-3 right-3 flex bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg p-0.5 z-20">
                        {(['daily', 'weekly', 'monthly'] as Timeframe[]).map(t => (
                          <button
                            key={t}
                            onClick={() => setTimeframes(prev => ({ ...prev, [card.id]: t }))}
                            className={`px-2 py-1 text-[10px] uppercase font-bold rounded-md transition-colors ${tf === t ? 'bg-[var(--bg-panel)] text-[var(--accent-primary)] shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                          >
                            {t.charAt(0)}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* AI source badge */}
                    {hasAI && (
                      <div className="absolute bottom-3 right-3 z-20">
                        <span className="text-[10px] font-mono bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 px-2 py-0.5 rounded-full">
                          AI
                        </span>
                      </div>
                    )}

                    {/* AI Insight overlay */}
                    <AnimatePresence>
                      {isInsightExpanded && card.aiData && (
                        <motion.div
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="absolute inset-0 z-30 bg-[var(--bg-panel)]/96 rounded-xl p-4 flex flex-col"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider">AI Insight</span>
                            <button onClick={() => setExpandedInsight(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                         <p className="text-sm text-[var(--text-primary)] leading-relaxed">{card.aiData.insight}</p>
                            {card.aiData.calculationSteps && (
                              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
                                <div className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-semibold">Calculation</div>
                                <pre className="text-[10px] text-[var(--text-secondary)] whitespace-pre-wrap font-mono leading-relaxed overflow-y-auto max-h-40">
                                  {card.aiData.calculationSteps}
                                </pre>
                              </div>
                            )}
                    </AnimatePresence>

                    {/* Card layouts */}
                    {card.layout === 'hero-top-left' ? (
                      <div className="flex flex-col h-full justify-between z-10">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1 truncate max-w-[200px]">{card.title || 'Untitled'}</h3>
                            <div className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">{card.indicator || 'Unconfigured'}</div>
                            <div className="text-4xl md:text-6xl font-mono tracking-tighter text-[var(--text-primary)]">{displayVal}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>
                        <div className="flex justify-between items-end pb-6">
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 max-w-[60%]">{card.description}</p>
                          {card.secondaryIndicator && (
                            <div className="text-right">
                              <div className="text-[10px] text-[var(--text-secondary)] uppercase">{card.secondaryIndicator}</div>
                              <div className="text-xl font-mono text-[var(--text-primary)]">{secValue}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : card.layout === 'split-metrics' ? (
                      <div className="flex flex-col h-full z-10">
                        <div className="flex items-center gap-2 mb-4">
                          <Icon className="w-4 h-4 text-[var(--accent-primary)]" />
                          <div>
                            <h3 className="text-sm font-bold text-[var(--text-primary)]">{card.title || 'Untitled'}</h3>
                            <div className="text-xs text-[var(--text-secondary)]">{card.indicator}</div>
                          </div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4 items-center pb-6">
                          <div>
                            <div className="text-xs text-[var(--text-secondary)] mb-1">Primary</div>
                            <div className="text-2xl md:text-3xl font-mono text-[var(--text-primary)]">{displayVal}</div>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm mt-1 inline-block ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {displayTrend}
                            </span>
                          </div>
                          {card.secondaryIndicator && (
                            <div className="border-l border-[var(--border-subtle)] pl-4">
                              <div className="text-xs text-[var(--text-secondary)] mb-1">{card.secondaryIndicator}</div>
                              <div className="text-xl md:text-2xl font-mono text-[var(--text-primary)]">{secValue}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Standard */
                      <div className="flex flex-col h-full z-10">
                        <div className="flex items-start justify-between mb-2 md:mb-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[140px] md:max-w-[200px]">{card.title || 'Untitled'}</h3>
                              <p className="text-xs text-[var(--text-secondary)] truncate max-w-[140px] md:max-w-[200px]">{card.indicator || 'Unconfigured'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex items-baseline gap-3">
                            <span className="text-3xl md:text-5xl font-mono tracking-tight text-[var(--text-primary)]">{displayVal}</span>
                            {displayTrend && (
                              <span className={`text-xs font-mono px-2 py-1 rounded-md ${isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                {displayTrend}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 pt-3 border-t border-[var(--border-subtle)] pb-6">
                          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                            {card.description || 'No description provided.'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gradient-to-br from-transparent to-[var(--accent-primary)]/5 rounded-full blur-2xl pointer-events-none group-hover:to-[var(--accent-primary)]/10 transition-colors" />
                  </>
                )}
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
