import { NavLink } from 'react-router-dom';

type SubdomainSettlementSidebarItem = {
  label: string;
  to: string;
  description?: string;
};

type SubdomainSettlementSidebarProps = {
  items: SubdomainSettlementSidebarItem[];
};

const settlementSidebarDescriptions: Record<string, string> = {
  '/settlement/home': '현황 요약',
  '/settlement/dispatch': '업로드 · 정산',
  '/settlement/crew': '매니저 등록',
  '/settlement/operations': '날짜별 현황',
  '/settlement/process': '정산 관리',
  '/settlement/team': '단가 설정',
};

function getSettlementSidebarLinkId(to: string, suffix: 'title' | 'description') {
  return `cockpit-settlement-sidebar-${to.slice(1).replaceAll('/', '-')}-${suffix}`;
}

export function SubdomainSettlementSidebar({ items }: SubdomainSettlementSidebarProps) {
  return (
    <div className="cockpit-detached-settlement-sidebar" data-testid="subdomain-settlement-sidebar">
      <nav aria-label="정산 메뉴" className="cockpit-child-nav cockpit-detached-sidebar">
        {items.map((item) => (
          <NavLink
            aria-describedby={getSettlementSidebarLinkId(item.to, 'description')}
            aria-labelledby={getSettlementSidebarLinkId(item.to, 'title')}
            className={({ isActive }) => (isActive ? 'cockpit-nav-child-link is-active' : 'cockpit-nav-child-link')}
            end={item.to === '/settlement/home'}
            key={item.to}
            to={item.to}
          >
            <span className="cockpit-settlement-nav-title" id={getSettlementSidebarLinkId(item.to, 'title')}>
              {item.label}
            </span>
            <span className="cockpit-settlement-nav-description" id={getSettlementSidebarLinkId(item.to, 'description')}>
              {item.description ?? settlementSidebarDescriptions[item.to] ?? ''}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
