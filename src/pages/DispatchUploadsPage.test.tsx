import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DispatchUploadsPage } from './DispatchUploadsPage';

const dispatchRegistryMocks = vi.hoisted(() => ({
  listDispatchUploadBatches: vi.fn(),
}));

const deliveryRecordMocks = vi.hoisted(() => ({
  bootstrapDailySnapshotsFromDispatch: vi.fn(),
}));

vi.mock('../api/dispatchRegistry', async () => {
  const actual = await vi.importActual<typeof import('../api/dispatchRegistry')>('../api/dispatchRegistry');
  return {
    ...actual,
    listDispatchUploadBatches: dispatchRegistryMocks.listDispatchUploadBatches,
  };
});

vi.mock('../api/deliveryRecords', () => ({
  bootstrapDailySnapshotsFromDispatch: deliveryRecordMocks.bootstrapDailySnapshotsFromDispatch,
}));

vi.mock('../api/organization', () => ({
  listCompanies: vi.fn().mockResolvedValue([
    {
      company_id: '30000000-0000-0000-0000-000000000001',
      route_no: 31,
      name: '알파 회사',
    },
  ]),
  listFleets: vi.fn().mockResolvedValue([
    {
      fleet_id: '40000000-0000-0000-0000-000000000001',
      route_no: 41,
      company_id: '30000000-0000-0000-0000-000000000001',
      name: '서울 플릿',
    },
  ]),
}));

describe('DispatchUploadsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dispatchRegistryMocks.listDispatchUploadBatches.mockResolvedValue([]);
    deliveryRecordMocks.bootstrapDailySnapshotsFromDispatch.mockResolvedValue({
      created_count: 1,
      skipped_count: 0,
      created_snapshot_ids: ['snapshot-1'],
    });
  });

  it('boots settlement preparation from the upload scope without a dispatch plan', async () => {
    dispatchRegistryMocks.listDispatchUploadBatches.mockResolvedValue([
      {
        upload_batch_id: 'upload-batch-1',
        dispatch_plan_id: null,
        company_id: '30000000-0000-0000-0000-000000000001',
        fleet_id: '40000000-0000-0000-0000-000000000001',
        dispatch_date: '2026-03-24',
        source_filename: 'dispatch.xlsx',
        upload_status: 'confirmed',
        created_at: '2026-03-24T09:00:00Z',
        updated_at: '2026-03-24T09:10:00Z',
        rows: [
          {
            upload_row_id: 'upload-row-1',
            row_index: 1,
            external_user_name: 'ZD홍길동',
            small_region_text: '10H2',
            detailed_region_text: '10H2-가',
            box_count: 133,
            household_count: 90,
            matched_driver_id: 'driver-1',
          },
        ],
      },
    ]);

    render(
      <MemoryRouter>
        <DispatchUploadsPage client={{ request: vi.fn() }} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: '배차표 업로드', level: 1 })).toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: '정산 시작' }));

    await waitFor(() => {
      expect(deliveryRecordMocks.bootstrapDailySnapshotsFromDispatch).toHaveBeenCalledWith(
        expect.anything(),
        {
          company_id: '30000000-0000-0000-0000-000000000001',
          fleet_id: '40000000-0000-0000-0000-000000000001',
          service_date: expect.any(String),
        },
      );
    });
  });

  it('keeps the upload page copy short and emphasizes upload actions', async () => {
    render(
      <MemoryRouter>
        <DispatchUploadsPage client={{ request: vi.fn() }} />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: '배차표 업로드', level: 1 })).toBeInTheDocument();
    expect(screen.getByLabelText('배차표 업로드')).toBeInTheDocument();
    expect(screen.getByLabelText('회사')).toBeInTheDocument();
    expect(screen.getByLabelText('플릿')).toBeInTheDocument();
    expect(screen.getByLabelText('배차일')).toBeInTheDocument();
    expect(screen.queryByText(/^회사$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^플릿$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^배차일$/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '정산 시작' })).not.toBeInTheDocument();
    expect(screen.queryByText(/1차 MVP/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/phase 1/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/정산 근거로 사용합니다/i)).not.toBeInTheDocument();
  });
});
