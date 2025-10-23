import type { ThemeId } from '@/store/uiStore'

export interface ThemeOption {
  id: ThemeId
  order: number
  label: string
  description: string
}

export interface ThemeStyleTokens {
  page: string
  card: string
  ticker: string
  positive: string
  negative: string
  muted: string
  mutedStrong: string
  highlight: string
  tableHead: string
  tableRow: string
  divider: string
  tradeRow: string
  chip: string
  chipActive: string
  switcher: string
  switcherButton: string
  switcherButtonActive: string
  statusDot: string
  statusDotActive: string
  badge: string
  statusPill: string
  chartBackground: string
  chartGrid: string
  chartText: string
  chartLine: string
}

export const themeOptions: ThemeOption[] = [
  {
    id: 'classic',
    order: 1,
    label: 'Classic',
    description: 'Glassmorphism на тёмном синем фоне с изумрудными акцентами',
  },
  {
    id: 'neon',
    order: 2,
    label: 'Neon Pulse',
    description: 'Неоновые подсветки, фиолетовые градиенты и свечения',
  },
  {
    id: 'carbon',
    order: 3,
    label: 'Carbon Fiber',
    description: 'Графитовый карбон с золотыми акцентами и строгой типографикой',
  },
]

export const themeStyles: Record<ThemeId, ThemeStyleTokens> = {
  classic: {
    page: 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100',
    card: 'bg-slate-900/60 border border-slate-800 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-sm',
    ticker: 'bg-slate-900/60 border border-slate-800 backdrop-blur-sm',
    positive: 'text-emerald-400',
    negative: 'text-rose-400',
    muted: 'text-slate-400',
    mutedStrong: 'text-slate-300',
    highlight: 'text-slate-100',
    tableHead: 'bg-slate-900/70 text-slate-300',
    tableRow: 'border-t border-slate-800/70 hover:bg-slate-900/60',
    divider: 'divide-slate-800/70',
    tradeRow: 'hover:bg-slate-900/60',
    chip: 'bg-slate-800/70 text-slate-300 hover:bg-slate-800',
    chipActive: 'bg-emerald-500 text-slate-900 shadow-[0_10px_25px_rgba(16,185,129,0.35)]',
    switcher: 'bg-slate-900/60 border border-slate-700/60 shadow-[0_10px_30px_rgba(14,116,144,0.25)] backdrop-blur-lg',
    switcherButton: 'text-slate-300 hover:text-emerald-400',
    switcherButtonActive: 'bg-emerald-500 text-slate-900 shadow-[0_10px_25px_rgba(16,185,129,0.45)]',
    statusDot: 'bg-rose-500',
    statusDotActive: 'bg-emerald-500',
    badge: 'text-slate-300',
    statusPill: 'border border-slate-700/60 bg-slate-900/60 backdrop-blur-lg',
    chartBackground: '#0b1220',
    chartGrid: '#1f2937',
    chartText: '#cbd5e1',
    chartLine: '#10b981',
  },
  neon: {
    page: 'bg-gradient-to-br from-[#04010f] via-[#111827] to-[#581c87] text-[#f9fafb]',
    card: 'bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] shadow-[0_0_45px_rgba(124,58,237,0.35)] backdrop-blur-lg',
    ticker: 'bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.16)] backdrop-blur-lg',
    positive: 'text-[#6cfdd6]',
    negative: 'text-[#ff7b9c]',
    muted: 'text-[#cbd5f5]',
    mutedStrong: 'text-[#e9d5ff]',
    highlight: 'text-white',
    tableHead: 'bg-[rgba(255,255,255,0.12)] text-[#ede9fe]',
    tableRow: 'border-t border-[rgba(255,255,255,0.16)] hover:bg-[rgba(255,255,255,0.08)]',
    divider: 'divide-[rgba(255,255,255,0.14)]',
    tradeRow: 'hover:bg-[rgba(255,255,255,0.08)]',
    chip: 'bg-[rgba(255,255,255,0.08)] text-[#ede9fe] hover:bg-[rgba(139,92,246,0.18)]',
    chipActive: 'bg-[#8b5cf6] text-white shadow-[0_0_25px_rgba(139,92,246,0.6)]',
    switcher: 'bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.24)] shadow-[0_0_35px_rgba(139,92,246,0.45)] backdrop-blur-xl',
    switcherButton: 'text-[#ede9fe] hover:text-[#c4b5fd]',
    switcherButtonActive: 'bg-[#8b5cf6] text-white shadow-[0_0_25px_rgba(139,92,246,0.6)]',
    statusDot: 'bg-[#f87171]',
    statusDotActive: 'bg-[#6cfdd6]',
    badge: 'text-[#d1d5ff]',
    statusPill: 'border border-[rgba(255,255,255,0.28)] bg-[rgba(255,255,255,0.12)] backdrop-blur-xl',
    chartBackground: '#060114',
    chartGrid: '#312e81',
    chartText: '#ede9fe',
    chartLine: '#8b5cf6',
  },
  carbon: {
    page: 'bg-gradient-to-br from-[#050505] via-[#0f172a] to-[#111927] text-[#f8fafc]',
    card: 'bg-[#101418] border border-[#1f2937] shadow-[0_20px_60px_rgba(0,0,0,0.55)]',
    ticker: 'bg-[#0d1217] border border-[#1f2937]',
    positive: 'text-[#facc15]',
    negative: 'text-[#f87171]',
    muted: 'text-[#94a3b8]',
    mutedStrong: 'text-[#e2e8f0]',
    highlight: 'text-[#f8fafc]',
    tableHead: 'bg-[#111827] text-[#cbd5f5]',
    tableRow: 'border-t border-[#1f2937] hover:bg-[#1f2937]/70',
    divider: 'divide-[#1f2937]',
    tradeRow: 'hover:bg-[#1f2937]/70',
    chip: 'bg-[#1f2937] text-[#e2e8f0] hover:bg-[#2563eb]/20',
    chipActive: 'bg-[#facc15] text-[#111827] shadow-[0_10px_25px_rgba(250,204,21,0.4)]',
    switcher: 'bg-[#0f172a] border border-[#1e293b] shadow-[0_0_35px_rgba(14,116,144,0.25)]',
    switcherButton: 'text-[#cbd5f5] hover:text-[#facc15]',
    switcherButtonActive: 'bg-[#facc15] text-[#111827] shadow-[0_10px_25px_rgba(250,204,21,0.45)]',
    statusDot: 'bg-[#f87171]',
    statusDotActive: 'bg-[#facc15]',
    badge: 'text-[#cbd5f5]',
    statusPill: 'border border-[#1e293b] bg-[#0f172a] backdrop-blur-lg',
    chartBackground: '#080b12',
    chartGrid: '#1f2937',
    chartText: '#e2e8f0',
    chartLine: '#facc15',
  },
}
