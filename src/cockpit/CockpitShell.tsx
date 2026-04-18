import { Outlet, useLocation } from 'react-router-dom';

import { SubdomainAccordionNav, type TopLevelMenuKey } from './SubdomainAccordionNav';

type CockpitShellProps = {
  companyName: string;
  onLogout: () => void | Promise<void>;
};

export function CockpitShell({ companyName, onLogout }: CockpitShellProps) {
  const location = useLocation();
  const isSettlementRoute = location.pathname === '/settlement' || location.pathname.startsWith('/settlement/');
  const activeMenu: TopLevelMenuKey = isSettlementRoute ? 'settlement' : 'dashboard';

  return (
    <div className={isSettlementRoute ? 'cockpit-shell' : 'cockpit-shell cockpit-shell-no-dashboard-sidebar'}>
      <SubdomainAccordionNav activeMenu={activeMenu} companyName={companyName} onLogout={onLogout} />
      <main className="cockpit-content">
        <Outlet />
      </main>
    </div>
  );
}
