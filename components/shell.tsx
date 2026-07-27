'use client';
// ============================================================
// Anima Pulse — app shell (sidebar / topbar / mobile tabs)
// Ported from prototype app.jsx; nav filtered by RBAC.
// ============================================================
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { I } from '@/components/icons';
import { BrandMark, Avatar } from '@/components/widgets';
import { DevSwitch } from '@/components/dev-switch';
import { FeedbackDrawer } from '@/components/feedback-drawer';
import { ROLE_LABEL } from '@/lib/roles';
import { can, type Action } from '@/lib/rbac';
import { apiPost } from '@/lib/client';
import type { Role, User } from '@/lib/repo/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  action: Action;
  badge?: boolean;
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: I.home, action: 'scorecard' },
  { href: '/pillars', label: 'Content Pillar', icon: I.flag, action: 'pillar-view' },
  { href: '/submit', label: 'Submit konten', icon: I.pulse, action: 'submit', badge: true },
  { href: '/tracker', label: 'Content Plan', icon: I.calendar, action: 'tracker-view' },
  { href: '/team', label: 'Performa tim', icon: I.team, action: 'team-view' },
  { href: '/kol', label: 'KOL Hub', icon: I.kol, action: 'kol-crud' },
  { href: '/vault', label: 'FYP Vault', icon: I.vault, action: 'vault-read' },
  { href: '/settings', label: 'Settings', icon: I.settings, action: 'user-manage' },
];

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pillars': 'Content Pillar',
  '/submit': 'Submit konten',
  '/tracker': 'Content Plan Tracker',
  '/team': 'Performa tim',
  '/kol': 'KOL Hub',
  '/vault': 'FYP Vault',
  '/settings': 'Settings',
};

export function AppShell({ user, role, cloudMode, newFeedback = 0, children }: {
  user: User; role: Role; cloudMode: boolean; newFeedback?: number; children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(newFeedback);
  const canTriage = can(role, 'feedback-manage');

  const nav = NAV.filter((n) => can(role, n.action));
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');
  const title = TITLES[Object.keys(TITLES).find((k) => isActive(k)) ?? '/dashboard'] ?? 'Anima Pulse';

  const logout = async () => {
    await apiPost('/auth/logout');
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (mobileNavOpen ? 'mobile-open' : '')}>
        <div className="sidebar-brand">
          <BrandMark size={28} />
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Anima Pulse</div>
            <div className="sidebar-brand-tag">v2.0 · operations</div>
          </div>
          <button className="sidebar-close-mobile" onClick={() => setMobileNavOpen(false)} aria-label="Tutup menu">{I.close}</button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-label">Workspace</div>
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={'nav-item ' + (isActive(item.href) ? 'active' : '')} onClick={() => setMobileNavOpen(false)}>
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {item.badge && <span className="nav-badge">{I.plus}</span>}
            </Link>
          ))}

          {can(role, 'feedback-submit') && (
            <button
              type="button"
              className="nav-item nav-item-btn"
              onClick={() => { setFeedbackOpen(true); setMobileNavOpen(false); }}
            >
              <span className="nav-icon">{I.megaphone}</span>
              <span className="nav-label">Lapor &amp; Masukan</span>
              {canTriage && feedbackCount > 0 && <span className="nav-count">{feedbackCount}</span>}
            </button>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <Avatar user={user} size={36} />
            <div className="sidebar-user-id">
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{ROLE_LABEL[role]}</div>
            </div>
            <button className="icon-btn" onClick={logout} title="Logout">{I.logout}</button>
          </div>
        </div>
      </aside>

      {mobileNavOpen && <div className="mobile-backdrop" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-area">
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileNavOpen(true)} aria-label="Buka menu">{I.menu}</button>
          <div className="topbar-crumb">
            <span className="crumb-app">Anima Pulse</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-page">{title}</span>
          </div>
          <div className="topbar-right">
            <div className="topbar-status"><span className="dot dot-positive" /> {cloudMode ? 'Cloud' : 'Live data'}</div>
            <button className="icon-btn" title="Notifikasi">{I.bell}<span className="bell-dot" /></button>
            <Avatar user={user} size={32} />
          </div>
        </header>

        <div className="main-scroll">{children}</div>

        <nav className="bottom-tabs">
          {nav.slice(0, 5).map((item) => (
            <Link key={item.href} href={item.href} className={'bt-tab ' + (isActive(item.href) ? 'active' : '')}>
              <span className="bt-icon">{item.icon}</span>
              <span className="bt-label">{item.label}</span>
            </Link>
          ))}
        </nav>
      </main>

      {feedbackOpen && (
        <FeedbackDrawer
          canManage={canTriage}
          onClose={() => setFeedbackOpen(false)}
          onCountChange={(d) => setFeedbackCount((c) => Math.max(0, c + d))}
        />
      )}

      {!cloudMode && <DevSwitch role={role} />}
    </div>
  );
}
