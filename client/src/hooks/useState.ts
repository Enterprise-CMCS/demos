import { useLazyQuery, ApolloError } from "@apollo/client";
import { State } from "demos-server";
import { STATE_OPTIONS_QUERY } from "queries/stateQueries";

export type StateOption = Pick<State, "id" | "name">;

interface GetStateOptionsOperation {
  trigger: () => void;
  data?: StateOption[];
  loading: boolean;
  error?: ApolloError;
}

export interface StateOperations {
  getStateOptions: GetStateOptionsOperation;
}

const createGetStateOptionsHook = (): GetStateOptionsOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    states: StateOption[];
  }>(STATE_OPTIONS_QUERY);

  return {
    trigger,
    data: data?.states,
    loading,
    error,
  };
};

export const useState = (): StateOperations => {
  return {
    getStateOptions: createGetStateOptionsHook(),
  };
};
