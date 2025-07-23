import { useLazyQuery, ApolloError, gql } from "@apollo/client";
import { State } from "demos-server";

export const GET_ALL_STATES_QUERY = gql`
  query GetStatesForSelect {
    states {
      stateCode
      stateName
    }
  }
`;

interface GetAllStatesOperation {
  trigger: () => void;
  data?: State[];
  loading: boolean;
  error?: ApolloError;
}

export interface StateOperations {
  getAllStates: GetAllStatesOperation;
}

const createGetAllStatesHook = (): GetAllStatesOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    states: State[];
  }>(GET_ALL_STATES_QUERY);

  return {
    trigger,
    data: data?.states,
    loading,
    error,
  };
};

export const useStates = (): StateOperations => {
  return {
    getAllStates: createGetAllStatesHook(),
  };
};
