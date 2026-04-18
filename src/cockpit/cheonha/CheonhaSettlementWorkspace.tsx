import { Navigate, Route, Routes } from 'react-router-dom';

import type { HttpClient, SessionPayload } from '../../api/http';
import type { SettlementChildNavItem } from '../SubdomainAccordionNav';
import { settlementChildNavItems } from '../SubdomainAccordionNav';
import { CheonhaDispatchDataPage } from './CheonhaDispatchDataPage';
import { CheonhaRuleShellPanel } from './CheonhaRuleShellPanel';
import { CheonhaSettlementHomePage } from './CheonhaSettlementHomePage';
import { CheonhaSettlementProcessPage } from './CheonhaSettlementProcessPage';

type CheonhaSettlementWorkspaceProps = {
  client?: HttpClient;
  companyName?: string;
  session?: SessionPayload | null;
};

function renderSettlementChildRoute(
  slug: SettlementChildNavItem['slug'],
  client?: HttpClient,
  session?: SessionPayload | null,
) {
  switch (slug) {
    case 'home':
      return <CheonhaSettlementHomePage />;
    case 'dispatch':
      return <CheonhaDispatchDataPage client={client} session={session} />;
    case 'crew':
      return (
        <CheonhaRuleShellPanel
          description="배송원 운영 규칙과 계정 연계 화면은 아직 cockpit shell만 제공합니다."
          title="배송원 관리"
        />
      );
    case 'operations':
      return (
        <CheonhaRuleShellPanel
          description="운영 현황과 예외 규칙 화면은 아직 cockpit shell만 제공합니다. 근태는 홈에서 요약으로 계속 확인합니다."
          title="운영 현황"
        />
      );
    case 'process':
      return <CheonhaSettlementProcessPage client={client} session={session} />;
    case 'team':
      return (
        <CheonhaRuleShellPanel
          description="팀 기준 정보와 운영 룰 편집 화면은 아직 cockpit shell만 제공합니다."
          title="팀 관리"
        />
      );
  }
}

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
      <div className="cockpit-workspace-stage">
        <Routes>
          <Route index element={<Navigate replace to="/settlement/home" />} />
          {settlementChildNavItems.map((item) => (
            <Route key={item.slug} path={item.slug} element={renderSettlementChildRoute(item.slug, client, session)} />
          ))}
          <Route path="*" element={<Navigate replace to="/settlement/home" />} />
        </Routes>
      </div>
    </div>
  );
}
