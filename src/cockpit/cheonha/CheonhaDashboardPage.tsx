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
  {
    title: '차량',
    description: '차량 전용 cockpit은 다음 단계에서 연결합니다.',
    to: '/vehicle',
  },
  {
    title: '빈 카드',
    description: '후속 업무 템플릿을 이 자리에 추가합니다.',
    to: '/placeholder-1',
  },
  {
    title: '빈 카드',
    description: '후속 업무 템플릿을 이 자리에 추가합니다.',
    to: '/placeholder-2',
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
