import { useEffect, useState } from 'react';
import { BookOpen, Download, ExternalLink, LoaderCircle, Package, Sparkles, Store } from 'lucide-react';
import { commerceApi } from '../lib/api';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/cn';

export function MyPurchases() {
  const urlStore = new URLSearchParams(window.location.search).get('store');
  const lastStoreSlug = useAppStore((s) => s.lastStoreSlug);
  const setLastStoreSlug = useAppStore((s) => s.setLastStoreSlug);
  const buyerEmail = useAppStore((s) => s.buyerEmail);
  const setBuyerEmail = useAppStore((s) => s.setBuyerEmail);
  const isDark = useAppStore((s) => s.theme === 'dark');

  const [storeSlug, setStoreSlug] = useState(() => urlStore || lastStoreSlug || '');
  const [email, setEmail] = useState(buyerEmail || '');
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [downloadMsg, setDownloadMsg] = useState('');

  const load = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setDownloadMsg('');
    try {
      const items = await commerceApi.purchases(email.trim());
      setBuyerEmail(email.trim());
      setPurchases(items);
      const fromPurchase = items.find((item) => item.storeSlug)?.storeSlug;
      if (fromPurchase) {
        setStoreSlug(fromPurchase);
        setLastStoreSlug(fromPurchase);
      }
      if (!items.length) setError('No purchases found for this email.');
    } catch (err) {
      setError(err.message);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlStore) setLastStoreSlug(urlStore);
  }, [urlStore, setLastStoreSlug]);

  useEffect(() => {
    if (buyerEmail) load();
  }, []);

  const download = async (purchase) => {
    setDownloadMsg('');
    try {
      const result = await commerceApi.download(purchase._id, purchase.downloadToken);
      if (result.available && result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
        setPurchases(purchases.map((p) => p._id === purchase._id
          ? { ...p, downloadCount: p.downloadCount + 1, downloadRemaining: result.remaining, hasDownload: true }
          : p));
      } else {
        setDownloadMsg(result.message || 'Download is not available yet.');
      }
    } catch (err) {
      setDownloadMsg(err.message);
    }
  };

  return (
    <main className={cn(
      'min-h-screen transition-colors duration-200',
      isDark ? 'bg-[#110e1a] text-[#f7f4ff]' : 'bg-gray-50 text-gray-900'
    )}>
      <header className={cn(
        'mx-auto flex max-w-[1000px] items-center justify-between border-b px-6 py-5 transition-colors duration-200',
        isDark ? 'border-violet-300/10' : 'border-violet-200/30'
      )}>
        <a href={storeSlug ? `/store/${storeSlug}` : '#'} className="flex items-center gap-2 font-display text-lg font-bold no-underline text-inherit">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#9b79fa] text-white"><Sparkles size={17}/></span>
          creator<span className="text-[#9c7cff]">hub</span>
        </a>
        <nav className="flex items-center gap-3">
          <ThemeToggle/>
          {storeSlug && (
            <a
              href={`/store/${storeSlug}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold no-underline',
                isDark ? 'bg-violet-500/15 text-[#d4c4ff]' : 'bg-violet-100 text-violet-700'
              )}
            >
              <Store size={15}/> Back to store
            </a>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-xl px-6 pb-8 pt-10 text-center">
        <p className={cn('text-[10px] font-bold tracking-[0.12em]', isDark ? 'text-[#967bf0]' : 'text-violet-600')}>YOUR LIBRARY</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">My Purchases</h1>
        <p className={cn('mt-3 leading-relaxed', isDark ? 'text-[#b5acbf]' : 'text-gray-500')}>
          Enter the email you used at checkout to access your products and courses.
        </p>
        {storeSlug && (
          <a href={`/store/${storeSlug}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#916dfa] px-5 py-2.5 text-[13px] font-semibold text-white no-underline transition hover:brightness-110">
            <Store size={16}/> Back to store
          </a>
        )}
      </section>

      <section className="mx-auto max-w-[900px] px-6 pb-20">
        <form
          className={cn(
            'mb-6 flex flex-col items-end gap-3 rounded-2xl border p-6 sm:flex-row transition-colors duration-200',
            isDark ? 'border-violet-300/15 bg-[#211b31]' : 'border-violet-200/30 bg-white'
          )}
          onSubmit={load}
        >
          <label className={cn('flex-1 text-[13px]', isDark ? 'text-[#c5bdd7]' : 'text-gray-600')}>
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={cn(
                'mt-1.5 w-full rounded-lg border px-3 py-2.5 text-sm transition-colors duration-200',
                isDark
                  ? 'border-violet-300/15 bg-[#110e1a] text-white'
                  : 'border-violet-200/30 bg-gray-50 text-gray-900'
              )}
            />
          </label>
          <button type="submit" className="rounded-lg border-0 bg-[#916dfa] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60" disabled={loading}>
            {loading ? 'Looking up...' : 'Find my purchases'}
          </button>
        </form>

        {error && !purchases.length && (
          <p className={cn(
            'mb-4 rounded-lg border px-4 py-3 text-[13px]',
            isDark ? 'border-rose-400/40 bg-rose-400/10 text-[#f0a8b8]' : 'border-rose-300 bg-rose-50 text-rose-600'
          )}>{error}</p>
        )}
        {downloadMsg && (
          <p className={cn(
            'mb-4 rounded-lg border px-4 py-3 text-[13px]',
            isDark ? 'border-amber-400/40 bg-amber-400/10 text-[#fcd34d]' : 'border-amber-300 bg-amber-50 text-amber-700'
          )}>{downloadMsg}</p>
        )}

        {loading ? (
          <div className={cn('flex items-center justify-center gap-2.5 py-10', isDark ? 'text-gray-400' : 'text-gray-500')}>
            <LoaderCircle className="animate-spin" size={22}/> Loading your library...
          </div>
        ) : purchases.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {purchases.map((item) => (
              <article
                key={item._id}
                className={cn(
                  'rounded-2xl border p-5 transition-colors duration-200',
                  isDark ? 'border-violet-300/15 bg-[#211b31]' : 'border-violet-200/30 bg-white'
                )}
              >
                <div
                  className="mb-3 grid h-12 w-12 place-items-center rounded-xl text-white"
                  style={{ background: item.coverColor ? `linear-gradient(145deg, ${item.coverColor}, #271a48)` : 'linear-gradient(145deg, #8b5cf6, #271a48)' }}
                >
                  {item.itemType === 'course' ? <BookOpen size={24}/> : <Package size={24}/>}
                </div>
                <small className="text-[10px] capitalize text-violet-500">
                  {item.itemType === 'course' ? 'Course' : 'Digital product'} · {item.creatorName}
                </small>
                <h3 className="mt-1.5 font-display text-[17px] font-semibold">{item.title}</h3>
                <p className={cn('text-xs leading-relaxed', isDark ? 'text-[#b5acbf]' : 'text-gray-500')}>
                  {item.description || 'Thank you for your purchase.'}
                </p>
                <div className="mb-3.5 mt-3 flex justify-between text-[11px] text-gray-400">
                  <span>${item.amount.toFixed(2)}</span>
                  <time>{new Date(item.createdAt).toLocaleDateString()}</time>
                </div>

                {item.itemType === 'product' && (
                  <div className="flex flex-col gap-2.5">
                    {item.hasDownload ? (
                      <button type="button" className="inline-flex w-fit items-center gap-1.5 rounded-lg border-0 bg-[#916dfa] px-3.5 py-2 text-xs font-semibold text-white" onClick={() => download(item)}>
                        <Download size={15}/> Download{item.downloadRemaining > 0 ? ` (${item.downloadRemaining} left)` : ''}
                      </button>
                    ) : (
                      <p className="m-0 text-[11px] leading-relaxed text-gray-400">
                        Download not ready yet — the creator hasn&apos;t added a file. Check back later.
                      </p>
                    )}
                    {item.storeSlug && (
                      <a href={`/store/${item.storeSlug}`} className="inline-flex items-center gap-1 text-xs text-violet-500 no-underline">
                        <ExternalLink size={14}/> Visit store
                      </a>
                    )}
                  </div>
                )}

                {item.itemType === 'course' && (
                  <div className="flex flex-col gap-2.5">
                    <button
                      type="button"
                      className={cn(
                        'inline-flex w-fit items-center rounded-lg border-0 px-3.5 py-2 text-xs font-semibold',
                        isDark ? 'bg-violet-500/15 text-[#b79fff]' : 'bg-violet-100 text-violet-700'
                      )}
                      onClick={() => setExpandedCourse(expandedCourse === item._id ? null : item._id)}
                    >
                      {expandedCourse === item._id ? 'Hide lessons' : `View ${item.lessons.length} lessons`}
                    </button>
                    {expandedCourse === item._id && (
                      <ul className={cn('mt-1 list-none border-t p-0', isDark ? 'border-violet-300/10' : 'border-violet-200/20')}>
                        {item.lessons.length ? item.lessons.map((lesson, i) => (
                          <li key={i} className={cn('border-b py-3 text-xs last:border-0', isDark ? 'border-violet-300/10' : 'border-violet-200/15')}>
                            <b className="block">{lesson.title}</b>
                            <span className="text-[10px] text-gray-400">{lesson.duration} min{lesson.isPreview ? ' · Preview' : ''}</span>
                            {lesson.content && (
                              <p className={cn('mt-2 whitespace-pre-wrap text-[11px] leading-relaxed', isDark ? 'text-[#c5bdd7]' : 'text-gray-600')}>
                                {lesson.content}
                              </p>
                            )}
                          </li>
                        )) : <li className="py-3 italic text-gray-400">Lessons coming soon.</li>}
                      </ul>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
