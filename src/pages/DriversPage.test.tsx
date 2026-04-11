import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

const defaultSession = {
  accessToken: 'token',
  sessionKind: 'normal' as const,
  email: 'admin@example.com',
  identity: {
    identityId: '10000000-0000-0000-0000-000000000001',
    name: '관리자',
    birthDate: '1990-01-01',
    status: 'active' as const,
  },
  activeAccount: {
    accountType: 'manager' as const,
    accountId: '20000000-0000-0000-0000-000000000099',
    companyId: '30000000-0000-0000-0000-000000000001',
    roleType: 'company_super_admin' as const,
  },
  availableAccountTypes: ['manager'],
};

function createDriver(index: number, overrides: Record<string, unknown> = {}) {
  return {
    driver_id: `90000000-0000-0000-0000-${String(index).padStart(12, '0')}`,
    route_no: index,
    company_id: '30000000-0000-0000-0000-000000000001',
    fleet_id: '40000000-0000-0000-0000-000000000001',
    name: `Driver ${index}`,
    external_user_name: `ZD기사${index}`,
    ev_id: `EV-${String(index).padStart(3, '0')}`,
    phone_number: `010-1234-${String(index).padStart(4, '0')}`,
    address: 'Seoul',
    ...overrides,
  };
}

function renderDriversPage(sessionOverrides: Record<string, unknown> = {}) {
  return render(
    <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <DriversPage
        client={{ request: vi.fn() }}
        session={{
          ...defaultSession,
          ...sessionOverrides,
        }}
      />
    </MemoryRouter>,
  );
}

describe('Admin DriversPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders driver list as operational status only', async () => {
    apiMocks.listDrivers.mockResolvedValue([
      createDriver(1, { name: 'Kim Driver', external_user_name: 'ZD김기사', phone_number: '010-1234-5678' }),
      createDriver(2, { name: 'Lee Driver', external_user_name: 'ZD이기사', phone_number: '010-1234-9999', address: 'Busan' }),
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
    renderDriversPage();

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

    renderDriversPage({
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
    });

    await screen.findByRole('heading', { name: '배송원' });
    expect(screen.queryByRole('link', { name: /배송원 생성/i })).not.toBeInTheDocument();
  });

  it('filters drivers by fleet and keyword and paginates rows', async () => {
    apiMocks.listDrivers.mockResolvedValue([
      createDriver(1, { name: '김기사 1', external_user_name: 'AA김기사1', fleet_id: '40000000-0000-0000-0000-000000000001' }),
      createDriver(2, { name: '김기사 2', external_user_name: 'AA김기사2', fleet_id: '40000000-0000-0000-0000-000000000001' }),
      createDriver(3, { name: '김기사 3', external_user_name: 'AA김기사3', fleet_id: '40000000-0000-0000-0000-000000000001' }),
      createDriver(4, { name: '김기사 4', external_user_name: 'AA김기사4', fleet_id: '40000000-0000-0000-0000-000000000001' }),
      createDriver(5, { name: '김기사 5', external_user_name: 'AA김기사5', fleet_id: '40000000-0000-0000-0000-000000000001' }),
      createDriver(6, { name: '김기사 6', external_user_name: 'AA김기사6', fleet_id: '40000000-0000-0000-0000-000000000001' }),
      createDriver(7, { name: '김기사 7', external_user_name: 'AA김기사7', fleet_id: '40000000-0000-0000-0000-000000000001' }),
      createDriver(8, { name: '김기사 8', external_user_name: 'AA김기사8', fleet_id: '40000000-0000-0000-0000-000000000001' }),
      createDriver(9, { name: '김기사 9', external_user_name: 'AA김기사9', fleet_id: '40000000-0000-0000-0000-000000000001' }),
      createDriver(10, { name: '김기사 10', external_user_name: 'AA김기사10', fleet_id: '40000000-0000-0000-0000-000000000001' }),
      createDriver(11, { name: '김기사 11', external_user_name: 'AA김기사11', fleet_id: '40000000-0000-0000-0000-000000000001' }),
      createDriver(12, { name: '박기사 12', external_user_name: 'BB박기사12', fleet_id: '40000000-0000-0000-0000-000000000002' }),
    ]);
    apiMocks.listDriverAccountLinks.mockResolvedValue([]);
    apiMocks.listCompanies.mockResolvedValue([{ company_id: '30000000-0000-0000-0000-000000000001', name: 'Seed Company' }]);
    apiMocks.listFleets.mockResolvedValue([
      { fleet_id: '40000000-0000-0000-0000-000000000001', company_id: '30000000-0000-0000-0000-000000000001', name: 'Fleet A' },
      { fleet_id: '40000000-0000-0000-0000-000000000002', company_id: '30000000-0000-0000-0000-000000000001', name: 'Fleet B' },
    ]);

    renderDriversPage();

    await screen.findByRole('heading', { name: '배송원' });

    fireEvent.change(screen.getByLabelText('플릿'), { target: { value: '40000000-0000-0000-0000-000000000001' } });
    fireEvent.change(screen.getByLabelText('검색'), { target: { value: '김기사' } });

    expect(screen.getByText('11명')).toBeInTheDocument();
    expect(screen.getByText('김기사 1')).toBeInTheDocument();
    expect(screen.getByText('김기사 10')).toBeInTheDocument();
    expect(screen.queryByText('김기사 11')).not.toBeInTheDocument();
    expect(screen.queryByText('박기사 12')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '2' }));

    expect(screen.getByText('김기사 11')).toBeInTheDocument();
    expect(screen.queryByText('김기사 1')).not.toBeInTheDocument();
  });

  it('supports the all page-size option', async () => {
    apiMocks.listDrivers.mockResolvedValue([
      createDriver(1, { name: '한기사', external_user_name: 'ZX한기사' }),
      createDriver(2, { name: '두기사', external_user_name: 'ZX두기사' }),
      createDriver(3, { name: '세기사', external_user_name: 'ZX세기사' }),
    ]);
    apiMocks.listDriverAccountLinks.mockResolvedValue([]);
    apiMocks.listCompanies.mockResolvedValue([{ company_id: '30000000-0000-0000-0000-000000000001', name: 'Seed Company' }]);
    apiMocks.listFleets.mockResolvedValue([
      { fleet_id: '40000000-0000-0000-0000-000000000001', company_id: '30000000-0000-0000-0000-000000000001', name: 'Seed Fleet' },
    ]);

    renderDriversPage();

    await screen.findByRole('heading', { name: '배송원' });

    fireEvent.change(screen.getByLabelText('노출 수'), { target: { value: 'all' } });

    expect(screen.getByText('한기사')).toBeInTheDocument();
    expect(screen.getByText('두기사')).toBeInTheDocument();
    expect(screen.getByText('세기사')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '2' })).not.toBeInTheDocument();
  });
});
