import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { loadStoredSession } from './sessionPersistence';
import { resolvePublicCompanyTenant } from './api/companyTenant';
import { ApiError } from './api/http';
import { getWorkspaceBootstrap } from './api/workspaceBootstrap';
import { resolveTenantEntry } from './tenant/resolveTenantEntry';

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
    roleType: 'settlement_manager',
  },
  availableAccountTypes: ['manager'],
};

const systemAdminSession = {
  ...session,
  email: 'system-admin@example.com',
  activeAccount: {
    accountType: 'system_admin' as const,
    accountId: '20000000-0000-0000-0000-000000000002',
    companyId: null,
    roleType: null,
  },
  availableAccountTypes: ['system_admin'],
};

const wrongCompanySession = {
  ...session,
  activeAccount: {
    ...session.activeAccount,
    companyId: '30000000-0000-0000-0000-000000000099',
  },
};

const cockpitBootstrap = {
  companyId: '30000000-0000-0000-0000-000000000001',
  companyName: '천하운수',
  tenantCode: 'cheonha',
  workflowProfile: 'cheonha_ops_v1',
  enabledFeatures: ['settlement', 'vehicle'],
  homeDashboardPreset: {},
  workspacePresets: {},
};

function setupCompanyCockpit({
  pathname = '/',
  sessionValue = session,
  bootstrap = cockpitBootstrap,
}: {
  pathname?: string;
  sessionValue?: typeof session | typeof systemAdminSession | typeof wrongCompanySession | null;
  bootstrap?: typeof cockpitBootstrap;
} = {}) {
  vi.mocked(loadStoredSession).mockReturnValue(sessionValue);
  vi.mocked(resolvePublicCompanyTenant).mockResolvedValue(bootstrap);
  vi.mocked(getWorkspaceBootstrap).mockResolvedValue(bootstrap);
  window.history.replaceState({}, '', pathname);
}

vi.mock('./sessionPersistence', () => ({
  clearStoredSession: vi.fn(),
  loadStoredSession: vi.fn(),
  persistSession: vi.fn(),
}));

vi.mock('./api/auth', () => ({
  login: vi.fn(),
  logout: vi.fn(),
  signupRequestIntake: vi.fn(),
}));

vi.mock('./api/organization', () => ({
  listPublicCompanies: vi.fn().mockResolvedValue([]),
  listCompanies: vi.fn().mockResolvedValue([]),
  listFleets: vi.fn().mockResolvedValue([
    {
      fleet_id: 'fleet-1',
      company_id: '30000000-0000-0000-0000-000000000001',
      name: '천하 메인 플릿',
    },
  ]),
}));

vi.mock('./api/companyTenant', () => ({
  resolvePublicCompanyTenant: vi.fn(),
}));

vi.mock('./api/workspaceBootstrap', () => ({
  getWorkspaceBootstrap: vi.fn(),
}));

vi.mock('./tenant/resolveTenantEntry', () => ({
  resolveTenantEntry: vi.fn(),
}));

vi.mock('./hooks/useNavigationPolicy', () => ({
  useNavigationPolicyWithRefresh: vi.fn(() => ({
    allowedNavKeys: ['dashboard'],
    isLoading: false,
  })),
}));

vi.mock('./pages/SettlementInputsPage', () => ({
  SettlementInputsPage: () => (
    <section>
      <h2>정산 입력 요약</h2>
      <p>cockpit alias surface</p>
    </section>
  ),
}));

async function withHostname<T>(url: string, run: () => Promise<T>): Promise<T> {
  const originalLocation = window.location;
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: new URL(url),
  });

  try {
    return await run();
  } finally {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  }
}

describe('App cockpit entry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/');
    vi.mocked(resolveTenantEntry).mockReturnValue({
      type: 'company',
      tenantCode: 'cheonha',
      host: 'cheonha.ev-dashboard.com',
    });
  });

  it('lands the company shell root on the empty cockpit dashboard shell', async () => {
    setupCompanyCockpit();
    render(<App />);

    await waitFor(() => {
      expect(resolvePublicCompanyTenant).toHaveBeenCalledWith('cheonha');
      expect(getWorkspaceBootstrap).toHaveBeenCalledWith(expect.anything(), 'cheonha');
    });

    expect(await screen.findByText('CLEVER')).toBeInTheDocument();
    expect(await screen.findByText('EV&Solution')).toBeInTheDocument();
    expect(await screen.findByText('천하운수')).toBeInTheDocument();
    expect(screen.queryByText('전용 업무 cockpit')).not.toBeInTheDocument();
    expect(await screen.findByRole('main')).toBeInTheDocument();
    expect(screen.queryByText('천하운수 운영 대시보드')).not.toBeInTheDocument();
  });

  it('dashboard body no longer shows the old finance/attendance/dispatch sections', async () => {
    setupCompanyCockpit();
    render(<App />);

    await waitFor(() => {
      expect(resolvePublicCompanyTenant).toHaveBeenCalledWith('cheonha');
      expect(getWorkspaceBootstrap).toHaveBeenCalledWith(expect.anything(), 'cheonha');
    });

    expect(await screen.findByRole('navigation', { name: '서브도메인 메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '상위 메뉴 열기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: '정산 메뉴' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '홈' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '최근 6개월 수입/지출' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '금월 배차표 기반 근태' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '금일 배차' })).not.toBeInTheDocument();
    expect(
      screen.queryByText('오늘 운영 현황을 우선으로 보고, 월 기준 전환으로 최근 흐름을 함께 확인합니다.'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('기준: 오늘')).not.toBeInTheDocument();
    expect(screen.queryByText('데이터 미연동')).not.toBeInTheDocument();
  });

  it('/settlement redirects to /settlement/home', async () => {
    setupCompanyCockpit({ pathname: '/settlement' });
    render(<App />);

    await waitFor(() => {
      expect(resolvePublicCompanyTenant).toHaveBeenCalledWith('cheonha');
      expect(getWorkspaceBootstrap).toHaveBeenCalledWith(expect.anything(), 'cheonha');
    });
    expect(await screen.findByRole('heading', { name: '천하운수 정산' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/settlement/home');
  });

  it('/settlement/home still resolves under the cockpit shell without a top-level dispatch route', async () => {
    setupCompanyCockpit({ pathname: '/settlement/home' });
    render(<App />);

    await waitFor(() => {
      expect(resolvePublicCompanyTenant).toHaveBeenCalledWith('cheonha');
      expect(getWorkspaceBootstrap).toHaveBeenCalledWith(expect.anything(), 'cheonha');
    });
    expect(await screen.findByRole('heading', { name: '천하운수 정산' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/settlement/home');
    expect(screen.getByText('CLEVER')).toBeInTheDocument();
    expect(screen.getByText('EV&Solution')).toBeInTheDocument();
    const topLevelNav = screen.getByRole('navigation', { name: '서브도메인 메뉴' });
    const settlementNav = screen.getByRole('navigation', { name: '정산 메뉴' });

    expect(topLevelNav).toBeInTheDocument();
    expect(settlementNav).toBeInTheDocument();
    expect(screen.getByTestId('subdomain-settlement-sidebar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '상위 메뉴 열기' })).toBeInTheDocument();
    expect(within(topLevelNav).queryAllByRole('link')).toHaveLength(0);
    expect(within(settlementNav).getAllByRole('link')).toHaveLength(6);
    expect(within(settlementNav).getByRole('link', { name: '홈' })).toHaveAttribute('href', '/settlement/home');
    expect(within(settlementNav).getByRole('link', { name: '정산 처리' })).toHaveAttribute(
      'href',
      '/settlement/process',
    );
  });

  it('returning to / removes the settlement sidebar but preserves the top-level menu state', async () => {
    const user = userEvent.setup();

    setupCompanyCockpit();
    render(<App />);

    await waitFor(() => {
      expect(resolvePublicCompanyTenant).toHaveBeenCalledWith('cheonha');
      expect(getWorkspaceBootstrap).toHaveBeenCalledWith(expect.anything(), 'cheonha');
    });

    const settlementButton = await screen.findByRole('button', { name: '상위 메뉴 열기' });

    await user.click(settlementButton);
    expect(settlementButton).toHaveAttribute('aria-expanded', 'true');
    expect(within(screen.getByRole('navigation', { name: '서브도메인 메뉴' })).getAllByRole('link')).toHaveLength(2);

    await user.click(screen.getByRole('link', { name: '정산' }));
    expect(await screen.findByRole('navigation', { name: '정산 메뉴' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '상위 메뉴 열기' })).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('link', { name: '대시보드' }));
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
    expect(screen.queryByRole('navigation', { name: '정산 메뉴' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '상위 메뉴 열기' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(screen.getByRole('navigation', { name: '서브도메인 메뉴' })).getAllByRole('link')).toHaveLength(2);
  });

  it('fails closed on removed /settlements aliases in the cockpit shell', async () => {
    setupCompanyCockpit({ pathname: '/settlements/inputs' });
    render(<App />);

    await waitFor(() => {
      expect(resolvePublicCompanyTenant).toHaveBeenCalledWith('cheonha');
      expect(getWorkspaceBootstrap).toHaveBeenCalledWith(expect.anything(), 'cheonha');
      expect(window.location.pathname).toBe('/');
    });
    expect(screen.queryByText('cockpit alias surface')).not.toBeInTheDocument();
    expect(screen.queryByText('천하운수 운영 대시보드')).not.toBeInTheDocument();
  });

  it('keeps the company shell from exposing a top-level dispatch route', async () => {
    setupCompanyCockpit({ pathname: '/dispatch' });
    render(<App />);

    await waitFor(() => {
      expect(resolvePublicCompanyTenant).toHaveBeenCalledWith('cheonha');
      expect(getWorkspaceBootstrap).toHaveBeenCalledWith(expect.anything(), 'cheonha');
    });
    expect(window.location.pathname).toBe('/');
    expect(screen.queryByText('배차 관리 권한 필요')).not.toBeInTheDocument();
    expect(screen.queryByText('천하운수 운영 대시보드')).not.toBeInTheDocument();
  });

  it('keeps the company shell from exposing other legacy top-level workspace routes', async () => {
    vi.mocked(loadStoredSession).mockReturnValue(session);
    vi.mocked(resolvePublicCompanyTenant).mockResolvedValue({
      companyId: '30000000-0000-0000-0000-000000000001',
      companyName: '천하운수',
      tenantCode: 'cheonha',
      workflowProfile: 'cheonha_ops_v1',
      enabledFeatures: ['settlement', 'vehicle'],
      homeDashboardPreset: {},
      workspacePresets: {},
    });
    vi.mocked(getWorkspaceBootstrap).mockResolvedValue({
      companyId: '30000000-0000-0000-0000-000000000001',
      companyName: '천하운수',
      tenantCode: 'cheonha',
      workflowProfile: 'cheonha_ops_v1',
      enabledFeatures: ['settlement', 'vehicle'],
      homeDashboardPreset: {},
      workspacePresets: {},
    });

    window.history.replaceState({}, '', '/vehicle');
    render(<App />);

    await waitFor(() => {
      expect(resolvePublicCompanyTenant).toHaveBeenCalledWith('cheonha');
      expect(getWorkspaceBootstrap).toHaveBeenCalledWith(expect.anything(), 'cheonha');
    });
    await waitFor(() => {
      expect(window.location.pathname).toBe('/');
    });
    expect(screen.queryByText('천하운수 운영 대시보드')).not.toBeInTheDocument();
  });

  it('blocks unknown company hosts after public resolve instead of opening the generic shell', async () => {
    const actualTenantModule = await vi.importActual<typeof import('./tenant/resolveTenantEntry')>(
      './tenant/resolveTenantEntry',
    );
    vi.mocked(loadStoredSession).mockReturnValue(session);

    await withHostname('https://unknown.ev-dashboard.com/', async () => {
      vi.mocked(resolveTenantEntry).mockImplementation(actualTenantModule.resolveTenantEntry);
      vi.mocked(resolvePublicCompanyTenant).mockRejectedValue(new ApiError(404, 'company_not_found', 'missing', {}));

      window.history.replaceState({}, '', '/');
      render(<App />);

      expect(await screen.findByText('존재하지 않는 회사 서브도메인입니다.')).toBeInTheDocument();
      expect(screen.queryByText('회사 전용 로그인')).not.toBeInTheDocument();
      expect(screen.queryByText(/전용 콘솔$/)).not.toBeInTheDocument();
      expect(getWorkspaceBootstrap).not.toHaveBeenCalled();
    });
  });

  it('blocks unknown company hosts before rendering the generic login shell when signed out', async () => {
    const actualTenantModule = await vi.importActual<typeof import('./tenant/resolveTenantEntry')>(
      './tenant/resolveTenantEntry',
    );
    vi.mocked(loadStoredSession).mockReturnValue(null);

    await withHostname('https://unknown.ev-dashboard.com/', async () => {
      vi.mocked(resolveTenantEntry).mockImplementation(actualTenantModule.resolveTenantEntry);
      vi.mocked(resolvePublicCompanyTenant).mockRejectedValue(new ApiError(404, 'company_not_found', 'missing', {}));

      window.history.replaceState({}, '', '/');
      render(<App />);

      expect(await screen.findByText('존재하지 않는 회사 서브도메인입니다.')).toBeInTheDocument();
      expect(screen.queryByText('회사 전용 로그인')).not.toBeInTheDocument();
      expect(screen.queryByText(/전용 콘솔$/)).not.toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: '로그인' })).not.toBeInTheDocument();
      expect(getWorkspaceBootstrap).not.toHaveBeenCalled();
    });
  });

  it('shows a retryable resolve error instead of treating non-404 tenant resolve failures as not found', async () => {
    const actualTenantModule = await vi.importActual<typeof import('./tenant/resolveTenantEntry')>(
      './tenant/resolveTenantEntry',
    );
    vi.mocked(loadStoredSession).mockReturnValue(null);

    await withHostname('https://cheonha.ev-dashboard.com/', async () => {
      vi.mocked(resolveTenantEntry).mockImplementation(actualTenantModule.resolveTenantEntry);
      vi.mocked(resolvePublicCompanyTenant).mockRejectedValue(
        new ApiError(503, 'service_unavailable', 'tenant service unavailable', {}),
      );

      window.history.replaceState({}, '', '/');
      render(<App />);

      expect(await screen.findByText('회사 문맥을 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.')).toBeInTheDocument();
      expect(screen.queryByText('존재하지 않는 회사 서브도메인입니다.')).not.toBeInTheDocument();
      expect(getWorkspaceBootstrap).not.toHaveBeenCalled();
    });
  });

  it('hides company search and select in signup for tenant subdomains', async () => {
    const user = userEvent.setup();
    vi.mocked(loadStoredSession).mockReturnValue(null);
    vi.mocked(resolvePublicCompanyTenant).mockResolvedValue({
      companyId: '30000000-0000-0000-0000-000000000001',
      companyName: '천하운수',
      tenantCode: 'cheonha',
      workflowProfile: 'cheonha_ops_v1',
      enabledFeatures: ['settlement'],
      homeDashboardPreset: {},
      workspacePresets: {},
    });

    render(<App />);

    expect(await screen.findByText('천하운수')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '천하운수' })).not.toBeInTheDocument();
    expect(screen.getByText('회사 전용 로그인')).toBeInTheDocument();
    expect(screen.getByText('천하운수 전용 콘솔')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(screen.getByText('회원가입 요청은 이 회사 전용 문맥으로 접수됩니다.')).toBeInTheDocument();
      expect(screen.queryByLabelText('회사 검색')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('회사 선택')).not.toBeInTheDocument();
    });
  });

  it('keeps the main-domain signed-out entry generic', async () => {
    const actualTenantModule = await vi.importActual<typeof import('./tenant/resolveTenantEntry')>(
      './tenant/resolveTenantEntry',
    );
    vi.mocked(loadStoredSession).mockReturnValue(null);

    await withHostname('https://ev-dashboard.com/', async () => {
      vi.mocked(resolveTenantEntry).mockImplementation(actualTenantModule.resolveTenantEntry);

      window.history.replaceState({}, '', '/');
      render(<App />);

      expect(await screen.findByRole('heading', { name: '로그인' })).toBeInTheDocument();
      expect(screen.getByText('통합 운영 웹 콘솔')).toBeInTheDocument();
      expect(screen.queryByText('회사 전용 로그인')).not.toBeInTheDocument();
      expect(screen.queryByText(/전용 콘솔$/)).not.toBeInTheDocument();
      expect(resolvePublicCompanyTenant).not.toHaveBeenCalled();
      expect(getWorkspaceBootstrap).not.toHaveBeenCalled();
    });
  });

  it('rejects a system-admin session on a company subdomain before entering the cockpit shell', async () => {
    vi.mocked(loadStoredSession).mockReturnValue(systemAdminSession);
    vi.mocked(resolvePublicCompanyTenant).mockResolvedValue(cockpitBootstrap);
    vi.mocked(getWorkspaceBootstrap).mockResolvedValue(cockpitBootstrap);

    render(<App />);

    await waitFor(() => expect(getWorkspaceBootstrap).not.toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: '도메인 접근 권한 필요' })).toBeInTheDocument();
    expect(screen.getByText('회사 계정은 자기 회사 서브도메인에서만 사용할 수 있습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '천하운수 운영 대시보드' })).not.toBeInTheDocument();
    expect(screen.queryByText('전용 업무 cockpit')).not.toBeInTheDocument();
  });

  it('rejects a company manager session on the wrong company subdomain before entering the cockpit shell', async () => {
    vi.mocked(loadStoredSession).mockReturnValue(wrongCompanySession);
    vi.mocked(resolveTenantEntry).mockReturnValue({
      type: 'company',
      tenantCode: 'other-company',
      host: 'other-company.ev-dashboard.com',
    });
    vi.mocked(resolvePublicCompanyTenant).mockResolvedValue(cockpitBootstrap);
    vi.mocked(getWorkspaceBootstrap).mockResolvedValue(cockpitBootstrap);

    render(<App />);

    await waitFor(() => expect(getWorkspaceBootstrap).not.toHaveBeenCalled());
    expect(screen.getByRole('heading', { name: '도메인 접근 권한 필요' })).toBeInTheDocument();
    expect(screen.getByText('회사 계정은 자기 회사 서브도메인에서만 사용할 수 있습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '천하운수 운영 대시보드' })).not.toBeInTheDocument();
    expect(screen.queryByText('전용 업무 cockpit')).not.toBeInTheDocument();
  });
});
