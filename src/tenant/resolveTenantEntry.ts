export type TenantEntry = {
  type: 'company';
  tenantCode: string;
  host: string;
};

const RESERVED_SUBDOMAINS = new Set(['www', 'api', 'admin']);

export function resolveTenantEntry(hostname: string | undefined): TenantEntry | null {
  const normalizedHost = hostname?.trim().toLowerCase() ?? '';
  if (!normalizedHost || normalizedHost === 'localhost' || normalizedHost === '127.0.0.1') {
    return null;
  }

  const hostParts = normalizedHost.split('.');
  if (hostParts.length !== 3 || hostParts.some((part) => part.length === 0)) {
    return null;
  }

  const apexDomain = hostParts.slice(-2).join('.');
  if (apexDomain !== 'ev-dashboard.com') {
    return null;
  }

  const subdomain = hostParts[0];
  if (!subdomain || RESERVED_SUBDOMAINS.has(subdomain)) {
    return null;
  }

  return {
    type: 'company',
    tenantCode: subdomain,
    host: normalizedHost,
  };
}
