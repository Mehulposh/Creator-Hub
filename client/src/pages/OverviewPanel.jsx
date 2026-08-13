import { useEffect, useState } from 'react';
import { CalendarDays, CircleDollarSign, Compass, CreditCard, LoaderCircle, Plus, Sparkles, Users } from 'lucide-react';
import { aiApi, analyticsApi } from '../lib/api';
import { useTheme, ui } from '../lib/ui';
import { LoadingBlock } from '../components/ui';
import { cn } from '../lib/cn';

const productGradients = [
  'bg-gradient-to-br from-[#6b4ac2] to-[#d59eff] text-white',
  'bg-gradient-to-br from-[#f2c1bc] to-[#ecb5dd] text-[#5f346b]',
  'bg-gradient-to-br from-[#6bd6d6] to-[#3381a2] text-white',
];

export function OverviewPanel({ user, onNavigate }) {
  const isDark = useTheme();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    analyticsApi.overview().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  const askAi = async (text) => {
    const question = text || prompt;
    if (!question.trim()) return;
    setPrompt('');
    setAiLoading(true);
    try {
      const result = await aiApi.generate({ prompt: question, context: `Creator: ${user.name}, Store: ${user.storeName || 'not set'}` });
      setAiReply(result.content);
    } catch (e) {
      setAiReply(e.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) return <LoadingBlock text="Loading dashboard..." isDark={isDark} />;

  const metrics = data ? [
    ['Total revenue', `$${data.revenue.toFixed(2)}`, CircleDollarSign, 'violet'],
    ['Store visits', data.storeVisits.toLocaleString(), Compass, 'blue'],
    ['New customers', data.contacts.toLocaleString(), Users, 'pink'],
    ['Conversion rate', data.sales && data.storeVisits ? `${((data.sales / data.storeVisits) * 100).toFixed(2)}%` : '0%', CreditCard, 'orange'],
  ] : [];

  const chartPoints = data?.chart || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const chartPath = chartPoints.map((v, i) => {
    const x = (i / (chartPoints.length - 1)) * 700;
    const y = 220 - (v / 100) * 200;
    return `${i === 0 ? 'M' : 'L'}${x} ${y}`;
  }).join(' ');

  return (
    <>
      <div className={cn(ui.page, ui.sectionHead)}>
        <div>
          <p className={ui.eyebrow}>
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()}
          </p>
          <h1 className={ui.h1}>
            Good morning, {user.name.split(' ')[0]} <span className="text-violet-400">✦</span>
          </h1>
          <p className={ui.muted(isDark)}>Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <button type="button" className={ui.primary} onClick={() => onNavigate('Products')}>
          <Plus size={18} />Create new
        </button>
      </div>

      <section className={ui.metrics}>
        {metrics.map(([label, value, Icon, color]) => (
          <article className={ui.metric(isDark)} key={label}>
            <div className={cn(ui.metricIconBase, ui.metricIcon[color])}>
              <Icon size={20} />
            </div>
            <p className={cn('mb-1.5 text-xs', ui.muted(isDark))}>{label}</p>
            <h2 className="font-display text-[21px] font-semibold tracking-tight">{value}</h2>
          </article>
        ))}
      </section>

      <section className={ui.grid2}>
        <article className={cn(ui.card(isDark), 'p-5 max-[680px]:p-4')}>
          <div className={ui.cardTitle}>
            <div>
              <h3 className={ui.h3}>Revenue overview</h3>
              <p className={ui.muted(isDark)}>Track your earnings over time</p>
            </div>
          </div>
          <div className="relative mt-[22px] h-[230px]">
            <svg className="ml-10 h-[185px] w-[calc(100%-40px)]" viewBox="0 0 700 235" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fill" x1="0" x2="0" y1="0" y2="1">
                  <stop stopColor="#8b5cf6" stopOpacity=".35" />
                  <stop offset="1" stopColor="#8b5cf6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${chartPath} L700 235 L0 235 Z`} fill="url(#fill)" />
              <path d={chartPath} fill="none" stroke="#9b7bff" strokeWidth="3" />
            </svg>
          </div>
        </article>

        <article
          className={cn(
            ui.card(isDark),
            'p-5 max-[680px]:p-4',
            isDark
              ? 'bg-gradient-to-br from-violet-600/35 to-violet-950/55'
              : 'bg-gradient-to-br from-violet-200/40 to-violet-50/80'
          )}
        >
          <span className="mb-4 grid h-10 w-10 place-items-center rounded-[13px] bg-violet-400/20 text-violet-300">
            <Sparkles size={20} />
          </span>
          <p className={ui.eyebrow}>AI BUSINESS ASSISTANT</p>
          <h3 className={ui.h3}>What can I help you create?</h3>
          <p className={cn('mb-6 text-xs leading-relaxed', isDark ? 'text-[#d0c9dc]' : ui.muted(isDark))}>
            Get ideas, write copy, plan content, and grow your business.
          </p>
          <form
            className={cn(
              'flex items-center justify-between rounded-[11px] border p-2 pl-3 text-xs',
              isDark ? 'border-violet-300/17 bg-[#100b1e66] text-[#aaa0c1]' : 'border-violet-200/30 bg-white/60 text-[#817b94]'
            )}
            onSubmit={(e) => { e.preventDefault(); askAi(); }}
          >
            <input
              className="flex-1 border-0 bg-transparent text-sm outline-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask your assistant..."
            />
            <button
              type="submit"
              disabled={aiLoading}
              className="grid h-[29px] w-[29px] place-items-center rounded-lg border-0 bg-[#9a79f6] text-white disabled:opacity-60"
            >
              <Sparkles size={17} />
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ['Write a post', 'Write a social media post for my latest product'],
              ['Product ideas', 'Suggest 3 digital product ideas for my niche'],
              ['Plan my week', 'Plan my content and business tasks for this week'],
            ].map(([label, query]) => (
              <button
                key={label}
                type="button"
                className={cn(
                  'rounded-md border px-2 py-1 text-[10px]',
                  isDark ? 'border-violet-300/18 bg-violet-400/10 text-violet-200' : 'border-violet-200/30 bg-violet-100/60 text-violet-700'
                )}
                onClick={() => askAi(query)}
              >
                {label}
              </button>
            ))}
          </div>
          {(aiReply || aiLoading) && (
            <div className={cn('mt-4 rounded-lg p-3 text-xs leading-relaxed', isDark ? 'bg-black/20 text-[#d0c9dc]' : 'bg-violet-50 text-[#28243b]')}>
              {aiLoading ? 'Thinking...' : aiReply}
            </div>
          )}
        </article>
      </section>

      <section className={cn(ui.grid2, 'mt-4')}>
        <article className={cn(ui.card(isDark), 'p-5 max-[680px]:p-4')}>
          <div className={ui.cardTitle}>
            <div>
              <h3 className={ui.h3}>Top products</h3>
              <p className={ui.muted(isDark)}>Your best performers</p>
            </div>
            <button type="button" className="cursor-pointer border-0 bg-transparent text-[11px] text-violet-400" onClick={() => onNavigate('Products')}>
              View all
            </button>
          </div>
          {(data?.topProducts || []).map((item, i) => (
            <div
              className={cn(
                'grid grid-cols-[43px_1fr_auto] items-center gap-3 border-b py-3 last:border-0',
                isDark ? 'border-violet-300/10' : 'border-violet-200/15'
              )}
              key={item.title}
            >
              <div className={cn('grid h-10 w-10 place-items-center rounded-[9px] font-bold', productGradients[i] || productGradients[0])}>
                {i === 0 ? '✦' : i === 1 ? 'N' : '▶'}
              </div>
              <div>
                <b className="text-xs">{item.title}</b>
                <small className={cn('mt-1 block text-[10px]', ui.muted(isDark))}>{item.type}</small>
              </div>
              <div className="text-right">
                <b className="text-xs">${Number(item.price).toFixed(2)}</b>
                <small className={cn('mt-1 block text-[10px]', ui.muted(isDark))}>{item.sales} sales</small>
              </div>
            </div>
          ))}
          {!data?.topProducts?.length && <p className={ui.muted(isDark)}>Publish products to see performance here.</p>}
        </article>

        <article className={cn(ui.card(isDark), 'p-5 max-[680px]:p-4')}>
          <div className={ui.cardTitle}>
            <div>
              <h3 className={ui.h3}>Recent activity</h3>
              <p className={ui.muted(isDark)}>Latest happenings in your business</p>
            </div>
          </div>
          {(data?.recentActivity || []).map((item, i) => (
            <div
              className={cn(
                'flex items-center gap-2.5 border-b py-4 last:border-0',
                isDark ? 'border-violet-300/10' : 'border-violet-200/15'
              )}
              key={i}
            >
              <div className={cn('grid h-[33px] w-[33px] place-items-center rounded-[10px]', ui.metricIcon[item.type === 'sale' ? 'purple' : item.type === 'booking' ? 'pink' : 'blue'])}>
                {item.type === 'sale' ? <CircleDollarSign size={18} /> : item.type === 'booking' ? <CalendarDays size={18} /> : <Users size={18} />}
              </div>
              <p className="m-0 flex-1 text-[11px]">
                <b className="block">{item.type === 'sale' ? 'New sale' : item.type === 'booking' ? 'Booking confirmed' : 'New contact'}</b>
                <small className={cn('mt-0.5 block text-[10px]', ui.muted(isDark))}>{item.text}</small>
              </p>
              <time className={cn('text-[10px]', ui.muted(isDark))}>{new Date(item.time).toLocaleDateString()}</time>
            </div>
          ))}
          {!data?.recentActivity?.length && <p className={ui.muted(isDark)}>Activity will appear as your business grows.</p>}
        </article>
      </section>
    </>
  );
}
