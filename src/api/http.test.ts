import { describe, expect, it } from 'vitest';

import { deserializeSessionPayload } from './http';

describe('deserializeSessionPayload', () => {
  it('maps role_display_name into activeAccount.roleDisplayName', () => {
    const session = deserializeSessionPayload({
      access_token: 'token',
      session_kind: 'normal',
      email: 'custom-role@example.com',
      identity: {
        identity_id: '10000000-0000-0000-0000-000000000001',
        name: '커스텀 관리자',
        birth_date: '1990-01-02',
        status: 'active',
      },
      active_account: {
        account_type: 'manager',
        account_id: '20000000-0000-0000-0000-000000000001',
        company_id: '30000000-0000-0000-0000-000000000001',
        role_type: 'custom_dispatch_manager',
        role_display_name: '배차 운영 관리자',
      },
      available_account_types: ['manager'],
    });

    expect(session.activeAccount).toEqual({
      accountType: 'manager',
      accountId: '20000000-0000-0000-0000-000000000001',
      companyId: '30000000-0000-0000-0000-000000000001',
      roleType: 'custom_dispatch_manager',
      roleDisplayName: '배차 운영 관리자',
    });
  });
});
