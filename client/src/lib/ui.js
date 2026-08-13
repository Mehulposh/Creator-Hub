import { cn } from './cn';
import { useAppStore } from '../store/useAppStore';

export function useTheme() {
  return useAppStore((s) => s.theme === 'dark');
}

export const ui = {
  shell: (d) => cn(
    'flex min-h-screen transition-colors duration-200',
    d
      ? 'bg-[#110f1a] text-[#f4f1fb] [background-image:radial-gradient(circle_at_100%_0,#372454_0,transparent_30%),radial-gradient(circle_at_30%_90%,#1e1734_0,transparent_35%)]'
      : 'bg-[#f6f6fb] text-[#28243b] [background-image:radial-gradient(circle_at_90%_0,#e9e1ff_0,transparent_30%)]'
  ),
  sidebar: (d, open) => cn(
    'fixed z-[3] flex h-screen w-[250px] flex-col overflow-hidden border-r p-[27px_16px] backdrop-blur-[22px] transition-transform max-[680px]:w-[220px]',
    d ? 'border-violet-300/10 bg-[#181423bf]' : 'border-violet-200/15 bg-white/75',
    open ? 'max-[680px]:translate-x-0' : 'max-[680px]:-translate-x-full max-[680px]:transition-transform'
  ),
  brand: 'flex items-center gap-2 px-2.5 pb-7 font-display text-[23px] font-bold tracking-tight',
  brandMark: 'grid h-[30px] w-[30px] place-items-center rounded-[10px] bg-gradient-to-br from-[#b197fc] to-[#6c48df] text-white shadow-lg shadow-violet-500/30',
  workspace: (d) => cn(
    'mb-6 flex items-center gap-2 rounded-[14px] border p-[11px_9px]',
    d ? 'border-violet-300/10 bg-violet-500/10' : 'border-violet-200/15 bg-violet-500/5'
  ),
  avatar: 'grid h-8 w-8 place-items-center rounded-[11px] bg-gradient-to-br from-[#ffcfb9] to-[#db7d9e] text-[10px] font-bold text-[#5d2944]',
  navBtn: (d, active) => cn(
    'flex w-full items-center gap-3 rounded-[10px] border-0 px-3 py-[11px] text-left text-[13px] cursor-pointer',
    active
      ? 'bg-gradient-to-r from-[#8b66f6] to-[#a87bff] text-white shadow-lg shadow-violet-500/30'
      : d ? 'bg-transparent text-[#aaa4b9]' : 'bg-transparent text-[#817b94]'
  ),
  sidebarBottom: (d) => cn('mt-auto border-t pt-2.5', d ? 'border-violet-300/10' : 'border-violet-200/15'),
  content: 'ml-[250px] w-[calc(100%-250px)] max-w-[1720px] px-[42px] pb-[42px] max-[1050px]:ml-[220px] max-[1050px]:w-[calc(100%-220px)] max-[1050px]:px-6 max-[680px]:ml-0 max-[680px]:w-full max-[680px]:px-4',
  topHeader: (d) => cn('flex h-20 items-center justify-between border-b', d ? 'border-violet-300/10' : 'border-violet-200/15'),
  iconBtn: (d) => cn(
    'grid h-9 w-9 place-items-center rounded-[10px] border',
    d ? 'border-violet-300/10 bg-violet-950/40 text-[#f4f1fb]' : 'border-violet-200/15 bg-white/70 text-[#28243b]'
  ),
  mobileMenu: (d) => cn('hidden max-[680px]:grid', ui.iconBtn(d)),
  search: (d) => cn('flex items-center gap-2 max-[680px]:hidden', d ? 'text-[#aaa4b9]' : 'text-[#817b94]'),
  searchInput: (d) => cn('w-[210px] border-0 bg-transparent outline-none', d ? 'text-[#f4f1fb]' : 'text-[#28243b]'),
  page: 'pt-9',
  sectionHead: 'mb-7 flex items-center justify-between gap-4 max-[680px]:flex-col max-[680px]:items-start',
  eyebrow: 'mb-1.5 text-[10px] font-bold tracking-[0.12em] text-violet-500',
  h1: 'font-display text-[28px] font-semibold tracking-tight max-[680px]:text-[23px]',
  h2: 'font-display text-[28px] font-semibold tracking-tight',
  h3: 'font-display text-base font-semibold',
  muted: (d) => cn('text-[13px]', d ? 'text-[#aaa4b9]' : 'text-[#817b94]'),
  primary: 'inline-flex items-center gap-2 rounded-[10px] border-0 bg-gradient-to-br from-[#8561ee] to-[#b27cff] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 disabled:opacity-60',
  secondary: (d) => cn(
    'inline-flex items-center gap-2 rounded-[10px] border px-4 py-2.5 text-sm font-semibold',
    d ? 'border-violet-300/15 bg-violet-500/10 text-violet-200' : 'border-violet-200/30 bg-white text-violet-700'
  ),
  card: (d) => cn(
    'rounded-[17px] border backdrop-blur-[18px] shadow-lg',
    d ? 'border-violet-300/10 bg-violet-950/40' : 'border-violet-200/15 bg-white/70'
  ),
  cardTitle: 'mb-4 flex items-start justify-between gap-3',
  loading: (d) => cn('flex items-center justify-center gap-2.5 py-16 text-sm', d ? 'text-[#aaa4b9]' : 'text-[#817b94]'),
  empty: (d) => cn(
    'flex min-h-[280px] flex-col items-center justify-center rounded-[17px] border p-6 text-center',
    d ? 'border-violet-300/10 bg-violet-950/40' : 'border-violet-200/15 bg-white/70'
  ),
  emptyIcon: 'mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/15 text-violet-400',
  formError: 'text-[11px] text-rose-400',
  modalBackdrop: 'fixed inset-0 z-10 grid place-items-center bg-[#090513a8] p-5 backdrop-blur-sm',
  modal: (d) => cn('relative w-full max-w-[500px] rounded-[17px] border p-6', ui.card(d)),
  closeBtn: (d) => cn('absolute right-4 top-4 border-0 bg-transparent', d ? 'text-[#aaa4b9]' : 'text-[#817b94]'),
  label: (d) => cn('mt-3.5 block text-[11px] font-bold', d ? 'text-[#c5bdd7]' : 'text-[#28243b]'),
  input: (d) => cn(
    'mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm outline-none',
    d ? 'border-violet-300/15 bg-[#110f1a] text-white' : 'border-violet-200/30 bg-[#f6f6fb] text-[#28243b]'
  ),
  textarea: (d) => cn(ui.input(d), 'min-h-[74px] resize-y'),
  formRow: 'grid grid-cols-2 gap-3 max-[500px]:grid-cols-1',
  wide: 'mt-5 w-full justify-center',
  metrics: 'grid grid-cols-4 gap-4 max-[1050px]:grid-cols-2 max-[680px]:grid-cols-2 max-[680px]:gap-2.5',
  metric: (d) => cn('relative p-[17px] max-[680px]:p-3.5', ui.card(d)),
  metricIcon: {
    violet: 'text-[#a98aff] bg-[#a98aff20]',
    blue: 'text-[#55b5e8] bg-[#55b5e820]',
    pink: 'text-[#e986ae] bg-[#e986ae20]',
    orange: 'text-[#f2a35f] bg-[#f2a35f20]',
    purple: 'text-[#ae91ff] bg-[#a98aff20]'
  },
  metricIconBase: 'mb-4 grid h-9 w-9 place-items-center rounded-[11px]',
  grid2: 'mt-4 grid grid-cols-[1.55fr_1fr] gap-4 max-[1050px]:grid-cols-1',
  productGrid: 'grid grid-cols-3 gap-4 max-[800px]:grid-cols-2 max-[500px]:grid-cols-1',
  pill: (status) => cn(
    'inline-block rounded-full px-2 py-1 text-[10px] font-bold capitalize',
    {
      published: 'bg-emerald-500/15 text-emerald-400',
      draft: 'bg-gray-500/15 text-gray-400',
      paid: 'bg-emerald-500/15 text-emerald-400',
      pending: 'bg-amber-500/15 text-amber-400',
      lead: 'bg-violet-500/15 text-violet-300',
      customer: 'bg-blue-500/15 text-blue-300',
      subscriber: 'bg-pink-500/15 text-pink-300',
      confirmed: 'bg-emerald-500/15 text-emerald-400',
      sent: 'bg-emerald-500/15 text-emerald-400',
      scheduled: 'bg-amber-500/15 text-amber-400',
      active: 'bg-emerald-500/15 text-emerald-400',
      inactive: 'bg-gray-500/15 text-gray-400',
      creator: 'bg-violet-500/15 text-violet-300',
      admin: 'bg-rose-500/15 text-rose-300',
      discussion: 'bg-blue-500/15 text-blue-300',
      announcement: 'bg-amber-500/15 text-amber-300',
      win: 'bg-emerald-500/15 text-emerald-400'
    }[status] || 'bg-violet-500/15 text-violet-300'
  ),
  tableCard: (d) => cn('overflow-hidden p-0', ui.card(d)),
  tableHead: (d) => cn(
    'grid grid-cols-4 gap-3 border-b px-4 py-3 text-[10px] font-bold uppercase tracking-wide',
    d ? 'border-violet-300/10 text-[#aaa4b9]' : 'border-violet-200/15 text-[#817b94]'
  ),
  tableRow: (d) => cn(
    'grid grid-cols-4 items-center gap-3 border-b px-4 py-3 text-sm last:border-0',
    d ? 'border-violet-300/10' : 'border-violet-200/15'
  ),
  notificationDot: 'absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-400'
};
