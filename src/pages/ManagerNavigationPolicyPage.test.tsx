import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ManagerNavigationPolicyPage } from './ManagerNavigationPolicyPage';

const getManagedNavigationPolicies = vi.fn();
const updateManagedNavigationPolicies = vi.fn();

vi.mock('../api/navigationPolicy', () => ({
  getManagedNavigationPolicies: (...args: unknown[]) => getManagedNavigationPolicies(...args),
  updateManagedNavigationPolicies: (...args: unknown[]) => updateManagedNavigationPolicies(...args),
}));

describe('ManagerNavigationPolicyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getManagedNavigationPolicies.mockResolvedValue({
      policies: [
        {
          role_type: 'company_super_admin',
          allowed_nav_keys: ['dashboard', 'account', 'accounts', 'announcements', 'support', 'notifications'],
          source: 'global',
        },
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
          allowed_nav_keys: ['dashboard', 'companies', 'drivers', 'dispatch'],
          source: 'global',
        },
      ],
    });
    updateManagedNavigationPolicies.mockResolvedValue({
      policies: [
        {
          role_type: 'company_super_admin',
          allowed_nav_keys: ['dashboard', 'account', 'accounts', 'announcements', 'support', 'notifications'],
          source: 'global',
        },
        {
          role_type: 'vehicle_manager',
          allowed_nav_keys: ['dashboard', 'vehicles', 'vehicle_assignments'],
          source: 'global',
        },
        {
          role_type: 'settlement_manager',
          allowed_nav_keys: ['dashboard', 'settlements'],
          source: 'global',
        },
        {
          role_type: 'fleet_manager',
          allowed_nav_keys: ['dashboard', 'companies', 'drivers', 'dispatch'],
          source: 'global',
        },
      ],
    });
  });

  it('updates preview and saves the selected role policy', async () => {
    render(
      <ManagerNavigationPolicyPage
        client={{
          request: vi.fn(),
        }}
      />,
    );

    await screen.findByRole('heading', { name: '전역 관리자 메뉴 정책' });

    fireEvent.click(screen.getByRole('button', { name: /차량 관리자/ }));

    const preview = screen.getByTestId('navigation-policy-preview');
    expect(within(preview).queryByText('차량 배정')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('차량 배정'));

    expect(within(preview).getByText('차량 배정')).toBeInTheDocument();
    expect(screen.getByText('저장 전 변경 있음')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '현재 역할 저장' }));

    await waitFor(() => {
      expect(updateManagedNavigationPolicies).toHaveBeenCalledWith(
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
});
