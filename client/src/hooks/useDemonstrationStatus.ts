import { useLazyQuery, ApolloError } from "@apollo/client";
import { DemonstrationStatus } from "demos-server";
import { DEMONSTRATION_STATUS_OPTIONS_QUERY } from "queries/demonstrationStatusQueries";

export type DemonstrationStatusOption = Pick<DemonstrationStatus, "name">;

interface GetDemonstrationStatusOptionsOperation {
  trigger: () => void;
  data?: DemonstrationStatusOption[];
  loading: boolean;
  error?: ApolloError;
}

export interface DemonstrationStatusOperations {
  getDemonstrationStatusOptions: GetDemonstrationStatusOptionsOperation;
}

const createGetDemonstrationStatusOptionsHook =
  (): GetDemonstrationStatusOptionsOperation => {
    const [trigger, { data, loading, error }] = useLazyQuery<{
      demonstrationStatuses: DemonstrationStatusOption[];
    }>(DEMONSTRATION_STATUS_OPTIONS_QUERY);

    return {
      trigger,
      data: data?.demonstrationStatuses,
      loading,
      error,
    };
  };

export const useDemonstrationStatus = (): DemonstrationStatusOperations => {
  return {
    getDemonstrationStatusOptions: createGetDemonstrationStatusOptionsHook(),
  };
};
