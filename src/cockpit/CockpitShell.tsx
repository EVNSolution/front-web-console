import { NavLink, Outlet } from 'react-router-dom';

type CockpitShellProps = {
  companyName: string;
  onLogout: () => void | Promise<void>;
};

export function CockpitShell({ companyName, onLogout }: CockpitShellProps) {
  return (
    <div className="cockpit-shell">
      <header className="cockpit-topbar">
        <div className="cockpit-brand-block">
          <NavLink className="cockpit-brand-link" to="/">
            <span className="cockpit-brand-mark">{companyName}</span>
            <span className="cockpit-brand-subtitle">전용 업무 cockpit</span>
          </NavLink>
        </div>
        <button className="button ghost small" onClick={() => void onLogout()} type="button">
          로그아웃
        </button>
      </header>
      <main className="cockpit-content">
        <Outlet />
      </main>
    </div>
  );
}
