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
  companyName = '천하운수',
) {
  switch (slug) {
    case 'home':
      return <CheonhaSettlementHomePage companyName={companyName} />;
    case 'dispatch':
      return <CheonhaDispatchDataPage client={client} session={session} />;
    case 'crew':
      return (
        <CheonhaRuleShellPanel
          description="배송원 운영은 계정 연결과 배차 연결 상태를 먼저 확인하는 자리로 정리합니다."
          note="등록 배송원과 연결 상태를 한 화면에서 확인하는 읽기 전용 요약입니다."
          summaryCards={[
            {
              rows: [
                { label: '등록 배송원', value: 0 },
                { label: '배차 연결', value: 0 },
                { label: '미연결', value: '없음' },
              ],
              status: '0명',
              title: '등록 현황',
            },
            {
              rows: [
                { label: '최근 동기화', value: '없음' },
                { label: '계정 승인', value: '없음' },
                { label: '저장 동작', value: '없음' },
              ],
              status: '없음',
              title: '계정 연결',
            },
          ]}
          title="배송원 관리"
        />
      );
    case 'operations':
      return (
        <CheonhaRuleShellPanel
          description="운영 현황은 날짜, 배차, 근태를 같은 박스 안에서 확인하는 요약 자리로 제공합니다."
          note="실제 값이 없으면 없음과 0을 그대로 보여 주는 box-style summary입니다."
          summaryCards={[
            {
              rows: [
                { label: '기준 날짜', value: '없음' },
                { label: '마지막 갱신', value: '없음' },
                { label: '다음 반영', value: 0 },
              ],
              status: '오늘',
              title: '날짜',
            },
            {
              rows: [
                { label: '배차 건수', value: 0 },
                { label: '미할당', value: 0 },
                { label: '예외', value: '없음' },
              ],
              status: '0건',
              title: '배차',
            },
            {
              rows: [
                { label: '출근', value: 0 },
                { label: '지각', value: 0 },
                { label: '결근', value: 0 },
              ],
              status: '0명',
              title: '근태',
            },
          ]}
          title="운영 현황"
        />
      );
    case 'process':
      return <CheonhaSettlementProcessPage client={client} session={session} />;
    case 'team':
      return (
        <CheonhaRuleShellPanel
          description="팀 관리는 단가와 규칙이 붙는 기준 정보를 먼저 묶어 보여 줍니다."
          note="팀 수, 기본 기준, 연결 상태를 요약으로 확인하는 읽기 전용 자리입니다."
          summaryCards={[
            {
              rows: [
                { label: '팀 수', value: 0 },
                { label: '활성 규칙', value: 0 },
                { label: '예외', value: '없음' },
              ],
              status: '0개',
              title: '팀 기준',
            },
            {
              rows: [
                { label: '기준일', value: '없음' },
                { label: '기본 플릿', value: '없음' },
                { label: '담당자', value: '없음' },
              ],
              status: '없음',
              title: '배차 연결',
            },
          ]}
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
    <div
      className="cockpit-workspace settlement-workspace-frame"
      data-testid="settlement-workspace-frame"
    >
      <header
        className="cockpit-workspace-header settlement-workspace-frame-header"
        data-testid="settlement-workspace-header"
      >
        <p className="cockpit-kicker">정산 Workspace</p>
        <h1>{companyName} 정산</h1>
        <p className="cockpit-copy">배차 업로드부터 snapshot 검토까지 실제 워크플로우를 같은 정산 문맥 안에서 이어갑니다.</p>
      </header>
      <div className="cockpit-workspace-stage settlement-workspace-frame-body">
        <section className="cockpit-workspace-panel settlement-workspace-frame-panel">
          <Routes>
            <Route index element={<Navigate replace to="/settlement/home" />} />
            {settlementChildNavItems.map((item) => (
              <Route
                key={item.slug}
                path={item.slug}
                element={renderSettlementChildRoute(item.slug, client, session, companyName)}
              />
            ))}
            <Route path="*" element={<Navigate replace to="/settlement/home" />} />
          </Routes>
        </section>
      </div>
    </div>
  );
}
