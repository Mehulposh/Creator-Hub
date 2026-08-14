import { useEffect, useState } from 'react';
import { ChevronDown, Menu, Moon, Sun } from 'lucide-react';
import { cn } from '../lib/cn';
import { ui } from '../lib/ui';

export function DashboardLayout({
  isDark,
  onToggleTheme,
  menu,
  setMenu,
  brandMark,
  brandText,
  workspace,
  navItems,
  activeView,
  onNavigate,
  collapsibleNav,
  bottomItems,
  headerCenter,
  headerRight,
  unreadDot,
  onNotificationClick,
  children
}) {
  const collapsibleViews = collapsibleNav?.items.map((item) => item.name) || [];
  const collapsibleActive = collapsibleViews.includes(activeView);
  const [toolsOpen, setToolsOpen] = useState(collapsibleActive);

  useEffect(() => {
    if (collapsibleActive) setToolsOpen(true);
  }, [collapsibleActive]);

  return (
    <main className={ui.shell(isDark)}>
      <aside className={ui.sidebar(isDark, menu)}>
        <div className={ui.brand}>
          <span className={ui.brandMark}>{brandMark}</span>
          <span>{brandText}</span>
        </div>
        <div className={ui.workspace(isDark)}>
          <div className={ui.avatar}>{workspace.initials}</div>
          <div className="flex-1">
            <b className="block text-xs">{workspace.name}</b>
            <small className={cn('block text-[10px]', ui.muted(isDark))}>{workspace.subtitle}</small>
          </div>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain pr-0.5">
          {navItems.map(({ name, icon: Icon }) => (
            <button key={name} type="button" className={ui.navBtn(isDark, activeView === name)} onClick={() => onNavigate(name)}>
              <Icon size={19}/>{name}
            </button>
          ))}
        </nav>
        <div className={cn(ui.sidebarBottom(isDark), 'shrink-0')}>
          {collapsibleNav && (
            <div className="mb-1">
              <button
                type="button"
                className={cn(
                  ui.navBtn(isDark, collapsibleActive && !toolsOpen),
                  'justify-between font-semibold'
                )}
                onClick={() => setToolsOpen((open) => !open)}
                aria-expanded={toolsOpen}
              >
                <span className="flex items-center gap-3">
                  {collapsibleNav.icon && <collapsibleNav.icon size={19}/>}
                  {collapsibleNav.label}
                </span>
                <ChevronDown size={16} className={cn('shrink-0 transition-transform duration-200', toolsOpen && 'rotate-180')}/>
              </button>
              {toolsOpen && (
                <div className="mt-1 max-h-[220px] space-y-0.5 overflow-y-auto overscroll-contain pl-1">
                  {collapsibleNav.items.map(({ name, icon: Icon, onClick }) => (
                    <button
                      key={name}
                      type="button"
                      className={cn(ui.navBtn(isDark, activeView === name), 'py-2 pl-7 text-[12px]')}
                      onClick={onClick}
                    >
                      <Icon size={16}/>{name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          {bottomItems.map(({ name, icon: Icon, onClick }) => (
            <button key={name} type="button" className={ui.navBtn(isDark, activeView === name)} onClick={onClick}>
              <Icon size={19}/>{name}
            </button>
          ))}
        </div>
      </aside>
      <section className={ui.content}>
        <header className={ui.topHeader(isDark)}>
          <button type="button" className={ui.mobileMenu(isDark)} onClick={() => setMenu(!menu)}><Menu size={18}/></button>
          {headerCenter}
          <div className="flex items-center gap-3">
            {onToggleTheme && (
              <button type="button" className={ui.iconBtn(isDark)} onClick={onToggleTheme}>
                {isDark ? <Sun size={19}/> : <Moon size={19}/>}
              </button>
            )}
            {onNotificationClick && (
              <button type="button" className={cn(ui.iconBtn(isDark), 'relative')} onClick={onNotificationClick}>
                {headerRight?.notificationIcon}{unreadDot && <i className={ui.notificationDot}/>}
              </button>
            )}
            {headerRight?.avatar && <div className={ui.avatar}>{headerRight.avatar}</div>}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
