import { useEffect, useMemo, useState } from 'react';

import type { HttpClient } from '../api/http';
import { getErrorMessage } from '../api/http';
import {
  getManagedNavigationPolicies,
  updateManagedNavigationPolicies,
  type ManagedNavigationPolicy,
} from '../api/navigationPolicy';
import { accountItem, dashboardItem, navigationGroups } from '../navigation';
import { formatRoleLabel } from '../uiLabels';

const ROLE_ORDER = ['company_super_admin', 'vehicle_manager', 'settlement_manager', 'fleet_manager'] as const;

const ROLE_DESCRIPTIONS: Record<string, string> = {
  company_super_admin: '전역 기본 정책을 소유하고 모든 관리자 역할의 기준 메뉴를 정의합니다.',
  vehicle_manager: '차량 등록, 상세, 배정과 차량 운영 흐름을 담당합니다.',
  settlement_manager: '정산 개요, 정산 정책, 급여 흐름을 담당합니다.',
  fleet_manager: '회사, 배송원, 배차 등 현장 운영 진입점을 담당합니다.',
};

const NAV_ITEM_DESCRIPTIONS: Record<string, string> = {
  dashboard: '운영 현황과 핵심 지표를 확인하는 시작 화면입니다.',
  account: '현재 로그인한 관리자 계정 정보와 접근 상태를 확인합니다.',
  manager_navigation_policy: '시스템 관리자가 전역 관리자 메뉴 정책을 편집하는 고정 메뉴입니다.',
  company_navigation_policy: '회사 전체 관리자가 회사별 메뉴 정책을 조정하는 고정 메뉴입니다.',
  accounts: '회원가입 요청 승인과 관리자 계정 운영을 처리합니다.',
  announcements: '공지 등록과 노출 상태를 관리합니다.',
  support: '지원 요청과 대응 상태를 관리합니다.',
  notifications: '사용자 알림과 시스템 알림 노출을 관리합니다.',
  companies: '회사 상세, 플릿, 계정 연결 등 조직 운영의 중심 메뉴입니다.',
  regions: '권역 기준 정보와 운영 범위를 관리합니다.',
  dispatch: '배차 보드와 계획 수립 흐름을 관리합니다.',
  drivers: '배송원 등록, 상세, 현장 운영 상태를 관리합니다.',
  personnel_documents: '현장 인사문서와 첨부 자료를 관리합니다.',
  vehicles: '차량 등록, 상세, 운영자 연결을 관리합니다.',
  vehicle_assignments: '배송원과 차량의 배정 관계를 관리합니다.',
  settlements: '정산 개요, 정책, 급여 관련 메뉴 진입점입니다.',
};

const NON_EDITABLE_ITEM_REASONS: Record<string, string> = {
  manager_navigation_policy: '정책 화면 자체이므로 항상 시스템 관리자에게 고정됩니다.',
  company_navigation_policy: '회사별 override 화면이므로 전역 정책 편집 대상이 아닙니다.',
};

type SidebarWorkbenchItem = {
  key: string;
  label: string;
  description: string;
  editable: boolean;
  lockReason?: string;
};

type SidebarWorkbenchSection = {
  key: string;
  label: string;
  items: SidebarWorkbenchItem[];
};

const SIDEBAR_WORKBENCH_SECTIONS: SidebarWorkbenchSection[] = [
  {
    key: 'top-links',
    label: '상단 링크',
    items: [dashboardItem, accountItem].map((item) => ({
      key: item.key,
      label: item.label,
      description: NAV_ITEM_DESCRIPTIONS[item.key] ?? item.label,
      editable: true,
    })),
  },
  ...navigationGroups.map((group) => ({
    key: group.key,
    label: group.label,
    items: group.items.map((item) => ({
      key: item.key,
      label: item.label,
      description: NAV_ITEM_DESCRIPTIONS[item.key] ?? item.label,
      editable: !NON_EDITABLE_ITEM_REASONS[item.key],
      lockReason: NON_EDITABLE_ITEM_REASONS[item.key],
    })),
  })),
];

const EDITABLE_NAV_KEYS = SIDEBAR_WORKBENCH_SECTIONS.flatMap((section) =>
  section.items.filter((item) => item.editable).map((item) => item.key),
);
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
          좌측은 역할 선택, 중앙은 실제 사이드바 구조 기준 정책 편집, 우측은 같은 구조의 미리보기입니다.
        </p>
        {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
        {statusMessage ? <p className="form-success">{statusMessage}</p> : null}
      </section>

      <section className="panel policy-layout">
        <aside className="policy-role-rail policy-scroll-column">
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

        <div className="policy-editor policy-scroll-column">
          <div className="policy-column-header">
            <h2>{formatRoleLabel(selectedRole)} 편집</h2>
            <p>실제 사이드바와 같은 순서와 이름으로 정책을 조정합니다.</p>
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
            {SIDEBAR_WORKBENCH_SECTIONS.map((section) => (
              <section className="policy-group-panel" key={section.key}>
                <div className="policy-group-header">
                  <h3>{section.label}</h3>
                  <span>{section.items.length}개 항목</span>
                </div>
                <div className="policy-item-grid">
                  {section.items.map((item) => {
                    const checked = selectedDraftPolicy.allowed_nav_keys.includes(item.key);
                    const persisted = selectedSavedPolicy.allowed_nav_keys.includes(item.key);
                    const changed = item.editable ? checked !== persisted : false;
                    return (
                      <label className={`policy-item-card${checked ? ' is-enabled' : ''}`} key={item.key}>
                        <div className="policy-item-main">
                          <div className="policy-item-header">
                            <div>
                              <strong>{item.label}</strong>
                              <code>{item.key}</code>
                            </div>
                            <div className="policy-item-badges">
                              {item.editable ? (
                                <>
                                  <span className={`policy-badge ${checked ? 'success' : 'neutral'}`}>
                                    {checked ? '허용' : '숨김'}
                                  </span>
                                  {changed ? <span className="policy-badge warning">변경 예정</span> : null}
                                </>
                              ) : (
                                <span className="policy-badge neutral">설정 불가</span>
                              )}
                            </div>
                          </div>
                          <p>{item.description}</p>
                          {!item.editable && item.lockReason ? (
                            <p className="policy-lock-reason">{item.lockReason}</p>
                          ) : null}
                        </div>
                        <input
                          aria-label={item.label}
                          checked={checked}
                          disabled={!item.editable || isLoading || isSaving}
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

        <aside className="policy-preview-panel policy-scroll-column" data-testid="navigation-policy-preview">
          <div className="policy-column-header">
            <h2>사이드바 미리보기</h2>
            <p>중앙 편집 영역과 같은 구조로 현재 역할의 결과를 보여줍니다.</p>
          </div>
          <div className="policy-preview-shell">
            {SIDEBAR_WORKBENCH_SECTIONS.map((section) => (
              <section className="policy-preview-group" key={section.key}>
                <strong>{section.label}</strong>
                <div className="policy-preview-items">
                  {section.items.map((item) => {
                    const checked = selectedDraftPolicy.allowed_nav_keys.includes(item.key);
                    return (
                      <div className={`policy-preview-item${checked ? ' is-visible' : ' is-hidden'}`} key={item.key}>
                        <span>{item.label}</span>
                        {item.editable ? (
                          <small>{checked ? '허용' : '숨김'}</small>
                        ) : (
                          <small>설정 불가</small>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
