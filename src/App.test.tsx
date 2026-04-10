import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { login as loginApi } from './api/auth';
import { loadStoredSession } from './sessionPersistence';

const session = {
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
    roleType: 'company_super_admin',
  },
  availableAccountTypes: ['manager'],
};

vi.mock('./sessionPersistence', () => ({
  clearStoredSession: vi.fn(),
  loadStoredSession: vi.fn(() => session),
  persistSession: vi.fn(),
}));

vi.mock('./api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  signupRequestIntake: vi.fn(),
}));

vi.mock('./api/organization', () => ({
  listCompanies: vi.fn().mockResolvedValue([
    { company_id: '30000000-0000-0000-0000-000000000001', route_no: 1, name: 'Seed Company' },
  ]),
  listFleets: vi.fn().mockResolvedValue([
    {
      fleet_id: '40000000-0000-0000-0000-000000000001',
      route_no: 1,
      company_id: '30000000-0000-0000-0000-000000000001',
      name: 'Seed Fleet',
    },
  ]),
  listPublicCompanies: vi.fn().mockResolvedValue([]),
}));

vi.mock('./api/settlementOps', () => ({
  listSettlementReadRuns: vi.fn().mockResolvedValue([]),
  listSettlementReadItems: vi.fn().mockResolvedValue([]),
  getDriverLatestSettlement: vi.fn().mockResolvedValue(null),
}));

vi.mock('./api/settlementRegistry', () => ({
  getSettlementConfigMetadata: vi.fn().mockResolvedValue({
    sections: [
      {
        key: 'tax_rates',
        title: '세율',
        description: '정산 산출에 적용되는 세금율입니다.',
        fields: [
          {
            key: 'income_tax_rate',
            label: '소득세율',
            description: '과세 기준 소득세율',
            input_type: 'percent',
            unit: '%',
            min: '0.0000',
            max: '100.0000',
            decimal_precision: 4,
            required: true,
          },
        ],
      },
    ],
  }),
  getSettlementConfig: vi.fn().mockResolvedValue({
    singleton_key: 'global',
    income_tax_rate: '0.0000',
    vat_tax_rate: '0.0000',
    reported_amount_rate: '0.0000',
    national_pension_rate: '0.0000',
    health_insurance_rate: '0.0000',
    medical_insurance_rate: '0.0000',
    employment_insurance_rate: '0.0000',
    industrial_accident_insurance_rate: '0.0000',
    special_employment_insurance_rate: '0.0000',
    special_industrial_accident_insurance_rate: '0.0000',
    two_insurance_min_settlement_amount: '0.0000',
    meal_allowance: '0.0000',
  }),
  updateSettlementConfig: vi.fn(),
  listSettlementPolicies: vi.fn(),
  createSettlementPolicy: vi.fn(),
  updateSettlementPolicy: vi.fn(),
  deleteSettlementPolicy: vi.fn(),
  listSettlementPolicyVersions: vi.fn(),
  createSettlementPolicyVersion: vi.fn(),
  updateSettlementPolicyVersion: vi.fn(),
  deleteSettlementPolicyVersion: vi.fn(),
  listSettlementPolicyAssignments: vi.fn(),
  createSettlementPolicyAssignment: vi.fn(),
  updateSettlementPolicyAssignment: vi.fn(),
  deleteSettlementPolicyAssignment: vi.fn(),
}));

vi.mock('./api/settlements', () => ({
  listSettlementRuns: vi.fn().mockResolvedValue([]),
  createSettlementRun: vi.fn(),
  updateSettlementRun: vi.fn(),
  deleteSettlementRun: vi.fn(),
  listSettlementItems: vi.fn().mockResolvedValue([]),
  createSettlementItem: vi.fn(),
  updateSettlementItem: vi.fn(),
  deleteSettlementItem: vi.fn(),
}));

vi.mock('./api/deliveryRecords', () => ({
  listDeliveryRecords: vi.fn().mockResolvedValue([]),
  createDeliveryRecord: vi.fn(),
  updateDeliveryRecord: vi.fn(),
  deleteDeliveryRecord: vi.fn(),
  listDailyDeliveryInputSnapshots: vi.fn().mockResolvedValue([]),
  createDailyDeliveryInputSnapshot: vi.fn(),
  updateDailyDeliveryInputSnapshot: vi.fn(),
  deleteDailyDeliveryInputSnapshot: vi.fn(),
  bootstrapDispatchSnapshots: vi.fn(),
}));

vi.mock('./api/personnelDocuments', () => ({
  listPersonnelDocuments: vi.fn().mockResolvedValue([]),
  getPersonnelDocument: vi.fn(),
  createPersonnelDocument: vi.fn(),
  updatePersonnelDocument: vi.fn(),
}));

vi.mock('./api/drivers', async () => {
  const actual = await vi.importActual<typeof import('./api/drivers')>('./api/drivers');
  return {
    ...actual,
    listDrivers: vi.fn().mockResolvedValue([]),
    getDriver: vi.fn(),
  };
});

vi.mock('./api/regions', () => ({
  listRegions: vi.fn().mockResolvedValue([]),
  getRegionByCode: vi.fn().mockResolvedValue({
    region_id: '10000000-0000-0000-0000-000000000011',
    region_code: 'SEOUL-A',
    name: '서울 A 권역',
    status: 'active',
    difficulty_level: 'high',
    polygon_geojson: { type: 'Polygon', coordinates: [] },
    description: '',
    display_order: 1,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: '2026-04-01T00:00:00Z',
  }),
  createRegion: vi.fn(),
  updateRegion: vi.fn(),
  listRegionDailyStatistics: vi.fn().mockResolvedValue([]),
  listRegionPerformanceSummaries: vi.fn().mockResolvedValue([]),
}));

describe('Admin App', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
    vi.mocked(loadStoredSession).mockReturnValue(session);
    vi.mocked(loginApi).mockReset();
  });

  it('uses the unified dashboard as the root route', async () => {
    render(<App />);

    expect(await screen.findByText('운영 요약')).toBeInTheDocument();
  });

  it('renders personnel documents route inside the unified console', async () => {
    window.history.replaceState({}, '', '/personnel-documents');

    render(<App />);

    expect(await screen.findByRole('heading', { name: '인사문서 목록' })).toBeInTheDocument();
  });

  it('renders the region list route inside the single web console', async () => {
    window.history.replaceState({}, '', '/regions');

    render(<App />);

    expect(await screen.findByRole('heading', { name: '권역 목록' })).toBeInTheDocument();
  });

  it('renders the manager roles route for company super admin', async () => {
    window.history.replaceState({}, '', '/admin/manager-roles');

    render(<App />);

    expect(await screen.findByRole('heading', { name: '관리자 역할' })).toBeInTheDocument();
  });

  it('redirects legacy /account to canonical /me', async () => {
    window.history.replaceState({}, '', '/account');

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/me'));
  });

  it('redirects legacy /accounts to canonical /admin/account-requests', async () => {
    window.history.replaceState({}, '', '/accounts');

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/admin/account-requests'));
  });

  it('redirects legacy menu policy routes to canonical admin/company routes', async () => {
    window.history.replaceState({}, '', '/admin/navigation-policy');

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/admin/menu-policy'));

    window.history.replaceState({}, '', '/company/navigation-policy');

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/company/menu-policy'));
  });

  it('redirects /settlements to the standalone overview entry', async () => {
    window.history.replaceState({}, '', '/settlements');

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/settlements/overview'));
  });

  it('renders settlement overview without process tabs or context selectors', async () => {
    window.history.replaceState({}, '', '/settlements/overview');

    render(<App />);

    expect(await screen.findByRole('heading', { name: '정산 실행 조회' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '정산 기준' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('회사')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('플릿')).not.toBeInTheDocument();
  });

  it('renders settlement process routes with process tabs and context selectors', async () => {
    window.history.replaceState({}, '', '/settlements/criteria');

    render(<App />);

    expect(await screen.findByRole('heading', { name: '정산 처리' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '정산 기준' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '정산 입력' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '정산 실행' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '정산 결과' })).toBeInTheDocument();
    expect(screen.getByLabelText('회사')).toBeInTheDocument();
    expect(screen.getByLabelText('플릿')).toBeInTheDocument();
  });

  it('redirects to the dashboard root after login regardless of the entry route', async () => {
    const user = userEvent.setup();
    vi.mocked(loadStoredSession).mockReturnValue(null);
    vi.mocked(loginApi).mockResolvedValue(session);
    window.history.replaceState({}, '', '/settlements/results');

    render(<App />);

    await user.type(screen.getByLabelText(/아이디/i), 'manager@example.com');
    await user.type(screen.getByLabelText(/비밀번호/i), 'change-me');
    await user.click(screen.getByRole('button', { name: /^로그인$/i }));

    await waitFor(() => expect(window.location.pathname).toBe('/'));
    expect(await screen.findByText('운영 요약')).toBeInTheDocument();
  });

  it('renders the local-only /block route and previews both top notice tones', async () => {
    const user = userEvent.setup();
    window.history.replaceState({}, '', '/block');

    render(<App />);

    expect(await screen.findByRole('heading', { name: '상단 알림 미리보기' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '일반 알림 미리보기' }));
    const successNotice = await screen.findByText('정상 흐름 로그 예시입니다. 상단 알림 템플릿을 확인하세요.');
    expect(successNotice.closest('.top-notice')).toHaveAttribute('data-tone', 'success');

    await user.click(screen.getByRole('button', { name: '오류 알림 미리보기' }));
    const errorNotice = await screen.findByText('오류로 인해 허용된 화면으로 이동했습니다. 상단 알림 템플릿을 확인하세요.');
    expect(errorNotice.closest('.top-notice')).toHaveAttribute('data-tone', 'error');
  });
});
