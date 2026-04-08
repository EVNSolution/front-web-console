import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
          allowed_nav_keys: ['dashboard', 'account', 'manager_navigation_policy'],
        },
        {
          role_type: 'vehicle_manager',
          allowed_nav_keys: ['dashboard', 'vehicles'],
        },
      ],
    });
    updateManagedNavigationPolicies.mockResolvedValue({
      policies: [
        {
          role_type: 'company_super_admin',
          allowed_nav_keys: ['dashboard', 'account', 'manager_navigation_policy'],
        },
        {
          role_type: 'vehicle_manager',
          allowed_nav_keys: ['dashboard', 'vehicles', 'vehicle_assignments'],
          source: 'stored',
        },
      ],
    });
  });

  it('loads policies and saves updated nav keys', async () => {
    render(
      <ManagerNavigationPolicyPage
        client={{
          request: vi.fn(),
        }}
      />,
    );

    await screen.findByRole('heading', { name: '관리자 권한 정책' });
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'vehicle_manager' },
    });
    fireEvent.click(await screen.findByLabelText('차량 배정'));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

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
