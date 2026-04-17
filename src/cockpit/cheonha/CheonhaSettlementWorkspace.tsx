import { NavLink, Navigate, Route, Routes } from 'react-router-dom';

import type { HttpClient, SessionPayload } from '../../api/http';
import { CheonhaDispatchDataPage } from './CheonhaDispatchDataPage';
import { CheonhaRuleShellPanel } from './CheonhaRuleShellPanel';
import { CheonhaSettlementHomePage } from './CheonhaSettlementHomePage';
import { CheonhaSettlementProcessPage } from './CheonhaSettlementProcessPage';

type CheonhaSettlementWorkspaceProps = {
  client?: HttpClient;
  companyName?: string;
  session?: SessionPayload | null;
};

const settlementTabs = [
  { slug: 'home', label: '홈' },
  { slug: 'dispatch', label: '배차 데이터' },
  { slug: 'crew', label: '배송원 관리' },
  { slug: 'operations', label: '운영 현황' },
  { slug: 'process', label: '정산 처리' },
  { slug: 'team', label: '팀 관리' },
] as const;

export function CheonhaSettlementWorkspace({
  client,
  companyName = '천하운수',
  session,
}: CheonhaSettlementWorkspaceProps) {
  return (
    <div className="cockpit-workspace">
      <header className="cockpit-workspace-header">
        <p className="cockpit-kicker">정산 Workspace</p>
        <h1>{companyName} 정산</h1>
        <p className="cockpit-copy">배차 업로드부터 snapshot 검토까지 실제 워크플로우를 같은 정산 문맥 안에서 이어갑니다.</p>
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
      <div className="cockpit-workspace-stage">
        <Routes>
          <Route index element={<Navigate replace to="/settlement/home" />} />
          <Route path="home" element={<CheonhaSettlementHomePage />} />
          <Route path="dispatch" element={<CheonhaDispatchDataPage client={client} session={session} />} />
          <Route
            path="crew"
            element={
              <CheonhaRuleShellPanel
                description="배송원 운영 규칙과 계정 연계 화면은 아직 cockpit shell만 제공합니다."
                title="배송원 관리"
              />
            }
          />
          <Route
            path="operations"
            element={
              <CheonhaRuleShellPanel
                description="운영 현황과 예외 규칙 화면은 아직 cockpit shell만 제공합니다. 근태는 홈에서 요약으로 계속 확인합니다."
                title="운영 현황"
              />
            }
          />
          <Route path="process" element={<CheonhaSettlementProcessPage client={client} session={session} />} />
          <Route
            path="team"
            element={
              <CheonhaRuleShellPanel
                description="팀 기준 정보와 운영 룰 편집 화면은 아직 cockpit shell만 제공합니다."
                title="팀 관리"
              />
            }
          />
          <Route path="*" element={<Navigate replace to="/settlement/home" />} />
        </Routes>
      </div>
    </div>
  );
}
