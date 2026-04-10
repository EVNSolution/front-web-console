import { useMemo, useState, type ChangeEvent } from 'react';
import { read, utils } from 'xlsx';

import type { DispatchUploadBatch } from '../types';
import {
  confirmDispatchUpload,
  previewDispatchUpload,
  type DispatchUploadPreviewRowPayload,
} from '../api/dispatchRegistry';
import { getErrorMessage, type HttpClient } from '../api/http';

type DispatchUploadWizardProps = {
  client: HttpClient;
  companyId: string;
  fleetId: string;
  dispatchDate: string;
  dispatchPlanId?: string | null;
  confirmedBatches: DispatchUploadBatch[];
  isStartingSettlement?: boolean;
  onConfirmed?: () => Promise<void> | void;
  onStartSettlement?: () => Promise<void> | void;
};

type EditableUploadRow = DispatchUploadPreviewRowPayload & {
  row_index: number;
};

function parseNumericCell(value: unknown) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    if (!normalized) {
      return 0;
    }
    const parsed = Number.parseInt(normalized, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function mapWorksheetRows(rows: Record<string, unknown>[]) {
  return rows
    .map<DispatchUploadPreviewRowPayload | null>((row) => {
      const deliveryManagerName = String(row['배송매니저 이름'] ?? '').trim();
      const smallRegionText = String(row['소분류 권역'] ?? '').trim();
      const detailedRegionText = String(row['세분류 권역'] ?? '').trim();
      const boxCount = parseNumericCell(row['박스 수']);
      const householdCount = parseNumericCell(row['가구 수']);

      if (!deliveryManagerName && !smallRegionText && !detailedRegionText && boxCount === 0 && householdCount === 0) {
        return null;
      }

      return {
        delivery_manager_name: deliveryManagerName,
        small_region_text: smallRegionText,
        detailed_region_text: detailedRegionText,
        box_count: boxCount,
        household_count: householdCount,
      };
    })
    .filter((row): row is DispatchUploadPreviewRowPayload => row !== null);
}

function summarizeBatch(batch: DispatchUploadBatch | null) {
  if (!batch) {
    return null;
  }

  const matchedCount = batch.rows.filter((row) => Boolean(row.matched_driver_id)).length;
  const unmatchedCount = batch.rows.length - matchedCount;
  const totalBoxCount = batch.rows.reduce((sum, row) => sum + row.box_count, 0);

  return {
    matchedCount,
    unmatchedCount,
    totalBoxCount,
  };
}

function summarizeEditableRows(rows: EditableUploadRow[], validatedBatch: DispatchUploadBatch | null) {
  const totalBoxCount = rows.reduce((sum, row) => sum + row.box_count, 0);
  const matchedCount = validatedBatch
    ? validatedBatch.rows.filter((row) => Boolean(row.matched_driver_id)).length
    : 0;
  return {
    matchedCount,
    unmatchedCount: Math.max(rows.length - matchedCount, 0),
    totalBoxCount,
  };
}

function formatValidatedMatchLabel(row: DispatchUploadBatch['rows'][number] | undefined) {
  if (!row) {
    return {
      status: '검증 전',
      detail: '서버 검증 전',
    };
  }

  if (row.matched_driver_id) {
    return {
      status: '매칭 완료',
      detail: `${row.external_user_name} · ${row.matched_driver_id}`,
    };
  }

  return {
    status: '미매칭',
    detail: '연결된 배송원 없음',
  };
}

export function DispatchUploadWizard({
  client,
  companyId,
  fleetId,
  dispatchDate,
  dispatchPlanId,
  confirmedBatches,
  isStartingSettlement = false,
  onConfirmed,
  onStartSettlement,
}: DispatchUploadWizardProps) {
  const [editableRows, setEditableRows] = useState<EditableUploadRow[]>([]);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [previewBatch, setPreviewBatch] = useState<DispatchUploadBatch | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const previewSummary = useMemo(
    () =>
      editableRows.length > 0
        ? summarizeEditableRows(editableRows, previewBatch)
        : summarizeBatch(previewBatch),
    [editableRows, previewBatch],
  );
  const canStartSettlement =
    Boolean(onStartSettlement) &&
    (previewBatch?.upload_status === 'confirmed' || confirmedBatches.length > 0);
  const toolbarMessage = editableRows.length
    ? '시트 수정 후 서버 검증으로 배송원 매칭을 확인합니다.'
    : canStartSettlement
      ? '확정된 업로드 기준으로 바로 정산을 시작할 수 있습니다.'
      : '파일을 올리면 시트에서 바로 수정하고 검증할 수 있습니다.';

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !companyId || !fleetId || !dispatchDate) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const workbook = read(await file.arrayBuffer(), { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const worksheetRows = utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
      const rows = mapWorksheetRows(worksheetRows);

      if (!rows.length) {
        throw new Error('업로드할 배차 row가 없습니다.');
      }
      setUploadedFilename(file.name);
      setEditableRows(rows.map((row, index) => ({ ...row, row_index: index + 1 })));
      setPreviewBatch(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  }

  function updateEditableRow(
    rowIndex: number,
    field: keyof DispatchUploadPreviewRowPayload,
    value: string | number,
  ) {
    setEditableRows((currentRows) =>
      currentRows.map((row) =>
        row.row_index === rowIndex
          ? {
              ...row,
              [field]:
                field === 'box_count' || field === 'household_count'
                  ? Number.parseInt(String(value), 10) || 0
                  : String(value),
            }
          : row,
      ),
    );
    setPreviewBatch(null);
  }

  async function handleValidateRows() {
    if (!editableRows.length || !companyId || !fleetId || !dispatchDate) {
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);
    try {
      const response = await previewDispatchUpload(client, {
        company_id: companyId,
        fleet_id: fleetId,
        dispatch_date: dispatchDate,
        ...(dispatchPlanId ? { dispatch_plan_id: dispatchPlanId } : {}),
        source_filename: uploadedFilename ?? undefined,
        rows: editableRows.map((row) => ({
          delivery_manager_name: row.delivery_manager_name,
          small_region_text: row.small_region_text,
          detailed_region_text: row.detailed_region_text,
          box_count: row.box_count,
          household_count: row.household_count,
        })),
      });
      setPreviewBatch(response);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsValidating(false);
    }
  }

  async function handleConfirmUpload() {
    if (!previewBatch || previewBatch.upload_status !== 'draft') {
      return;
    }

    setIsConfirming(true);
    setErrorMessage(null);
    try {
      const confirmedBatch = await confirmDispatchUpload(client, previewBatch.upload_batch_id);
      setPreviewBatch(confirmedBatch);
      await onConfirmed?.();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsConfirming(false);
    }
  }

  return (
    <section className="panel dispatch-upload-panel">
      <div className="panel-header panel-header-inline">
        <div>
          <p className="panel-kicker">배차 업로드</p>
          <h2>업로드 파일</h2>
        </div>
        <label className="button primary">
          배차표 업로드
          <input
            accept=".xlsx,.xls,.csv"
            aria-label="배차표 업로드"
            disabled={!companyId || !fleetId || !dispatchDate || isUploading || isValidating || isConfirming}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            type="file"
          />
        </label>
      </div>
      <div className="panel-toolbar">
        <span className="table-meta">{toolbarMessage}</span>
        {editableRows.length > 0 || canStartSettlement ? (
          <div className="panel-toolbar-actions">
            {editableRows.length > 0 ? (
              <button
                className="button ghost small"
                disabled={isValidating || isConfirming}
                onClick={() => void handleValidateRows()}
                type="button"
              >
                {isValidating ? '검증 중...' : '서버 검증'}
              </button>
            ) : null}
            {previewBatch ? (
              <span className="status-badge">{previewBatch.upload_status === 'confirmed' ? '확정 완료' : '검증 완료'}</span>
            ) : null}
            {previewBatch?.upload_status === 'draft' ? (
              <button
                className="button primary small"
                disabled={isConfirming}
                onClick={() => void handleConfirmUpload()}
                type="button"
              >
                업로드 확정
              </button>
            ) : null}
            {canStartSettlement ? (
              <button
                className="button ghost small"
                disabled={isStartingSettlement}
                onClick={() => void onStartSettlement?.()}
                type="button"
              >
                {isStartingSettlement ? '정산 준비 중...' : '정산 시작'}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      {editableRows.length > 0 ? (
        <div className="stack">
          <div className="dispatch-upload-sheet-summary">
            <article className="metric-card">
              <span>업로드 파일</span>
              <strong>{uploadedFilename || previewBatch?.source_filename || '이름 없음'}</strong>
            </article>
            <article className="metric-card">
              <span>배송원 매칭 row</span>
              <strong>{previewSummary?.matchedCount ?? 0}</strong>
            </article>
            <article className="metric-card">
              <span>확인 필요 row</span>
              <strong>{previewSummary?.unmatchedCount ?? 0}</strong>
            </article>
            <article className="metric-card">
              <span>현재 박스 수</span>
              <strong>{previewSummary?.totalBoxCount ?? 0}</strong>
            </article>
          </div>

          <table className="table dispatch-upload-sheet">
            <thead>
              <tr>
                <th>#</th>
                <th>배송매니저 이름</th>
                <th>소분류 권역</th>
                <th>세분류 권역</th>
                <th>박스 수</th>
                <th>가구 수</th>
                <th>배송원 매칭</th>
              </tr>
            </thead>
            <tbody>
              {editableRows.map((row) => {
                const validatedRow = previewBatch?.rows.find((candidate) => candidate.row_index === row.row_index);
                const matchLabel = formatValidatedMatchLabel(validatedRow);

                return (
                  <tr key={row.row_index}>
                    <td>{row.row_index}</td>
                    <td>
                      <input
                        aria-label={`배송매니저 이름 ${row.row_index}`}
                        onChange={(event) => updateEditableRow(row.row_index, 'delivery_manager_name', event.target.value)}
                        value={row.delivery_manager_name}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`소분류 권역 ${row.row_index}`}
                        onChange={(event) => updateEditableRow(row.row_index, 'small_region_text', event.target.value)}
                        value={row.small_region_text}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`세분류 권역 ${row.row_index}`}
                        onChange={(event) =>
                          updateEditableRow(row.row_index, 'detailed_region_text', event.target.value)
                        }
                        value={row.detailed_region_text}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`박스 수 ${row.row_index}`}
                        inputMode="numeric"
                        onChange={(event) => updateEditableRow(row.row_index, 'box_count', event.target.value)}
                        value={row.box_count}
                      />
                    </td>
                    <td>
                      <input
                        aria-label={`가구 수 ${row.row_index}`}
                        inputMode="numeric"
                        onChange={(event) => updateEditableRow(row.row_index, 'household_count', event.target.value)}
                        value={row.household_count}
                      />
                    </td>
                    <td>
                      <div className="dispatch-upload-match-cell">
                        <strong>{matchLabel.status}</strong>
                        <small>{matchLabel.detail}</small>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : confirmedBatches.length ? (
        <div className="dispatch-upload-history">
          {confirmedBatches.map((batch) => (
            <div className="list-card" key={batch.upload_batch_id}>
              <div className="list-card-header">
                <div>
                  <h3>{batch.source_filename || '업로드 파일'}</h3>
                  <p>{batch.rows.length}개 row · {batch.rows.filter((row) => Boolean(row.matched_driver_id)).length}개 매칭</p>
                </div>
                <span className="status-badge">확정됨</span>
              </div>
              <div className="stack tight">
                {batch.rows.slice(0, 3).map((row) => (
                  <p key={row.upload_row_id}>
                    {row.external_user_name} · {row.small_region_text || '-'} · 박스 {row.box_count}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">확정된 업로드가 없습니다. 파일을 올려 확인 후 확정하세요.</p>
      )}
    </section>
  );
}
