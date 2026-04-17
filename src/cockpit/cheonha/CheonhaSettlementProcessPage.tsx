import type { HttpClient, SessionPayload } from '../../api/http';
import { SettlementInputsPage } from '../../pages/SettlementInputsPage';
import { useCheonhaWorkspaceDependencies } from './CheonhaDispatchDataPage';

type CheonhaSettlementProcessPageProps = {
  client?: HttpClient;
  session?: SessionPayload | null;
};

export function CheonhaSettlementProcessPage(props: CheonhaSettlementProcessPageProps) {
  const { client } = useCheonhaWorkspaceDependencies(props);

  return <SettlementInputsPage client={client} />;
}
