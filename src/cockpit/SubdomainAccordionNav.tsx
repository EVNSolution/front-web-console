import { useState } from 'react';
import { NavLink } from 'react-router-dom';

import { SubdomainBrandCard } from './SubdomainBrandCard';
import { SubdomainExpandTrigger } from './SubdomainExpandTrigger';
import { SubdomainSettlementSidebar } from './SubdomainSettlementSidebar';

export type TopLevelMenuKey = 'dashboard' | 'settlement';
export type SettlementChildNavItem = {
  slug: 'home' | 'dispatch' | 'crew' | 'operations' | 'process' | 'team';
  label: string;
  to: string;
};

type SubdomainAccordionNavProps = {
  activeMenu: TopLevelMenuKey;
  companyName: string;
  onLogout: () => void | Promise<void>;
};

type TopLevelMenuItem = {
  key: TopLevelMenuKey;
  label: string;
  to: string;
};

const topLevelMenuItems: TopLevelMenuItem[] = [
  { key: 'dashboard', label: '대시보드', to: '/' },
  { key: 'settlement', label: '정산', to: '/settlement/home' },
];

export const settlementChildNavItems: SettlementChildNavItem[] = [
  { slug: 'home', label: '홈', to: '/settlement/home' },
  { slug: 'dispatch', label: '배차 데이터', to: '/settlement/dispatch' },
  { slug: 'crew', label: '배송원 관리', to: '/settlement/crew' },
  { slug: 'operations', label: '운영 현황', to: '/settlement/operations' },
  { slug: 'process', label: '정산 처리', to: '/settlement/process' },
  { slug: 'team', label: '팀 관리', to: '/settlement/team' },
];

export function resolveTopLevelMenu(pathname: string): TopLevelMenuKey {
  return pathname === '/settlement' || pathname.startsWith('/settlement/') ? 'settlement' : 'dashboard';
}

export function SubdomainAccordionNav({ activeMenu, companyName, onLogout }: SubdomainAccordionNavProps) {
  const [isTopLevelMenuExpanded, setIsTopLevelMenuExpanded] = useState(false);
  const isSettlementRoute = activeMenu === 'settlement';
  const railClassName = isSettlementRoute ? 'cockpit-rail is-settlement-route' : 'cockpit-rail';
  const topLevelNavClassName = isTopLevelMenuExpanded ? 'cockpit-nav is-expanded' : 'cockpit-nav';

  return (
    <aside className={railClassName}>
      <div className="cockpit-brand-block">
        <SubdomainBrandCard companyName={companyName} />
        <SubdomainExpandTrigger
          isActive={isSettlementRoute}
          isExpanded={isTopLevelMenuExpanded}
          onToggle={() => setIsTopLevelMenuExpanded((current) => !current)}
        />
      </div>

      <nav aria-label="서브도메인 메뉴" className={topLevelNavClassName} id="subdomain-top-level-menu">
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

      {isSettlementRoute ? <SubdomainSettlementSidebar items={settlementChildNavItems} /> : null}

      <div className="cockpit-rail-footer">
        <button className="button ghost small cockpit-logout-button" onClick={() => void onLogout()} type="button">
          로그아웃
        </button>
      </div>
    </aside>
  );
}
