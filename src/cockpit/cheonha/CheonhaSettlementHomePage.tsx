import { Link } from 'react-router-dom';

const quickActions = [
  {
    title: '배차 데이터',
    description: '배차표 업로드와 배송원 자동 보정, snapshot 준비를 실제 업무 순서대로 이어갑니다.',
    cta: '배차 데이터 열기',
    to: '/settlement/dispatch',
  },
  {
    title: '정산 처리',
    description: '업로드 결과로 만든 정산 대상 record와 snapshot을 검토한 뒤 실행 단계로 넘깁니다.',
    cta: '정산 처리 열기',
    to: '/settlement/process',
  },
] as const;

const embeddedSummaries = [
  {
    title: '금월 배차표 기반 근태',
    description: '근태는 별도 탭으로 분리하지 않고 홈에서 월 기준 요약으로 유지합니다.',
  },
  {
    title: '비활성 규칙 탭',
    description: '배송원 관리, 운영 현황, 팀 관리는 현재 shell만 열어 두고 실제 편집은 아직 연결하지 않았습니다.',
  },
] as const;

export function CheonhaSettlementHomePage() {
  return (
    <div className="cockpit-home-page">
      <section className="cockpit-workspace-panel">
        <p className="cockpit-kicker">Settlement Home</p>
        <h2>홈</h2>
        <p>천하운수 정산 워크플로우는 홈에서 시작하고, 근태 요약은 별도 route 없이 여기서 함께 확인합니다.</p>
      </section>

      <div className="cockpit-card-grid">
        {quickActions.map((item) => (
          <article className="cockpit-card" key={item.title}>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            <Link className="button ghost small" to={item.to}>
              {item.cta}
            </Link>
          </article>
        ))}
        {embeddedSummaries.map((item) => (
          <article className="cockpit-card" key={item.title}>
            <strong>{item.title}</strong>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
