import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TopNotificationBar, type TopNotification } from './TopNotificationBar';

describe('TopNotificationBar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('renders success notifications as a green status bar and auto dismisses after 3 seconds', () => {
    const notice: TopNotification = {
      id: 1,
      message: '정산 기준이 저장되었습니다.',
      tone: 'success',
    };
    const onDismiss = vi.fn();

    render(<TopNotificationBar notice={notice} onDismiss={onDismiss} />);

    const bar = screen.getByRole('status');
    expect(bar).toHaveAttribute('data-tone', 'success');
    expect(bar).toHaveClass('top-notice');
    expect(bar).toHaveClass('is-entered');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByRole('status')).toHaveClass('is-exiting');
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(240);
    });

    expect(onDismiss).toHaveBeenCalledWith(notice.id);
  });

  it('renders error notifications as a red alert bar', () => {
    const notice: TopNotification = {
      id: 2,
      message: '권한 정책이 변경되어 이동했습니다.',
      tone: 'error',
    };

    render(<TopNotificationBar notice={notice} onDismiss={vi.fn()} />);

    const bar = screen.getByRole('alert');
    expect(bar).toHaveAttribute('data-tone', 'error');
    expect(bar).toHaveTextContent(notice.message);
  });
});
