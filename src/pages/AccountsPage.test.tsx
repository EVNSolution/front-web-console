import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { AccountsPage } from './AccountsPage';

const apiMocks = vi.hoisted(() => ({
  listManagedRequests: vi.fn(),
  listManageableManagerAccounts: vi.fn(),
  listCompanyManagerRoles: vi.fn(),
  approveManagedRequest: vi.fn(),
  rejectManagedRequest: vi.fn(),
  changeManagerAccountRole: vi.fn(),
  archiveManagerAccount: vi.fn(),
}));

vi.mock('../api/authRequests', () => ({
  listManagedRequests: apiMocks.listManagedRequests,
  approveManagedRequest: apiMocks.approveManagedRequest,
  rejectManagedRequest: apiMocks.rejectManagedRequest,
}));

vi.mock('../api/managerAccounts', () => ({
  listManageableManagerAccounts: apiMocks.listManageableManagerAccounts,
  changeManagerAccountRole: apiMocks.changeManagerAccountRole,
  archiveManagerAccount: apiMocks.archiveManagerAccount,
}));

vi.mock('../api/managerRoles', () => ({
  listCompanyManagerRoles: apiMocks.listCompanyManagerRoles,
}));

vi.mock('../api/organization', () => ({
  listCompanies: vi.fn().mockResolvedValue([
    { company_id: '40000000-0000-0000-0000-000000000001', name: '알파 회사' },
  ]),
}));

describe('AccountsPage', () => {
  it('renders request management tabs and manageable manager accounts', async () => {
    apiMocks.listManagedRequests.mockResolvedValue({
      identity: {
        identity_id: '10000000-0000-0000-0000-000000000001',
        name: '현재 관리자',
        birth_date: '1970-01-01',
        status: 'active',
      },
      inquiry_message: '',
      requests: [
        {
          identity_signup_request_id: '20000000-0000-0000-0000-000000000001',
          identity: {
            identity_id: '30000000-0000-0000-0000-000000000001',
            name: '홍길동',
            birth_date: '1990-01-01',
            status: 'active',
          },
          request_type: 'manager_account_create',
          request_display_name: '관리자 계정 신청',
          status: 'pending',
          status_message: '검토 중입니다.',
          company_id: '40000000-0000-0000-0000-000000000001',
          requested_at: '2026-04-04T09:00:00Z',
        },
      ],
    });
    apiMocks.listManageableManagerAccounts.mockResolvedValue({
      accounts: [
        {
          manager_account_id: '50000000-0000-0000-0000-000000000001',
          identity: {
            identity_id: '60000000-0000-0000-0000-000000000001',
            name: '차량 관리자',
            birth_date: '1988-02-02',
            status: 'active',
          },
          company_id: '40000000-0000-0000-0000-000000000001',
          role_type: 'custom_dispatch_manager',
          role_display_name: '배차 운영 관리자',
          status: 'active',
          created_at: '2026-04-04T09:30:00Z',
        },
      ],
    });
    apiMocks.listCompanyManagerRoles.mockResolvedValue({
      roles: [
        {
          company_manager_role_id: '71000000-0000-0000-0000-000000000001',
          company_id: '40000000-0000-0000-0000-000000000001',
          code: 'company_super_admin',
          display_name: '회사 전체 관리자',
          is_system_required: true,
          is_default: true,
          assigned_count: 1,
          can_delete: false,
          delete_block_reason: '회사 전체 관리자 역할은 삭제할 수 없습니다.',
          allowed_nav_keys: ['dashboard', 'accounts'],
        },
        {
          company_manager_role_id: '72000000-0000-0000-0000-000000000001',
          company_id: '40000000-0000-0000-0000-000000000001',
          code: 'custom_dispatch_manager',
          display_name: '배차 운영 관리자',
          is_system_required: false,
          is_default: false,
          assigned_count: 1,
          can_delete: false,
          delete_block_reason: '배정된 관리자가 있습니다.',
          allowed_nav_keys: ['dashboard', 'dispatch'],
        },
        {
          company_manager_role_id: '73000000-0000-0000-0000-000000000001',
          company_id: '40000000-0000-0000-0000-000000000001',
          code: 'custom_safety_manager',
          display_name: '안전 관리자',
          is_system_required: false,
          is_default: false,
          assigned_count: 0,
          can_delete: true,
          delete_block_reason: null,
          allowed_nav_keys: ['dashboard', 'vehicles'],
        },
      ],
    });
    apiMocks.approveManagedRequest.mockResolvedValue({
      identity_signup_request_id: '20000000-0000-0000-0000-000000000001',
      identity: {
        identity_id: '30000000-0000-0000-0000-000000000001',
        name: '홍길동',
        birth_date: '1990-01-01',
        status: 'active',
      },
      request_type: 'manager_account_create',
      request_display_name: '관리자 계정 신청',
      status: 'approved',
      status_message: '승인되어 사용할 수 있습니다.',
      company_id: '40000000-0000-0000-0000-000000000001',
      requested_at: '2026-04-04T09:00:00Z',
    });
    apiMocks.rejectManagedRequest.mockResolvedValue({});
    apiMocks.changeManagerAccountRole.mockResolvedValue({
      manager_account_id: '50000000-0000-0000-0000-000000000001',
      identity: {
        identity_id: '60000000-0000-0000-0000-000000000001',
        name: '차량 관리자',
        birth_date: '1988-02-02',
        status: 'active',
      },
      company_id: '40000000-0000-0000-0000-000000000001',
      role_type: 'custom_safety_manager',
      role_display_name: '안전 관리자',
      status: 'active',
      created_at: '2026-04-04T09:30:00Z',
    });
    apiMocks.archiveManagerAccount.mockResolvedValue({
      manager_account_id: '50000000-0000-0000-0000-000000000001',
      identity: {
        identity_id: '60000000-0000-0000-0000-000000000001',
        name: '차량 관리자',
        birth_date: '1988-02-02',
        status: 'active',
      },
      company_id: '40000000-0000-0000-0000-000000000001',
      role_type: 'custom_safety_manager',
      role_display_name: '안전 관리자',
      status: 'archived',
      created_at: '2026-04-04T09:30:00Z',
    });

    render(
      <MemoryRouter>
        <AccountsPage
          client={{ request: vi.fn() }}
          session={{
            accessToken: 'token',
            sessionKind: 'normal',
            email: 'super@example.com',
            identity: {
              identityId: '90000000-0000-0000-0000-000000000001',
              name: '회사 전체 관리자',
              birthDate: '1990-01-01',
              status: 'active',
            },
            activeAccount: {
              accountType: 'manager',
              accountId: '91000000-0000-0000-0000-000000000001',
              companyId: '40000000-0000-0000-0000-000000000001',
              roleType: 'company_super_admin',
            },
            availableAccountTypes: ['manager'],
          }}
        />
      </MemoryRouter>,
    );

    await screen.findByText('홍길동');
    expect(screen.getByText('현재 권한으로 처리할 수 있는 하위 요청과 관리자 계정만 표시합니다.')).toBeInTheDocument();
    expect(screen.queryByText('요청 처리와 관리자 계정 운영을 한 화면에서 이어서 처리합니다.')).not.toBeInTheDocument();
    expect(screen.queryByText('처리 대기 요청')).not.toBeInTheDocument();
    expect(screen.queryByText('현재 활성 관리자 계정')).not.toBeInTheDocument();
    expect(screen.getAllByText('알파 회사').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: '대기' })).toHaveClass('accounts-status-tab');
    expect(screen.getByRole('button', { name: '승인됨' })).toHaveClass('accounts-status-tab');
    expect(screen.getByRole('button', { name: '반려됨' })).toHaveClass('accounts-status-tab');
    expect(screen.getByText('관리자 계정 신청')).toBeInTheDocument();
    expect(screen.getByText('검토 중입니다.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '승인' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '반려' })).toBeInTheDocument();
    expect(screen.getByText('총 1건 요청')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '활성 관리자 계정' })).toBeInTheDocument();
    expect(screen.getAllByText('배차 운영 관리자').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: '권한 변경' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '계정 종료' })).toBeInTheDocument();
    expect(screen.getByText('총 1명 관리자')).toBeInTheDocument();
    expect(screen.getAllByText('2026. 4. 4.').length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /계정 생성/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('option', { name: '회사 전체 관리자' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('option', { name: '배차 운영 관리자' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('option', { name: '안전 관리자' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('table', { name: '활성 관리자 계정 목록' })).toHaveClass('accounts-table', 'accounts-manager-table');
    expect(screen.getByTestId('manager-account-actions-50000000-0000-0000-0000-000000000001')).toHaveClass('accounts-manager-inline-actions');

    fireEvent.change(screen.getAllByDisplayValue('배차 운영 관리자')[0], { target: { value: 'custom_safety_manager' } });
    fireEvent.click(screen.getAllByRole('button', { name: '승인' })[0]);
    await waitFor(() => {
      expect(apiMocks.approveManagedRequest).toHaveBeenCalledWith(
        expect.anything(),
        '20000000-0000-0000-0000-000000000001',
        'custom_safety_manager',
      );
    });

    fireEvent.change(screen.getAllByDisplayValue('배차 운영 관리자')[1], { target: { value: 'custom_safety_manager' } });
    expect(screen.getByRole('button', { name: '권한 변경' })).toBeInTheDocument();
    fireEvent.change(screen.getByDisplayValue('안전 관리자'), { target: { value: 'custom_dispatch_manager' } });
    expect(screen.queryByRole('button', { name: '권한 변경' })).not.toBeInTheDocument();

    fireEvent.change(screen.getAllByDisplayValue('배차 운영 관리자')[1], { target: { value: 'custom_safety_manager' } });
    expect(screen.getByRole('button', { name: '권한 변경' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '권한 변경' }));
    await waitFor(() => {
      expect(apiMocks.changeManagerAccountRole).toHaveBeenCalledWith(
        expect.anything(),
        '50000000-0000-0000-0000-000000000001',
        'custom_safety_manager',
      );
    });

    fireEvent.click(screen.getByRole('button', { name: '계정 종료' }));
    await waitFor(() => {
      expect(apiMocks.archiveManagerAccount).toHaveBeenCalledWith(
        expect.anything(),
        '50000000-0000-0000-0000-000000000001',
      );
    });
  });
});
