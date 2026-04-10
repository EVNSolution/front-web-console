import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { bootstrapDailySnapshotsFromDispatch } from '../api/deliveryRecords';
import type { SessionPayload } from '../api/http';
import { listDispatchUploadBatches } from '../api/dispatchRegistry';
import { getErrorMessage, type HttpClient } from '../api/http';
import { listCompanies, listFleets } from '../api/organization';
import { DispatchUploadWizard } from '../components/DispatchUploadWizard';
import { PageLayout } from '../components/PageLayout';
import { isSystemAdmin } from '../authScopes';
import type { Company, DispatchUploadBatch, Fleet } from '../types';

type DispatchUploadsPageProps = {
  client: HttpClient;
  session: SessionPayload;
};

export function DispatchUploadsPage({ client, session }: DispatchUploadsPageProps) {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedFleetId, setSelectedFleetId] = useState('');
  const [dispatchDate, setDispatchDate] = useState('');
  const [confirmedBatches, setConfirmedBatches] = useState<DispatchUploadBatch[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const visibleFleets = useMemo(
    () => fleets.filter((fleet) => !selectedCompanyId || fleet.company_id === selectedCompanyId),
    [fleets, selectedCompanyId],
  );
  const showCompanySelector = isSystemAdmin(session);
  const uploadSummary = useMemo(() => {
    const matchedRowCount = confirmedBatches.reduce(
      (sum, batch) => sum + batch.rows.filter((row) => Boolean(row.matched_driver_id)).length,
      0,
    );
    const totalRowCount = confirmedBatches.reduce((sum, batch) => sum + batch.rows.length, 0);
    const totalBoxCount = confirmedBatches.reduce(
      (sum, batch) => sum + batch.rows.reduce((rowSum, row) => rowSum + row.box_count, 0),
      0,
    );
    return { matchedRowCount, totalRowCount, totalBoxCount };
  }, [confirmedBatches]);

  useEffect(() => {
    let ignore = false;

    async function loadScopeOptions() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [companyResponse, fleetResponse] = await Promise.all([
          listCompanies(client),
          listFleets(client),
        ]);
        if (ignore) {
          return;
        }
        setCompanies(companyResponse);
        setFleets(fleetResponse);
        const lockedCompanyId =
          !showCompanySelector && session.activeAccount?.companyId ? session.activeAccount.companyId : '';
        const nextCompanyId =
          lockedCompanyId && companyResponse.some((company) => company.company_id === lockedCompanyId)
            ? lockedCompanyId
            : companyResponse[0]?.company_id ?? '';
        const nextFleetId =
          fleetResponse.find((fleet) => fleet.company_id === nextCompanyId)?.fleet_id ??
          fleetResponse[0]?.fleet_id ??
          '';
        setSelectedCompanyId(nextCompanyId);
        setSelectedFleetId(nextFleetId);
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getErrorMessage(error));
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadScopeOptions();
    return () => {
      ignore = true;
    };
  }, [client, session, showCompanySelector]);

  async function loadConfirmedBatches() {
    if (!selectedCompanyId || !selectedFleetId || !dispatchDate) {
      setConfirmedBatches([]);
      return;
    }

    const batches = await listDispatchUploadBatches(client, {
      company_id: selectedCompanyId,
      fleet_id: selectedFleetId,
      dispatch_date: dispatchDate,
      upload_status: 'confirmed',
    });
    setConfirmedBatches(batches);
  }

  useEffect(() => {
    let ignore = false;

    async function loadBatches() {
      if (!selectedCompanyId || !selectedFleetId || !dispatchDate) {
        setConfirmedBatches([]);
        return;
      }
      try {
        const batches = await listDispatchUploadBatches(client, {
          company_id: selectedCompanyId,
          fleet_id: selectedFleetId,
          dispatch_date: dispatchDate,
          upload_status: 'confirmed',
        });
        if (!ignore) {
          setConfirmedBatches(batches);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(getErrorMessage(error));
        }
      }
    }

    void loadBatches();
    return () => {
      ignore = true;
    };
  }, [client, dispatchDate, selectedCompanyId, selectedFleetId]);

  async function handleBootstrapSettlementInputs() {
    if (!selectedCompanyId || !selectedFleetId || !dispatchDate) {
      return;
    }
    setIsBootstrapping(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      await bootstrapDailySnapshotsFromDispatch(client, {
        company_id: selectedCompanyId,
        fleet_id: selectedFleetId,
        service_date: dispatchDate,
      });
      setStatusMessage('배차표 업로드 기준으로 정산 입력 snapshot을 준비했습니다.');
      navigate('/settlements/inputs');
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsBootstrapping(false);
    }
  }

  return (
    <PageLayout subtitle="회사, 플릿, 날짜 기준으로 배차표 업로드를 확정합니다." title="배차표 업로드">
      <div className="dispatch-upload-workbench">
        <section className="panel dispatch-upload-sidebar">
          <div className="panel-header dispatch-upload-compact-header">
            <p className="panel-kicker">업로드 범위</p>
            <h2>회사, 플릿, 날짜</h2>
            <p className="table-meta">업로드와 정산 기준 범위를 먼저 고릅니다.</p>
          </div>
          {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
          {statusMessage ? <div className="success-banner">{statusMessage}</div> : null}
          {isLoading ? (
            <p className="empty-state">업로드 범위를 불러오는 중입니다...</p>
          ) : (
            <>
              <div className="dispatch-upload-scope-grid">
                {showCompanySelector ? (
                  <label className="field">
                    <select
                      aria-label="회사"
                      onChange={(event) => {
                        const nextCompanyId = event.target.value;
                        setSelectedCompanyId(nextCompanyId);
                        const nextFleetId =
                          fleets.find((fleet) => fleet.company_id === nextCompanyId)?.fleet_id ?? '';
                        setSelectedFleetId(nextFleetId);
                      }}
                      value={selectedCompanyId}
                    >
                      <option value="">회사 선택</option>
                      {companies.map((company) => (
                        <option key={company.company_id} value={company.company_id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                <label className="field">
                  <select
                    aria-label="플릿"
                    onChange={(event) => setSelectedFleetId(event.target.value)}
                    value={selectedFleetId}
                  >
                    <option value="">플릿 선택</option>
                    {visibleFleets.map((fleet) => (
                      <option key={fleet.fleet_id} value={fleet.fleet_id}>
                        {fleet.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <input
                    aria-label="배차일"
                    onChange={(event) => setDispatchDate(event.target.value)}
                    type="date"
                    value={dispatchDate}
                  />
                </label>
              </div>
              <div className="dispatch-upload-scope-summary">
                <article className="metric-card">
                  <span>확정 업로드 배치</span>
                  <strong>{confirmedBatches.length}</strong>
                </article>
                <article className="metric-card">
                  <span>배송원 매칭 row</span>
                  <strong>{uploadSummary.matchedRowCount}</strong>
                </article>
                <article className="metric-card">
                  <span>확정 박스 수</span>
                  <strong>{uploadSummary.totalBoxCount}</strong>
                </article>
              </div>
              <div className="dispatch-upload-sidebar-actions">
                <Link className="button ghost" to="/dispatch/boards">
                  배차 계획 보기
                </Link>
              </div>
            </>
          )}
        </section>

        <div className="dispatch-upload-main">
          <DispatchUploadWizard
            client={client}
            companyId={selectedCompanyId}
            fleetId={selectedFleetId}
            dispatchDate={dispatchDate}
            onDispatchDateDetected={setDispatchDate}
            confirmedBatches={confirmedBatches}
            isStartingSettlement={isBootstrapping}
            onConfirmed={loadConfirmedBatches}
            onStartSettlement={handleBootstrapSettlementInputs}
          />
        </div>
      </div>
    </PageLayout>
  );
}
