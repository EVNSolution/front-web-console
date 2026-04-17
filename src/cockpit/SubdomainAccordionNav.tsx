import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';

type SubdomainAccordionNavProps = {
  companyName: string;
  onLogout: () => void | Promise<void>;
};

const settlementItems = [
  { label: '배차 데이터', to: '/settlement/dispatch-data' },
  { label: '배송원 관리', to: '/settlement/driver-management' },
  { label: '운영 현황', to: '/settlement/operations-status' },
  { label: '정산 처리', to: '/settlement/settlement-processing' },
  { label: '팀 관리', to: '/settlement/team-management' },
] as const;

function isSettlementRoute(pathname: string) {
  return pathname === '/settlement' || pathname.startsWith('/settlement/');
}

export function SubdomainAccordionNav({ companyName, onLogout }: SubdomainAccordionNavProps) {
  const location = useLocation();
  const [isSettlementExpanded, setIsSettlementExpanded] = useState(() => isSettlementRoute(location.pathname));

  useEffect(() => {
    if (isSettlementRoute(location.pathname)) {
      setIsSettlementExpanded(true);
    }
  }, [location.pathname]);

  return (
    <aside className="cockpit-rail">
      <div className="cockpit-brand-block">
        <NavLink className="cockpit-brand-link" to="/">
          <span className="cockpit-brand-mark">{companyName}</span>
          <span className="cockpit-brand-subtitle">전용 업무 cockpit</span>
        </NavLink>
      </div>

      <nav aria-label="서브도메인 메뉴" className="cockpit-nav">
        <NavLink className={({ isActive }) => (isActive ? 'cockpit-nav-link is-active' : 'cockpit-nav-link')} end to="/">
          대시보드
        </NavLink>

        <section className="cockpit-nav-group">
          <button
            aria-expanded={isSettlementExpanded}
            className={isSettlementRoute(location.pathname) ? 'cockpit-nav-toggle is-active' : 'cockpit-nav-toggle'}
            onClick={() => setIsSettlementExpanded((current) => !current)}
            type="button"
          >
            <span>정산</span>
            <span aria-hidden="true" className={isSettlementExpanded ? 'cockpit-nav-caret is-open' : 'cockpit-nav-caret'}>
              ⌄
            </span>
          </button>

          {isSettlementExpanded ? (
            <div className="cockpit-nav-children">
              {settlementItems.map((item) => (
                <NavLink
                  className={({ isActive }) => (isActive ? 'cockpit-nav-child-link is-active' : 'cockpit-nav-child-link')}
                  key={item.to}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          ) : null}
        </section>
      </nav>

      <div className="cockpit-rail-footer">
        <button className="button ghost small cockpit-logout-button" onClick={() => void onLogout()} type="button">
          로그아웃
        </button>
      </div>
    </aside>
  );
}
