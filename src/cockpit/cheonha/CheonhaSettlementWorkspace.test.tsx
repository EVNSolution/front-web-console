import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { CheonhaSettlementWorkspace } from './CheonhaSettlementWorkspace';

function renderWorkspace(initialEntry: string) {
  render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
      initialEntries={[initialEntry]}
    >
      <Routes>
        <Route path="/settlement/*" element={<CheonhaSettlementWorkspace />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CheonhaSettlementWorkspace', () => {
  it('lands on dispatch-data by default and exposes the approved tab order', async () => {
    renderWorkspace('/settlement');

    expect(await screen.findByRole('heading', { name: '천하운수 정산' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: '배차 데이터' })).toBeInTheDocument();

    const tabs = screen.getAllByRole('link');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      '배차 데이터',
      '배송원 관리',
      '운영 현황',
      '정산 처리',
      '팀 관리',
    ]);
  });

  it('marks the active tab from the route', async () => {
    renderWorkspace('/settlement/team-management');

    expect(await screen.findByRole('heading', { level: 2, name: '팀 관리' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '팀 관리' })).toHaveClass('is-active');
    expect(screen.getByRole('link', { name: '배차 데이터' })).not.toHaveClass('is-active');
  });
});
