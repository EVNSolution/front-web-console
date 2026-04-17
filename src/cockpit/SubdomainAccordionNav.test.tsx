import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { SubdomainAccordionNav } from './SubdomainAccordionNav';

function renderNav(initialEntry = '/') {
  render(
    <MemoryRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
      initialEntries={[initialEntry]}
    >
      <Routes>
        <Route path="*" element={<SubdomainAccordionNav companyName="천하운수" onLogout={vi.fn()} />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('SubdomainAccordionNav', () => {
  it('renders the company brand block', () => {
    renderNav();

    expect(screen.getByText('천하운수')).toBeInTheDocument();
    expect(screen.getByText('전용 업무 cockpit')).toBeInTheDocument();
  });

  it('shows only 대시보드 and 정산 as top-level items', () => {
    renderNav();

    expect(screen.getByRole('link', { name: '대시보드' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: '정산' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '배차 데이터' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '배송원 관리' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '운영 현황' })).not.toBeInTheDocument();
  });

  it('reveals internal items when 정산 is expanded', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole('button', { name: '정산' }));

    expect(screen.getByRole('link', { name: '배차 데이터' })).toHaveAttribute('href', '/settlement/dispatch-data');
    expect(screen.getByRole('link', { name: '배송원 관리' })).toHaveAttribute('href', '/settlement/driver-management');
    expect(screen.getByRole('link', { name: '운영 현황' })).toHaveAttribute('href', '/settlement/operations-status');
    expect(screen.getByRole('link', { name: '정산 처리' })).toHaveAttribute('href', '/settlement/settlement-processing');
    expect(screen.getByRole('link', { name: '팀 관리' })).toHaveAttribute('href', '/settlement/team-management');
  });

  it('marks the active child item for the current route', () => {
    renderNav('/settlement/driver-management');

    expect(screen.getByRole('button', { name: '정산' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: '배송원 관리' })).toHaveClass('is-active');
    expect(screen.getByRole('link', { name: '배차 데이터' })).not.toHaveClass('is-active');
  });
});
