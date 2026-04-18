import { useState } from 'react';
import { NavLink } from 'react-router-dom';

import { settlementChildNavItems } from './cheonha/CheonhaSettlementWorkspace';

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
  isCardTrigger?: boolean;
};

const topLevelMenuItems: TopLevelMenuItem[] = [
  { key: 'dashboard', label: '대시보드', to: '/' },
  { key: 'settlement', label: '정산', to: '/settlement/home', isCardTrigger: true },
];

const cardTriggerMenuItem = topLevelMenuItems.find((item) => item.isCardTrigger);

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
          className={activeMenu === cardTriggerMenuItem?.key ? 'cockpit-card-toggle is-active' : 'cockpit-card-toggle'}
          onClick={() => setIsTopLevelMenuExpanded((current) => !current)}
          type="button"
        >
          <span>{cardTriggerMenuItem?.label ?? '메뉴'}</span>
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
                className={activeMenu === item.key ? 'cockpit-nav-link is-active' : 'cockpit-nav-link'}
                end={item.to === '/'}
                key={item.key}
                to={item.to}
              >
                <span>{item.label}</span>
              </NavLink>
            ))
          : null}
      </nav>

      {isSettlementRoute ? (
        <nav aria-label="정산 메뉴" className="cockpit-child-nav cockpit-detached-sidebar">
          {settlementChildNavItems.map((item) => (
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
