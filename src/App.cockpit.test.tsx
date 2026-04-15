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

  it('renders the Cheonha cockpit dashboard after workspace bootstrap resolves', async () => {
    vi.mocked(loadStoredSession).mockReturnValue(session);
    vi.mocked(getWorkspaceBootstrap).mockResolvedValue({
      companyId: '30000000-0000-0000-0000-000000000001',
      companyName: '천하운수',
      tenantCode: 'cheonha',
      workflowProfile: 'cheonha_ops_v1',
      enabledFeatures: ['settlement', 'vehicle'],
      homeDashboardPreset: {},
      workspacePresets: {},
    });

    render(<App />);

    expect(await screen.findByRole('heading', { name: '천하운수' })).toBeInTheDocument();
    expect(screen.getByText('정산').closest('a')).toHaveAttribute('href', '/settlement');
    expect(screen.getByText('차량').closest('a')).toHaveAttribute('href', '/vehicle');
    expect(screen.getAllByText('빈 카드')).toHaveLength(2);
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
