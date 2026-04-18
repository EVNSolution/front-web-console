import { render, screen, within } from '@testing-library/react';
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

    const greetingBanner = screen.getByRole('heading', { level: 1, name: /천하운수.*정산/ }).closest('section');
    const processCard = screen.getByRole('heading', { level: 2, name: '업무 프로세스' }).closest('article');
    const kpiStripAnchor = screen.getByText('수신합계');
    const recentSettlementAnchor = screen.getByText('정산 내역이 없습니다');

    expect(greetingBanner).not.toBeNull();
    expect(greetingBanner).toHaveTextContent(/천하운수.*정산/);
    expect(greetingBanner).toHaveTextContent('정산 워크플로우');

    expect(processCard).not.toBeNull();
    expect(within(processCard!).getByRole('link', { name: '배차 업로드' })).toHaveAttribute(
      'href',
      '/settlement/dispatch',
    );
    expect(within(processCard!).getByRole('link', { name: '정산 처리' })).toHaveAttribute(
      'href',
      '/settlement/process',
    );
    expect(processCard).toHaveTextContent(/배차 업로드[\s\S]*특근 설정[\s\S]*단가 확인[\s\S]*정산 처리/);

    const kpiStrip = kpiStripAnchor.closest('section');
    expect(kpiStrip).not.toBeNull();
    expect(kpiStrip).toHaveTextContent('수신합계');
    expect(kpiStrip).toHaveTextContent('지급합계');
    expect(kpiStrip).toHaveTextContent('조정비용');
    expect(kpiStrip).toHaveTextContent('수익');

    const recentSettlementSection = recentSettlementAnchor.closest('section');
    expect(recentSettlementSection).not.toBeNull();
    expect(recentSettlementSection).toHaveTextContent('정산 내역이 없습니다');
  });
});
