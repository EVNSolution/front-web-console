type CheonhaDashboardPageProps = {
  companyName: string;
};

type DashboardHighlight = {
  label: string;
  value: string;
  note: string;
};

const unavailableValue = '데이터 미연동';

const financeHighlights = [
  { label: '확정 수입', value: unavailableValue, note: '실운영 정산 데이터 연동 후 표시됩니다.' },
  { label: '확정 지출', value: unavailableValue, note: '실운영 정산 데이터 연동 후 표시됩니다.' },
  { label: '마감 차액', value: unavailableValue, note: '실운영 정산 데이터 연동 후 표시됩니다.' },
] satisfies readonly DashboardHighlight[];

const attendanceHighlights = [
  { label: '대상 배송원', value: unavailableValue, note: '금월 배차 기반 근태 집계 연동 후 표시됩니다.' },
  { label: '출근 반영', value: unavailableValue, note: '금월 배차 기반 근태 집계 연동 후 표시됩니다.' },
  { label: '배차 연동 누락', value: unavailableValue, note: '금월 배차 기반 근태 집계 연동 후 표시됩니다.' },
] satisfies readonly DashboardHighlight[];

const dispatchHighlights = [
  { label: '금일 배차 건수', value: unavailableValue, note: '금일 배차 업로드 연동 후 표시됩니다.' },
  { label: '자동 생성 배송원', value: unavailableValue, note: '금일 배차 업로드 연동 후 표시됩니다.' },
  { label: '플릿 추정 대기', value: unavailableValue, note: '금일 배차 업로드 연동 후 표시됩니다.' },
] satisfies readonly DashboardHighlight[];

function getCurrentMonthLabel(date = new Date()) {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
}

export function CheonhaDashboardPage({ companyName }: CheonhaDashboardPageProps) {
  const currentMonthLabel = getCurrentMonthLabel();

  return (
    <section className="cockpit-dashboard">
      <div className="cockpit-hero">
        <div className="cockpit-dashboard-hero-copy">
          <p className="cockpit-kicker">Subdomain Dashboard</p>
          <h1>{companyName} 운영 대시보드</h1>
          <p className="cockpit-copy">오늘 운영 현황을 우선으로 보고, 월 기준 전환으로 최근 흐름을 함께 확인합니다.</p>
        </div>
        <div className="cockpit-month-switch" aria-label="월 전환">
          <span className="cockpit-dashboard-frame">기준: 오늘</span>
          <div className="cockpit-month-switch-controls">
            <button className="cockpit-month-button" type="button" disabled>
              이전 월
            </button>
            <strong>{currentMonthLabel}</strong>
            <button className="cockpit-month-button" type="button" disabled>
              다음 월
            </button>
          </div>
        </div>
      </div>

      <div className="cockpit-dashboard-grid">
        <section className="cockpit-dashboard-panel">
          <div className="cockpit-dashboard-section-header">
            <h2>최근 6개월 수입/지출</h2>
            <p>확정된 결과만 집계합니다.</p>
          </div>
          <div className="cockpit-dashboard-summary-grid">
            {financeHighlights.map((item) => (
              <article className="cockpit-dashboard-summary-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cockpit-dashboard-panel">
          <div className="cockpit-dashboard-section-header">
            <h2>금월 배차표 기반 근태</h2>
            <p>배차 업로드 결과를 기준으로 근태 요약만 노출합니다.</p>
          </div>
          <div className="cockpit-dashboard-metric-list">
            {attendanceHighlights.map((item) => (
              <article className="cockpit-dashboard-metric" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="cockpit-dashboard-panel">
          <div className="cockpit-dashboard-section-header">
            <h2>금일 배차</h2>
            <p>배차 업로드 이후 자동 생성과 추정 대기 상태를 같은 문맥에서 봅니다.</p>
          </div>
          <div className="cockpit-dashboard-metric-list">
            {dispatchHighlights.map((item) => (
              <article className="cockpit-dashboard-metric" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
