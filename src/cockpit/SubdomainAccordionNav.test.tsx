import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SubdomainAccordionNav, resolveTopLevelMenu } from './SubdomainAccordionNav';

function renderNav(initialEntry = '/') {
  render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
      initialEntries={[initialEntry]}
    >
      <Routes>
        <Route path="*" element={<RouteAwareNav />} />
      </Routes>
    </MemoryRouter>,
  );
}

function RouteAwareNav() {
  const location = useLocation();

  return (
    <SubdomainAccordionNav
      activeMenu={resolveTopLevelMenu(location.pathname)}
      companyName="천하운수"
      onLogout={vi.fn()}
    />
  );
}

function RouteSwitcher() {
  const navigate = useNavigate();

  return (
    <>
      <button type="button" onClick={() => navigate('/other')}>
        route-switch
      </button>
      <button type="button" onClick={() => navigate('/')}>
        dashboard-route
      </button>
    </>
  );
}

describe('SubdomainAccordionNav', () => {
  it('dashboard route renders the refined company card copy', () => {
    renderNav();

    expect(screen.getByText('CLEVER')).toBeInTheDocument();
    expect(screen.getByText('EV&Solution')).toBeInTheDocument();
    expect(screen.getByText('천하운수')).toBeInTheDocument();
    expect(screen.queryByText('전용 업무 cockpit')).not.toBeInTheDocument();
  });

  it('dashboard route starts collapsed with no top-level menu items visible', () => {
    renderNav();

    const nav = screen.getByRole('navigation', { name: '서브도메인 메뉴' });
    const trigger = screen.getByRole('button', { name: '상위 메뉴 열기' });

    expect(within(nav).queryAllByRole('link')).toHaveLength(0);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: '정산' })).not.toBeInTheDocument();
  });

  it('top-level expansion only reveals 대시보드 and 정산', async () => {
    const user = userEvent.setup();
    renderNav();

    const trigger = screen.getByRole('button', { name: '상위 메뉴 열기' });

    await user.click(trigger);

    const nav = screen.getByRole('navigation', { name: '서브도메인 메뉴' });
    const launcherCluster = screen.getByTestId('subdomain-launcher-cluster');

    expect(within(nav).getByRole('link', { name: '대시보드' })).toHaveAttribute('href', '/');
    expect(within(nav).getByRole('link', { name: '정산' })).toHaveAttribute('href', '/settlement/home');
    expect(within(nav).getAllByRole('link')).toHaveLength(2);
    expect(launcherCluster).toContainElement(nav);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('settlement route renders the detached settlement sidebar contract', () => {
    renderNav('/settlement/home');

    const launcherCluster = screen.getByTestId('subdomain-launcher-cluster');
    const topLevelNav = screen.getByRole('navigation', { name: '서브도메인 메뉴' });
    const settlementSidebar = screen.getByTestId('subdomain-settlement-sidebar');
    const settlementNav = within(settlementSidebar).getByRole('navigation', { name: '정산 메뉴' });

    expect(launcherCluster).toContainElement(topLevelNav);
    expect(launcherCluster).not.toContainElement(settlementSidebar);
    expect(launcherCluster.nextElementSibling).toBe(settlementSidebar);
    expect(topLevelNav).toBeInTheDocument();
    expect(settlementSidebar).toBeInTheDocument();
    expect(settlementNav).toBeInTheDocument();
    expect(within(topLevelNav).queryAllByRole('link')).toHaveLength(0);
    expect(within(settlementNav).getByRole('link', { name: '홈' })).toHaveAttribute('href', '/settlement/home');
    expect(within(settlementNav).getByRole('link', { name: '팀 관리' })).toHaveAttribute('href', '/settlement/team');
    expect(within(settlementNav).getAllByRole('link')).toHaveLength(6);
  });

  it('top-level expanded state stays open after route changes until the user collapses it', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
        initialEntries={['/']}
      >
        <Routes>
          <Route
            path="*"
            element={
              <>
                <RouteSwitcher />
                <RouteAwareNav />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '상위 메뉴 열기' }));
    const nav = screen.getByRole('navigation', { name: '서브도메인 메뉴' });
    expect(within(nav).getAllByRole('link')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: 'route-switch' }));
    expect(screen.getByRole('button', { name: '상위 메뉴 열기' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(nav).getAllByRole('link')).toHaveLength(2);

    await user.click(screen.getByRole('button', { name: '상위 메뉴 열기' }));
    expect(screen.getByRole('button', { name: '상위 메뉴 열기' })).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryAllByRole('link')).toHaveLength(0);
  });

  it('returning to / removes the settlement sidebar but preserves the top-level menu state', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
        initialEntries={['/']}
      >
        <Routes>
          <Route
            path="*"
            element={
              <>
                <RouteSwitcher />
                <RouteAwareNav />
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '상위 메뉴 열기' }));
    expect(screen.getByRole('button', { name: '상위 메뉴 열기' })).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('link', { name: '정산' }));
    const topLevelNav = screen.getByRole('navigation', { name: '서브도메인 메뉴' });
    expect(within(topLevelNav).getAllByRole('link')).toHaveLength(2);
    expect(screen.getByRole('navigation', { name: '정산 메뉴' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'dashboard-route' }));
    expect(screen.queryByRole('navigation', { name: '정산 메뉴' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '상위 메뉴 열기' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(topLevelNav).getAllByRole('link')).toHaveLength(2);
  });

});
