import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';

import * as deliveryRecords from '../api/deliveryRecords';
import * as driversApi from '../api/drivers';
import * as organizationApi from '../api/organization';
import { SettlementFlowProvider } from '../components/SettlementFlowContext';
import { SettlementInputsPage } from './SettlementInputsPage';

vi.mock('../api/organization', () => ({
  listCompanies: vi.fn(),
  listFleets: vi.fn(),
}));

vi.mock('../api/drivers', () => ({
  listDrivers: vi.fn(),
}));

vi.mock('../api/deliveryRecords', () => ({
  listDeliveryRecords: vi.fn(),
  listDailyDeliveryInputSnapshots: vi.fn(),
  createDeliveryRecord: vi.fn(),
  updateDeliveryRecord: vi.fn(),
  deleteDeliveryRecord: vi.fn(),
  createDailyDeliveryInputSnapshot: vi.fn(),
  updateDailyDeliveryInputSnapshot: vi.fn(),
  deleteDailyDeliveryInputSnapshot: vi.fn(),
}));

const mockedListCompanies = vi.mocked(organizationApi.listCompanies);
const mockedListFleets = vi.mocked(organizationApi.listFleets);
const mockedListDrivers = vi.mocked(driversApi.listDrivers);
const mockedListDeliveryRecords = vi.mocked(deliveryRecords.listDeliveryRecords);
const mockedListDailyDeliveryInputSnapshots = vi.mocked(
  deliveryRecords.listDailyDeliveryInputSnapshots,
);
const mockedUpdateDailyDeliveryInputSnapshot = vi.mocked(deliveryRecords.updateDailyDeliveryInputSnapshot);

describe('SettlementInputsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows draft snapshots to be activated from the list', async () => {
    mockedListCompanies.mockResolvedValue([
      { company_id: '30000000-0000-0000-0000-000000000001', route_no: 1, name: 'Seed Company' },
    ]);
    mockedListFleets.mockResolvedValue([
      {
        fleet_id: '40000000-0000-0000-0000-000000000001',
        route_no: 1,
        company_id: '30000000-0000-0000-0000-000000000001',
        name: 'Seed Fleet',
      },
    ]);
    mockedListDrivers.mockResolvedValue([
      {
        driver_id: '10000000-0000-0000-0000-000000000001',
        route_no: 1,
        company_id: '30000000-0000-0000-0000-000000000001',
        fleet_id: '40000000-0000-0000-0000-000000000001',
        name: 'Seed Driver',
        ev_id: 'EV-001',
        phone_number: '010-1234-5678',
        address: 'Seoul',
      },
    ]);
    mockedListDeliveryRecords.mockResolvedValue([]);
    mockedListDailyDeliveryInputSnapshots
      .mockResolvedValueOnce([
        {
          daily_delivery_input_snapshot_id: 'snapshot-draft-1',
          company_id: '30000000-0000-0000-0000-000000000001',
          fleet_id: '40000000-0000-0000-0000-000000000001',
          driver_id: '10000000-0000-0000-0000-000000000001',
          service_date: '2026-03-30',
          delivery_count: 0,
          total_distance_km: '0.00',
          total_base_amount: '0.00',
          source_record_count: 0,
          status: 'draft',
        },
      ])
      .mockResolvedValueOnce([
        {
          daily_delivery_input_snapshot_id: 'snapshot-draft-1',
          company_id: '30000000-0000-0000-0000-000000000001',
          fleet_id: '40000000-0000-0000-0000-000000000001',
          driver_id: '10000000-0000-0000-0000-000000000001',
          service_date: '2026-03-30',
          delivery_count: 0,
          total_distance_km: '0.00',
          total_base_amount: '0.00',
          source_record_count: 0,
          status: 'active',
        },
      ]);
    mockedUpdateDailyDeliveryInputSnapshot.mockResolvedValue({
      daily_delivery_input_snapshot_id: 'snapshot-draft-1',
      company_id: '30000000-0000-0000-0000-000000000001',
      fleet_id: '40000000-0000-0000-0000-000000000001',
      driver_id: '10000000-0000-0000-0000-000000000001',
      service_date: '2026-03-30',
      delivery_count: 0,
      total_distance_km: '0.00',
      total_base_amount: '0.00',
      source_record_count: 0,
      status: 'active',
    });

    render(
      <MemoryRouter>
        <SettlementFlowProvider client={{ request: vi.fn() }}>
          <SettlementInputsPage client={{ request: vi.fn() }} />
        </SettlementFlowProvider>
      </MemoryRouter>,
    );

    const activateButton = await screen.findByRole('button', { name: '활성화' });
    const user = userEvent.setup();
    await user.click(activateButton);

    await waitFor(() => {
      expect(screen.getByText('활성')).toBeInTheDocument();
      expect(screen.queryByText('draft snapshot')).not.toBeInTheDocument();
    });
  });

  it('renders upload-first review language ahead of manual correction', async () => {
    mockedListCompanies.mockResolvedValue([
      { company_id: '30000000-0000-0000-0000-000000000001', route_no: 1, name: 'Seed Company' },
    ]);
    mockedListFleets.mockResolvedValue([
      {
        fleet_id: '40000000-0000-0000-0000-000000000001',
        route_no: 1,
        company_id: '30000000-0000-0000-0000-000000000001',
        name: 'Seed Fleet',
      },
    ]);
    mockedListDrivers.mockResolvedValue([
      {
        driver_id: '10000000-0000-0000-0000-000000000001',
        route_no: 1,
        company_id: '30000000-0000-0000-0000-000000000001',
        fleet_id: '40000000-0000-0000-0000-000000000001',
        name: 'Seed Driver',
        ev_id: 'EV-001',
        phone_number: '010-1234-5678',
        address: 'Seoul',
      },
    ]);
    mockedListDeliveryRecords.mockResolvedValue([
      {
        delivery_record_id: 'record-1',
        company_id: '30000000-0000-0000-0000-000000000001',
        fleet_id: '40000000-0000-0000-0000-000000000001',
        driver_id: '10000000-0000-0000-0000-000000000001',
        service_date: '2026-03-30',
        source_reference: 'dispatch-upload-row:upload-row-1',
        delivery_count: 133,
        distance_km: '0.00',
        base_amount: '0.00',
        status: 'confirmed',
        payload: {
          household_count: 90,
          small_region_text: '10H2',
          detailed_region_text: '10H2-가',
        },
      },
    ]);
    mockedListDailyDeliveryInputSnapshots.mockResolvedValue([
      {
        daily_delivery_input_snapshot_id: 'snapshot-draft-1',
        company_id: '30000000-0000-0000-0000-000000000001',
        fleet_id: '40000000-0000-0000-0000-000000000001',
        driver_id: '10000000-0000-0000-0000-000000000001',
        service_date: '2026-03-30',
        delivery_count: 0,
        total_distance_km: '0.00',
        total_base_amount: '0.00',
        source_record_count: 0,
        status: 'draft',
      },
    ]);

    render(
      <MemoryRouter>
        <SettlementFlowProvider client={{ request: vi.fn() }}>
          <SettlementInputsPage client={{ request: vi.fn() }} />
        </SettlementFlowProvider>
      </MemoryRouter>,
    );

    await screen.findByRole('heading', { name: '정산 입력 요약' });
    await screen.findByText('업로드 결과로 만들어진 정산 대상 snapshot을 먼저 검토하고, 필요한 예외만 수동 보정합니다.');
    expect(screen.getByRole('heading', { name: '업로드 기준 검토' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Seed Driver', level: 3 })).toBeInTheDocument();
    expect(screen.getByText(/박스 133/)).toBeInTheDocument();
    expect(screen.getByText(/10H2/)).toBeInTheDocument();
    expect(screen.getByText('dispatch-upload-row:upload-row-1')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /배차 보드로 이동/i })).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /정산 실행으로 이동/i })).toBeInTheDocument();
  });
});
