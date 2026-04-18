type SubdomainExpandTriggerProps = {
  isExpanded: boolean;
  isActive?: boolean;
  onToggle: () => void;
};

export function SubdomainExpandTrigger({
  isExpanded,
  isActive = false,
  onToggle,
}: SubdomainExpandTriggerProps) {
  const ariaLabel = isExpanded ? '상위 메뉴 닫기' : '상위 메뉴 열기';

  return (
    <button
      aria-controls="subdomain-top-level-menu"
      aria-expanded={isExpanded}
      aria-label={ariaLabel}
      className={isActive ? 'cockpit-expand-trigger cockpit-card-toggle is-active' : 'cockpit-expand-trigger cockpit-card-toggle'}
      onClick={onToggle}
      type="button"
    >
      <span aria-hidden="true">→</span>
    </button>
  );
}
