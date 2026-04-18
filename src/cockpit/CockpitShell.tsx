import { Outlet, useLocation } from 'react-router-dom';

import { SubdomainAccordionNav, resolveTopLevelMenu } from './SubdomainAccordionNav';

type CockpitShellProps = {
  companyName: string;
  onLogout: () => void | Promise<void>;
};

export function CockpitShell({ companyName, onLogout }: CockpitShellProps) {
  const location = useLocation();
  const activeMenu = resolveTopLevelMenu(location.pathname);
  const isSettlementRoute = activeMenu === 'settlement';
  const shellClassName = isSettlementRoute
    ? 'cockpit-shell cockpit-shell-settlement'
    : 'cockpit-shell cockpit-shell-no-dashboard-sidebar';

  return (
    <div className={shellClassName}>
      <SubdomainAccordionNav activeMenu={activeMenu} companyName={companyName} onLogout={onLogout} />
      <main className="cockpit-content">
        <Outlet />
      </main>
    </div>
  );
}
