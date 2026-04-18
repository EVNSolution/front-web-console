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
    <aside
      className="cockpit-child-nav cockpit-detached-sidebar cockpit-detached-vehicle-sidebar"
      data-nav-label="차량"
      data-testid="subdomain-vehicle-sidebar"
    >
      <nav aria-label="차량 메뉴">
        {items.map((item) => (
          <NavLink
            className={({ isActive }) => (isActive ? 'cockpit-nav-child-link is-active' : 'cockpit-nav-child-link')}
            end={item.to === '/vehicles/home'}
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
