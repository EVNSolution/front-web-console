import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CompanyNavigationPolicyPage } from './CompanyNavigationPolicyPage';

const getCompanyNavigationPolicies = vi.fn();
const updateCompanyNavigationPolicies = vi.fn();
const resetCompanyNavigationPolicy = vi.fn();

vi.mock('../api/navigationPolicy', () => ({
  getCompanyNavigationPolicies: (...args: unknown[]) => getCompanyNavigationPolicies(...args),
  updateCompanyNavigationPolicies: (...args: unknown[]) => updateCompanyNavigationPolicies(...args),
  resetCompanyNavigationPolicy: (...args: unknown[]) => resetCompanyNavigationPolicy(...args),
}));

describe('CompanyNavigationPolicyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCompanyNavigationPolicies.mockResolvedValue({
      policies: [
        {
          role_type: 'vehicle_manager',
          allowed_nav_keys: ['dashboard', 'vehicles'],
          source: 'company_override',
        },
        {
          role_type: 'settlement_manager',
          allowed_nav_keys: ['dashboard', 'settlements'],
          source: 'global',
        },
        {
          role_type: 'fleet_manager',
          allowed_nav_keys: ['dashboard', 'dispatch'],
          source: 'default',
        },
      ],
    });
    updateCompanyNavigationPolicies.mockResolvedValue({
      policies: [
        {
          role_type: 'vehicle_manager',
          allowed_nav_keys: ['dashboard', 'vehicles', 'vehicle_assignments'],
          source: 'company_override',
        },
        {
          role_type: 'settlement_manager',
          allowed_nav_keys: ['dashboard', 'settlements'],
          source: 'global',
        },
        {
          role_type: 'fleet_manager',
          allowed_nav_keys: ['dashboard', 'dispatch'],
          source: 'default',
        },
      ],
    });
    resetCompanyNavigationPolicy.mockResolvedValue({
      policies: [
        {
          role_type: 'vehicle_manager',
          allowed_nav_keys: ['dashboard', 'vehicles'],
          source: 'global',
        },
        {
          role_type: 'settlement_manager',
          allowed_nav_keys: ['dashboard', 'settlements'],
          source: 'global',
        },
        {
          role_type: 'fleet_manager',
          allowed_nav_keys: ['dashboard', 'dispatch'],
          source: 'default',
        },
      ],
    });
  });

  const session = {
    accessToken: 'token',
    sessionKind: 'normal',
    email: 'company-admin@example.com',
    identity: {
      identityId: '10000000-0000-0000-0000-000000000001',
      name: '회사 전체 관리자',
      birthDate: '1970-01-01',
      status: 'active',
    },
    activeAccount: {
      accountType: 'manager',
      accountId: '20000000-0000-0000-0000-000000000001',
      companyId: '30000000-0000-0000-0000-000000000001',
      roleType: 'company_super_admin',
    },
    availableAccountTypes: ['manager'],
  } as const;

  it('loads company policies and saves an updated role override', async () => {
    render(<CompanyNavigationPolicyPage client={{ request: vi.fn() }} session={session} />);

    await screen.findByRole('heading', { name: '회사 메뉴 정책' });
    fireEvent.click(await screen.findByLabelText('차량 배정'));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(updateCompanyNavigationPolicies).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          policies: expect.arrayContaining([
            expect.objectContaining({
              role_type: 'vehicle_manager',
              allowed_nav_keys: ['dashboard', 'vehicles', 'vehicle_assignments'],
            }),
          ]),
        }),
      );
    });
  });

  it('resets the selected role to inherited policy', async () => {
    render(<CompanyNavigationPolicyPage client={{ request: vi.fn() }} session={session} />);

    await screen.findByRole('heading', { name: '회사 메뉴 정책' });
    fireEvent.click(screen.getByRole('button', { name: '전역 기본값으로 되돌리기' }));

    await waitFor(() => {
      expect(resetCompanyNavigationPolicy).toHaveBeenCalledWith(expect.anything(), {
        role_type: 'vehicle_manager',
      });
    });
  });
}
