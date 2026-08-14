import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen, CalendarDays, Clock, Crown, ExternalLink, GraduationCap, Heart, LoaderCircle, MessageCircle,
  Package, Plus, Shield, ShoppingBag, ShoppingCart, Sparkles, Trash2, Users, Video, X, Zap
} from 'lucide-react';
import { commerceApi, storefrontApi } from '../lib/api';
import { ThemeToggle } from '../components/ThemeToggle';
import { cartKey, useAppStore } from '../store/useAppStore';
import { cn } from '../lib/cn';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function PublicStore({ slug }) {
  const [store, setStore] = useState(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('products');
  const [email, setEmail] = useState('');
  const [coupon, setCoupon] = useState('');
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [buying, setBuying] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportMsg, setSupportMsg] = useState('');
  const [supportReply, setSupportReply] = useState('');
  const [supportLoading, setSupportLoading] = useState(false);
  const [paymentSimulated, setPaymentSimulated] = useState(true);
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [sessionForm, setSessionForm] = useState({ clientName: '', clientEmail: '', startsAt: '', duration: '60', notes: '' });
  const [sessionBooking, setSessionBooking] = useState(false);
  const [sessionSuccess, setSessionSuccess] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [wishlist, setWishlist] = useState(() => JSON.parse(localStorage.getItem(`ach_wishlist_${slug}`) || '[]'));
  const affiliateRef = useMemo(() => new URLSearchParams(window.location.search).get('ref') || '', []);

  const cart = useAppStore((s) => s.cart);
  const cartOpen = useAppStore((s) => s.cartOpen);
  const colorScheme = useAppStore((s) => s.theme);
  const isDark = colorScheme === 'dark';
  const setCartOpen = useAppStore((s) => s.setCartOpen);
  const addToCart = useAppStore((s) => s.addToCart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const setLastStoreSlug = useAppStore((s) => s.setLastStoreSlug);
  const setBuyerEmail = useAppStore((s) => s.setBuyerEmail);
  const storedEmail = useAppStore((s) => s.buyerEmail);

  useEffect(() => {
    if (storedEmail && !email) setEmail(storedEmail);
  }, [storedEmail, email]);

  useEffect(() => {
    setLastStoreSlug(slug);

    fetch(`${apiUrl}/storefront/${slug}`).then(async (r) => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.message);
      return data;
    }).then(setStore).catch((e) => setError(e.message));

    storefrontApi.pageView({ slug, path: `/store/${slug}`, referrer: document.referrer || '' }).catch(() => {});

    commerceApi.paymentMode().then((m) => setPaymentSimulated(m.simulated)).catch(() => setPaymentSimulated(true));

    const params = new URLSearchParams(window.location.search);
    const orderId = params.get('order');
    const token = params.get('token');
    if (orderId && token) {
      commerceApi.download(orderId, token).then((d) => {
        if (d.available && d.downloadUrl) window.open(d.downloadUrl, '_blank');
      }).catch(() => {});
    }
  }, [slug, setLastStoreSlug]);

  useEffect(() => {
    if (!store?.creator) return;
    const title = store.creator.seoTitle || `${store.creator.storeName || store.creator.name} | Creator Store`;
    const desc = store.creator.seoDescription || store.creator.bio || 'Shop digital products, courses, and memberships.';
    document.title = title;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = desc;
  }, [store]);

  const toggleWishlist = (item) => {
    const key = `${item.type}:${item.id}`;
    const next = wishlist.includes(key) ? wishlist.filter((k) => k !== key) : [...wishlist, key];
    setWishlist(next);
    localStorage.setItem(`ach_wishlist_${slug}`, JSON.stringify(next));
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);
  const checkoutTotal = couponPreview?.total ?? cartTotal;

  useEffect(() => {
    if (!coupon.trim() || cartTotal <= 0) {
      setCouponPreview(null);
      setCouponError('');
      return;
    }
    const timer = setTimeout(async () => {
      setCouponLoading(true);
      setCouponError('');
      try {
        const result = await storefrontApi.validateCoupon({ slug, code: coupon.trim(), subtotal: cartTotal });
        setCouponPreview(result);
      } catch (err) {
        setCouponPreview(null);
        setCouponError(err.message);
      } finally {
        setCouponLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [coupon, cartTotal, slug]);

  const completePurchase = async (result) => {
    setBuyerEmail(email);
    clearCart();
    setCartOpen(false);
    setCheckoutSuccess(result.simulated
      ? 'Demo checkout complete! View your purchases in My Library.'
      : 'Purchase complete! View your downloads and courses in My Library.');
  };

  const bookSession = async (e) => {
    e.preventDefault();
    setSessionBooking(true);
    setSessionError('');
    setSessionSuccess('');
    try {
      const result = await storefrontApi.bookSession({
        slug,
        clientName: sessionForm.clientName.trim(),
        clientEmail: sessionForm.clientEmail.trim().toLowerCase(),
        startsAt: sessionForm.startsAt,
        duration: Number(sessionForm.duration),
        notes: sessionForm.notes.trim() || undefined
      });
      setBuyerEmail(sessionForm.clientEmail.trim().toLowerCase());
      setSessionSuccess(result.message);
      setSessionForm({ clientName: '', clientEmail: '', startsAt: '', duration: '60', notes: '' });
    } catch (err) {
      setSessionError(err.message);
    } finally {
      setSessionBooking(false);
    }
  };

  const checkoutCart = async (e) => {
    e.preventDefault();
    if (!cart.length) return;
    setBuying(true);
    setCheckoutSuccess('');
    try {
      const baseUrl = window.location.href.split('?')[0];
      const result = await commerceApi.cartCheckout({
        email,
        couponCode: coupon || undefined,
        affiliateCode: affiliateRef || undefined,
        successUrl: baseUrl,
        cancelUrl: baseUrl,
        items: cart.map(({ type, id }) => ({ type, id }))
      });
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else if (result.simulated || result.free) {
        await completePurchase(result);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setBuying(false);
    }
  };

  const askSupport = async (e) => {
    e.preventDefault();
    if (!supportMsg.trim()) return;
    setSupportLoading(true);
    try {
      const result = await storefrontApi.support({ slug, message: supportMsg });
      setSupportReply(result.content);
    } catch (err) {
      setSupportReply(err.message);
    } finally {
      setSupportLoading(false);
    }
  };

  if (error) {
    return (
      <main className="grid min-h-screen place-content-center justify-items-center gap-3 bg-[#0d0b14] text-[#bdb4c8] dark:bg-[#0d0b14]">
        <Sparkles/>
        <h1 className="font-display text-xl font-semibold text-white">Storefront unavailable</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!store) {
    return (
      <main className="grid min-h-screen place-content-center justify-items-center gap-3 bg-[#0d0b14] text-[#bdb4c8]">
        <LoaderCircle className="animate-spin" size={24}/>
        Loading storefront...
      </main>
    );
  }

  const theme = store.creator.themeColor || '#8b5cf6';
  const links = (store.creator.linkBlocks || []).sort((a, b) => (a.order || 0) - (b.order || 0));
  const social = store.creator.socialLinks || {};
  const products = store.products || [];
  const courses = store.courses || [];
  const memberships = store.memberships || [];
  const bundles = store.bundles || [];
  const storeName = store.creator.storeName || store.creator.name;
  const totalStudents = courses.reduce((sum, c) => sum + (c.enrolled || 0), 0);
  const featuredProduct = products[0];
  const featuredCourse = courses[0];
  const hasSocial = Object.values(social).some(Boolean);

  const scrollToCatalog = (tab) => {
    setActiveTab(tab);
    document.getElementById('store-catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const EmptyCatalog = ({ type }) => (
    <div className="col-span-full rounded-2xl border border-dashed border-violet-300/20 bg-white px-6 py-14 text-center dark:bg-[#211b31]">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-violet-500/15 text-violet-500">
        {type === 'products' ? <ShoppingBag size={26}/> : <BookOpen size={26}/>}
      </div>
      <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-[#e8e0ff]">No {type} yet</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500 dark:text-[#b5acbf]">
        {storeName} is still building this section. Check back soon or ask a question with the AI assistant.
      </p>
    </div>
  );

  return (
    <main
      className={cn(
        'relative min-h-screen overflow-x-hidden transition-colors duration-200',
        isDark ? 'bg-[#0d0b14] text-[#f7f4ff]' : 'bg-gray-50 text-gray-900'
      )}
      style={{ '--store-theme': theme }}
    >
      <div
        className={cn('pointer-events-none fixed -left-20 -top-28 h-[520px] w-[520px] rounded-full blur-[80px] transition-opacity duration-200', isDark ? 'opacity-40' : 'opacity-20')}
        style={{ background: `radial-gradient(circle, ${theme}, transparent 70%)` }}
      />
      <div className={cn('pointer-events-none fixed -bottom-20 -right-16 h-[420px] w-[420px] rounded-full bg-purple-900/40 blur-[80px] transition-opacity duration-200', isDark ? 'opacity-40' : 'opacity-20')}/>

      <header className={cn(
        'sticky top-0 z-10 mx-auto flex h-[68px] max-w-[1140px] items-center justify-between border-b px-6 backdrop-blur-xl transition-colors duration-200',
        isDark ? 'border-violet-300/10 bg-[#0d0b14]/80' : 'border-violet-200/30 bg-white/80'
      )}>
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold text-inherit no-underline">
          <span className="grid h-7 w-7 place-items-center rounded-lg text-white" style={{ background: theme }}><Sparkles size={17}/></span>
          creatorhub
        </a>
        <div className="flex items-center gap-3">
          <ThemeToggle/>
          <a href={`/customer?store=${slug}`} className="rounded-full border border-violet-200/40 px-3 py-2 text-xs text-violet-700 no-underline transition hover:bg-violet-50 dark:border-violet-300/15 dark:text-[#c6b8e5] dark:hover:bg-[#211b31]">
            My Library
          </a>
          <button
            type="button"
            className="relative flex items-center gap-2 rounded-full border border-violet-200/40 bg-white px-3.5 py-2 text-xs font-semibold transition hover:-translate-y-px hover:shadow-lg dark:border-violet-300/15 dark:bg-[#211b31] dark:text-[#f7f4ff]"
            onClick={() => setCartOpen(true)}
          >
            <ShoppingCart size={18}/>
            Cart
            {cart.length > 0 && (
              <span className="absolute -right-1.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold text-white" style={{ background: theme }}>
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <section className="relative mx-auto max-w-3xl px-6 pb-14 pt-16 text-center">
        <div className="pointer-events-none absolute left-1/2 top-10 h-80 w-[min(640px,90vw)] -translate-x-1/2" style={{ background: `radial-gradient(circle at 50% 40%, color-mix(in srgb, ${theme} 35%, transparent), transparent 68%)` }}/>

        <div className="relative mx-auto w-fit">
          <div className="absolute -inset-1.5 animate-pulse-ring rounded-[32px] border-2 opacity-50" style={{ borderColor: `color-mix(in srgb, ${theme} 45%, transparent)` }}/>
          <div className="relative grid h-[88px] w-[88px] place-items-center rounded-[28px] font-display text-[34px] font-semibold text-white shadow-2xl" style={{ background: `linear-gradient(135deg, ${theme}, #271a48)` }}>
            {store.creator.name.slice(0, 1)}
          </div>
        </div>

        <p className="mt-6 text-[10px] font-bold tracking-[0.12em] text-violet-600 dark:text-violet-300">WELCOME TO</p>
        <h1 className="font-display text-[clamp(32px,5vw,52px)] font-semibold leading-tight tracking-tight">{storeName}</h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-gray-600 dark:text-[#c5bdd7]">
          {store.creator.bio || 'Digital products and courses to help you learn, create, and grow — curated by a creator who cares about your results.'}
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          {[
            { icon: Package, label: 'products', value: products.length },
            { icon: GraduationCap, label: 'courses', value: courses.length },
            ...(totalStudents > 0 ? [{ icon: Users, label: 'students', value: totalStudents }] : [])
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2 rounded-full border border-violet-200/30 bg-white px-4 py-2.5 text-xs text-gray-700 dark:border-violet-300/15 dark:bg-[#211b31] dark:text-[#d4c9ef]">
              <Icon size={16} style={{ color: theme }}/>
              <span><b className="font-display text-[15px] text-gray-900 dark:text-white">{value}</b> {label}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {products.length > 0 && (
            <button type="button" className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5" style={{ background: theme, boxShadow: `0 10px 30px color-mix(in srgb, ${theme} 35%, transparent)` }} onClick={() => scrollToCatalog('products')}>
              <ShoppingBag size={16}/> Browse products
            </button>
          )}
          {courses.length > 0 && (
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-violet-200/40 bg-white px-5 py-3 text-sm font-semibold text-violet-700 transition hover:-translate-y-0.5 dark:border-violet-300/20 dark:bg-[#211b31] dark:text-[#e8e0ff]" onClick={() => scrollToCatalog('courses')}>
              <BookOpen size={16}/> View courses
            </button>
          )}
          <button type="button" className="inline-flex items-center gap-2 rounded-full border border-violet-200/40 bg-white px-5 py-3 text-sm font-semibold text-violet-700 transition hover:-translate-y-0.5 dark:border-violet-300/20 dark:bg-[#211b31] dark:text-[#e8e0ff]" onClick={() => scrollToCatalog('sessions')}>
            <CalendarDays size={16}/> Book a session
          </button>
        </div>

        {(links.length > 0 || hasSocial) && (
          <div className="mx-auto mt-8 max-w-md rounded-2xl border border-violet-200/30 bg-white p-5 text-left dark:border-violet-300/15 dark:bg-[#211b31]">
            {links.length > 0 && (
              <>
                <h3 className="font-display text-sm font-semibold text-gray-800 dark:text-[#d4c9ef]">Quick links</h3>
                <div className="mt-3 flex flex-col gap-2.5">
                  {links.map((block, i) => (
                    <a key={i} href={block.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border bg-gray-50 px-4 py-3.5 text-sm font-semibold text-gray-900 no-underline transition hover:translate-x-1 dark:bg-[#1a1528] dark:text-[#f7f4ff]" style={{ borderColor: `${theme}44` }}>
                      {block.label} <ExternalLink size={14}/>
                    </a>
                  ))}
                </div>
              </>
            )}
            {hasSocial && (
              <div className="mt-5 flex flex-wrap gap-2.5">
                {social.instagram && <a href={social.instagram} className="rounded-full border border-violet-200/30 bg-gray-50 px-3.5 py-2 text-xs text-gray-600 no-underline dark:border-violet-300/15 dark:bg-[#211b31] dark:text-[#c6b8e5]">Instagram</a>}
                {social.twitter && <a href={social.twitter} className="rounded-full border border-violet-200/30 bg-gray-50 px-3.5 py-2 text-xs text-gray-600 no-underline dark:border-violet-300/15 dark:bg-[#211b31] dark:text-[#c6b8e5]">Twitter</a>}
                {social.youtube && <a href={social.youtube} className="rounded-full border border-violet-200/30 bg-gray-50 px-3.5 py-2 text-xs text-gray-600 no-underline dark:border-violet-300/15 dark:bg-[#211b31] dark:text-[#c6b8e5]">YouTube</a>}
                {social.tiktok && <a href={social.tiktok} className="rounded-full border border-violet-200/30 bg-gray-50 px-3.5 py-2 text-xs text-gray-600 no-underline dark:border-violet-300/15 dark:bg-[#211b31] dark:text-[#c6b8e5]">TikTok</a>}
                {social.website && <a href={social.website} className="rounded-full border border-violet-200/30 bg-gray-50 px-3.5 py-2 text-xs text-gray-600 no-underline dark:border-violet-300/15 dark:bg-[#211b31] dark:text-[#c6b8e5]">Website</a>}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-[1140px] grid-cols-1 gap-3.5 px-6 md:grid-cols-3">
        {[
          { icon: Zap, title: 'Instant access', text: 'Get your downloads and course content right after checkout.' },
          { icon: Shield, title: 'Secure checkout', text: 'Safe payments with email receipts for every order.' },
          { icon: Clock, title: 'Lifetime access', text: 'Revisit your purchases anytime from My Library.' }
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex gap-3 rounded-2xl border border-violet-200/30 bg-white p-5 dark:border-violet-300/12 dark:bg-[#211b31]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-500/15" style={{ color: theme }}><Icon size={18}/></span>
            <div>
              <b className="font-display text-sm">{title}</b>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-[#9d94ad]">{text}</p>
            </div>
          </div>
        ))}
      </section>

      {(featuredProduct || featuredCourse) && (
        <section className="mx-auto mt-8 max-w-[1140px] px-6">
          <div className="mb-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Featured picks</h2>
            <p className="text-sm text-gray-500 dark:text-[#9d94ad]">Popular offerings from {storeName}</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredProduct && (
              <article className="grid overflow-hidden rounded-2xl border border-violet-200/30 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-violet-300/15 dark:bg-[#211b31] md:grid-cols-[140px_1fr]">
                <div className="grid min-h-[140px] place-items-center text-white" style={{ background: `linear-gradient(145deg, ${featuredProduct.coverColor || theme}, #271a48)` }}>
                  <ShoppingBag size={32}/>
                </div>
                <div className="flex flex-col justify-center p-4 md:pl-0">
                  <small className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Featured product</small>
                  <h3 className="font-display text-[17px] font-semibold">{featuredProduct.title}</h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-[#b5acbf]">{featuredProduct.description || 'A creator-made digital resource.'}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <b className="font-display text-xl">${featuredProduct.price.toFixed(2)}</b>
                    <button className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[11px] font-semibold text-white" style={{ background: theme }} onClick={() => addToCart({ type: 'product', id: featuredProduct._id, title: featuredProduct.title, price: featuredProduct.price, coverColor: featuredProduct.coverColor })}>
                      <Plus size={14}/> Add to cart
                    </button>
                  </div>
                </div>
              </article>
            )}
            {featuredCourse && (
              <article className="grid overflow-hidden rounded-2xl border border-violet-200/30 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-violet-300/15 dark:bg-[#211b31] md:grid-cols-[140px_1fr]">
                <div className="grid min-h-[140px] place-items-center text-white" style={{ background: `linear-gradient(145deg, ${theme}, #271a48)` }}>
                  <BookOpen size={32}/>
                </div>
                <div className="flex flex-col justify-center p-4 md:pl-0">
                  <small className="text-[10px] font-bold uppercase tracking-wider text-violet-500">Featured course</small>
                  <h3 className="font-display text-[17px] font-semibold">{featuredCourse.title}</h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-gray-500 dark:text-[#b5acbf]">{featuredCourse.description || 'A structured learning experience.'}</p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <b className="font-display text-xl">${Number(featuredCourse.price || 0).toFixed(2)}</b>
                    <button className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[11px] font-semibold text-white" style={{ background: theme }} onClick={() => addToCart({ type: 'course', id: featuredCourse._id, title: featuredCourse.title, price: Number(featuredCourse.price || 0) })}>
                      <Plus size={14}/> Add to cart
                    </button>
                  </div>
                </div>
              </article>
            )}
          </div>
        </section>
      )}

      <section className="mx-auto mt-12 max-w-[1140px] px-6 pb-20" id="store-catalog">
        <div className="mb-7 text-center">
          <h2 className="font-display text-[28px] font-semibold tracking-tight">Shop the collection</h2>
          <p className="text-sm text-gray-500 dark:text-[#9d94ad]">Everything you need from {storeName} — add to cart and checkout in seconds.</p>
        </div>

        <div className="mx-auto mb-7 flex w-fit flex-wrap justify-center gap-2.5 rounded-full border border-violet-200/30 bg-white p-1.5 dark:border-violet-300/12 dark:bg-[#211b31]">
          {[
            { id: 'products', label: 'products', icon: ShoppingBag, count: products.length },
            { id: 'courses', label: 'courses', icon: BookOpen, count: courses.length },
            { id: 'memberships', label: 'memberships', icon: Crown, count: memberships.length },
            { id: 'bundles', label: 'bundles', icon: Package, count: bundles.length },
            { id: 'sessions', label: 'sessions', icon: CalendarDays, count: null }
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              type="button"
              className={cn(
                'flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold capitalize transition',
                activeTab === id ? 'text-white shadow-md' : 'text-gray-500 dark:text-[#c5bdd7]'
              )}
              style={activeTab === id ? { background: theme } : undefined}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={16}/>
              {label}{count !== null ? ` (${count})` : ''}
            </button>
          ))}
        </div>

        {activeTab === 'products' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article key={product._id} className="flex flex-col overflow-hidden rounded-2xl border border-violet-200/30 bg-white transition hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl dark:border-violet-300/15 dark:bg-[#211b31]">
                <div className="relative grid h-[168px] place-items-center text-white" style={{ background: `linear-gradient(145deg, ${product.coverColor || theme}, #271a48)` }}>
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">{product.type.replace('_', ' ')}</span>
                  {(product.sales || 0) > 0 && <span className="absolute right-3 top-3 z-10 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-[10px] font-bold text-amber-300">Popular</span>}
                  <ShoppingBag size={28} className="relative z-[1]"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#211b31]/80 to-transparent"/>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <small className="text-[10px] font-bold capitalize tracking-wide text-violet-500">Digital product</small>
                  <h3 className="mt-2 font-display text-[17px] font-semibold leading-tight">{product.title}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-gray-500 dark:text-[#b5acbf]">{product.description || 'A creator-made digital resource built to help you move faster.'}</p>
                </div>
                <footer className="flex items-center justify-between border-t border-violet-200/20 px-4 py-3.5 dark:border-violet-300/10">
                  <b className="font-display text-xl">${product.price.toFixed(2)}</b>
                  <div className="flex items-center gap-2">
                    <button type="button" className="rounded-full p-2 text-rose-400" onClick={() => toggleWishlist({ type: 'product', id: product._id })} aria-label="Wishlist">
                      <Heart size={14} fill={wishlist.includes(`product:${product._id}`) ? 'currentColor' : 'none'}/>
                    </button>
                    <button className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[11px] font-semibold text-white transition hover:brightness-110" style={{ background: theme }} onClick={() => addToCart({ type: 'product', id: product._id, title: product.title, price: product.price, coverColor: product.coverColor })}>
                      <Plus size={14}/> Add to cart
                    </button>
                  </div>
                </footer>
              </article>
            ))}
            {!products.length && <EmptyCatalog type="products"/>}
          </div>
        )}

        {activeTab === 'courses' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <article key={course._id} className="flex flex-col overflow-hidden rounded-2xl border border-violet-200/30 bg-white transition hover:-translate-y-1 hover:border-violet-400/40 hover:shadow-xl dark:border-violet-300/15 dark:bg-[#211b31]">
                <div className="relative grid h-[168px] place-items-center text-white" style={{ background: `linear-gradient(145deg, ${theme}, #271a48)` }}>
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">Course</span>
                  {(course.enrolled || 0) > 0 && <span className="absolute right-3 top-3 z-10 rounded-full border border-amber-400/40 bg-amber-400/15 px-2.5 py-1 text-[10px] font-bold text-amber-300">{course.enrolled} enrolled</span>}
                  <BookOpen size={28} className="relative z-[1]"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#211b31]/80 to-transparent"/>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <small className="text-[10px] font-bold capitalize tracking-wide text-violet-500">Online course</small>
                  <h3 className="mt-2 font-display text-[17px] font-semibold leading-tight">{course.title}</h3>
                  <p className="mt-2 line-clamp-3 flex-1 text-xs leading-relaxed text-gray-500 dark:text-[#b5acbf]">{course.description || 'A structured learning experience with step-by-step lessons.'}</p>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-gray-400 dark:text-[#8a8199]">
                    <BookOpen size={12}/> {course.lessons?.length || 0} lessons
                    {(course.enrolled || 0) > 0 && <> · <Users size={12}/> {course.enrolled} students</>}
                  </div>
                </div>
                <footer className="flex items-center justify-between border-t border-violet-200/20 px-4 py-3.5 dark:border-violet-300/10">
                  <b className="font-display text-xl">${Number(course.price || 0).toFixed(2)}</b>
                  <button className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[11px] font-semibold text-white transition hover:brightness-110" style={{ background: theme }} onClick={() => addToCart({ type: 'course', id: course._id, title: course.title, price: Number(course.price || 0) })}>
                    <Plus size={14}/> Add to cart
                  </button>
                </footer>
              </article>
            ))}
            {!courses.length && <EmptyCatalog type="courses"/>}
          </div>
        )}

        {activeTab === 'memberships' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {memberships.map((m) => (
              <article key={m._id} className="flex flex-col overflow-hidden rounded-2xl border border-violet-200/30 bg-white dark:border-violet-300/15 dark:bg-[#211b31]">
                <div className="grid place-items-center px-6 py-8 text-white" style={{ background: `linear-gradient(145deg, ${theme}, #271a48)` }}>
                  <Crown size={32}/>
                  <h3 className="mt-3 font-display text-lg font-semibold">{m.name}</h3>
                  <b className="mt-2 text-2xl">${m.price}<small className="text-sm font-normal">/{m.interval === 'annual' ? 'yr' : 'mo'}</small></b>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="text-xs text-gray-500 dark:text-[#b5acbf]">{m.description}</p>
                  <ul className="mt-3 list-none space-y-1 p-0 text-xs text-gray-400">
                    {(m.perks || []).map((p, i) => <li key={i}>✓ {p}</li>)}
                  </ul>
                </div>
                <footer className="border-t border-violet-200/20 px-4 py-3.5 dark:border-violet-300/10">
                  <button className="inline-flex w-full items-center justify-center gap-1 rounded-full py-2.5 text-[11px] font-semibold text-white" style={{ background: theme }} onClick={() => addToCart({ type: 'membership', id: m._id, title: m.name, price: m.price })}>
                    <Plus size={14}/> Subscribe
                  </button>
                </footer>
              </article>
            ))}
            {!memberships.length && <EmptyCatalog type="memberships"/>}
          </div>
        )}

        {activeTab === 'bundles' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bundles.map((b) => (
              <article key={b._id} className="flex flex-col overflow-hidden rounded-2xl border border-violet-200/30 bg-white dark:border-violet-300/15 dark:bg-[#211b31]">
                <div className="grid h-[120px] place-items-center text-white" style={{ background: `linear-gradient(145deg, ${b.coverColor || theme}, #271a48)` }}>
                  <Package size={28}/>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-[17px] font-semibold">{b.title}</h3>
                  <p className="mt-2 text-xs text-gray-500 dark:text-[#b5acbf]">{b.description || `${(b.productIds?.length || 0) + (b.courseIds?.length || 0)} items included`}</p>
                </div>
                <footer className="flex items-center justify-between border-t border-violet-200/20 px-4 py-3.5 dark:border-violet-300/10">
                  <b className="font-display text-xl">${b.price.toFixed(2)}</b>
                  <button className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[11px] font-semibold text-white" style={{ background: theme }} onClick={() => addToCart({ type: 'bundle', id: b._id, title: b.title, price: b.price })}>
                    <Plus size={14}/> Add to cart
                  </button>
                </footer>
              </article>
            ))}
            {!bundles.length && <EmptyCatalog type="bundles"/>}
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="mx-auto max-w-lg">
            <article className={cn('overflow-hidden rounded-2xl border border-violet-200/30 dark:border-violet-300/15', isDark ? 'bg-[#211b31]' : 'bg-white')}>
              <div className="grid place-items-center px-6 py-10 text-white" style={{ background: `linear-gradient(145deg, ${theme}, #271a48)` }}>
                <CalendarDays size={40}/>
                <h3 className="mt-4 font-display text-2xl font-semibold">Book a 1-on-1 session</h3>
                <p className="mt-2 max-w-sm text-center text-sm text-white/80">
                  Pick a time that works for you. {storeName} will confirm and send a meeting link.
                </p>
              </div>
              <form className="p-6" onSubmit={bookSession}>
                {sessionSuccess && (
                  <p className="mb-4 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-600 dark:text-emerald-300">
                    {sessionSuccess}{' '}
                    <a href={`/customer?store=${slug}`} className="font-semibold">View in My Library →</a>
                  </p>
                )}
                {sessionError && <p className="mb-4 text-sm text-rose-400">{sessionError}</p>}
                <label className="mb-3 block text-xs text-gray-500 dark:text-[#c5bdd7]">
                  Your name
                  <input required value={sessionForm.clientName} onChange={(e) => setSessionForm({ ...sessionForm, clientName: e.target.value })} className="mt-1.5 w-full rounded-lg border border-violet-200/30 bg-gray-50 px-3 py-2.5 text-sm dark:border-violet-300/15 dark:bg-[#110e1a] dark:text-white"/>
                </label>
                <label className="mb-3 block text-xs text-gray-500 dark:text-[#c5bdd7]">
                  Email address
                  <input required type="email" value={sessionForm.clientEmail} onChange={(e) => setSessionForm({ ...sessionForm, clientEmail: e.target.value })} className="mt-1.5 w-full rounded-lg border border-violet-200/30 bg-gray-50 px-3 py-2.5 text-sm dark:border-violet-300/15 dark:bg-[#110e1a] dark:text-white"/>
                </label>
                <div className="mb-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-gray-500 dark:text-[#c5bdd7]">
                    Preferred date & time
                    <input required type="datetime-local" value={sessionForm.startsAt} onChange={(e) => setSessionForm({ ...sessionForm, startsAt: e.target.value })} className="mt-1.5 w-full rounded-lg border border-violet-200/30 bg-gray-50 px-3 py-2.5 text-sm dark:border-violet-300/15 dark:bg-[#110e1a] dark:text-white"/>
                  </label>
                  <label className="block text-xs text-gray-500 dark:text-[#c5bdd7]">
                    Duration (minutes)
                    <input required type="number" min="15" max="480" step="15" value={sessionForm.duration} onChange={(e) => setSessionForm({ ...sessionForm, duration: e.target.value })} className="mt-1.5 w-full rounded-lg border border-violet-200/30 bg-gray-50 px-3 py-2.5 text-sm dark:border-violet-300/15 dark:bg-[#110e1a] dark:text-white"/>
                  </label>
                </div>
                <label className="mb-4 block text-xs text-gray-500 dark:text-[#c5bdd7]">
                  Notes (optional)
                  <textarea value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} placeholder="What would you like to focus on?" rows={3} className="mt-1.5 w-full rounded-lg border border-violet-200/30 bg-gray-50 px-3 py-2.5 text-sm dark:border-violet-300/15 dark:bg-[#110e1a] dark:text-white"/>
                </label>
                <button type="submit" disabled={sessionBooking} className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ background: theme }}>
                  {sessionBooking ? <><LoaderCircle className="animate-spin" size={16}/> Sending request...</> : <><Video size={16}/> Request session</>}
                </button>
              </form>
            </article>
          </div>
        )}
      </section>

      <footer className="mx-auto flex max-w-[1140px] flex-wrap items-center justify-between gap-5 border-t border-violet-200/30 px-6 py-8 dark:border-violet-300/12">
        <div>
          <b className="font-display text-base">{storeName}</b>
          <small className="mt-1 block text-xs text-gray-400">Powered by Creator Hub</small>
        </div>
        <div className="flex flex-wrap gap-3">
          <a href={`/customer?store=${slug}`} className="rounded-full border border-violet-200/30 px-3 py-2 text-xs text-gray-600 no-underline dark:border-violet-300/15 dark:text-[#c6b8e5]">My Library</a>
          {hasSocial && social.website && <a href={social.website} className="rounded-full border border-violet-200/30 px-3 py-2 text-xs text-gray-600 no-underline dark:border-violet-300/15 dark:text-[#c6b8e5]">Visit website</a>}
        </div>
      </footer>

      <button className="fixed bottom-6 right-6 z-[5] inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-white shadow-xl" style={{ background: theme, boxShadow: `0 8px 28px color-mix(in srgb, ${theme} 45%, transparent)` }} onClick={() => setSupportOpen(true)}>
        <MessageCircle size={22}/> Ask AI
      </button>

      {cartOpen && (
        <div className="fixed inset-0 z-20 flex justify-end bg-black/55" onClick={() => setCartOpen(false)}>
          <aside className="flex h-full w-full max-w-[420px] animate-slide-in flex-col bg-white p-6 dark:bg-[#1a1528]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><ShoppingCart size={20}/> Your cart</h2>
              <button type="button" className="border-0 bg-transparent text-gray-400" onClick={() => setCartOpen(false)}><X size={20}/></button>
            </div>

            {!cart.length ? (
              <p className="flex-1 py-10 text-center text-sm text-gray-400">Your cart is empty. Browse products or courses to get started.</p>
            ) : (
              <>
                <ul className="mb-4 flex-1 list-none overflow-auto p-0">
                  {cart.map((item) => (
                    <li key={cartKey(item)} className="grid grid-cols-[1fr_auto_auto] items-center gap-2.5 border-b border-violet-200/20 py-3 dark:border-violet-300/10">
                      <div>
                        <b className="block text-sm">{item.title}</b>
                        <small className="text-[10px] capitalize text-gray-400">{item.type === 'course' ? 'Course' : 'Product'}</small>
                      </div>
                      <span className="text-sm font-semibold">${item.price.toFixed(2)}</span>
                      <button type="button" className="rounded-md bg-rose-500/10 p-1.5 text-rose-400" onClick={() => removeFromCart(cartKey(item))} aria-label="Remove"><Trash2 size={14}/></button>
                    </li>
                  ))}
                </ul>
                <div className="mb-4 space-y-2 border-t border-violet-200/30 py-3.5 dark:border-violet-300/15">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-[#b5acbf]">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  {couponPreview && couponPreview.discount > 0 && (
                    <div className="flex items-center justify-between text-sm text-emerald-600 dark:text-emerald-400">
                      <span>Discount ({couponPreview.code})</span>
                      <span>-${couponPreview.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-violet-200/20 pt-2 dark:border-violet-300/10">
                    <span className="font-medium">Total</span>
                    <b className="font-display text-[22px] font-semibold">${checkoutTotal.toFixed(2)}</b>
                  </div>
                </div>
                <form onSubmit={checkoutCart}>
                  {paymentSimulated && <p className="mb-3 rounded-lg border border-amber-400/40 bg-amber-400/10 px-3 py-2.5 text-[11px] leading-relaxed text-amber-600 dark:text-amber-300">Demo mode — payments are simulated, no real charge.</p>}
                  {checkoutSuccess && (
                    <p className="mb-3 rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-3 py-2.5 text-xs leading-relaxed text-emerald-600 dark:text-emerald-300">
                      {checkoutSuccess}{' '}
                      <a href={`/customer?store=${slug}`} className="font-semibold">Go to My Library →</a>
                    </p>
                  )}
                  <label className="mb-3 block text-xs text-gray-500 dark:text-[#c5bdd7]">
                    Email for receipt
                    <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5 w-full rounded-lg border border-violet-200/30 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 dark:border-violet-300/15 dark:bg-[#110e1a] dark:text-white"/>
                  </label>
                  <label className="mb-3 block text-xs text-gray-500 dark:text-[#c5bdd7]">
                    Coupon code (optional)
                    <input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="SAVE10" className="mt-1.5 w-full rounded-lg border border-violet-200/30 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 dark:border-violet-300/15 dark:bg-[#110e1a] dark:text-white"/>
                    {couponLoading && <span className="mt-1 block text-[10px] text-gray-400">Checking coupon...</span>}
                    {couponError && <span className="mt-1 block text-[10px] text-rose-400">{couponError}</span>}
                    {couponPreview && !couponError && (
                      <span className="mt-1 block text-[10px] text-emerald-500">
                        {couponPreview.discountType === 'percent'
                          ? `${couponPreview.discountValue}% off applied`
                          : `$${couponPreview.discountValue.toFixed(2)} off applied`}
                      </span>
                    )}
                  </label>
                  <button type="submit" className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={buying || (coupon.trim() && (couponError || couponLoading))} style={{ background: theme }}>
                    {buying ? 'Processing...' : paymentSimulated ? `Simulate payment · $${checkoutTotal.toFixed(2)}` : `Checkout · $${checkoutTotal.toFixed(2)}`}
                  </button>
                </form>
              </>
            )}
          </aside>
        </div>
      )}

      {supportOpen && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/55 p-5 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-violet-200/30 bg-white p-6 dark:border-violet-300/15 dark:bg-[#211b31]">
            <button type="button" className="absolute right-4 top-4 border-0 bg-transparent text-gray-400" onClick={() => setSupportOpen(false)}><X size={19}/></button>
            <h2 className="font-display text-xl font-semibold">AI Support</h2>
            <p className="text-sm text-gray-500 dark:text-[#b5acbf]">Ask anything about {storeName}&apos;s store.</p>
            <form className="mt-3 flex gap-2" onSubmit={askSupport}>
              <input value={supportMsg} onChange={(e) => setSupportMsg(e.target.value)} placeholder="What's your refund policy?" className="flex-1 rounded-lg border border-violet-200/30 bg-gray-50 px-3 py-2.5 text-sm dark:border-violet-300/15 dark:bg-[#110e1a] dark:text-white"/>
              <button className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white" style={{ background: theme }} disabled={supportLoading}>{supportLoading ? 'Thinking...' : 'Ask'}</button>
            </form>
            {supportReply && <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-600 dark:bg-[#1a1528] dark:text-[#c5bdd7]">{supportReply}</div>}
          </div>
        </div>
      )}
    </main>
  );
}
