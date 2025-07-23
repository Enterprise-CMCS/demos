import { useLazyQuery, ApolloError, gql } from "@apollo/client";
import { DemonstrationStatus } from "demos-server";

export const GET_ALL_DEMONSTRATION_STATUSES_QUERY = gql`
  query GetDemonstrationStatusesForSelect {
    demonstrationStatuses {
      name
    }
  }
`;

interface GetAllDemonstrationStatusesOperation {
  trigger: () => void;
  data?: DemonstrationStatus[];
  loading: boolean;
  error?: ApolloError;
}

export interface DemonstrationOperations {
  getAllDemonstrationStatuses: GetAllDemonstrationStatusesOperation;
}

const createGetAllDemonstrationStatusesHook =
  (): GetAllDemonstrationStatusesOperation => {
    const [trigger, { data, loading, error }] = useLazyQuery<{
      demonstrationStatuses: DemonstrationStatus[];
    }>(GET_ALL_DEMONSTRATION_STATUSES_QUERY);

    return {
      trigger,
      data: data?.demonstrationStatuses,
      loading,
      error,
    };
  };

export const useDemonstrationStatus = (): DemonstrationOperations => {
  return {
    getAllDemonstrationStatuses: createGetAllDemonstrationStatusesHook(),
  };
};
