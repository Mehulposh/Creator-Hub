import { useEffect, useState } from 'react';
import {
  BookOpen, CalendarDays, Download, ExternalLink, LoaderCircle, LogOut,
  Mail, Package, ShieldCheck, Sparkles, Store
} from 'lucide-react';
import { commerceApi, customerApi } from '../lib/api';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/cn';

const tabs = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'sessions', label: 'Sessions', icon: CalendarDays }
];

export function CustomerPortal() {
  const urlStore = new URLSearchParams(window.location.search).get('store');
  const lastStoreSlug = useAppStore((s) => s.lastStoreSlug);
  const setLastStoreSlug = useAppStore((s) => s.setLastStoreSlug);
  const isDark = useAppStore((s) => s.theme === 'dark');

  const [storeSlug, setStoreSlug] = useState(urlStore || lastStoreSlug || '');
  const [step, setStep] = useState(() => (customerApi.isLoggedIn() ? 'library' : 'email'));
  const [email, setEmail] = useState(() => localStorage.getItem('ach_customer_email') || '');
  const [code, setCode] = useState('');
  const [loginMsg, setLoginMsg] = useState('');
  const [debugCode, setDebugCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [library, setLibrary] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [downloadMsg, setDownloadMsg] = useState('');

  const loadLibrary = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await customerApi.library();
      setLibrary(data);
      const slug = data.products[0]?.storeSlug || data.courses[0]?.storeSlug || data.sessions[0]?.storeSlug;
      if (slug) {
        setStoreSlug(slug);
        setLastStoreSlug(slug);
      }
    } catch (err) {
      if (err.message.includes('expired') || err.message.includes('sign in')) {
        customerApi.logout();
        setStep('email');
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (urlStore) setLastStoreSlug(urlStore);
  }, [urlStore, setLastStoreSlug]);

  useEffect(() => {
    if (customerApi.isLoggedIn()) loadLibrary();
  }, []);

  const requestCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setLoginMsg('');
    setDebugCode('');
    try {
      const result = await customerApi.requestLogin(email.trim());
      setLoginMsg(result.message);
      if (result.debugCode) setDebugCode(result.debugCode);
      setStep('code');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await customerApi.verifyLogin(email.trim(), code.trim());
      customerApi.saveSession(result.token, email.trim());
      setLibrary(result.library);
      setStep('library');
      const slug = result.library.products[0]?.storeSlug
        || result.library.courses[0]?.storeSlug
        || result.library.sessions[0]?.storeSlug;
      if (slug) {
        setStoreSlug(slug);
        setLastStoreSlug(slug);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    customerApi.logout();
    setLibrary(null);
    setCode('');
    setStep('email');
    setError('');
  };

  const download = async (purchase) => {
    setDownloadMsg('');
    try {
      const result = await commerceApi.download(purchase._id, purchase.downloadToken);
      if (result.available && result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
        setLibrary({
          ...library,
          products: library.products.map((p) => p._id === purchase._id
            ? { ...p, downloadCount: p.downloadCount + 1, downloadRemaining: result.remaining }
            : p)
        });
      } else {
        setDownloadMsg(result.message || 'Download is not available yet.');
      }
    } catch (err) {
      setDownloadMsg(err.message);
    }
  };

  const items = library
    ? activeTab === 'products' ? library.products
      : activeTab === 'courses' ? library.courses
        : library.sessions
    : [];

  return (
    <main className={cn('min-h-screen transition-colors duration-200', isDark ? 'bg-[#110e1a] text-[#f7f4ff]' : 'bg-gray-50 text-gray-900')}>
      <header className={cn('mx-auto flex max-w-[1000px] items-center justify-between border-b px-6 py-5', isDark ? 'border-violet-300/10' : 'border-violet-200/30')}>
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold no-underline text-inherit">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-[#9b79fa] text-white"><Sparkles size={17}/></span>
          creator<span className="text-[#9c7cff]">hub</span>
        </a>
        <nav className="flex items-center gap-3">
          <ThemeToggle/>
          {step === 'library' && (
            <button type="button" onClick={logout} className={cn('inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold', isDark ? 'bg-violet-500/15 text-[#d4c4ff]' : 'bg-violet-100 text-violet-700')}>
              <LogOut size={14}/> Sign out
            </button>
          )}
          {storeSlug && (
            <a href={`/store/${storeSlug}`} className={cn('inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold no-underline', isDark ? 'bg-violet-500/15 text-[#d4c4ff]' : 'bg-violet-100 text-violet-700')}>
              <Store size={15}/> Back to store
            </a>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-xl px-6 pb-8 pt-10 text-center">
        <p className={cn('text-[10px] font-bold tracking-[0.12em]', isDark ? 'text-[#967bf0]' : 'text-violet-600')}>CUSTOMER PORTAL</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight">My Library</h1>
        <p className={cn('mt-3 leading-relaxed', isDark ? 'text-[#b5acbf]' : 'text-gray-500')}>
          {step === 'library'
            ? `Signed in as ${email}`
            : 'Sign in with your email to access products, courses, and booked sessions.'}
        </p>
      </section>

      <section className="mx-auto max-w-[900px] px-6 pb-20">
        {step === 'email' && (
          <form className={cn('mx-auto max-w-md rounded-2xl border p-6', isDark ? 'border-violet-300/15 bg-[#211b31]' : 'border-violet-200/30 bg-white')} onSubmit={requestCode}>
            <div className={cn('mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold', isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-700')}>
              <ShieldCheck size={14}/> Secure email sign-in
            </div>
            <label className={cn('block text-sm', isDark ? 'text-[#c5bdd7]' : 'text-gray-600')}>
              Email address
              <div className="relative mt-1.5">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={cn('w-full rounded-lg border py-2.5 pl-10 pr-3 text-sm', isDark ? 'border-violet-300/15 bg-[#110e1a] text-white' : 'border-violet-200/30 bg-gray-50 text-gray-900')}
                />
              </div>
            </label>
            {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
            <button type="submit" disabled={loading} className="mt-4 w-full rounded-lg bg-[#916dfa] py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? 'Sending code...' : 'Send sign-in code'}
            </button>
          </form>
        )}

        {step === 'code' && (
          <form className={cn('mx-auto max-w-md rounded-2xl border p-6', isDark ? 'border-violet-300/15 bg-[#211b31]' : 'border-violet-200/30 bg-white')} onSubmit={verifyCode}>
            <p className={cn('text-sm', isDark ? 'text-[#b5acbf]' : 'text-gray-600')}>{loginMsg}</p>
            {debugCode && (
              <p className={cn('mt-3 rounded-lg border px-3 py-2 text-center font-display text-2xl font-bold tracking-[0.3em]', isDark ? 'border-amber-400/40 bg-amber-400/10 text-amber-300' : 'border-amber-300 bg-amber-50 text-amber-700')}>
                {debugCode}
              </p>
            )}
            <label className={cn('mt-4 block text-sm', isDark ? 'text-[#c5bdd7]' : 'text-gray-600')}>
              6-digit code
              <input
                required
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className={cn('mt-1.5 w-full rounded-lg border px-3 py-2.5 text-center font-display text-xl tracking-[0.4em]', isDark ? 'border-violet-300/15 bg-[#110e1a] text-white' : 'border-violet-200/30 bg-gray-50 text-gray-900')}
              />
            </label>
            {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
            <button type="submit" disabled={loading || code.length !== 6} className="mt-4 w-full rounded-lg bg-[#916dfa] py-2.5 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? 'Verifying...' : 'Sign in'}
            </button>
            <button type="button" onClick={() => { setStep('email'); setError(''); setCode(''); }} className="mt-3 w-full text-xs text-violet-400">
              Use a different email
            </button>
          </form>
        )}

        {step === 'library' && (
          <>
            {library && (
              <div className="mb-6 grid grid-cols-3 gap-3">
                {[
                  ['Products', library.stats.products, Package],
                  ['Courses', library.stats.courses, BookOpen],
                  ['Sessions', library.stats.sessions, CalendarDays]
                ].map(([label, count, Icon]) => (
                  <div key={label} className={cn('rounded-2xl border p-4 text-center', isDark ? 'border-violet-300/15 bg-[#211b31]' : 'border-violet-200/30 bg-white')}>
                    <Icon size={18} className="mx-auto mb-2 text-violet-400"/>
                    <b className="font-display text-2xl">{count}</b>
                    <small className={cn('block text-xs', isDark ? 'text-[#9d94ad]' : 'text-gray-500')}>{label}</small>
                  </div>
                ))}
              </div>
            )}

            <div className={cn('mb-6 flex w-fit gap-2 rounded-full border p-1', isDark ? 'border-violet-300/15 bg-[#211b31]' : 'border-violet-200/30 bg-white')}>
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition',
                    activeTab === id ? 'bg-[#916dfa] text-white' : isDark ? 'text-[#c5bdd7]' : 'text-gray-500'
                  )}
                >
                  <Icon size={14}/> {label}
                </button>
              ))}
            </div>

            {error && <p className="mb-4 rounded-lg border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm text-rose-400">{error}</p>}
            {downloadMsg && <p className="mb-4 rounded-lg border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-300">{downloadMsg}</p>}

            {loading ? (
              <div className={cn('flex items-center justify-center gap-2 py-16', isDark ? 'text-gray-400' : 'text-gray-500')}>
                <LoaderCircle className="animate-spin" size={22}/> Loading your library...
              </div>
            ) : !items.length ? (
              <div className={cn('rounded-2xl border px-6 py-14 text-center', isDark ? 'border-violet-300/15 bg-[#211b31]' : 'border-violet-200/30 bg-white')}>
                <p className={cn('text-sm', isDark ? 'text-[#b5acbf]' : 'text-gray-500')}>
                  No {activeTab} in your library yet.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {activeTab === 'sessions' && library.sessions.map((session) => (
                  <article key={session._id} className={cn('rounded-2xl border p-5', isDark ? 'border-violet-300/15 bg-[#211b31]' : 'border-violet-200/30 bg-white')}>
                    <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700 text-white">
                      <CalendarDays size={22}/>
                    </div>
                    <small className="text-[10px] uppercase tracking-wide text-violet-500">Session · {session.creatorName}</small>
                    <h3 className="mt-1 font-display text-lg font-semibold">{session.title}</h3>
                    <p className={cn('text-xs', isDark ? 'text-[#b5acbf]' : 'text-gray-500')}>
                      {new Date(session.startsAt).toLocaleString()} · {session.duration} min
                    </p>
                    <span className={cn('mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold capitalize', isDark ? 'bg-violet-500/15 text-violet-300' : 'bg-violet-100 text-violet-700')}>
                      {session.status}
                    </span>
                    {session.notes && <p className={cn('mt-3 text-xs leading-relaxed', isDark ? 'text-[#c5bdd7]' : 'text-gray-600')}>{session.notes}</p>}
                  </article>
                ))}

                {activeTab !== 'sessions' && items.map((item) => (
                  <article key={item._id} className={cn('rounded-2xl border p-5', isDark ? 'border-violet-300/15 bg-[#211b31]' : 'border-violet-200/30 bg-white')}>
                    <div className="mb-3 grid h-12 w-12 place-items-center rounded-xl text-white" style={{ background: item.coverColor ? `linear-gradient(145deg, ${item.coverColor}, #271a48)` : 'linear-gradient(145deg, #8b5cf6, #271a48)' }}>
                      {item.itemType === 'course' ? <BookOpen size={22}/> : <Package size={22}/>}
                    </div>
                    <small className="text-[10px] capitalize text-violet-500">{item.itemType === 'course' ? 'Course' : 'Product'} · {item.creatorName}</small>
                    <h3 className="mt-1 font-display text-lg font-semibold">{item.title}</h3>
                    <p className={cn('text-xs leading-relaxed', isDark ? 'text-[#b5acbf]' : 'text-gray-500')}>{item.description || 'Thank you for your purchase.'}</p>
                    <div className="mt-3 flex justify-between text-[11px] text-gray-400">
                      <span>${item.amount.toFixed(2)}</span>
                      <time>{new Date(item.createdAt).toLocaleDateString()}</time>
                    </div>

                    {item.itemType === 'product' && (
                      <div className="mt-3 flex flex-col gap-2">
                        {item.hasDownload ? (
                          <button type="button" className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#916dfa] px-3.5 py-2 text-xs font-semibold text-white" onClick={() => download(item)}>
                            <Download size={14}/> Download{item.downloadRemaining > 0 ? ` (${item.downloadRemaining} left)` : ''}
                          </button>
                        ) : (
                          <p className="text-[11px] text-gray-400">Download not ready yet — check back later.</p>
                        )}
                        {item.storeSlug && (
                          <a href={`/store/${item.storeSlug}`} className="inline-flex items-center gap-1 text-xs text-violet-400 no-underline">
                            <ExternalLink size={14}/> Visit store
                          </a>
                        )}
                      </div>
                    )}

                    {item.itemType === 'course' && (
                      <div className="mt-3">
                        <button type="button" className={cn('rounded-lg px-3.5 py-2 text-xs font-semibold', isDark ? 'bg-violet-500/15 text-[#b79fff]' : 'bg-violet-100 text-violet-700')} onClick={() => setExpandedCourse(expandedCourse === item._id ? null : item._id)}>
                          {expandedCourse === item._id ? 'Hide lessons' : `View ${item.lessons.length} lessons`}
                        </button>
                        {expandedCourse === item._id && (
                          <ul className={cn('mt-3 list-none border-t pt-2', isDark ? 'border-violet-300/10' : 'border-violet-200/20')}>
                            {item.lessons.map((lesson, i) => (
                              <li key={i} className={cn('border-b py-3 text-xs last:border-0', isDark ? 'border-violet-300/10' : 'border-violet-200/15')}>
                                <b>{lesson.title}</b>
                                <span className="ml-2 text-[10px] text-gray-400">{lesson.duration} min</span>
                                {lesson.content && <p className={cn('mt-2 whitespace-pre-wrap text-[11px]', isDark ? 'text-[#c5bdd7]' : 'text-gray-600')}>{lesson.content}</p>}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
