import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { canManageDriverProfileScope } from '../authScopes';
import { listDriverAccountLinks } from '../api/driverAccountLinks';
import { listDrivers } from '../api/drivers';
import { listCompanies, listFleets } from '../api/organization';
import { PageLayout } from '../components/PageLayout';
import { getErrorMessage, type HttpClient, type SessionPayload } from '../api/http';
import { getDriverRouteRef } from '../routeRefs';
import type { Company, DriverAccountLinkSummary, DriverProfile, Fleet } from '../types';

type DriversPageProps = {
  client: HttpClient;
  session: SessionPayload;
};

const PAGE_SIZE_OPTIONS = [10, 25, 50, 'all'] as const;

export function DriversPage({ client, session }: DriversPageProps) {
  const navigate = useNavigate();
  const [driverAccountLinks, setDriverAccountLinks] = useState<DriverAccountLinkSummary[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFleetId, setSelectedFleetId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const [currentPage, setCurrentPage] = useState(1);
  const canManageDriverProfiles = canManageDriverProfileScope(session);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [driverResponse, driverAccountLinkResponse, companyResponse, fleetResponse] = await Promise.all([
          listDrivers(client),
          listDriverAccountLinks(client),
          listCompanies(client),
          listFleets(client),
        ]);
        if (ignore) {
          return;
        }
        setDrivers(driverResponse);
        setDriverAccountLinks(driverAccountLinkResponse);
        setCompanies(companyResponse);
        setFleets(fleetResponse);
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

    void load();
    return () => {
      ignore = true;
    };
  }, [client]);

  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, searchTerm, selectedFleetId]);

  function getCompanyName(companyId: string) {
    return companies.find((company) => company.company_id === companyId)?.name ?? '미확인 회사';
  }

  function getFleetName(fleetId: string) {
    return fleets.find((fleet) => fleet.fleet_id === fleetId)?.name ?? '미확인 플릿';
  }

  function getActiveDriverAccountLink(driverId: string) {
    return driverAccountLinks.find((entry) => entry.driver_id === driverId && entry.unlinked_at == null) ?? null;
  }

  function handleRowKeyDown(event: React.KeyboardEvent<HTMLTableRowElement>, detailPath: string) {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    navigate(detailPath);
  }

  function stopRowNavigation(event: React.SyntheticEvent) {
    event.stopPropagation();
  }

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredDrivers = drivers.filter((driver) => {
    const matchesFleet = selectedFleetId === 'all' || driver.fleet_id === selectedFleetId;
    if (!matchesFleet) {
      return false;
    }

    if (!normalizedSearchTerm) {
      return true;
    }

    return (
      driver.name.toLowerCase().includes(normalizedSearchTerm) ||
      (driver.external_user_name ?? '').toLowerCase().includes(normalizedSearchTerm)
    );
  });

  const totalPages =
    pageSize === 'all'
      ? 1
      : Math.max(1, Math.ceil(filteredDrivers.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedDrivers =
    pageSize === 'all'
      ? filteredDrivers
      : filteredDrivers.slice((safeCurrentPage - 1) * pageSize, safeCurrentPage * pageSize);

  const filters = (
    <div className="driver-list-toolbar">
      <label className="driver-list-filter">
        <span>플릿</span>
        <select value={selectedFleetId} onChange={(event) => setSelectedFleetId(event.target.value)}>
          <option value="all">전체</option>
          {fleets.map((fleet) => (
            <option key={fleet.fleet_id} value={fleet.fleet_id}>
              {fleet.name}
            </option>
          ))}
        </select>
      </label>
      <label className="driver-list-filter driver-list-filter-search">
        <span>검색</span>
        <input
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="배송원 이름 또는 원청 앱 사용자명"
        />
      </label>
      <span className="driver-list-meta">{filteredDrivers.length}명</span>
    </div>
  );

  return (
    <PageLayout
      contentClassName="driver-list-page"
      actions={
        canManageDriverProfiles ? (
          <Link className="button primary" to="/drivers/new">
            배송원 생성
          </Link>
        ) : null
      }
      filters={filters}
      subtitle="배송원 운영 현황을 확인하고, 계정 연결은 상세 화면에서 관리합니다."
      title="배송원"
    >
      <section className="panel driver-list-shell">
        <div className="panel-header">
          <p className="panel-kicker">배송원</p>
          <h2>배송원 목록</h2>
        </div>
        {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
        <div className="driver-list-body">
          {isLoading ? <p className="empty-state">배송원을 불러오는 중입니다...</p> : null}
          {!isLoading && pagedDrivers.length === 0 ? <p className="empty-state">조건에 맞는 배송원이 없습니다.</p> : null}
          {!isLoading && pagedDrivers.length > 0 ? (
            <table className="table compact driver-list-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>원청 앱 사용자명</th>
                  <th>회사</th>
                  <th>플릿</th>
                  <th>계정 연결</th>
                </tr>
              </thead>
              <tbody>
                {pagedDrivers.map((driver) => {
                  const detailPath = driver.route_no != null ? `/drivers/${getDriverRouteRef(driver)}` : null;
                  const activeLink = getActiveDriverAccountLink(driver.driver_id);

                  return (
                    <tr
                      key={driver.driver_id}
                      className={detailPath ? 'interactive-row' : undefined}
                      data-detail-path={detailPath ?? undefined}
                      onClick={detailPath ? () => navigate(detailPath) : undefined}
                      onKeyDown={detailPath ? (event) => handleRowKeyDown(event, detailPath) : undefined}
                      tabIndex={detailPath ? 0 : undefined}
                    >
                      <td>{driver.name}</td>
                      <td>{driver.external_user_name || '미입력'}</td>
                      <td>{getCompanyName(driver.company_id)}</td>
                      <td>{getFleetName(driver.fleet_id)}</td>
                      <td onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>
                        {activeLink?.identity_name ?? ''}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : null}
        </div>
        <div className="driver-list-footer">
          <label className="driver-list-page-size">
            <span>노출 수</span>
            <select
              aria-label="노출 수"
              value={String(pageSize)}
              onChange={(event) => {
                const nextValue = event.target.value;
                setPageSize(nextValue === 'all' ? 'all' : Number(nextValue) as 10 | 25 | 50);
              }}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={String(option)} value={String(option)}>
                  {option === 'all' ? '전체' : option}
                </option>
              ))}
            </select>
          </label>
          <div className="driver-list-pagination" aria-label="페이지 번호">
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  type="button"
                  className={page === safeCurrentPage ? 'is-active' : undefined}
                  disabled={page === safeCurrentPage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
