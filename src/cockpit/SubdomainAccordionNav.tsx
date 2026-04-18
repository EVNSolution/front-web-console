import { useState } from 'react';
import { NavLink } from 'react-router-dom';

export type TopLevelMenuKey = 'dashboard' | 'settlement';

type SubdomainAccordionNavProps = {
  activeMenu: TopLevelMenuKey;
  companyName: string;
  onLogout: () => void | Promise<void>;
};

type TopLevelMenuItem = {
  key: TopLevelMenuKey;
  label: string;
  to: string;
  accessibleLabel?: string;
};

type SettlementChildMenuItem = {
  label: string;
  to: string;
};

const topLevelMenuItems: TopLevelMenuItem[] = [
  { key: 'dashboard', label: '대시보드', to: '/' },
  { key: 'settlement', label: '정산', to: '/settlement/home', accessibleLabel: '정산 메뉴' },
];

const settlementChildMenuItems: SettlementChildMenuItem[] = [
  { label: '홈', to: '/settlement/home' },
  { label: '배차 데이터', to: '/settlement/dispatch' },
  { label: '배송원 관리', to: '/settlement/crew' },
  { label: '운영 현황', to: '/settlement/operations' },
  { label: '정산 처리', to: '/settlement/process' },
  { label: '팀 관리', to: '/settlement/team' },
];

const cardTriggerMenuItem = topLevelMenuItems.find((item) => item.key !== 'dashboard') ?? topLevelMenuItems[0];

export function resolveTopLevelMenu(pathname: string): TopLevelMenuKey {
  return pathname === '/settlement' || pathname.startsWith('/settlement/') ? 'settlement' : 'dashboard';
}

export function SubdomainAccordionNav({ activeMenu, companyName, onLogout }: SubdomainAccordionNavProps) {
  const [isTopLevelMenuExpanded, setIsTopLevelMenuExpanded] = useState(false);
  const isSettlementRoute = activeMenu === 'settlement';

  return (
    <aside className="cockpit-rail">
      <div className="cockpit-brand-block">
        <NavLink className="cockpit-brand-link" to="/">
          <span className="cockpit-brand-mark">{companyName}</span>
          <span className="cockpit-brand-subtitle">전용 업무 cockpit</span>
        </NavLink>
        <button
          aria-controls="subdomain-top-level-menu"
          aria-expanded={isTopLevelMenuExpanded}
          className={activeMenu === cardTriggerMenuItem.key ? 'cockpit-card-toggle is-active' : 'cockpit-card-toggle'}
          onClick={() => setIsTopLevelMenuExpanded((current) => !current)}
          type="button"
        >
          <span>{cardTriggerMenuItem.label}</span>
          <span
            aria-hidden="true"
            className={isTopLevelMenuExpanded ? 'cockpit-nav-caret is-open' : 'cockpit-nav-caret'}
          >
            ⌄
          </span>
        </button>
      </div>

      <nav aria-label="서브도메인 메뉴" className="cockpit-nav" id="subdomain-top-level-menu">
        {isTopLevelMenuExpanded
          ? topLevelMenuItems.map((item) => (
              <NavLink
                aria-current={activeMenu === item.key ? 'page' : undefined}
                aria-label={item.accessibleLabel}
                className={activeMenu === item.key ? 'cockpit-nav-link is-active' : 'cockpit-nav-link'}
                end={item.to === '/'}
                key={item.key}
                to={item.to}
              >
                <span aria-hidden={item.accessibleLabel ? 'true' : undefined}>{item.label}</span>
              </NavLink>
            ))
          : null}
      </nav>

      {isSettlementRoute ? (
        <nav aria-label="정산 메뉴" className="cockpit-child-nav cockpit-detached-sidebar">
          {settlementChildMenuItems.map((item) => (
            <NavLink
              className={({ isActive }) => (isActive ? 'cockpit-nav-child-link is-active' : 'cockpit-nav-child-link')}
              end={item.to === '/settlement/home'}
              key={item.to}
              to={item.to}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      ) : null}

      <div className="cockpit-rail-footer">
        <button className="button ghost small cockpit-logout-button" onClick={() => void onLogout()} type="button">
          로그아웃
        </button>
      </div>
    </aside>
  );
}
