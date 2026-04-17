import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { CheonhaSettlementHomePage } from './CheonhaSettlementHomePage';

describe('CheonhaSettlementHomePage', () => {
  it('keeps attendance embedded on home and links to the live workspace surfaces', () => {
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

    expect(screen.getByRole('heading', { level: 2, name: '홈' })).toBeInTheDocument();
    expect(screen.getByText('금월 배차표 기반 근태')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '배차 데이터 열기' })).toHaveAttribute('href', '/settlement/dispatch');
    expect(screen.getByRole('link', { name: '정산 처리 열기' })).toHaveAttribute('href', '/settlement/process');
    expect(screen.queryByRole('link', { name: /근태/ })).not.toBeInTheDocument();
  });
});
