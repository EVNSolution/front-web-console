import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DispatchUploadWizard } from './DispatchUploadWizard';

const dispatchRegistryMocks = vi.hoisted(() => ({
  previewDispatchUpload: vi.fn(),
  confirmDispatchUpload: vi.fn(),
}));

const xlsxMocks = vi.hoisted(() => ({
  read: vi.fn(),
  sheetToJson: vi.fn(),
}));

vi.mock('../api/dispatchRegistry', () => ({
  previewDispatchUpload: dispatchRegistryMocks.previewDispatchUpload,
  confirmDispatchUpload: dispatchRegistryMocks.confirmDispatchUpload,
}));

vi.mock('xlsx', () => ({
  read: xlsxMocks.read,
  utils: {
    sheet_to_json: xlsxMocks.sheetToJson,
  },
}));

describe('DispatchUploadWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows upload preview rows with driver match and box count', async () => {
    xlsxMocks.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: {} },
    });
    xlsxMocks.sheetToJson.mockReturnValue([
      {
        '배송매니저 이름': 'ZD홍길동',
        '소분류 권역': '10H2',
        '세분류 권역': '10H2-가',
        '박스 수': 133,
        '가구 수': 90,
      },
    ]);
    dispatchRegistryMocks.previewDispatchUpload.mockResolvedValue({
      upload_batch_id: 'upload-batch-1',
      dispatch_plan_id: 'dispatch-plan-1',
      source_filename: 'dispatch.xlsx',
      upload_status: 'draft',
      created_at: '2026-03-24T09:00:00Z',
      updated_at: '2026-03-24T09:00:00Z',
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
    });

    render(
      <DispatchUploadWizard
        client={{ request: vi.fn() }}
        confirmedBatches={[]}
        dispatchPlanId="dispatch-plan-1"
      />,
    );

    const user = userEvent.setup();
    const file = new File(['dummy'], 'dispatch.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    await user.upload(screen.getByLabelText('배차표 업로드'), file);

    expect(await screen.findByText('ZD홍길동')).toBeInTheDocument();
    expect(screen.getAllByText('133')).toHaveLength(2);
    expect(dispatchRegistryMocks.previewDispatchUpload).toHaveBeenCalledWith(expect.anything(), {
      dispatch_plan_id: 'dispatch-plan-1',
      source_filename: 'dispatch.xlsx',
      rows: [
        {
          delivery_manager_name: 'ZD홍길동',
          small_region_text: '10H2',
          detailed_region_text: '10H2-가',
          box_count: 133,
          household_count: 90,
        },
      ],
    });
  });

  it('confirms a draft preview batch and calls the page callback', async () => {
    xlsxMocks.read.mockReturnValue({
      SheetNames: ['Sheet1'],
      Sheets: { Sheet1: {} },
    });
    xlsxMocks.sheetToJson.mockReturnValue([
      {
        '배송매니저 이름': 'ZD홍길동',
        '소분류 권역': '10H2',
        '세분류 권역': '10H2-가',
        '박스 수': 133,
        '가구 수': 90,
      },
    ]);
    dispatchRegistryMocks.previewDispatchUpload.mockResolvedValue({
      upload_batch_id: 'upload-batch-1',
      dispatch_plan_id: 'dispatch-plan-1',
      source_filename: 'dispatch.xlsx',
      upload_status: 'draft',
      created_at: '2026-03-24T09:00:00Z',
      updated_at: '2026-03-24T09:00:00Z',
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
    });
    dispatchRegistryMocks.confirmDispatchUpload.mockResolvedValue({
      upload_batch_id: 'upload-batch-1',
      dispatch_plan_id: 'dispatch-plan-1',
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
    });
    const handleConfirmed = vi.fn().mockResolvedValue(undefined);

    render(
      <DispatchUploadWizard
        client={{ request: vi.fn() }}
        confirmedBatches={[]}
        dispatchPlanId="dispatch-plan-1"
        onConfirmed={handleConfirmed}
      />,
    );

    const user = userEvent.setup();
    const file = new File(['dummy'], 'dispatch.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    await user.upload(screen.getByLabelText('배차표 업로드'), file);
    await user.click(await screen.findByRole('button', { name: '업로드 확정' }));

    await waitFor(() => {
      expect(dispatchRegistryMocks.confirmDispatchUpload).toHaveBeenCalledWith(
        expect.anything(),
        'upload-batch-1',
      );
      expect(handleConfirmed).toHaveBeenCalled();
    });
    expect(await screen.findByText('확정 완료')).toBeInTheDocument();
  });
});
