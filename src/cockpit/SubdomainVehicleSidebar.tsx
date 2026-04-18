import { NavLink } from 'react-router-dom';

export type VehicleChildNavItem = {
  slug: 'home' | 'drivers' | 'vehicles' | 'assignments';
  label: string;
  to: string;
};

type SubdomainVehicleSidebarProps = {
  items: VehicleChildNavItem[];
};

export function SubdomainVehicleSidebar({ items }: SubdomainVehicleSidebarProps) {
  return (
    <aside className="cockpit-child-nav cockpit-detached-sidebar" data-testid="subdomain-vehicle-sidebar">
      <nav aria-label="차량 메뉴" className="cockpit-child-nav cockpit-detached-sidebar">
        {items.map((item) => (
          <NavLink
            className={({ isActive }) => (isActive ? 'cockpit-nav-child-link is-active' : 'cockpit-nav-child-link')}
            end={item.to === '/vehicles/home' || item.to === '/vehicles'}
            key={item.to}
            to={item.to}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
