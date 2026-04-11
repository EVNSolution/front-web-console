import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
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
  onDispatchDateDetected?: (dispatchDate: string) => void;
  onFleetCodeDetected?: (fleetCode: string | null) => void;
  pendingDetectedFleetCode?: string | null;
  requiresDetectedFleetCreation?: boolean;
  isCreatingDetectedFleet?: boolean;
  onApplyDetectedFleet?: () => void;
  onCreateDetectedFleet?: () => Promise<void> | void;
  onDismissDetectedFleet?: () => void;
  pendingMissingDriverNames?: string[];
  isCreatingMissingDrivers?: boolean;
  onCreateMissingDrivers?: () => Promise<void> | void;
  onExternalUserNamesChanged?: (externalUserNames: string[]) => void;
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

function extractDispatchDateFromFilename(filename: string) {
  const normalized = filename.trim();
  if (!normalized) {
    return null;
  }

  function toValidDispatchDate(year: string, month: string, day: string) {
    const monthNumber = Number.parseInt(month, 10);
    const dayNumber = Number.parseInt(day, 10);
    if (monthNumber < 1 || monthNumber > 12 || dayNumber < 1 || dayNumber > 31) {
      return null;
    }

    const candidate = new Date(`${year}-${month}-${day}T00:00:00Z`);
    if (
      Number.isNaN(candidate.getTime()) ||
      candidate.getUTCFullYear() !== Number.parseInt(year, 10) ||
      candidate.getUTCMonth() + 1 !== monthNumber ||
      candidate.getUTCDate() !== dayNumber
    ) {
      return null;
    }

    return `${year}-${month}-${day}`;
  }

  const dottedMatch = normalized.match(/(20\d{2})[-_.](\d{2})[-_.](\d{2})/);
  if (dottedMatch) {
    return toValidDispatchDate(dottedMatch[1], dottedMatch[2], dottedMatch[3]);
  }

  const compactMatch = normalized.match(/(20\d{2})(\d{2})(\d{2})/);
  if (compactMatch) {
    return toValidDispatchDate(compactMatch[1], compactMatch[2], compactMatch[3]);
  }

  return null;
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

function extractFleetTokens(text: string) {
  return Array.from(new Set(text.toUpperCase().match(/[A-Z]+/g) ?? []));
}

function extractFleetCodeFromRows(rows: DispatchUploadPreviewRowPayload[]) {
  const fleetTokens = new Set<string>();

  rows.forEach((row) => {
    extractFleetTokens(row.small_region_text).forEach((token) => fleetTokens.add(token));
    extractFleetTokens(row.detailed_region_text).forEach((token) => fleetTokens.add(token));
  });

  if (fleetTokens.size !== 1) {
    return null;
  }

  return Array.from(fleetTokens)[0];
}

function extractExternalUserNamesFromRows(rows: DispatchUploadPreviewRowPayload[]) {
  const externalUserNames = new Set<string>();
  rows.forEach((row) => {
    const normalizedName = row.delivery_manager_name.trim();
    if (normalizedName) {
      externalUserNames.add(normalizedName);
    }
  });
  return Array.from(externalUserNames);
}

function clampColumnWidth(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

function hasDraggedFiles(event: DragEvent<HTMLElement>) {
  return Array.from(event.dataTransfer?.types ?? []).includes('Files');
}

export function DispatchUploadWizard({
  client,
  companyId,
  fleetId,
  dispatchDate,
  onDispatchDateDetected,
  onFleetCodeDetected,
  pendingDetectedFleetCode = null,
  requiresDetectedFleetCreation = false,
  isCreatingDetectedFleet = false,
  onApplyDetectedFleet,
  onCreateDetectedFleet,
  onDismissDetectedFleet,
  pendingMissingDriverNames = [],
  isCreatingMissingDrivers = false,
  onCreateMissingDrivers,
  onExternalUserNamesChanged,
  dispatchPlanId,
  confirmedBatches,
  isStartingSettlement = false,
  onConfirmed,
  onStartSettlement,
}: DispatchUploadWizardProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const [editableRows, setEditableRows] = useState<EditableUploadRow[]>([]);
  const [pendingDetectedDispatchDate, setPendingDetectedDispatchDate] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);
  const [previewBatch, setPreviewBatch] = useState<DispatchUploadBatch | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const previewSummary = useMemo(
    () =>
      editableRows.length > 0
        ? summarizeEditableRows(editableRows, previewBatch)
        : summarizeBatch(previewBatch),
    [editableRows, previewBatch],
  );
  const sheetColumnWidths = useMemo(() => {
    const rows = editableRows;
    const nameWidth = clampColumnWidth(
      Math.max('배송매니저 이름'.length, ...rows.map((row) => row.delivery_manager_name.length)) + 2,
      10,
      18,
    );
    const smallRegionWidth = clampColumnWidth(
      Math.max('소분류 권역'.length, ...rows.map((row) => row.small_region_text.length)) + 2,
      8,
      14,
    );
    const detailedRegionWidth = clampColumnWidth(
      Math.max('세분류 권역'.length, ...rows.map((row) => row.detailed_region_text.length)) + 2,
      9,
      16,
    );
    const boxWidth = clampColumnWidth(
      Math.max('박스 수'.length, ...rows.map((row) => String(row.box_count).length)) + 2,
      6,
      9,
    );
    const householdWidth = clampColumnWidth(
      Math.max('가구 수'.length, ...rows.map((row) => String(row.household_count).length)) + 2,
      6,
      9,
    );
    const matchWidth = clampColumnWidth(
      Math.max(
        '배송원 매칭'.length,
        ...rows.map((row) => formatValidatedMatchLabel(previewBatch?.rows.find((candidate) => candidate.row_index === row.row_index)).detail.length),
      ) + 2,
      12,
      22,
    );

    return {
      index: '3.5rem',
      deliveryManager: `${nameWidth}ch`,
      smallRegion: `${smallRegionWidth}ch`,
      detailedRegion: `${detailedRegionWidth}ch`,
      boxCount: `${boxWidth}ch`,
      householdCount: `${householdWidth}ch`,
      match: `${matchWidth}ch`,
    };
  }, [editableRows, previewBatch]);
  const isUploadDisabled = !companyId || isUploading || isValidating || isConfirming;
  const requiresFleetConfirmation = Boolean(pendingDetectedFleetCode);
  const requiresMissingDriverCreation = pendingMissingDriverNames.length > 0;
  const canStartSettlement =
    Boolean(onStartSettlement) &&
    (previewBatch?.upload_status === 'confirmed' || confirmedBatches.length > 0);
  const effectiveDispatchDate = dispatchDate;
  const requiresDispatchDateConfirmation = Boolean(pendingDetectedDispatchDate && !dispatchDate);
  const toolbarMessage = editableRows.length
    ? requiresDispatchDateConfirmation
      ? `파일명에서 배차일 ${pendingDetectedDispatchDate}을 감지했습니다. 적용 후 검증하거나 직접 선택하세요.`
      : requiresFleetConfirmation
        ? `시트에서 플릿 ${pendingDetectedFleetCode}을 감지했습니다. 적용하거나 직접 선택한 뒤 검증하세요.`
      : effectiveDispatchDate
        ? fleetId
          ? '시트 수정 후 서버 검증으로 배송원 매칭을 확인합니다.'
          : '플릿을 선택하거나 감지된 플릿을 승인한 뒤 서버 검증하세요.'
        : '파일명에서 날짜를 찾지 못했거나 아직 확인하지 않았습니다. 배차일을 선택한 뒤 검증하세요.'
    : canStartSettlement
      ? '확정된 업로드 기준으로 바로 정산을 시작할 수 있습니다.'
      : '파일을 올리면 시트에서 바로 수정하고 검증할 수 있습니다.';

  useEffect(() => {
    if (dispatchDate) {
      setPendingDetectedDispatchDate(null);
    }
  }, [dispatchDate]);

  useEffect(() => {
    onExternalUserNamesChanged?.(
      extractExternalUserNamesFromRows(
        editableRows.map((row) => ({
          delivery_manager_name: row.delivery_manager_name,
          small_region_text: row.small_region_text,
          detailed_region_text: row.detailed_region_text,
          box_count: row.box_count,
          household_count: row.household_count,
        })),
      ),
    );
  }, [editableRows, onExternalUserNamesChanged]);

  async function processUploadFile(file: File) {
    if (!file || !companyId) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    try {
      const nextDetectedDispatchDate = !dispatchDate ? extractDispatchDateFromFilename(file.name) : null;
      const workbook = read(await file.arrayBuffer(), { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const worksheetRows = utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });
      const rows = mapWorksheetRows(worksheetRows);
      const nextDetectedFleetCode = extractFleetCodeFromRows(rows);

      if (!rows.length) {
        throw new Error('업로드할 배차 row가 없습니다.');
      }
      setUploadedFilename(file.name);
      setPendingDetectedDispatchDate(nextDetectedDispatchDate);
      setEditableRows(rows.map((row, index) => ({ ...row, row_index: index + 1 })));
      setPreviewBatch(null);
      onFleetCodeDetected?.(nextDetectedFleetCode);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await processUploadFile(file);
    event.target.value = '';
  }

  function handleUploadSurfaceClick() {
    if (isUploadDisabled) {
      return;
    }
    fileInputRef.current?.click();
  }

  function handleSurfaceDragEnter(event: DragEvent<HTMLDivElement>) {
    if (isUploadDisabled || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragActive(true);
  }

  function handleSurfaceDragOver(event: DragEvent<HTMLDivElement>) {
    if (isUploadDisabled || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    if (!isDragActive) {
      setIsDragActive(true);
    }
  }

  function handleSurfaceDragLeave(event: DragEvent<HTMLDivElement>) {
    if (isUploadDisabled) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = Math.max(dragDepthRef.current - 1, 0);
    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  }

  function handleSurfaceDrop(event: DragEvent<HTMLDivElement>) {
    if (isUploadDisabled || !hasDraggedFiles(event)) {
      return;
    }

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) {
      return;
    }
    void processUploadFile(file);
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

  function handleApplyDetectedDispatchDate() {
    if (!pendingDetectedDispatchDate) {
      return;
    }
    onDispatchDateDetected?.(pendingDetectedDispatchDate);
    setPendingDetectedDispatchDate(null);
  }

  function handleChooseDispatchDateManually() {
    setPendingDetectedDispatchDate(null);
  }

  async function handleValidateRows() {
    if (!editableRows.length || !companyId || !fleetId || !effectiveDispatchDate) {
      return;
    }

    setIsValidating(true);
    setErrorMessage(null);
    try {
      const response = await previewDispatchUpload(client, {
        company_id: companyId,
        fleet_id: fleetId,
        dispatch_date: effectiveDispatchDate,
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
      </div>
      <input
        accept=".xlsx,.xls,.csv"
        aria-label="배차표 업로드"
        disabled={isUploadDisabled}
        onChange={handleFileUpload}
        ref={fileInputRef}
        style={{ display: 'none' }}
        type="file"
      />
      <div className="panel-toolbar">
        <span className="table-meta">{toolbarMessage}</span>
        {editableRows.length > 0 || canStartSettlement ? (
          <div className="panel-toolbar-actions">
            {editableRows.length > 0 ? (
              <button
                className="button ghost small"
                disabled={!effectiveDispatchDate || !fleetId || requiresFleetConfirmation || isValidating || isConfirming}
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
      {requiresDispatchDateConfirmation ? (
        <div className="dispatch-upload-date-detection">
          <div>
            <strong>감지된 배차일 {pendingDetectedDispatchDate}</strong>
            <p>지원 패턴: YYYY-MM-DD, YYYY_MM_DD, YYYYMMDD</p>
          </div>
          <div className="panel-toolbar-actions">
            <button
              className="button secondary small dispatch-upload-detection-action"
              onClick={handleApplyDetectedDispatchDate}
              type="button"
            >
              감지된 날짜 적용
            </button>
            <button className="button ghost small" onClick={handleChooseDispatchDateManually} type="button">
              직접 선택
            </button>
          </div>
        </div>
      ) : null}
      {pendingDetectedFleetCode ? (
        <div className="dispatch-upload-date-detection">
          <div>
            <strong>감지된 플릿 {pendingDetectedFleetCode}</strong>
            <p>
              {requiresDetectedFleetCreation
                ? '현재 회사에 일치하는 플릿이 없습니다. 생성하시겠습니까?'
                : '업로드 내용과 일치하는 플릿으로 전환합니다.'}
            </p>
          </div>
          <div className="panel-toolbar-actions">
            {requiresDetectedFleetCreation ? (
              <button
                className="button secondary small dispatch-upload-detection-action"
                disabled={isCreatingDetectedFleet}
                onClick={() => void onCreateDetectedFleet?.()}
                type="button"
              >
                {isCreatingDetectedFleet ? '생성 중...' : '플릿 생성'}
              </button>
            ) : (
              <button
                className="button secondary small dispatch-upload-detection-action"
                onClick={onApplyDetectedFleet}
                type="button"
              >
                감지된 플릿 적용
              </button>
            )}
            <button className="button ghost small" onClick={onDismissDetectedFleet} type="button">
              직접 선택
            </button>
          </div>
        </div>
      ) : null}
      {requiresMissingDriverCreation ? (
        <div className="dispatch-upload-date-detection">
          <div>
            <strong>미등록 배송원 {pendingMissingDriverNames.length}명</strong>
            <p>배송원.외부계정명 기준으로 누락된 배송원 프로필을 생성합니다.</p>
            <p>{pendingMissingDriverNames.join(', ')}</p>
          </div>
          <div className="panel-toolbar-actions">
            <button
              className="button secondary small dispatch-upload-detection-action"
              disabled={isCreatingMissingDrivers}
              onClick={() => void onCreateMissingDrivers?.()}
              type="button"
            >
              {isCreatingMissingDrivers ? '생성 중...' : '배송원 생성'}
            </button>
          </div>
        </div>
      ) : null}
      {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}

      <div
        aria-label="배차표 업로드 영역"
        className={`dispatch-upload-surface${editableRows.length > 0 ? ' has-sheet' : ''}${isDragActive ? ' is-drag-active' : ''}`}
        onDragEnter={handleSurfaceDragEnter}
        onDragLeave={handleSurfaceDragLeave}
        onDragOver={handleSurfaceDragOver}
        onDrop={handleSurfaceDrop}
        role="group"
      >
        <div className="dispatch-upload-surface-body">
          {editableRows.length > 0 ? (
            <div className="stack">
              <div className="dispatch-upload-sheet-summary">
                <div className="dispatch-upload-file-meta">
                  <span>파일</span>
                  <strong>{uploadedFilename || previewBatch?.source_filename || '이름 없음'}</strong>
                </div>
                <div className="dispatch-upload-stat-chips">
                  <span className="dispatch-upload-stat-chip">매칭 {previewSummary?.matchedCount ?? 0}</span>
                  <span className="dispatch-upload-stat-chip">확인 {previewSummary?.unmatchedCount ?? 0}</span>
                  <span className="dispatch-upload-stat-chip">박스 {previewSummary?.totalBoxCount ?? 0}</span>
                </div>
              </div>

              <table className="table dispatch-upload-sheet">
                <colgroup>
                  <col style={{ width: sheetColumnWidths.index }} />
                  <col style={{ width: sheetColumnWidths.deliveryManager }} />
                  <col style={{ width: sheetColumnWidths.smallRegion }} />
                  <col style={{ width: sheetColumnWidths.detailedRegion }} />
                  <col style={{ width: sheetColumnWidths.boxCount }} />
                  <col style={{ width: sheetColumnWidths.householdCount }} />
                  <col style={{ width: sheetColumnWidths.match }} />
                </colgroup>
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
                            onChange={(event) =>
                              updateEditableRow(row.row_index, 'delivery_manager_name', event.target.value)
                            }
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
                      <p>
                        {batch.rows.length}개 row · {batch.rows.filter((row) => Boolean(row.matched_driver_id)).length}개
                        매칭
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
            <button
              className="dispatch-upload-empty-surface"
              disabled={isUploadDisabled}
              onClick={handleUploadSurfaceClick}
              type="button"
            >
              <div className="dispatch-upload-empty-copy">
                <p className="dispatch-upload-empty-kicker">Drop Zone</p>
                <h3>배차표 파일을 드래그하거나 클릭해 업로드하세요.</h3>
                <p>엑셀 시트처럼 보이는 이 영역에 새 파일을 바로 올릴 수 있습니다.</p>
              </div>
              <div aria-hidden="true" className="dispatch-upload-placeholder-sheet">
                <div className="dispatch-upload-placeholder-toolbar">
                  <span className="dispatch-upload-placeholder-pill">배송매니저 이름</span>
                  <span className="dispatch-upload-placeholder-pill">소분류 권역</span>
                  <span className="dispatch-upload-placeholder-pill">세분류 권역</span>
                </div>
                <div className="dispatch-upload-placeholder-grid">
                  <span>#</span>
                  <span>배송매니저 이름</span>
                  <span>소분류 권역</span>
                  <span>세분류 권역</span>
                  <span>박스 수</span>
                  <span>가구 수</span>
                  <span>#</span>
                  <span>예시 row</span>
                  <span>10H2</span>
                  <span>10H2-가</span>
                  <span>133</span>
                  <span>90</span>
                  <span>#</span>
                  <span>새 파일 드롭</span>
                  <span>11A1</span>
                  <span>11A1-나</span>
                  <span>211</span>
                  <span>120</span>
                </div>
              </div>
            </button>
          )}
        </div>
        {isDragActive ? (
          <div className="dispatch-upload-surface-overlay">
            <strong>업로드 + 중복 덮어씌워짐</strong>
            <span>현재 시트와 요약 정보가 새 파일 기준으로 즉시 교체됩니다.</span>
          </div>
        ) : null}
      </div>
    </section>
  );
}
