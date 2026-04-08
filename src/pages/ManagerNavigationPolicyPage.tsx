import { useEffect, useMemo, useState } from 'react';

import type { HttpClient } from '../api/http';
import { getErrorMessage } from '../api/http';
import {
  getManagedNavigationPolicies,
  updateManagedNavigationPolicies,
  type ManagedNavigationPolicy,
} from '../api/navigationPolicy';
import { allNavItemKeys } from '../authScopes';
import { formatRoleLabel } from '../uiLabels';

const NAV_GROUPS: { label: string; items: { key: string; label: string }[] }[] = [
  {
    label: '기본',
    items: [
      { key: 'dashboard', label: '대시보드' },
      { key: 'account', label: '내 계정' },
      { key: 'manager_navigation_policy', label: '관리자 권한 정책' },
    ],
  },
  {
    label: '운영',
    items: [
      { key: 'accounts', label: '계정 요청' },
      { key: 'announcements', label: '공지' },
      { key: 'support', label: '지원' },
      { key: 'notifications', label: '알림' },
    ],
  },
  {
    label: '조직/배차',
    items: [
      { key: 'companies', label: '회사' },
      { key: 'regions', label: '권역' },
      { key: 'dispatch', label: '배차' },
    ],
  },
  {
    label: '현장',
    items: [
      { key: 'drivers', label: '배송원' },
      { key: 'personnel_documents', label: '인사문서' },
      { key: 'vehicles', label: '차량' },
      { key: 'vehicle_assignments', label: '차량 배정' },
      { key: 'settlements', label: '정산' },
    ],
  },
];

type Props = {
  client: HttpClient;
};

export function ManagerNavigationPolicyPage({ client }: Props) {
  const [policies, setPolicies] = useState<ManagedNavigationPolicy[]>([]);
  const [selectedRole, setSelectedRole] = useState('company_super_admin');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    void getManagedNavigationPolicies(client)
      .then((response) => {
        if (ignore) {
          return;
        }
        setPolicies(response.policies);
        if (!response.policies.some((policy) => policy.role_type === selectedRole) && response.policies[0]) {
          setSelectedRole(response.policies[0].role_type);
        }
      })
      .catch((error) => {
        if (ignore) {
          return;
        }
        setErrorMessage(getErrorMessage(error, '관리자 권한 정책을 불러올 수 없습니다.'));
      })
      .finally(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [client, selectedRole]);

  const selectedPolicy = useMemo(
    () =>
      policies.find((policy) => policy.role_type === selectedRole) ?? {
        role_type: selectedRole,
        allowed_nav_keys: [],
      },
    [policies, selectedRole],
  );

  function toggleNavKey(navKey: string) {
    setPolicies((current) =>
      current.map((policy) => {
        if (policy.role_type !== selectedRole) {
          return policy;
        }

        const nextKeys = policy.allowed_nav_keys.includes(navKey)
          ? policy.allowed_nav_keys.filter((key) => key !== navKey)
          : Array.from(new Set([...policy.allowed_nav_keys, navKey]));

        return {
          ...policy,
          allowed_nav_keys: allNavItemKeys.filter((key) => nextKeys.includes(key)),
        };
      }),
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const response = await updateManagedNavigationPolicies(client, {
        policies: policies.map((policy) => ({
          role_type: policy.role_type,
          allowed_nav_keys: policy.allowed_nav_keys,
        })),
      });
      setPolicies(response.policies);
      setStatusMessage('관리자 권한 정책을 저장했습니다.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '관리자 권한 정책을 저장할 수 없습니다.'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="stack page-shell">
      <section className="panel">
        <p className="panel-kicker">시스템 관리자</p>
        <h1>관리자 권한 정책</h1>
        <p className="hero-copy">관리자 유형별로 사이드바 메뉴 노출 정책을 관리합니다. 이 설정은 현재 글로벌 기본 정책에 적용됩니다.</p>
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
      </section>

      <section className="panel stack gap-md">
        <label className="field">
          <span>관리자 유형</span>
          <select
            disabled={isLoading || isSaving}
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
          >
            {policies.map((policy) => (
              <option key={policy.role_type} value={policy.role_type}>
                {formatRoleLabel(policy.role_type)}
              </option>
            ))}
          </select>
        </label>

        {NAV_GROUPS.map((group) => (
          <section className="stack gap-sm" key={group.label}>
            <h2>{group.label}</h2>
            <div className="stack gap-xs">
              {group.items.map((item) => {
                const checked = selectedPolicy.allowed_nav_keys.includes(item.key);
                return (
                  <label key={item.key} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input
                      checked={checked}
                      disabled={isLoading || isSaving}
                      onChange={() => toggleNavKey(item.key)}
                      type="checkbox"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        <div className="inline-actions">
          <button className="button primary" disabled={isLoading || isSaving} onClick={() => void handleSave()} type="button">
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      </section>
    </div>
  );
}
