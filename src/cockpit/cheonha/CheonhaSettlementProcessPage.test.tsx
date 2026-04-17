import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { HttpClient, SessionPayload } from '../../api/http';
import { CheonhaSettlementProcessPage } from './CheonhaSettlementProcessPage';

const settlementInputsSpy = vi.fn();

vi.mock('../../pages/SettlementInputsPage', () => ({
  SettlementInputsPage: (props: unknown) => {
    settlementInputsSpy(props);
    return <section><h2>정산 입력 요약</h2><p>read/snapshot workflow surface</p></section>;
  },
}));

describe('CheonhaSettlementProcessPage', () => {
  it('renders the existing read and snapshot workflow surface instead of a placeholder', () => {
    const client = { request: vi.fn() } satisfies HttpClient;
    const session = {
      accessToken: 'token',
      sessionKind: 'normal',
      email: 'manager@example.com',
      identity: {
        identityId: 'identity-1',
        name: 'Manager',
        birthDate: '1990-01-01',
        status: 'active',
      },
      activeAccount: {
        accountType: 'manager',
        accountId: 'account-1',
        companyId: 'company-1',
        roleType: 'company_super_admin',
        roleDisplayName: '회사 관리자',
      },
      availableAccountTypes: ['manager'],
    } satisfies SessionPayload;

    render(<CheonhaSettlementProcessPage client={client} session={session} />);

    expect(screen.getByRole('heading', { level: 2, name: '정산 입력 요약' })).toBeInTheDocument();
    expect(screen.getByText('read/snapshot workflow surface')).toBeInTheDocument();
    expect(settlementInputsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        client,
      }),
    );
  });
});
