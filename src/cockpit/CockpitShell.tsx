import { Outlet, useLocation } from 'react-router-dom';

import type { SessionPayload } from '../api/http';
import { CockpitGlobalHeader } from './CockpitGlobalHeader';
import { SubdomainAccordionNav, resolveTopLevelMenu } from './SubdomainAccordionNav';

type CockpitShellProps = {
  companyName: string;
  onLogout: () => void | Promise<void>;
  session: SessionPayload;
};

export function CockpitShell({ companyName, onLogout, session }: CockpitShellProps) {
  const location = useLocation();
  const activeMenu = resolveTopLevelMenu(location.pathname);
  const isSettlementRoute = activeMenu === 'settlement';
  const shellClassName = isSettlementRoute
    ? 'cockpit-shell cockpit-shell-settlement'
    : 'cockpit-shell cockpit-shell-no-dashboard-sidebar';

  return (
    <div className={shellClassName}>
      <SubdomainAccordionNav activeMenu={activeMenu} companyName={companyName} />
      <div className="cockpit-main-panel">
        <CockpitGlobalHeader onLogout={onLogout} session={session} />
        <main className="cockpit-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
