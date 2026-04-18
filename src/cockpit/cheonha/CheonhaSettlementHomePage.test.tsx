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
    expect(screen.getByRole('heading', { level: 2, name: '업무 프로세스' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '이번 달' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('link', { name: '배차 업로드' })).toHaveAttribute('href', '/settlement/dispatch');
    expect(screen.getByRole('link', { name: '정산 처리' })).toHaveAttribute('href', '/settlement/process');
    expect(screen.getByText('특근 설정')).toBeInTheDocument();
    expect(screen.getByText('단가 확인')).toBeInTheDocument();
    expect(screen.getByText('수신합계')).toBeInTheDocument();
    expect(screen.getByText('지급합계')).toBeInTheDocument();
    expect(screen.getByText('조정비용')).toBeInTheDocument();
    expect(screen.getByText('수익')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '최근 정산' })).toBeInTheDocument();
    expect(screen.getByText('정산 내역이 없습니다')).toBeInTheDocument();
  });
});
