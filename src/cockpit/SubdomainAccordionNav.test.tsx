import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
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

function RouteSwitcher() {
  const navigate = useNavigate();

  return (
    <button type="button" onClick={() => navigate('/other')}>
      route-switch
    </button>
  );
}

describe('SubdomainAccordionNav', () => {
  it('dashboard route renders the company card and top-level expansion trigger', () => {
    renderNav();

    expect(screen.getByText('천하운수')).toBeInTheDocument();
    expect(screen.getByText('전용 업무 cockpit')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '정산' })).toBeInTheDocument();
  });

  it('dashboard route starts collapsed with no top-level menu items visible', () => {
    renderNav();

    const nav = screen.getByRole('navigation', { name: '서브도메인 메뉴' });

    expect(within(nav).queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('button', { name: '정산' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('top-level expansion only reveals 대시보드 and 정산', async () => {
    const user = userEvent.setup();
    renderNav();

    await user.click(screen.getByRole('button', { name: '정산' }));

    const nav = screen.getByRole('navigation', { name: '서브도메인 메뉴' });

    expect(within(nav).getByRole('link', { name: '대시보드' })).toHaveAttribute('href', '/');
    expect(within(nav).getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('button', { name: '정산' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('top-level expanded state stays open after route changes until the user collapses it', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
        initialEntries={['/']}
      >
        <Routes>
          <Route path="*" element={<><RouteSwitcher /><SubdomainAccordionNav companyName="천하운수" onLogout={vi.fn()} /></>} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: '정산' }));
    const nav = screen.getByRole('navigation', { name: '서브도메인 메뉴' });
    expect(within(nav).getAllByRole('link')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'route-switch' }));
    expect(screen.getByRole('button', { name: '정산' })).toHaveAttribute('aria-expanded', 'true');
    expect(within(nav).getAllByRole('link')).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: '정산' }));
    expect(screen.getByRole('button', { name: '정산' })).toHaveAttribute('aria-expanded', 'false');
    expect(within(nav).queryAllByRole('link')).toHaveLength(0);
  });

});
