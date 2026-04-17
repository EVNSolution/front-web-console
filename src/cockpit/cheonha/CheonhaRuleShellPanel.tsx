type CheonhaRuleShellPanelProps = {
  description: string;
  note?: string;
  title: string;
};

const DEFAULT_NOTE = '실제 업무 흐름은 홈, 배차 데이터, 정산 처리에서 이어집니다.';

export function CheonhaRuleShellPanel({
  description,
  note = DEFAULT_NOTE,
  title,
}: CheonhaRuleShellPanelProps) {
  return (
    <section className="cockpit-workspace-panel cockpit-shell-panel">
      <p className="cockpit-kicker">Route Shell</p>
      <div className="cockpit-shell-panel-header">
        <h2>{title}</h2>
        <span className="cockpit-shell-status">준비 중</span>
      </div>
      <p>{description}</p>
      <p className="cockpit-shell-panel-note">{note}</p>
    </section>
  );
}
