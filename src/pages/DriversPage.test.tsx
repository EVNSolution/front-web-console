import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { DriversPage } from './DriversPage';

const apiMocks = vi.hoisted(() => ({
  listDriverAccountLinks: vi.fn(),
  listDrivers: vi.fn(),
  createDriver: vi.fn(),
  deleteDriver: vi.fn(),
  updateDriver: vi.fn(),
  listCompanies: vi.fn(),
  listFleets: vi.fn(),
}));

vi.mock('../api/driverAccountLinks', () => ({
  listDriverAccountLinks: apiMocks.listDriverAccountLinks,
}));

vi.mock('../api/drivers', () => ({
  listDrivers: apiMocks.listDrivers,
  createDriver: apiMocks.createDriver,
  deleteDriver: apiMocks.deleteDriver,
  updateDriver: apiMocks.updateDriver,
}));

vi.mock('../api/organization', () => ({
  listCompanies: apiMocks.listCompanies,
  listFleets: apiMocks.listFleets,
}));

describe('Admin DriversPage', () => {
  it('renders driver list as operational status only', async () => {
    apiMocks.listDrivers.mockResolvedValue([
      {
        driver_id: '90000000-0000-0000-0000-000000000001',
        route_no: 1,
        company_id: '30000000-0000-0000-0000-000000000001',
        fleet_id: '40000000-0000-0000-0000-000000000001',
        name: 'Kim Driver',
        external_user_name: 'ZD김기사',
        ev_id: 'EV-001',
        phone_number: '010-1234-5678',
        address: 'Seoul',
      },
      {
        driver_id: '90000000-0000-0000-0000-000000000002',
        route_no: 2,
        company_id: '30000000-0000-0000-0000-000000000001',
        fleet_id: '40000000-0000-0000-0000-000000000001',
        name: 'Lee Driver',
        external_user_name: 'ZD이기사',
        ev_id: 'EV-002',
        phone_number: '010-1234-9999',
        address: 'Busan',
      },
    ]);
    apiMocks.listCompanies.mockResolvedValue([{ company_id: '30000000-0000-0000-0000-000000000001', name: 'Seed Company' }]);
    apiMocks.listFleets.mockResolvedValue([
      {
        fleet_id: '40000000-0000-0000-0000-000000000001',
        company_id: '30000000-0000-0000-0000-000000000001',
        name: 'Seed Fleet',
      },
    ]);
    apiMocks.listDriverAccountLinks.mockResolvedValue([
      {
        driver_account_link_id: '21000000-0000-0000-0000-000000000001',
        driver_account_id: '20000000-0000-0000-0000-000000000001',
        driver_id: '90000000-0000-0000-0000-000000000001',
        identity_id: '22000000-0000-0000-0000-000000000001',
        identity_name: '김기사 계정',
        email: 'driver@example.com',
        account_status: 'active',
        linked_at: '2026-04-01T00:00:00Z',
        unlinked_at: null,
      },
    ]);
    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <DriversPage
          client={{ request: vi.fn() }}
          session={{
            accessToken: 'token',
            sessionKind: 'normal',
            email: 'admin@example.com',
            identity: {
              identityId: '10000000-0000-0000-0000-000000000001',
              name: '관리자',
              birthDate: '1990-01-01',
              status: 'active',
            },
            activeAccount: {
              accountType: 'manager',
              accountId: '20000000-0000-0000-0000-000000000099',
              companyId: '30000000-0000-0000-0000-000000000001',
              roleType: 'company_super_admin',
            },
            availableAccountTypes: ['manager'],
          }}
        />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '배송원' });
    expect(screen.getByText('배송원 운영 현황을 확인하고, 계정 연결은 상세 화면에서 관리합니다.')).toBeInTheDocument();
    const row = screen.getByText('Kim Driver').closest('tr');
    expect(screen.getByRole('link', { name: /배송원 생성/i })).toHaveAttribute('href', '/drivers/new');
    expect(row).toHaveAttribute('data-detail-path', '/drivers/1');
    expect(screen.getByText('원청 앱 사용자명')).toBeInTheDocument();
    expect(screen.getByText('ZD김기사')).toBeInTheDocument();
    expect(screen.getByText('김기사 계정')).toBeInTheDocument();
    expect(screen.queryByText('상세에서 관리')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '연결 해제' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '계정 연결' })).not.toBeInTheDocument();
    expect(screen.queryByText('driver@example.com')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '보기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '수정' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/이름/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/org unit id/i)).not.toBeInTheDocument();
  });

  it('hides driver create action for vehicle managers', async () => {
    apiMocks.listDrivers.mockResolvedValue([]);
    apiMocks.listDriverAccountLinks.mockResolvedValue([]);
    apiMocks.listCompanies.mockResolvedValue([]);
    apiMocks.listFleets.mockResolvedValue([]);

    render(
      <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
        <DriversPage
          client={{ request: vi.fn() }}
          session={{
            accessToken: 'token',
            sessionKind: 'normal',
            email: 'vehicle@example.com',
            identity: {
              identityId: '10000000-0000-0000-0000-000000000002',
              name: '차량 관리자',
              birthDate: '1990-01-01',
              status: 'active',
            },
            activeAccount: {
              accountType: 'manager',
              accountId: '20000000-0000-0000-0000-000000000100',
              companyId: '30000000-0000-0000-0000-000000000001',
              roleType: 'vehicle_manager',
            },
            availableAccountTypes: ['manager'],
          }}
        />
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '배송원' });
    expect(screen.queryByRole('link', { name: /배송원 생성/i })).not.toBeInTheDocument();
  });
});
