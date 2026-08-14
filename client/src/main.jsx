import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart3, Bell, BookOpen, Bot, Box, BrainCircuit, CalendarDays, CircleDollarSign, Compass, Crown, FileText, GitBranch, LayoutDashboard, Link2, LogOut, Mail, MessageSquare, Package, Search, Sparkles, Users, Zap } from 'lucide-react';
import './index.css';
import { authApi, communityApi } from './lib/api';
import { ProductPanel } from './pages/ProductPanel';
import { GrowthPanel } from './pages/GrowthPanel';
import { LearningPanel } from './pages/LearningPanel';
import { AiPanel } from './pages/AiPanel';
import { CommercePanel } from './pages/CommercePanel';
import { PublicStore } from './pages/PublicStore';
import { SettingsPanel } from './pages/SettingsPanel';
import { OverviewPanel } from './pages/OverviewPanel';
import { FunnelPanel } from './pages/FunnelPanel';
import { AffiliatePanel } from './pages/AffiliatePanel';
import { LandingPage } from './pages/LandingPage';
import { AdminApp } from './pages/AdminApp';
import { CustomerPortal } from './pages/CustomerPortal';
import { AutomationPanel } from './pages/AutomationPanel';
import { BundlePanel } from './pages/BundlePanel';
import { PublicFunnel } from './pages/PublicFunnel';
import { ThemeSync } from './components/ThemeSync';
import { DashboardLayout } from './components/DashboardLayout';
import { ui } from './lib/ui';
import { useAppStore } from './store/useAppStore';

const creatorNav = [
  [LayoutDashboard, 'Overview'], [Package, 'Products'], [CircleDollarSign, 'Orders'], [BookOpen, 'Courses'],
  [Crown, 'Memberships'], [CalendarDays, 'Bookings'], [Users, 'Customers'], [Mail, 'Campaigns'],
  [GitBranch, 'Funnels'], [Users, 'Affiliates'], [MessageSquare, 'Community'], [BarChart3, 'Analytics']
];

function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  const navigate = (to) => { window.history.pushState({}, '', to); setPath(to); };
  return [path, navigate];
}

function App() {
  return (
    <>
      <ThemeSync/>
      <AppRoutes/>
    </>
  );
}

function AppRoutes() {
  const [path, navigate] = usePath();
  const storeSlug = path.match(/^\/store\/([^/]+)$/)?.[1];
  const funnelSlug = path.match(/^\/f\/([^/]+)$/)?.[1];
  const isLogin = path === '/login';

  const isDark = useAppStore((s) => s.theme === 'dark');
  const setTheme = useAppStore((s) => s.setTheme);
  const [menu, setMenu] = useState(false);
  const [activeView, setActiveView] = useState('Overview');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('ach_user') || 'null'));
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || user.role === 'admin') return;
    communityApi.notifications().then((items) => setUnreadCount(items.filter((n) => !n.read).length)).catch(() => {});
  }, [user, activeView]);

  const logout = () => {
    localStorage.removeItem('ach_token');
    localStorage.removeItem('ach_user');
    setUser(null);
    navigate('/');
  };

  const onAuthenticated = (account) => {
    setUser(account);
    navigate(account.role === 'admin' ? '/admin' : '/dashboard');
  };

  const updateUser = (profile) => {
    const nextUser = { ...user, ...profile, id: profile._id || user.id };
    localStorage.setItem('ach_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === 'admin' && path !== '/admin') navigate('/admin');
    else if (user.role !== 'admin' && (path === '/' || path === '/login')) navigate('/dashboard');
  }, [user, path]);

  if (storeSlug) return <PublicStore slug={storeSlug}/>;
  if (funnelSlug) return <PublicFunnel slug={funnelSlug}/>;
  if (path === '/customer') return <CustomerPortal/>;
  if (path === '/my-purchases') return <CustomerPortal/>;

  if (!user && isLogin) {
    return <AuthScreen onAuthenticated={onAuthenticated} onBack={() => navigate('/')}/>;
  }

  if (!user) {
    return <LandingPage onLogin={() => navigate('/login')} onRegister={() => navigate('/login?mode=register')}/>;
  }

  if (user.role === 'admin') {
    return <AdminApp user={user} logout={logout}/>;
  }

  if (path === '/' || path === '/login') return null;

  const renderContent = () => {
    if (activeView === 'Products') return <ProductPanel/>;
    if (activeView === 'Bundles') return <BundlePanel/>;
    if (activeView === 'Orders') return <CommercePanel user={user}/>;
    if (activeView === 'Settings') return <SettingsPanel onUpdated={updateUser}/>;
    if (activeView === 'Funnels') return <FunnelPanel/>;
    if (activeView === 'Affiliates') return <AffiliatePanel/>;
    if (activeView === 'Automations') return <AutomationPanel/>;
    if (['Customers', 'Bookings', 'Campaigns', 'Analytics'].includes(activeView)) return <GrowthPanel view={activeView}/>;
    if (['Courses', 'Memberships', 'Community', 'Notifications'].includes(activeView)) return <LearningPanel view={activeView}/>;
    if (['AI Studio', 'Knowledge', 'Support', 'AI Product', 'AI Website', 'AI Branding', 'AI Content'].includes(activeView)) return <AiPanel view={activeView}/>;
    return <OverviewPanel user={user} onNavigate={setActiveView}/>;
  };

  const toolItems = [
    { name: 'Bundles', icon: Package, onClick: () => setActiveView('Bundles') },
    { name: 'Automations', icon: Zap, onClick: () => setActiveView('Automations') },
    { name: 'AI Studio', icon: Bot, onClick: () => setActiveView('AI Studio') },
    { name: 'AI Content', icon: FileText, onClick: () => setActiveView('AI Content') },
    { name: 'AI Product Gen', icon: Zap, onClick: () => setActiveView('AI Product') },
    { name: 'AI Website', icon: Link2, onClick: () => setActiveView('AI Website') },
    { name: 'AI Branding', icon: Compass, onClick: () => setActiveView('AI Branding') },
    { name: 'Support copilot', icon: MessageSquare, onClick: () => setActiveView('Support') },
    { name: 'Knowledge base', icon: BrainCircuit, onClick: () => setActiveView('Knowledge') }
  ];

  const bottomItems = [
    { name: 'Settings', icon: Box, onClick: () => setActiveView('Settings') },
    { name: '← Log out', icon: LogOut, onClick: logout }
  ];

  return (
    <DashboardLayout
      isDark={isDark}
      onToggleTheme={() => setTheme(isDark ? 'light' : 'dark')}
      menu={menu}
      setMenu={setMenu}
      brandMark={<Sparkles size={18}/>}
      brandText={<>creator<span className="text-[#9c7cff]">hub</span></>}
      workspace={{ initials: user.name.slice(0, 2).toUpperCase(), name: user.name, subtitle: 'Creator workspace' }}
      navItems={creatorNav.map(([icon, name]) => ({ icon, name }))}
      activeView={activeView}
      onNavigate={setActiveView}
      collapsibleNav={{ label: 'Tools & AI', icon: Sparkles, items: toolItems }}
      bottomItems={bottomItems}
      headerCenter={(
        <div className={ui.search(isDark)}>
          <Search size={18}/>
          <input className={ui.searchInput(isDark)} placeholder="Search anything..."/>
        </div>
      )}
      headerRight={{
        notificationIcon: <Bell size={19}/>,
        avatar: user.name.slice(0, 2).toUpperCase()
      }}
      unreadDot={unreadCount > 0}
      onNotificationClick={() => setActiveView('Notifications')}
    >
      {renderContent()}
    </DashboardLayout>
  );
}

createRoot(document.getElementById('root')).render(<App/>);

function AuthScreen({ onAuthenticated, onBack }) {
  const registerMode = new URLSearchParams(window.location.search).get('mode') === 'register';
  const [isLogin, setIsLogin] = useState(!registerMode);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    try {
      setLoading(true); setError('');
      const result = isLogin ? await authApi.login(form) : await authApi.register(form);
      localStorage.setItem('ach_token', result.token);
      localStorage.setItem('ach_user', JSON.stringify(result.user));
      onAuthenticated(result.user);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <main className="grid min-h-screen grid-cols-[1.12fr_0.88fr] overflow-hidden max-[800px]:grid-cols-1">
      <section className="relative overflow-hidden bg-[#151023] px-[min(9vw,130px)] py-11 [background-image:radial-gradient(circle_at_73%_71%,#8058e860,transparent_30%)] max-[800px]:px-[30px] max-[800px]:py-7">
        <button type="button" className="mb-5 cursor-pointer border-0 bg-transparent p-0 text-[13px] text-[#b79fff] hover:underline" onClick={onBack}>← Back to home</button>
        <div className={ui.brand}>
          <span className={ui.brandMark}><Sparkles size={18}/></span>
          <span>creator<span className="text-[#9c7cff]">hub</span></span>
        </div>
        <div className="relative z-[1] mt-[19vh] max-w-[480px] max-[800px]:mb-[50px] max-[800px]:mt-[55px]">
          <p className={ui.eyebrow}>YOUR BUSINESS, AMPLIFIED</p>
          <h1 className="font-display text-[clamp(37px,4vw,62px)] font-semibold leading-[1.04] tracking-[-2px] max-[800px]:text-[38px]">
            Build a creator business that feels like <em className="not-italic text-[#b798ff]">you.</em>
          </h1>
          <p className="max-w-[410px] text-sm leading-[1.7] text-[#bbb1cf]">Sell digital products, build an audience, and make smarter moves with your personal AI business assistant.</p>
        </div>
        <div className="absolute -right-[90px] -top-[100px] h-[320px] w-[320px] rounded-full bg-[#9167ee3b] blur-[3px]"/>
        <div className="absolute -bottom-[220px] left-[8%] h-[430px] w-[430px] rounded-full bg-[#6640ba2c] blur-[3px]"/>
      </section>
      <section className="grid place-items-center bg-[#100d18] p-[30px] max-[800px]:px-5">
        <form className="w-full max-w-[390px] rounded-[17px] border border-violet-300/10 bg-[#282139bf] p-[31px] shadow-lg backdrop-blur-[18px]" onSubmit={submit}>
          <p className={ui.eyebrow}>WELCOME TO CREATOR HUB</p>
          <h2 className="font-display text-2xl font-semibold">{isLogin ? 'Welcome back' : 'Create your workspace'}</h2>
          <p className={ui.muted(true)}>{isLogin ? 'Sign in to continue building your business.' : 'Start your creator business in minutes.'}</p>
          {!isLogin && (
            <label className={ui.label(true)}>
              Your name
              <input className={ui.input(true)} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name"/>
            </label>
          )}
          <label className={ui.label(true)}>
            Email
            <input className={ui.input(true)} required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com"/>
          </label>
          <label className={ui.label(true)}>
            Password
            <input className={ui.input(true)} required type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters"/>
          </label>
          {error && <p className={ui.formError}>{error}</p>}
          <button className={`${ui.primary} ${ui.wide}`} disabled={loading}>{loading ? 'Please wait...' : isLogin ? 'Sign in' : 'Create account'}</button>
          <p className="mt-5 text-center text-[11px] text-[#aaa4b9]">
            {isLogin ? 'New to Creator Hub?' : 'Already have an account?'}{' '}
            <button type="button" className="border-0 bg-transparent p-0 text-[11px] text-[#ad8cff]" onClick={() => { setIsLogin(!isLogin); setError(''); }}>{isLogin ? 'Create an account' : 'Sign in'}</button>
          </p>
        </form>
      </section>
    </main>
  );
}
