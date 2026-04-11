import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { canManageDriverProfileScope } from '../authScopes';
import { listDrivers } from '../api/drivers';
import { listCompanies, listFleets } from '../api/organization';
import { PageLayout } from '../components/PageLayout';
import { getErrorMessage, type HttpClient, type SessionPayload } from '../api/http';
import { getDriverRouteRef } from '../routeRefs';
import type { Company, DriverProfile, Fleet } from '../types';

type DriversPageProps = {
  client: HttpClient;
  session: SessionPayload;
};

export function DriversPage({ client, session }: DriversPageProps) {
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canManageDriverProfiles = canManageDriverProfileScope(session);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [driverResponse, companyResponse, fleetResponse] = await Promise.all([
          listDrivers(client),
          listCompanies(client),
          listFleets(client),
        ]);
        if (ignore) {
          return;
        }
        setDrivers(driverResponse);
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

  function getCompanyName(companyId: string) {
    return companies.find((company) => company.company_id === companyId)?.name ?? '미확인 회사';
  }

  function getFleetName(fleetId: string) {
    return fleets.find((fleet) => fleet.fleet_id === fleetId)?.name ?? '미확인 플릿';
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

  return (
    <PageLayout
      actions={
        canManageDriverProfiles ? (
          <Link className="button primary" to="/drivers/new">
            배송원 생성
          </Link>
        ) : null
      }
      subtitle="배송원 운영 현황을 확인하고, 계정 연결은 상세 화면에서 관리합니다."
      title="배송원"
    >
      <section className="panel">
        <div className="panel-header">
          <p className="panel-kicker">배송원</p>
          <h2>배송원 목록</h2>
        </div>
        {errorMessage ? <div className="error-banner">{errorMessage}</div> : null}
        {isLoading ? <p className="empty-state">배송원을 불러오는 중입니다...</p> : (
          <table className="table compact">
            <thead><tr><th>이름</th><th>원청 앱 사용자명</th><th>회사</th><th>플릿</th><th>계정 연결</th></tr></thead>
            <tbody>
              {drivers.map((driver) => {
                const detailPath = driver.route_no != null ? `/drivers/${getDriverRouteRef(driver)}` : null;

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
                    <td onClick={stopRowNavigation} onKeyDown={stopRowNavigation}>상세에서 관리</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </PageLayout>
  );
}
