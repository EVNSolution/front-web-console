import type { HttpClient, SessionPayload } from '../../api/http';
import { SettlementFlowProvider } from '../../components/SettlementFlowContext';
import { SettlementInputsPage } from '../../pages/SettlementInputsPage';
import { useCheonhaWorkspaceDependencies } from './CheonhaDispatchDataPage';

type CheonhaSettlementProcessPageProps = {
  client?: HttpClient;
  session?: SessionPayload | null;
};

export function CheonhaSettlementProcessPage(props: CheonhaSettlementProcessPageProps) {
  const { client, session } = useCheonhaWorkspaceDependencies(props);

  return (
    <SettlementFlowProvider client={client} session={session ?? undefined}>
      <section className="cockpit-workspace-panel settlement-workspace-frame-panel">
        <SettlementInputsPage
          client={client}
          dispatchBoardsPath="/settlement/dispatch"
          settlementRunsPath="/settlement/process"
        />
      </section>
    </SettlementFlowProvider>
  );
}
