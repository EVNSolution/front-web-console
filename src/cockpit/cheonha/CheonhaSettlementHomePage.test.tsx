import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { CheonhaSettlementHomePage } from './CheonhaSettlementHomePage';

describe('CheonhaSettlementHomePage', () => {
  it('locks the cheonha settlement home layout contract', () => {
    render(
      <MemoryRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
      >
        <CheonhaSettlementHomePage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: /천하운수.*정산/ })).toBeInTheDocument();
    expect(screen.getByText('정산 워크플로우')).toBeInTheDocument();

    const processCard = screen.getByRole('article', { name: '업무 프로세스' });
    expect(processCard).toHaveTextContent(/배차 업로드[\s\S]*특근 설정[\s\S]*단가 확인[\s\S]*정산 처리/);
    expect(screen.getByRole('link', { name: '배차 업로드' })).toHaveAttribute('href', '/settlement/dispatch');
    expect(screen.getByRole('link', { name: '정산 처리' })).toHaveAttribute('href', '/settlement/process');

    const kpiStrip = screen.getByRole('region', { name: '정산 KPI' });
    expect(kpiStrip).toHaveTextContent(/수신합계[\s\S]*지급합계[\s\S]*조정비용[\s\S]*수익/);

    const recentSettlement = screen.getByRole('region', { name: '최근 정산' });
    expect(recentSettlement).toHaveTextContent('정산 내역이 없습니다');
  });
});
