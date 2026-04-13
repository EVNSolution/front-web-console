import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { HttpClient } from '../api/http';
import { ManagerRolesPage } from './ManagerRolesPage';

const listCompanies = vi.fn();
const listCompanyManagerRoles = vi.fn();
const createCompanyManagerRole = vi.fn();
const updateCompanyManagerRole = vi.fn();
const deleteCompanyManagerRole = vi.fn();

vi.mock('../api/organization', () => ({
  listCompanies: (...args: unknown[]) => listCompanies(...args),
}));

vi.mock('../api/managerRoles', () => ({
  listCompanyManagerRoles: (...args: unknown[]) => listCompanyManagerRoles(...args),
  createCompanyManagerRole: (...args: unknown[]) => createCompanyManagerRole(...args),
  updateCompanyManagerRole: (...args: unknown[]) => updateCompanyManagerRole(...args),
  deleteCompanyManagerRole: (...args: unknown[]) => deleteCompanyManagerRole(...args),
}));

const client = { request: vi.fn() } as unknown as HttpClient;

const systemAdminSession = {
  accessToken: 'token',
  sessionKind: 'normal',
  email: 'sysadmin@example.com',
  identity: {
    identityId: '10000000-0000-0000-0000-000000000001',
    name: '시스템 관리자',
    birthDate: '1970-01-01',
    status: 'active',
  },
  activeAccount: {
    accountType: 'system_admin' as const,
    accountId: '20000000-0000-0000-0000-000000000001',
  },
  availableAccountTypes: ['system_admin'],
};

const companyARoles = [
  {
    company_manager_role_id: 'role-company-super-admin',
    company_id: 'company-a',
    code: 'company_super_admin',
    display_name: '회사 전체 관리자',
    scope_level: 'company',
    is_system_required: true,
    is_default: true,
    assigned_count: 1,
    can_delete: false,
    delete_block_reason: '필수 역할은 삭제할 수 없습니다.',
  },
  {
    company_manager_role_id: 'role-vehicle-manager',
    company_id: 'company-a',
    code: 'vehicle_manager',
    display_name: '차량 관리자',
    scope_level: 'company',
    is_system_required: false,
    is_default: true,
    assigned_count: 1,
    can_delete: false,
    delete_block_reason: '배정된 관리자가 있는 역할은 삭제할 수 없습니다.',
  },
  {
    company_manager_role_id: 'role-custom-1',
    company_id: 'company-a',
    code: 'custom_role_1',
    display_name: '배차 품질 관리자',
    scope_level: 'fleet',
    is_system_required: false,
    is_default: false,
    assigned_count: 0,
    can_delete: true,
    delete_block_reason: null,
  },
];

describe('ManagerRolesPage', () => {
  beforeEach(() => {
    listCompanies.mockReset();
    listCompanyManagerRoles.mockReset();
    createCompanyManagerRole.mockReset();
    updateCompanyManagerRole.mockReset();
    deleteCompanyManagerRole.mockReset();

    listCompanies.mockResolvedValue([
      { company_id: 'company-a', name: '에이 법인' },
      { company_id: 'company-b', name: '비 법인' },
    ]);
    listCompanyManagerRoles.mockResolvedValue({ roles: companyARoles });
  });

  it('loads company roles from API and shows delete restrictions', async () => {
    render(<ManagerRolesPage client={client} session={systemAdminSession} />);

    expect(await screen.findByRole('heading', { name: '관리자 역할' })).toBeInTheDocument();
    expect(document.querySelector('.page-layout.page-layout-template-workbench')).not.toBeNull();
    await waitFor(() =>
      expect(listCompanyManagerRoles).toHaveBeenCalledWith(client, 'company-a'),
    );
    expect(screen.getByDisplayValue('회사 전체 관리자')).toBeInTheDocument();
    expect(screen.getByDisplayValue('차량 관리자')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '회사 전체 관리자 삭제' })).toBeDisabled();
    expect(screen.getByText('필수 역할은 삭제할 수 없습니다.')).toBeInTheDocument();
    expect(screen.getByText('배정된 관리자가 있는 역할은 삭제할 수 없습니다.')).toBeInTheDocument();
  });

  it('creates a new role through API', async () => {
    createCompanyManagerRole.mockResolvedValue({
      company_manager_role_id: 'role-custom-2',
      company_id: 'company-a',
      code: 'custom_role_2',
      display_name: '새 관리자 역할 2',
      scope_level: 'fleet',
      is_system_required: false,
      is_default: false,
      assigned_count: 0,
      can_delete: true,
      delete_block_reason: null,
    });

    render(<ManagerRolesPage client={client} session={systemAdminSession} />);

    await screen.findByDisplayValue('배차 품질 관리자');
    fireEvent.change(screen.getByLabelText('역할 범위'), { target: { value: 'fleet' } });
    fireEvent.click(screen.getByRole('button', { name: '역할 추가' }));

    await waitFor(() =>
      expect(createCompanyManagerRole).toHaveBeenCalledWith(client, {
        companyId: 'company-a',
        displayName: '새 관리자 역할 2',
        scopeLevel: 'fleet',
      }),
    );
    expect(await screen.findByDisplayValue('새 관리자 역할 2')).toBeInTheDocument();
  });

  it('renames a role through API when save is pressed', async () => {
    updateCompanyManagerRole.mockResolvedValue({
      ...companyARoles[2],
      display_name: '배차 품질 리더',
    });

    render(<ManagerRolesPage client={client} session={systemAdminSession} />);

    const input = await screen.findByDisplayValue('배차 품질 관리자');
    fireEvent.change(input, { target: { value: '배차 품질 리더' } });
    fireEvent.click(screen.getByRole('button', { name: '배차 품질 관리자 저장' }));

    await waitFor(() =>
      expect(updateCompanyManagerRole).toHaveBeenCalledWith(client, 'role-custom-1', {
        displayName: '배차 품질 리더',
      }),
    );
    expect(await screen.findByDisplayValue('배차 품질 리더')).toBeInTheDocument();
  });

  it('deletes a removable role through API', async () => {
    deleteCompanyManagerRole.mockResolvedValue(undefined);

    render(<ManagerRolesPage client={client} session={systemAdminSession} />);

    await screen.findByDisplayValue('배차 품질 관리자');
    fireEvent.click(screen.getByRole('button', { name: '배차 품질 관리자 삭제' }));

    await waitFor(() =>
      expect(deleteCompanyManagerRole).toHaveBeenCalledWith(client, 'role-custom-1'),
    );
    expect(screen.queryByDisplayValue('배차 품질 관리자')).not.toBeInTheDocument();
  });
});
