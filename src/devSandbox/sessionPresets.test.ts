import { describe, expect, it } from 'vitest';

import { resolveAllowedSessionPreset } from './sessionPresets';

describe('resolveAllowedSessionPreset', () => {
  it('returns only system_admin for ev-dashboard.com', () => {
    expect(resolveAllowedSessionPreset('ev-dashboard.com')).toEqual(['system_admin']);
  });

  it('returns only cheonha_manager for cheonha.ev-dashboard.com', () => {
    expect(resolveAllowedSessionPreset('cheonha.ev-dashboard.com')).toEqual(['cheonha_manager']);
  });

  it('returns no presets for unknown subdomains', () => {
    expect(resolveAllowedSessionPreset('alpha.ev-dashboard.com')).toEqual([]);
  });
});
