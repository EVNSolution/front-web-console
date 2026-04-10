import { render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
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

  it('lets users edit uploaded rows before running server validation', async () => {
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
      dispatch_plan_id: null,
      company_id: 'company-1',
      fleet_id: 'fleet-1',
      dispatch_date: '2026-03-24',
      source_filename: 'dispatch.xlsx',
      upload_status: 'draft',
      created_at: '2026-03-24T09:00:00Z',
      updated_at: '2026-03-24T09:00:00Z',
      rows: [
        {
          upload_row_id: 'upload-row-1',
          row_index: 1,
          external_user_name: 'ZD김영희',
          small_region_text: '10H2',
          detailed_region_text: '10H2-가',
          box_count: 144,
          household_count: 90,
          matched_driver_id: 'driver-1',
        },
      ],
    });

    render(
      <DispatchUploadWizard
        client={{ request: vi.fn() }}
        confirmedBatches={[]}
        companyId="company-1"
        fleetId="fleet-1"
        dispatchDate="2026-03-24"
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

    expect(await screen.findByDisplayValue('ZD홍길동')).toBeInTheDocument();
    expect(screen.getByDisplayValue('133')).toBeInTheDocument();
    expect(screen.getByDisplayValue('90')).toBeInTheDocument();
    expect(dispatchRegistryMocks.previewDispatchUpload).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText('배송매니저 이름 1'));
    await user.type(screen.getByLabelText('배송매니저 이름 1'), 'ZD김영희');
    await user.clear(screen.getByLabelText('박스 수 1'));
    await user.type(screen.getByLabelText('박스 수 1'), '144');
    await user.click(screen.getByRole('button', { name: '서버 검증' }));

    expect(dispatchRegistryMocks.previewDispatchUpload).toHaveBeenCalledWith(expect.anything(), {
      company_id: 'company-1',
      fleet_id: 'fleet-1',
      dispatch_date: '2026-03-24',
      source_filename: 'dispatch.xlsx',
      rows: [
        {
          delivery_manager_name: 'ZD김영희',
          small_region_text: '10H2',
          detailed_region_text: '10H2-가',
          box_count: 144,
          household_count: 90,
        },
      ],
    });
    expect(await screen.findByText('검증 완료')).toBeInTheDocument();
    expect(screen.getByText('ZD김영희 · driver-1')).toBeInTheDocument();
  });

  it('asks for confirmation before using a detected dispatch date from the filename', async () => {
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
      dispatch_plan_id: null,
      company_id: 'company-1',
      fleet_id: 'fleet-1',
      dispatch_date: '2026-02-13',
      source_filename: '배차현황_2026-02-13 02_29_07.xlsx',
      upload_status: 'draft',
      created_at: '2026-03-24T09:00:00Z',
      updated_at: '2026-03-24T09:00:00Z',
      rows: [],
    });
    const handleDispatchDateDetected = vi.fn();

    function StatefulWizard() {
      const [dispatchDate, setDispatchDate] = useState('');

      return (
        <DispatchUploadWizard
          client={{ request: vi.fn() }}
          companyId="company-1"
          confirmedBatches={[]}
          dispatchDate={dispatchDate}
          fleetId="fleet-1"
          onDispatchDateDetected={(nextDispatchDate) => {
            handleDispatchDateDetected(nextDispatchDate);
            setDispatchDate(nextDispatchDate);
          }}
        />
      );
    }

    render(<StatefulWizard />);

    const user = userEvent.setup();
    const file = new File(['dummy'], '배차현황_2026-02-13 02_29_07.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    await user.upload(screen.getByLabelText('배차표 업로드'), file);

    expect(await screen.findByDisplayValue('ZD홍길동')).toBeInTheDocument();
    expect(handleDispatchDateDetected).not.toHaveBeenCalled();
    expect(screen.getByText('감지된 배차일 2026-02-13')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '서버 검증' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: '감지된 날짜 적용' }));

    expect(handleDispatchDateDetected).toHaveBeenCalledWith('2026-02-13');

    await user.click(screen.getByRole('button', { name: '서버 검증' }));

    expect(dispatchRegistryMocks.previewDispatchUpload).toHaveBeenCalledWith(expect.anything(), {
      company_id: 'company-1',
      fleet_id: 'fleet-1',
      dispatch_date: '2026-02-13',
      source_filename: '배차현황_2026-02-13 02_29_07.xlsx',
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

  it('falls back to manual date selection when the filename does not match a supported pattern', async () => {
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

    render(
      <DispatchUploadWizard
        client={{ request: vi.fn() }}
        companyId="company-1"
        confirmedBatches={[]}
        dispatchDate=""
        fleetId="fleet-1"
      />,
    );

    const user = userEvent.setup();
    const file = new File(['dummy'], '배차현황_13-02-2026.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
    });

    await user.upload(screen.getByLabelText('배차표 업로드'), file);

    expect(await screen.findByDisplayValue('ZD홍길동')).toBeInTheDocument();
    expect(screen.queryByText(/감지된 배차일/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '서버 검증' })).toBeDisabled();
    expect(
      screen.getByText('파일명에서 날짜를 찾지 못했거나 아직 확인하지 않았습니다. 배차일을 선택한 뒤 검증하세요.'),
    ).toBeInTheDocument();
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
      dispatch_plan_id: null,
      company_id: 'company-1',
      fleet_id: 'fleet-1',
      dispatch_date: '2026-03-24',
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
      dispatch_plan_id: null,
      company_id: 'company-1',
      fleet_id: 'fleet-1',
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
    });
    const handleConfirmed = vi.fn().mockResolvedValue(undefined);

    render(
      <DispatchUploadWizard
        client={{ request: vi.fn() }}
        confirmedBatches={[]}
        companyId="company-1"
        fleetId="fleet-1"
        dispatchDate="2026-03-24"
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
    await user.click(screen.getByRole('button', { name: '서버 검증' }));
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
