import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { CheonhaSettlementWorkspace } from './CheonhaSettlementWorkspace';

vi.mock('./CheonhaSettlementHomePage', () => ({
  CheonhaSettlementHomePage: () => <section><h2>홈 화면</h2></section>,
}));

vi.mock('./CheonhaDispatchDataPage', () => ({
  CheonhaDispatchDataPage: () => <section><h2>배차 데이터 화면</h2></section>,
}));

vi.mock('./CheonhaSettlementProcessPage', () => ({
  CheonhaSettlementProcessPage: () => <section><h2>정산 처리 화면</h2></section>,
}));

vi.mock('./CheonhaRuleShellPanel', () => ({
  CheonhaRuleShellPanel: ({ title }: { title: string }) => <section><h2>{title}</h2></section>,
}));

function LocationProbe() {
  const location = useLocation();

  return <p data-testid="location">{location.pathname}</p>;
}

function renderWorkspace(initialEntry: string) {
  function WorkspaceHarness() {
    return (
      <>
        <CheonhaSettlementWorkspace />
        <LocationProbe />
      </>
    );
  }

  render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
      initialEntries={[initialEntry]}
    >
      <Routes>
        <Route path="/settlement/*" element={<WorkspaceHarness />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('CheonhaSettlementWorkspace', () => {
  it('redirects /settlement to /settlement/home and exposes the approved internal menu order', async () => {
    renderWorkspace('/settlement');

    expect(await screen.findByRole('heading', { name: '천하운수 정산' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: '홈 화면' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/settlement/home');

    const tabs = screen.getAllByRole('link');
    expect(tabs.map((tab) => [tab.textContent, tab.getAttribute('href')])).toEqual([
      ['홈', '/settlement/home'],
      ['배차 데이터', '/settlement/dispatch'],
      ['배송원 관리', '/settlement/crew'],
      ['운영 현황', '/settlement/operations'],
      ['정산 처리', '/settlement/process'],
      ['팀 관리', '/settlement/team'],
    ]);
  });

  it('marks the active route using the new process slug', async () => {
    renderWorkspace('/settlement/process');

    expect(await screen.findByRole('heading', { level: 2, name: '정산 처리 화면' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '정산 처리' })).toHaveClass('is-active');
    expect(screen.getByRole('link', { name: '배차 데이터' })).not.toHaveClass('is-active');
    expect(screen.queryByRole('link', { name: '근태' })).not.toBeInTheDocument();
  });
});
