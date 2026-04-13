import { useEffect, useMemo, useRef, useState } from 'react';

import {
  createCompanyManagerRole,
  deleteCompanyManagerRole,
  listCompanyManagerRoles,
  updateCompanyManagerRole,
} from '../api/managerRoles';
import type { HttpClient, SessionPayload } from '../api/http';
import { getErrorMessage } from '../api/http';
import { PageLayout } from '../components/PageLayout';
import { listCompanies } from '../api/organization';
import type { Company, CompanyManagerRole } from '../types';

type EditableRole = CompanyManagerRole & {
  draftDisplayName: string;
  draftScopeLevel: CompanyManagerRole['scope_level'];
};

type DropdownOption = {
  value: string;
  label: string;
};

type DropdownProps = {
  ariaLabel: string;
  disabled?: boolean;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  onToggle: () => void;
  options: DropdownOption[];
  value: string;
};

function RoleDropdown({
  ariaLabel,
  disabled = false,
  isOpen,
  onClose,
  onSelect,
  onToggle,
  options,
  value,
}: DropdownProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onClose();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const selected = options.find((option) => option.value === value);

  return (
    <div className="policy-dropdown" ref={rootRef}>
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
        className="policy-dropdown-trigger"
        disabled={disabled}
        onClick={onToggle}
        type="button"
      >
        <span>{selected?.label ?? `${ariaLabel} 없음`}</span>
      </button>
      {isOpen && !disabled ? (
        <div aria-label={ariaLabel} className="policy-dropdown-menu" role="listbox">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                aria-label={option.label}
                aria-selected={isSelected}
                className={`policy-dropdown-option${isSelected ? ' is-selected' : ''}`}
                key={option.value}
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
                role="option"
                type="button"
              >
                <span>{option.label}</span>
                {isSelected ? <small>선택됨</small> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function toEditableRole(role: CompanyManagerRole): EditableRole {
  return {
    ...role,
    draftDisplayName: role.display_name,
    draftScopeLevel: role.scope_level,
  };
}

function getNextRoleLabel(roles: CompanyManagerRole[]) {
  const nextIndex =
    roles
      .filter((role) => role.code.startsWith('custom_role_'))
      .map((role) => Number(role.code.replace('custom_role_', '')))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0) + 1;
  return `새 관리자 역할 ${nextIndex}`;
}

type Props = {
  client: HttpClient;
  session: SessionPayload;
};

const ROLE_SCOPE_OPTIONS: Array<{ value: CompanyManagerRole['scope_level']; label: string }> = [
  { value: 'company', label: '회사 레벨' },
  { value: 'fleet', label: '플릿 레벨' },
];

function getRoleScopeLabel(scopeLevel: CompanyManagerRole['scope_level']) {
  return ROLE_SCOPE_OPTIONS.find((option) => option.value === scopeLevel)?.label ?? '회사 레벨';
}

export function ManagerRolesPage({ client, session }: Props) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [newRoleScopeLevel, setNewRoleScopeLevel] = useState<CompanyManagerRole['scope_level']>('company');
  const [roles, setRoles] = useState<EditableRole[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'company' | null>(null);

  useEffect(() => {
    let ignore = false;
    setIsLoading(true);
    setErrorMessage(null);

    void listCompanies(client)
      .then((companyList) => {
        if (ignore) {
          return;
        }

        const activeCompanyId = session.activeAccount?.companyId ?? null;
        const resolvedCompanies =
          companyList.length > 0
            ? companyList
            : activeCompanyId
              ? [{ company_id: activeCompanyId, name: '현재 회사' }]
              : [];

        setCompanies(resolvedCompanies);
        if (session.activeAccount?.accountType === 'manager' && activeCompanyId) {
          setSelectedCompanyId(activeCompanyId);
          return;
        }
        setSelectedCompanyId(resolvedCompanies[0]?.company_id ?? '');
      })
      .catch((error) => {
        if (!ignore) {
          setErrorMessage(getErrorMessage(error, '관리자 역할 목록을 불러올 수 없습니다.'));
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
  }, [client, session.activeAccount]);

  useEffect(() => {
    let ignore = false;
    if (!selectedCompanyId) {
      setRoles([]);
      return undefined;
    }

    setIsLoading(true);
    setErrorMessage(null);
    void listCompanyManagerRoles(client, selectedCompanyId)
      .then((response) => {
        if (!ignore) {
          setRoles(response.roles.map(toEditableRole));
        }
      })
      .catch((error) => {
        if (!ignore) {
          setErrorMessage(getErrorMessage(error, '관리자 역할 목록을 불러올 수 없습니다.'));
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
  }, [client, selectedCompanyId]);

  const companyOptions = useMemo(
    () => companies.map((company) => ({ value: company.company_id, label: company.name })),
    [companies],
  );

  const isCompanyFixed = session.activeAccount?.accountType === 'manager';

  function updateRoleDraft(roleId: string, draftDisplayName: string) {
    setRoles((current) =>
      current.map((role) =>
        role.company_manager_role_id === roleId ? { ...role, draftDisplayName } : role,
      ),
    );
  }

  function updateRoleScope(roleId: string, draftScopeLevel: CompanyManagerRole['scope_level']) {
    setRoles((current) =>
      current.map((role) =>
        role.company_manager_role_id === roleId ? { ...role, draftScopeLevel } : role,
      ),
    );
  }

  async function handleAddRole() {
    if (!selectedCompanyId) {
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);
    try {
      const created = await createCompanyManagerRole(client, {
        companyId: selectedCompanyId,
        displayName: getNextRoleLabel(roles),
        scopeLevel: newRoleScopeLevel,
      });
      setRoles((current) => [...current, toEditableRole(created)]);
      setStatusMessage(`${created.display_name} 역할을 추가했습니다.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '관리자 역할을 추가할 수 없습니다.'));
    } finally {
      setIsMutating(false);
    }
  }

  async function handleSaveRole(role: EditableRole) {
    const nextName = role.draftDisplayName.trim();
    const hasNameChange = nextName !== role.display_name;
    const hasScopeChange = role.draftScopeLevel !== role.scope_level;
    if (!nextName || (!hasNameChange && !hasScopeChange)) {
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);
    try {
      const updated = await updateCompanyManagerRole(client, role.company_manager_role_id, {
        ...(hasNameChange ? { displayName: nextName } : {}),
        ...(hasScopeChange ? { scopeLevel: role.draftScopeLevel } : {}),
      });
      setRoles((current) =>
        current.map((item) =>
          item.company_manager_role_id === role.company_manager_role_id
            ? toEditableRole(updated)
            : item,
        ),
      );
      setStatusMessage(`${updated.display_name} 역할 이름을 저장했습니다.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '관리자 역할 이름을 저장할 수 없습니다.'));
    } finally {
      setIsMutating(false);
    }
  }

  async function handleDeleteRole(role: EditableRole) {
    if (!role.can_delete) {
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);
    try {
      await deleteCompanyManagerRole(client, role.company_manager_role_id);
      setRoles((current) =>
        current.filter((item) => item.company_manager_role_id !== role.company_manager_role_id),
      );
      setStatusMessage(`${role.display_name} 역할을 삭제했습니다.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, '관리자 역할을 삭제할 수 없습니다.'));
    } finally {
      setIsMutating(false);
    }
  }

  return (
    <PageLayout
      actions={
        <button
          className="button primary"
          disabled={!selectedCompanyId || isLoading || isMutating}
          onClick={() => void handleAddRole()}
          type="button"
        >
          역할 추가
        </button>
      }
      contentClassName="stack role-catalog-content"
      filters={
        <>
          <label className="field policy-role-field">
            <span>회사</span>
            <RoleDropdown
              ariaLabel="회사"
              disabled={isCompanyFixed || companyOptions.length === 0}
              isOpen={openDropdown === 'company'}
              onClose={() => setOpenDropdown(null)}
              onSelect={(value) => {
                setSelectedCompanyId(value);
                setStatusMessage(null);
              }}
              onToggle={() => setOpenDropdown((current) => (current === 'company' ? null : 'company'))}
              options={companyOptions}
              value={selectedCompanyId}
            />
          </label>
          <label className="field policy-role-field">
            <span>역할 범위</span>
            <select
              aria-label="역할 범위"
              disabled={isLoading || isMutating}
              onChange={(event) =>
                setNewRoleScopeLevel(event.target.value as CompanyManagerRole['scope_level'])
              }
              value={newRoleScopeLevel}
            >
              {ROLE_SCOPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </>
      }
      layoutClassName="role-catalog-page"
      subtitle="회사별 관리자 역할과 배정 상태를 같은 흐름에서 관리합니다."
      template="workbench"
      title="관리자 역할"
    >
      {errorMessage ? <p className="form-error">{errorMessage}</p> : null}
      {statusMessage ? <p className="form-success">{statusMessage}</p> : null}

      <section className="panel role-catalog-panel">
        <div className="panel-header">
          <div className="stack compact">
            <h2>역할 목록</h2>
            <p className="panel-copy">
              필수 역할은 삭제할 수 없고, 배정된 관리자가 있는 역할은 이름만 변경할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="role-catalog-list">
          {roles.map((role) => (
            <article className="role-card" key={role.company_manager_role_id}>
              <div className="role-card-main">
                <div className="role-card-heading">
                  <input
                    aria-label={`${role.code} 이름`}
                    className="role-card-name-input"
                    onChange={(event) => updateRoleDraft(role.company_manager_role_id, event.target.value)}
                    type="text"
                    value={role.draftDisplayName}
                  />
                  <div className="policy-item-badges">
                    {role.is_system_required ? <span className="policy-badge warning">필수</span> : null}
                    {role.is_default ? <span className="policy-badge neutral">기본</span> : null}
                  </div>
                </div>
                <div className="role-card-meta">
                  <code>{role.code}</code>
                  <span>{getRoleScopeLabel(role.scope_level)}</span>
                  <span>배정 {role.assigned_count}명</span>
                </div>
                <label className="field role-card-scope-field">
                  <span>{`${role.display_name} 역할 범위`}</span>
                  <select
                    aria-label={`${role.display_name} 역할 범위`}
                    disabled={isMutating || role.assigned_count > 0 || role.is_system_required}
                    onChange={(event) =>
                      updateRoleScope(
                        role.company_manager_role_id,
                        event.target.value as CompanyManagerRole['scope_level'],
                      )
                    }
                    value={role.draftScopeLevel}
                  >
                    {ROLE_SCOPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                {role.delete_block_reason ? <p className="role-card-rule">{role.delete_block_reason}</p> : null}
              </div>
              <div className="role-card-actions">
                <button
                  aria-label={`${role.display_name} 저장`}
                  className="button secondary"
                  disabled={
                    isMutating ||
                    role.draftDisplayName.trim() === '' ||
                    (role.draftDisplayName === role.display_name &&
                      role.draftScopeLevel === role.scope_level)
                  }
                  onClick={() => void handleSaveRole(role)}
                  type="button"
                >
                  저장
                </button>
                <button
                  aria-label={`${role.display_name} 삭제`}
                  className="button ghost"
                  disabled={isMutating || !role.can_delete}
                  onClick={() => void handleDeleteRole(role)}
                  type="button"
                >
                  삭제
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
