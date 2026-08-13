import { useState } from 'react';
import { ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { AdminPanel, adminTabs } from './AdminPanel';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAppStore } from '../store/useAppStore';
import { useTheme, ui } from '../lib/ui';
import { cn } from '../lib/cn';

export function AdminApp({ user, logout }) {
  const isDark = useTheme();
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const [menu, setMenu] = useState(false);
  const [activeView, setActiveView] = useState('Overview');

  return (
    <DashboardLayout
      isDark={isDark}
      onToggleTheme={toggleTheme}
      menu={menu}
      setMenu={setMenu}
      brandMark={<ShieldCheck size={18}/>}
      brandText={<>admin<span className="text-violet-400">hub</span></>}
      workspace={{
        initials: user.name.slice(0, 2).toUpperCase(),
        name: user.name,
        subtitle: 'Platform administrator'
      }}
      navItems={adminTabs.map(([name, Icon]) => ({ name, icon: Icon }))}
      activeView={activeView}
      onNavigate={setActiveView}
      bottomItems={[{ name: '← Log out', icon: ArrowLeft, onClick: logout }]}
      headerCenter={
        <div className={cn('flex flex-1 items-center gap-2 text-[13px]', ui.muted(isDark))}>
          <Sparkles size={16}/> Platform administration
        </div>
      }
      headerRight={{ avatar: user.name.slice(0, 2).toUpperCase() }}
    >
      <AdminPanel view={activeView}/>
    </DashboardLayout>
  );
}
