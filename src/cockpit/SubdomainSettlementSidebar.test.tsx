import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { CockpitShell } from './CockpitShell';

const shellSession = {
  accessToken: 'token',
  sessionKind: 'normal',
  email: 'manager@example.com',
  identity: {
    identityId: '10000000-0000-0000-0000-000000000001',
    name: '관리자',
    birthDate: '1990-01-01',
    status: 'active',
  },
  activeAccount: {
    accountType: 'manager' as const,
    accountId: '20000000-0000-0000-0000-000000000001',
    companyId: '30000000-0000-0000-0000-000000000001',
    roleType: 'settlement_manager',
    roleDisplayName: '정산 관리자',
  },
  availableAccountTypes: ['manager'],
};

function renderShell(initialEntry = '/settlement/home') {
  render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
      initialEntries={[initialEntry]}
    >
      <Routes>
        <Route
          path="*"
          element={<CockpitShell companyName="천하운수" onLogout={() => undefined} session={shellSession as never} />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SubdomainSettlementSidebar', () => {
  it('locks the detached settlement sidebar surface and presentation contract', () => {
    renderShell('/settlement/home');

    const settlementSidebar = screen.getByTestId('subdomain-settlement-sidebar');
    const settlementSidebarSurface = screen.getByTestId('subdomain-settlement-sidebar-surface');
    const settlementNav = within(settlementSidebar).getByRole('navigation', { name: '정산 메뉴' });
    const settlementLinks = within(settlementNav).getAllByRole('link');
    const settlementExpectedLinks = [
      { description: '현황 요약', href: '/settlement/home', title: '홈' },
      { description: '업로드 · 정산', href: '/settlement/dispatch', title: '배차 데이터' },
      { description: '매니저 등록', href: '/settlement/crew', title: '배송원 관리' },
      { description: '날짜별 현황', href: '/settlement/operations', title: '운영 현황' },
      { description: '정산 관리', href: '/settlement/process', title: '정산 처리' },
      { description: '단가 설정', href: '/settlement/team', title: '팀 관리' },
    ] as const;

    expect(settlementSidebar).toBeInTheDocument();
    expect(settlementSidebar.closest('.cockpit-rail')).toBeNull();
    expect(settlementSidebarSurface).toBeInTheDocument();
    expect(settlementSidebarSurface).toContainElement(settlementSidebar);
    expect(settlementSidebarSurface).toContainElement(settlementNav);
    expect(settlementLinks).toHaveLength(settlementExpectedLinks.length);
    settlementExpectedLinks.forEach((item, index) => {
      expect(settlementLinks[index]).toHaveAttribute('href', item.href);
      expect(settlementLinks[index]).toHaveTextContent(item.title);
      expect(settlementLinks[index]).toHaveTextContent(item.description);
    });
  });
});
