import { useEffect, useMemo, useState } from 'react';

import type { HttpClient, SessionPayload } from '../api/http';
import { getErrorMessage } from '../api/http';
import {
  getCompanyNavigationPolicies,
  resetCompanyNavigationPolicy,
  updateCompanyNavigationPolicies,
  type ManagedNavigationPolicy,
} from '../api/navigationPolicy';
import { allNavItemKeys, getManageableManagerRoleOptions } from '../authScopes';
import { formatProtectedIdentifier, formatRoleLabel } from '../uiLabels';

const NAV_GROUPS: { label: string; items: { key: string; label: string }[] }[] = [
  {
    label: '기본',
    items: [
      { key: 'dashboard', label: '대시보드' },
      { key: 'account', label: '내 계정' },
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

function formatSourceLabel(source: string | undefined) {
  switch (source) {
    case 'company_override':
      return '회사 override';
    case 'global':
      return '전역 기본값';
    case 'default':
      return '내장 기본값';
    default:
      return source ?? '-';
  }
}

type Props = {
  client: HttpClient;
  session: SessionPayload;
};

export function CompanyNavigationPolicyPage({ client, session }: Props) {
  const roleOptions = getManageableManagerRoleOptions(session).filter((role) => role !== 'company_super_admin');
  const [policies, setPolicies] = useState<ManagedNavigationPolicy[]>([]);
  const [selectedRole, setSelectedRole] = useState(roleOptions[0] ?? 'vehicle_manager');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setErrorMessage(null);
    setStatusMessage(null);
    void getCompanyNavigationPolicies(client)
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
        if (!ignore) {
          setErrorMessage(getErrorMessage(error, '회사 메뉴 정책을 불러올 수 없습니다.'));
        }
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
        source: 'default',
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
          allowed_nav_keys: allNavItemKeys.filter(
            (key) => key !== 'manager_navigation_policy' && key !== 'company_navigation_policy' && nextKeys.includes(key),
          ),
        };
      }),
    );
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const response = await updateCompanyNavigationPolicies(client, {
        policies: policies.map((policy) => ({
          role_type: policy.role_type,
          allowed_nav_keys: policy.allowed_nav_keys,
        })),
      });
      setPolicies(response.policies);
      setStatusMessage('회사 메뉴 정책을 저장했습니다.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '회사 메뉴 정책을 저장할 수 없습니다.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReset() {
    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const response = await resetCompanyNavigationPolicy(client, {
        role_type: selectedRole,
      });
      setPolicies(response.policies);
      setStatusMessage('선택한 역할 정책을 전역 기본값으로 되돌렸습니다.');
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '회사 메뉴 정책을 초기화할 수 없습니다.'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="stack page-shell">
      <section className="panel">
        <p className="panel-kicker">회사 전체 관리자</p>
        <h1>회사 메뉴 정책</h1>
        <p className="hero-copy">
          현재 회사에서만 적용되는 관리자 메뉴 정책을 조정합니다. 전역 기본값은 유지되고, 여기서 저장한 내용만 회사 override로 우선 적용됩니다.
        </p>
        <p className="hero-copy">회사 식별값: {formatProtectedIdentifier(session.activeAccount?.companyId)}</p>
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
      </section>

      <section className="panel stack gap-md">
        <label className="field">
          <span>관리자 유형</span>
          <select disabled={isLoading || isSaving} value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)}>
            {roleOptions.map((role) => (
              <option key={role} value={role}>
                {formatRoleLabel(role)}
              </option>
            ))}
          </select>
        </label>

        <p className="helper-text">현재 정책 원본: {formatSourceLabel(selectedPolicy.source)}</p>

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
          <button className="button ghost" disabled={isLoading || isSaving} onClick={() => void handleReset()} type="button">
            전역 기본값으로 되돌리기
          </button>
        </div>
      </section>
    </div>
  );
}
