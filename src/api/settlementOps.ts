import type { DriverLatestSettlement, SettlementItem, SettlementRun } from '../types';
import type { HttpClient } from './http';
import type { SettlementScopeFilters } from './settlements';

export function listSettlementReadRuns(client: HttpClient, filters?: SettlementScopeFilters) {
  const query = new URLSearchParams();
  if (filters?.company_id) {
    query.set('company_id', filters.company_id);
  }
  if (filters?.fleet_id) {
    query.set('fleet_id', filters.fleet_id);
  }

  const queryString = query.toString();
  const path = queryString ? `/settlement-ops/runs/?${queryString}` : '/settlement-ops/runs/';

  return client.request<SettlementRun[]>(path);
}

export function listSettlementReadItems(client: HttpClient, filters?: SettlementScopeFilters) {
  const query = new URLSearchParams();
  if (filters?.company_id) {
    query.set('company_id', filters.company_id);
  }
  if (filters?.fleet_id) {
    query.set('fleet_id', filters.fleet_id);
  }

  const queryString = query.toString();
  const path = queryString ? `/settlement-ops/items/?${queryString}` : '/settlement-ops/items/';

  return client.request<SettlementItem[]>(path);
}

export function getDriverLatestSettlement(client: HttpClient, driverId: string) {
  return client.request<DriverLatestSettlement>(`/settlement-ops/drivers/${driverId}/latest-settlement/`);
}
