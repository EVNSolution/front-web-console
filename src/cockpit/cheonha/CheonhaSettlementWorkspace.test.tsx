import { render, screen, within } from '@testing-library/react';
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
  it('redirects /settlement to /settlement/home', async () => {
    renderWorkspace('/settlement');

    const frame = screen.getByTestId('settlement-workspace-frame');

    expect(await screen.findByRole('heading', { name: '천하운수 정산' })).toBeInTheDocument();
    expect(frame).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 2, name: '홈 화면' })).toBeInTheDocument();
    expect(within(frame).getByRole('heading', { level: 2, name: '홈 화면' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/settlement/home');
  });

  it.each([
    ['/settlement/home', '홈 화면'],
    ['/settlement/dispatch', '배차 데이터 화면'],
    ['/settlement/process', '정산 처리 화면'],
  ])('renders the route body for shared settlement child page %s', async (initialEntry, heading) => {
    renderWorkspace(initialEntry);

    const frame = screen.getByTestId('settlement-workspace-frame');
    const renderedHeading = await screen.findByRole('heading', { level: 2, name: heading });

    expect(renderedHeading).toBeInTheDocument();
    expect(frame).toBeInTheDocument();
    expect(within(frame).getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '천하운수 정산' })).toBeInTheDocument();
  });

  it.each([
    ['/settlement/crew', '배송원 관리'],
    ['/settlement/operations', '운영 현황'],
    ['/settlement/team', '팀 관리'],
  ])('keeps shell-only route %s inside the shared settlement workspace frame', async (initialEntry, heading) => {
    renderWorkspace(initialEntry);

    const frame = screen.getByTestId('settlement-workspace-frame');
    const renderedHeading = await screen.findByRole('heading', { level: 2, name: heading });

    expect(renderedHeading).toBeInTheDocument();
    expect(frame).toBeInTheDocument();
    expect(within(frame).getByRole('heading', { level: 2, name: heading })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '천하운수 정산' })).toBeInTheDocument();
  });

  it.each([
    '/settlement/dispatch-data',
    '/settlement/driver-management',
    '/settlement/operations-status',
    '/settlement/settlement-processing',
    '/settlement/team-management',
  ])('fails closed on removed legacy settlement child slug %s', async (legacyPath) => {
    renderWorkspace(legacyPath);

    const frame = screen.getByTestId('settlement-workspace-frame');
    expect(await screen.findByRole('heading', { level: 2, name: '홈 화면' })).toBeInTheDocument();
    expect(frame).toBeInTheDocument();
    expect(within(frame).getByRole('heading', { level: 2, name: '홈 화면' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '천하운수 정산' })).toBeInTheDocument();
    expect(screen.getByTestId('location')).toHaveTextContent('/settlement/home');
  });
});
