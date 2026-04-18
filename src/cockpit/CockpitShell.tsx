import { Outlet, useLocation } from 'react-router-dom';

import { SubdomainAccordionNav } from './SubdomainAccordionNav';

type CockpitShellProps = {
  companyName: string;
  onLogout: () => void | Promise<void>;
};

export function CockpitShell({ companyName, onLogout }: CockpitShellProps) {
  const location = useLocation();
  const isSettlementRoute = location.pathname === '/settlement' || location.pathname.startsWith('/settlement/');

  return (
    <div className={isSettlementRoute ? 'cockpit-shell' : 'cockpit-shell cockpit-shell-no-dashboard-sidebar'}>
      <SubdomainAccordionNav
        activeMenu={isSettlementRoute ? 'settlement' : 'dashboard'}
        companyName={companyName}
        onLogout={onLogout}
      />
      <main className="cockpit-content">
        <Outlet />
      </main>
    </div>
  );
}
