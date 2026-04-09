import type { CompanyManagerRole } from '../types';
import type { HttpClient } from './http';

type CompanyManagerRoleListResponse = {
  roles: CompanyManagerRole[];
};

export function listCompanyManagerRoles(client: HttpClient, companyId: string) {
  return client.request<CompanyManagerRoleListResponse>(
    `/auth/company-manager-roles/?company_id=${encodeURIComponent(companyId)}`,
  );
}

export function createCompanyManagerRole(
  client: HttpClient,
  payload: { companyId: string; displayName: string },
) {
  return client.request<CompanyManagerRole>('/auth/company-manager-roles/', {
    method: 'POST',
    body: JSON.stringify({
      company_id: payload.companyId,
      display_name: payload.displayName,
    }),
  });
}

export function updateCompanyManagerRole(
  client: HttpClient,
  roleId: string,
  payload: { displayName?: string; allowedNavKeys?: string[] },
) {
  const body: Record<string, unknown> = {};
  if (payload.displayName !== undefined) {
    body.display_name = payload.displayName;
  }
  if (payload.allowedNavKeys !== undefined) {
    body.allowed_nav_keys = payload.allowedNavKeys;
  }
  return client.request<CompanyManagerRole>(`/auth/company-manager-roles/${roleId}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function deleteCompanyManagerRole(client: HttpClient, roleId: string) {
  return client.request<void>(`/auth/company-manager-roles/${roleId}/`, {
    method: 'DELETE',
  });
}
