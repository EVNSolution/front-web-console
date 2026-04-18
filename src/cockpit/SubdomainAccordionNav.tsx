import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

type TopLevelMenuKey = 'dashboard' | 'settlement';

type SubdomainAccordionNavProps = {
  activeMenu?: TopLevelMenuKey;
  companyName: string;
  onLogout: () => void | Promise<void>;
};

function isSettlementRoute(pathname: string) {
  return pathname === '/settlement' || pathname.startsWith('/settlement/');
}

export function SubdomainAccordionNav({ activeMenu, companyName, onLogout }: SubdomainAccordionNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentMenu = activeMenu ?? (isSettlementRoute(location.pathname) ? 'settlement' : 'dashboard');
  const [isTopLevelMenuExpanded, setIsTopLevelMenuExpanded] = useState(false);

  return (
    <aside className="cockpit-rail">
      <div className="cockpit-brand-block">
        <NavLink className="cockpit-brand-link" to="/">
          <span className="cockpit-brand-mark">{companyName}</span>
          <span className="cockpit-brand-subtitle">전용 업무 cockpit</span>
        </NavLink>
        <button
          aria-controls="subdomain-top-level-menu"
          aria-expanded={isTopLevelMenuExpanded}
          className={currentMenu === 'settlement' ? 'cockpit-card-toggle is-active' : 'cockpit-card-toggle'}
          onClick={() => setIsTopLevelMenuExpanded((current) => !current)}
          type="button"
        >
          <span>정산</span>
          <span
            aria-hidden="true"
            className={isTopLevelMenuExpanded ? 'cockpit-nav-caret is-open' : 'cockpit-nav-caret'}
          >
            ⌄
          </span>
        </button>
      </div>

      <nav aria-label="서브도메인 메뉴" className="cockpit-nav" id="subdomain-top-level-menu">
        {isTopLevelMenuExpanded ? (
          <>
            <NavLink
              className={({ isActive }) => (isActive ? 'cockpit-nav-link is-active' : 'cockpit-nav-link')}
              end
              to="/"
            >
              대시보드
            </NavLink>
            <button
              aria-label="정산 메뉴"
              className={currentMenu === 'settlement' ? 'cockpit-nav-toggle is-active' : 'cockpit-nav-toggle'}
              onClick={() => void navigate('/settlement/home')}
              type="button"
            >
              <span aria-hidden="true">정산</span>
            </button>
          </>
        ) : null}
      </nav>

      <div className="cockpit-rail-footer">
        <button className="button ghost small cockpit-logout-button" onClick={() => void onLogout()} type="button">
          로그아웃
        </button>
      </div>
    </aside>
  );
}
