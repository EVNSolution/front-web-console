import { NavLink } from 'react-router-dom';

type SubdomainSettlementSidebarItem = {
  label: string;
  to: string;
};

type SubdomainSettlementSidebarProps = {
  items: SubdomainSettlementSidebarItem[];
};

export function SubdomainSettlementSidebar({ items }: SubdomainSettlementSidebarProps) {
  return (
    <div className="cockpit-detached-settlement-sidebar" data-testid="subdomain-settlement-sidebar">
      <nav aria-label="정산 메뉴" className="cockpit-child-nav cockpit-detached-sidebar">
        {items.map((item) => (
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
    </div>
  );
}
