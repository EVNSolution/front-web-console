import type { HttpClient } from './http';

export type CurrentNavigationPolicy = {
  allowed_nav_keys: string[];
  source: string;
};

export type ManagedNavigationPolicy = {
  role_type: string;
  allowed_nav_keys: string[];
  source?: string;
};

export type ManagedNavigationPolicyList = {
  policies: ManagedNavigationPolicy[];
};

export function getNavigationPolicy(client: HttpClient) {
  return client.request<CurrentNavigationPolicy>('/auth/identity-navigation-policy/');
}

export function getManagedNavigationPolicies(client: HttpClient) {
  return client.request<ManagedNavigationPolicyList>('/auth/manager-navigation-policy/manage/');
}

export function updateManagedNavigationPolicies(client: HttpClient, payload: ManagedNavigationPolicyList) {
  return client.request<ManagedNavigationPolicyList>('/auth/manager-navigation-policy/manage/', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}
