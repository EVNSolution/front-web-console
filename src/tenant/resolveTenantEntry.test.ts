import { describe, expect, it } from 'vitest';

import { resolveTenantEntry } from './resolveTenantEntry';

describe('resolveTenantEntry', () => {
  it('resolves company cockpit subdomains on the ev-dashboard apex domain', () => {
    expect(resolveTenantEntry('cheonha.ev-dashboard.com')).toEqual({
      type: 'company',
      tenantCode: 'cheonha',
      host: 'cheonha.ev-dashboard.com',
    });
  });

  it('treats the apex domain and local hosts as the generic hub', () => {
    expect(resolveTenantEntry('ev-dashboard.com')).toBeNull();
    expect(resolveTenantEntry('localhost')).toBeNull();
    expect(resolveTenantEntry('127.0.0.1')).toBeNull();
  });

  it('ignores reserved or foreign subdomains', () => {
    expect(resolveTenantEntry('admin.ev-dashboard.com')).toBeNull();
    expect(resolveTenantEntry('cheonha.example.com')).toBeNull();
  });

  it('rejects malformed cockpit hosts with empty labels', () => {
    expect(resolveTenantEntry('foo..ev-dashboard.com')).toBeNull();
  });

  it('rejects nested subdomains outside the canonical company host shape', () => {
    expect(resolveTenantEntry('ops.cheonha.ev-dashboard.com')).toBeNull();
  });
});
