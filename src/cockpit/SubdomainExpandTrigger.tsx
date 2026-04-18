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
  return (
    <button
      aria-controls="subdomain-top-level-menu"
      aria-expanded={isExpanded}
      aria-label="상위 메뉴 열기"
      className={isActive ? 'cockpit-expand-trigger cockpit-card-toggle is-active' : 'cockpit-expand-trigger cockpit-card-toggle'}
      onClick={onToggle}
      type="button"
    >
      <span aria-hidden="true">→</span>
    </button>
  );
}
