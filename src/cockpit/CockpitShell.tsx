import { Outlet } from 'react-router-dom';

import { SubdomainAccordionNav } from './SubdomainAccordionNav';

type CockpitShellProps = {
  companyName: string;
  onLogout: () => void | Promise<void>;
};

export function CockpitShell({ companyName, onLogout }: CockpitShellProps) {
  return (
    <div className="cockpit-shell">
      <SubdomainAccordionNav companyName={companyName} onLogout={onLogout} />
      <main className="cockpit-content">
        <Outlet />
      </main>
    </div>
  );
}
