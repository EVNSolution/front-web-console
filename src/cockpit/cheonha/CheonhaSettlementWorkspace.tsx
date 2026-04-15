import { NavLink, Navigate, Route, Routes } from 'react-router-dom';

const settlementTabs = [
  {
    slug: 'dispatch-data',
    label: '배차 데이터',
    description: '배차 데이터 업로드와 초기 정산 준비 흐름을 이 탭에 붙입니다.',
  },
  {
    slug: 'driver-management',
    label: '배송원 관리',
    description: '정산 대상 배송원 확인과 계정 상태 관리를 이 탭에 붙입니다.',
  },
  {
    slug: 'operations-status',
    label: '운영 현황',
    description: '운영 지표와 예외 상황 요약을 이 탭에 붙입니다.',
  },
  {
    slug: 'settlement-processing',
    label: '정산 처리',
    description: '월별 정산 실행과 검토 흐름을 이 탭에 붙입니다.',
  },
  {
    slug: 'team-management',
    label: '팀 관리',
    description: '팀 기준 정보와 운영 설정 관리를 이 탭에 붙입니다.',
  },
] as const;

function SettlementWorkspacePanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="cockpit-workspace-panel">
      <h2>{title}</h2>
      <p>{description}</p>
    </section>
  );
}

export function CheonhaSettlementWorkspace() {
  return (
    <div className="cockpit-workspace">
      <header className="cockpit-workspace-header">
        <p className="cockpit-kicker">정산 Workspace</p>
        <h1>천하운수 정산</h1>
        <p className="cockpit-copy">기존 프로토타입의 익숙한 순서를 유지하고, 내부 구현은 현재 콘솔 디자인 시스템을 따릅니다.</p>
      </header>
      <nav aria-label="정산 탭" className="cockpit-tab-strip">
        {settlementTabs.map((tab) => (
          <NavLink
            className={({ isActive }) => (isActive ? 'cockpit-tab is-active' : 'cockpit-tab')}
            key={tab.slug}
            to={`/settlement/${tab.slug}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      <Routes>
        <Route index element={<Navigate replace to="/settlement/dispatch-data" />} />
        {settlementTabs.map((tab) => (
          <Route
            element={<SettlementWorkspacePanel description={tab.description} title={tab.label} />}
            key={tab.slug}
            path={tab.slug}
          />
        ))}
      </Routes>
    </div>
  );
}
