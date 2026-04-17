import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CheonhaRuleShellPanel } from './CheonhaRuleShellPanel';

describe('CheonhaRuleShellPanel', () => {
  it('renders a disabled shell panel for unfinished rule surfaces', () => {
    render(
      <CheonhaRuleShellPanel
        description="배송원 운영 규칙과 연계 화면은 아직 cockpit shell만 제공합니다."
        title="배송원 관리"
      />,
    );

    expect(screen.getByRole('heading', { level: 2, name: '배송원 관리' })).toBeInTheDocument();
    expect(screen.getByText('준비 중')).toBeInTheDocument();
    expect(screen.getByText('배송원 운영 규칙과 연계 화면은 아직 cockpit shell만 제공합니다.')).toBeInTheDocument();
    expect(screen.getByText('실제 업무 흐름은 홈, 배차 데이터, 정산 처리에서 이어집니다.')).toBeInTheDocument();
  });
});
