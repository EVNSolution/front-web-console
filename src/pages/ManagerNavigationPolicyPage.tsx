import { useEffect, useMemo, useState } from 'react';

import type { HttpClient } from '../api/http';
import { getErrorMessage } from '../api/http';
import {
  getManagedNavigationPolicies,
  updateManagedNavigationPolicies,
  type ManagedNavigationPolicy,
} from '../api/navigationPolicy';
import { navigationGroups } from '../navigation';
import { formatRoleLabel } from '../uiLabels';

const ROLE_ORDER = ['company_super_admin', 'vehicle_manager', 'settlement_manager', 'fleet_manager'] as const;

const ROLE_DESCRIPTIONS: Record<string, string> = {
  company_super_admin: '전역 기본 정책을 소유하고 모든 관리자 역할의 기준 메뉴를 정의합니다.',
  vehicle_manager: '차량 등록, 상세, 차량 배정과 차량 운영 흐름을 담당합니다.',
  settlement_manager: '정산 개요, 정산 정책, 급여 흐름 관련 메뉴를 담당합니다.',
  fleet_manager: '회사, 배송원, 배차 등 현장 운영 진입점을 담당합니다.',
};

const EDITABLE_GROUPS = [
  {
    key: 'core',
    label: '기본',
    items: [
      { key: 'dashboard', label: '대시보드', description: '운영 현황과 핵심 지표를 확인하는 시작 화면입니다.' },
      { key: 'account', label: '내 계정', description: '현재 로그인한 관리자 계정 정보와 접근 상태를 확인합니다.' },
    ],
  },
  {
    key: 'operations',
    label: '운영',
    items: [
      { key: 'accounts', label: '계정 요청', description: '회원가입 요청 승인과 관리자 계정 운영을 처리합니다.' },
      { key: 'announcements', label: '공지', description: '공지 등록과 노출 상태를 관리합니다.' },
      { key: 'support', label: '지원', description: '지원 요청과 대응 상태를 관리합니다.' },
      { key: 'notifications', label: '알림', description: '사용자 알림과 시스템 알림 노출을 관리합니다.' },
    ],
  },
  {
    key: 'organization_dispatch',
    label: '조직/배차',
    items: [
      { key: 'companies', label: '회사', description: '회사 상세, 플릿, 계정 연결 등 조직 운영의 중심 메뉴입니다.' },
      { key: 'regions', label: '권역', description: '권역 기준 정보와 운영 범위를 관리합니다.' },
      { key: 'dispatch', label: '배차', description: '배차 보드와 계획 수립 흐름을 관리합니다.' },
    ],
  },
  {
    key: 'field',
    label: '현장',
    items: [
      { key: 'drivers', label: '배송원', description: '배송원 등록, 상세, 현장 운영 상태를 관리합니다.' },
      { key: 'personnel_documents', label: '인사문서', description: '현장 인사문서와 첨부 자료를 관리합니다.' },
      { key: 'vehicles', label: '차량', description: '차량 등록, 상세, 운영자 연결을 관리합니다.' },
      { key: 'vehicle_assignments', label: '차량 배정', description: '배송원과 차량의 배정 관계를 관리합니다.' },
      { key: 'settlements', label: '정산', description: '정산 개요, 정책, 급여 관련 메뉴 진입점입니다.' },
    ],
  },
] as const;

const EDITABLE_NAV_KEYS = EDITABLE_GROUPS.flatMap((group) => group.items.map((item) => item.key));
const EDITABLE_NAV_KEY_SET = new Set<string>(EDITABLE_NAV_KEYS);

function normalizeAllowedNavKeys(keys: string[]) {
  const source = new Set(keys.filter((key) => EDITABLE_NAV_KEY_SET.has(key)));
  return EDITABLE_NAV_KEYS.filter((key) => source.has(key));
}

function buildPolicies(policies: ManagedNavigationPolicy[]) {
  return ROLE_ORDER.map((roleType) => {
    const found = policies.find((policy) => policy.role_type === roleType);
    return {
      role_type: roleType,
      allowed_nav_keys: normalizeAllowedNavKeys(found?.allowed_nav_keys ?? []),
      source: found?.source,
    };
  });
}

function areSameKeys(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false;
  }
  return left.every((value, index) => value === right[index]);
}

function formatPolicySource(source?: string) {
  switch (source) {
    case 'global':
      return '전역 정책';
    case 'default':
      return '기본 정책';
    case 'stored':
      return '저장된 정책';
    default:
      return source ?? '전역 정책';
  }
}

type Props = {
  client: HttpClient;
};

export function ManagerNavigationPolicyPage({ client }: Props) {
  const [savedPolicies, setSavedPolicies] = useState<ManagedNavigationPolicy[]>([]);
  const [draftPolicies, setDraftPolicies] = useState<ManagedNavigationPolicy[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('company_super_admin');
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
        const normalized = buildPolicies(response.policies);
        setSavedPolicies(normalized);
        setDraftPolicies(normalized);
      })
      .catch((error) => {
        if (!ignore) {
          setErrorMessage(getErrorMessage(error, '관리자 권한 정책을 불러올 수 없습니다.'));
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
  }, [client]);

  const selectedSavedPolicy = useMemo(
    () =>
      savedPolicies.find((policy) => policy.role_type === selectedRole) ?? {
        role_type: selectedRole,
        allowed_nav_keys: [],
        source: 'global',
      },
    [savedPolicies, selectedRole],
  );

  const selectedDraftPolicy = useMemo(
    () =>
      draftPolicies.find((policy) => policy.role_type === selectedRole) ?? {
        role_type: selectedRole,
        allowed_nav_keys: [],
        source: selectedSavedPolicy.source,
      },
    [draftPolicies, selectedRole, selectedSavedPolicy.source],
  );

  const previewGroups = useMemo(
    () =>
      navigationGroups
        .map((group) => ({
          ...group,
          items: group.items.filter(
            (item) => EDITABLE_NAV_KEY_SET.has(item.key) && selectedDraftPolicy.allowed_nav_keys.includes(item.key),
          ),
        }))
        .filter((group) => group.items.length > 0),
    [selectedDraftPolicy.allowed_nav_keys],
  );

  function isRoleDirty(roleType: string) {
    const saved = savedPolicies.find((policy) => policy.role_type === roleType)?.allowed_nav_keys ?? [];
    const draft = draftPolicies.find((policy) => policy.role_type === roleType)?.allowed_nav_keys ?? [];
    return !areSameKeys(saved, draft);
  }

  function updateDraftForSelectedRole(nextKeys: string[]) {
    const normalized = normalizeAllowedNavKeys(nextKeys);
    setDraftPolicies((current) =>
      current.map((policy) =>
        policy.role_type === selectedRole
          ? {
              ...policy,
              allowed_nav_keys: normalized,
            }
          : policy,
      ),
    );
  }

  function toggleNavKey(navKey: string) {
    const nextKeys = selectedDraftPolicy.allowed_nav_keys.includes(navKey)
      ? selectedDraftPolicy.allowed_nav_keys.filter((key) => key !== navKey)
      : [...selectedDraftPolicy.allowed_nav_keys, navKey];
    updateDraftForSelectedRole(nextKeys);
  }

  async function handleSave() {
    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const response = await updateManagedNavigationPolicies(client, {
        policies: draftPolicies.map((policy) => ({
          role_type: policy.role_type,
          allowed_nav_keys: policy.allowed_nav_keys,
        })),
      });
      const normalized = buildPolicies(response.policies);
      setSavedPolicies(normalized);
      setDraftPolicies(normalized);
      setStatusMessage(`${formatRoleLabel(selectedRole)} 정책을 저장했습니다.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '관리자 권한 정책을 저장할 수 없습니다.'));
    } finally {
      setIsSaving(false);
    }
  }

  function handleResetSelectedRole() {
    updateDraftForSelectedRole(selectedSavedPolicy.allowed_nav_keys);
    setErrorMessage(null);
    setStatusMessage(`${formatRoleLabel(selectedRole)} 정책을 저장된 상태로 되돌렸습니다.`);
  }

  return (
    <div className="stack page-shell policy-workbench">
      <section className="panel">
        <p className="panel-kicker">시스템 관리자</p>
        <h1>전역 관리자 메뉴 정책</h1>
        <p className="hero-copy">
          관리자 유형별로 기본 사이드바 메뉴를 정의합니다. 회사별 정책이 있으면 그 값이 우선 적용됩니다.
        </p>
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
      </section>

      <section className="panel policy-layout">
        <aside className="policy-role-rail">
          <div className="policy-column-header">
            <h2>관리자 유형</h2>
            <p>한 번에 한 역할만 편집합니다.</p>
          </div>
          <div className="policy-role-list">
            {ROLE_ORDER.map((roleType) => {
              const draftPolicy = draftPolicies.find((policy) => policy.role_type === roleType);
              const dirty = isRoleDirty(roleType);
              const isActive = selectedRole === roleType;
              return (
                <button
                  className={`policy-role-card${isActive ? ' is-active' : ''}`}
                  disabled={isLoading || isSaving}
                  key={roleType}
                  onClick={() => setSelectedRole(roleType)}
                  type="button"
                >
                  <div className="policy-role-card-header">
                    <strong>{formatRoleLabel(roleType)}</strong>
                    {dirty ? <span className="policy-badge warning">변경됨</span> : null}
                  </div>
                  <p>{ROLE_DESCRIPTIONS[roleType] ?? '관리자 역할 설명이 아직 정의되지 않았습니다.'}</p>
                  <div className="policy-role-card-meta">
                    <span>허용 메뉴 {draftPolicy?.allowed_nav_keys.length ?? 0}개</span>
                    <span>{formatPolicySource(savedPolicies.find((policy) => policy.role_type === roleType)?.source)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="policy-editor">
          <div className="policy-column-header">
            <h2>{formatRoleLabel(selectedRole)} 정책 편집</h2>
            <p>메뉴 설명을 보고 현재 역할에 필요한 항목만 남깁니다.</p>
          </div>
          <div className="policy-toolbar">
            <div className="policy-summary-chips">
              <span className="policy-badge neutral">저장된 메뉴 {selectedSavedPolicy.allowed_nav_keys.length}개</span>
              <span className="policy-badge success">현재 허용 {selectedDraftPolicy.allowed_nav_keys.length}개</span>
              {isRoleDirty(selectedRole) ? <span className="policy-badge warning">저장 전 변경 있음</span> : null}
            </div>
            <div className="inline-actions">
              <button
                className="button ghost"
                disabled={isLoading || isSaving || !isRoleDirty(selectedRole)}
                onClick={handleResetSelectedRole}
                type="button"
              >
                저장된 정책으로 되돌리기
              </button>
              <button
                className="button primary"
                disabled={isLoading || isSaving || !isRoleDirty(selectedRole)}
                onClick={() => void handleSave()}
                type="button"
              >
                {isSaving ? '저장 중...' : '현재 역할 저장'}
              </button>
            </div>
          </div>

          <div className="policy-group-stack">
            {EDITABLE_GROUPS.map((group) => (
              <section className="policy-group-panel" key={group.key}>
                <div className="policy-group-header">
                  <h3>{group.label}</h3>
                  <span>{group.items.length}개 메뉴</span>
                </div>
                <div className="policy-item-grid">
                  {group.items.map((item) => {
                    const checked = selectedDraftPolicy.allowed_nav_keys.includes(item.key);
                    const persisted = selectedSavedPolicy.allowed_nav_keys.includes(item.key);
                    const changed = checked !== persisted;
                    return (
                      <label className={`policy-item-card${checked ? ' is-enabled' : ''}`} key={item.key}>
                        <div className="policy-item-main">
                          <div className="policy-item-header">
                            <div>
                              <strong>{item.label}</strong>
                              <code>{item.key}</code>
                            </div>
                            <div className="policy-item-badges">
                              <span className={`policy-badge ${checked ? 'success' : 'neutral'}`}>
                                {checked ? '허용' : '숨김'}
                              </span>
                              {changed ? <span className="policy-badge warning">변경 예정</span> : null}
                            </div>
                          </div>
                          <p>{item.description}</p>
                        </div>
                        <input
                          aria-label={item.label}
                          checked={checked}
                          disabled={isLoading || isSaving}
                          onChange={() => toggleNavKey(item.key)}
                          type="checkbox"
                        />
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>

        <aside className="policy-preview-panel" data-testid="navigation-policy-preview">
          <div className="policy-column-header">
            <h2>사이드바 미리보기</h2>
            <p>현재 선택 역할에 대해 실제로 보이게 될 메뉴 구조입니다.</p>
          </div>
          <div className="policy-preview-shell">
            {previewGroups.length ? (
              previewGroups.map((group) => (
                <section className="policy-preview-group" key={group.key}>
                  <strong>{group.label}</strong>
                  <div className="policy-preview-items">
                    {group.items.map((item) => (
                      <span className="policy-preview-item" key={item.key}>
                        {item.label}
                      </span>
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <p className="empty-state">현재 역할에 허용된 메뉴가 없습니다.</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
