import { Link } from 'react-router-dom';

type CheonhaDashboardPageProps = {
  companyName: string;
};

const dashboardCards = [
  {
    title: '정산',
    description: '천하운수 전용 정산 워크스페이스로 이동합니다.',
    to: '/settlement',
  },
] as const;

export function CheonhaDashboardPage({ companyName }: CheonhaDashboardPageProps) {
  return (
    <section className="cockpit-dashboard">
      <div className="cockpit-hero">
        <p className="cockpit-kicker">Company Cockpit</p>
        <h1>{companyName}</h1>
        <p className="cockpit-copy">업무 템플릿을 선택한 뒤 전용 워크스페이스로 진입합니다.</p>
      </div>
      <div className="cockpit-card-grid">
        {dashboardCards.map((card, index) => (
          <Link className="cockpit-card" key={`${card.title}-${index}`} to={card.to}>
            <strong>{card.title}</strong>
            <p>{card.description}</p>
            <span>열기</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
