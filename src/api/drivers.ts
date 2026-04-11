import type { DriverProfile, EnsureDriversByExternalUserNamesResult } from '../types';
import type { HttpClient } from './http';

export type DriverPayload = Omit<DriverProfile, 'driver_id' | 'route_no'>;

export function listDrivers(
  client: HttpClient,
  filters?: Partial<Pick<DriverProfile, 'company_id' | 'fleet_id' | 'external_user_name'>>,
) {
  const query = new URLSearchParams();
  if (filters?.company_id) {
    query.set('company_id', filters.company_id);
  }
  if (filters?.fleet_id) {
    query.set('fleet_id', filters.fleet_id);
  }
  if (filters?.external_user_name) {
    query.set('external_user_name', filters.external_user_name);
  }
  const queryString = query.toString();
  const path = queryString ? `/drivers/?${queryString}` : '/drivers/';
  return client.request<DriverProfile[]>(path);
}

export function getDriver(client: HttpClient, driverRef: string) {
  return client.request<DriverProfile>(`/drivers/${driverRef}/`);
}

export function createDriver(client: HttpClient, payload: DriverPayload) {
  return client.request<DriverProfile>('/drivers/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateDriver(client: HttpClient, driverRef: string, payload: Partial<DriverPayload>) {
  return client.request<DriverProfile>(`/drivers/${driverRef}/`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteDriver(client: HttpClient, driverRef: string) {
  return client.request<void>(`/drivers/${driverRef}/`, {
    method: 'DELETE',
  });
}

export function ensureDriversByExternalUserNames(
  client: HttpClient,
  payload: Pick<DriverProfile, 'company_id' | 'fleet_id'> & {
    external_user_names: string[];
  },
) {
  return client.request<EnsureDriversByExternalUserNamesResult>('/drivers/ensure-external-users/', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
