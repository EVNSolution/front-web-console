import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import App from './App';
import { loadStoredSession } from './sessionPersistence';
import { resolvePublicCompanyTenant } from './api/companyTenant';
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

  it('lands the company shell root on the cockpit dashboard', async () => {
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

    window.history.replaceState({}, '', '/');
    render(<App />);

    await waitFor(() => {
      expect(resolvePublicCompanyTenant).toHaveBeenCalledWith('cheonha');
      expect(getWorkspaceBootstrap).toHaveBeenCalledWith(expect.anything(), 'cheonha');
    });
    expect(screen.getByText('정산').closest('a')).toHaveAttribute('href', '/settlement');
    expect(screen.getByText('차량').closest('a')).toHaveAttribute('href', '/vehicle');
    expect(screen.getAllByText('빈 카드')).toHaveLength(2);
  });

  it('keeps settlement under /settlement', async () => {
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

    window.history.replaceState({}, '', '/settlement');
    render(<App />);

    await waitFor(() => {
      expect(resolvePublicCompanyTenant).toHaveBeenCalledWith('cheonha');
      expect(getWorkspaceBootstrap).toHaveBeenCalledWith(expect.anything(), 'cheonha');
    });
    expect(await screen.findByRole('heading', { name: '천하운수 정산' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '배차 데이터' })).toHaveAttribute('href', '/settlement/dispatch-data');
    expect(screen.getByRole('link', { name: '배송원 관리' })).toHaveAttribute('href', '/settlement/driver-management');
  });

  it('keeps the company shell from exposing a top-level dispatch route', async () => {
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

    window.history.replaceState({}, '', '/dispatch');
    render(<App />);

    await waitFor(() => {
      expect(resolvePublicCompanyTenant).toHaveBeenCalledWith('cheonha');
      expect(getWorkspaceBootstrap).toHaveBeenCalledWith(expect.anything(), 'cheonha');
    });
    expect(await screen.findAllByText('천하운수')).toHaveLength(2);
    expect(window.location.pathname).toBe('/');
    expect(screen.queryByText('배차 관리 권한 필요')).not.toBeInTheDocument();
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
    expect(window.location.pathname).toBe('/');
  });

  it('blocks unknown company hosts after public resolve instead of opening the generic shell', async () => {
    vi.mocked(loadStoredSession).mockReturnValue(session);
    vi.mocked(resolveTenantEntry).mockReturnValue({
      type: 'company',
      tenantCode: 'unknown',
      host: 'unknown.ev-dashboard.com',
    });
    vi.mocked(resolvePublicCompanyTenant).mockRejectedValue(new Error('missing company'));

    window.history.replaceState({}, '', '/');
    render(<App />);

    expect(await screen.findByText('존재하지 않는 회사 서브도메인입니다.')).toBeInTheDocument();
    expect(screen.queryByText('천하운수 전용 워크스페이스')).not.toBeInTheDocument();
    expect(getWorkspaceBootstrap).not.toHaveBeenCalled();
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

    expect(await screen.findByText('천하운수 전용 워크스페이스')).toBeInTheDocument();
    expect(screen.getByText('천하운수 전용 콘솔')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '회원가입' }));

    await waitFor(() => {
      expect(screen.getByText('회원가입 요청은 이 회사 전용 문맥으로 접수됩니다.')).toBeInTheDocument();
      expect(screen.queryByLabelText('회사 검색')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('회사 선택')).not.toBeInTheDocument();
    });
  });
});
