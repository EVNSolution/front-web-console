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
  dispatchPlanId: string | null;
  confirmedBatches: DispatchUploadBatch[];
  onConfirmed?: () => Promise<void> | void;
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

export function DispatchUploadWizard({
  client,
  dispatchPlanId,
  confirmedBatches,
  onConfirmed,
}: DispatchUploadWizardProps) {
  const [previewBatch, setPreviewBatch] = useState<DispatchUploadBatch | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const previewSummary = useMemo(() => summarizeBatch(previewBatch), [previewBatch]);

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !dispatchPlanId) {
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

      const response = await previewDispatchUpload(client, {
        dispatch_plan_id: dispatchPlanId,
        source_filename: file.name,
        rows,
      });
      setPreviewBatch(response);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsUploading(false);
      event.target.value = '';
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
    <section className="panel">
      <div className="panel-header panel-header-inline">
        <div>
          <p className="panel-kicker">배차 업로드</p>
          <h2>배차표 업로드</h2>
        </div>
        <label className="button primary">
          배차표 업로드
          <input
            accept=".xlsx,.xls,.csv"
            aria-label="배차표 업로드"
            disabled={!dispatchPlanId || isUploading || isConfirming}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            type="file"
          />
        </label>
      </div>
      <div className="panel-toolbar">
        <span className="table-meta">배송매니저 이름은 배송원 external_user_name으로 매칭하고, 박스 수만 정산 근거로 사용합니다.</span>
        {previewBatch ? (
          <div className="panel-toolbar-actions">
            <span className="status-badge">{previewBatch.upload_status === 'confirmed' ? '확정 완료' : '미리보기 완료'}</span>
            {previewBatch.upload_status === 'draft' ? (
              <button
                className="button ghost small"
                disabled={isConfirming}
                onClick={() => void handleConfirmUpload()}
                type="button"
              >
                업로드 확정
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      {previewBatch ? (
        <div className="stack">
          <div className="summary-strip">
            <article className="summary-item">
              <span>파일</span>
              <strong>{previewBatch.source_filename || '이름 없음'}</strong>
              <small>현재 미리보기 기준 업로드 파일</small>
            </article>
            <article className="summary-item">
              <span>검증 요약</span>
              <strong>{previewSummary?.matchedCount ?? 0}</strong>
              <small>배송원 매칭 완료 row</small>
            </article>
            <article className="summary-item">
              <span>미매칭</span>
              <strong>{previewSummary?.unmatchedCount ?? 0}</strong>
              <small>용차/수동 보정이 필요한 row</small>
            </article>
            <article className="summary-item">
              <span>총 박스 수</span>
              <strong>{previewSummary?.totalBoxCount ?? 0}</strong>
              <small>정산 snapshot에 들어갈 box 기준 수량</small>
            </article>
          </div>

          <table className="table compact">
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
              {previewBatch.rows.map((row) => (
                <tr key={row.upload_row_id}>
                  <td>{row.row_index}</td>
                  <td>{row.external_user_name}</td>
                  <td>{row.small_region_text || '-'}</td>
                  <td>{row.detailed_region_text || '-'}</td>
                  <td>{row.box_count}</td>
                  <td>{row.household_count}</td>
                  <td>{row.matched_driver_id ? row.matched_driver_id : '미매칭'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : confirmedBatches.length ? (
        <div className="stack tight">
          {confirmedBatches.map((batch) => (
            <div className="list-card" key={batch.upload_batch_id}>
              <div className="list-card-header">
                <div>
                  <h3>{batch.source_filename || '업로드 파일'}</h3>
                  <p>
                    {batch.rows.length}개 row · {batch.rows.filter((row) => Boolean(row.matched_driver_id)).length}개 매칭
                  </p>
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
        <p className="empty-state">확정된 배차 업로드가 없습니다. 파일을 올려 preview 후 확정하세요.</p>
      )}
    </section>
  );
}
