import { useLazyQuery, useMutation, ApolloError, FetchResult } from "@apollo/client";
import { Demonstration as ServerDemonstration, CreateDemonstrationInput } from "demos-server";
import {
  ADD_DEMONSTRATION_MUTATION,
  GET_DEMONSTRATION_BY_ID_QUERY,
  UPDATE_DEMONSTRATION_MUTATION,
} from "queries/demonstrationQueries";

type Demonstration = ServerDemonstration & {
  extensions: {
    name: string;
    projectOfficer: { fullName: string };
    extensionStatus: { name: string };
  }[];
};

// TODO: as the demonstration model changes, this will likely need to be updated

interface GetDemonstrationByIdOperation {
  trigger: (id: string) => void;
  data?: Demonstration;
  loading: boolean;
  error?: ApolloError;
}

interface AddDemonstrationOperation {
  trigger: (
    input: CreateDemonstrationInput
  ) => Promise<FetchResult<{ addDemonstration: Demonstration }>>;
  data?: Demonstration;
  loading: boolean;
  error?: ApolloError;
}

interface UpdateDemonstrationOperation {
  trigger: (
    id: string,
    input: CreateDemonstrationInput // or UpdateDemonstrationInput if defined separately
  ) => Promise<FetchResult<{ updateDemonstration: Demonstration }>>;
  data?: Demonstration;
  loading: boolean;
  error?: ApolloError;
}

export interface DemonstrationOperations {
  getDemonstrationById: GetDemonstrationByIdOperation;
  addDemonstration: AddDemonstrationOperation;
  updateDemonstration: UpdateDemonstrationOperation;
}

const createGetDemonstrationByIdHook = (): GetDemonstrationByIdOperation => {
  const [trigger, { data, loading, error }] = useLazyQuery<{
    demonstration: Demonstration;
  }>(GET_DEMONSTRATION_BY_ID_QUERY);

  return {
    trigger: (id: string) => trigger({ variables: { id } }),
    data: data?.demonstration,
    loading,
    error,
  };
};

const createAddDemonstrationHook = (): AddDemonstrationOperation => {
  const [trigger, { data, loading, error }] = useMutation<{
    addDemonstration: Demonstration;
  }>(ADD_DEMONSTRATION_MUTATION);

  return {
    trigger: async (input: CreateDemonstrationInput) => await trigger({ variables: { input } }),
    data: data?.addDemonstration,
    loading,
    error,
  };
};

const createUpdateDemonstrationHook = (): UpdateDemonstrationOperation => {
  const [trigger, { data, loading, error }] = useMutation<{
    updateDemonstration: Demonstration;
  }>(UPDATE_DEMONSTRATION_MUTATION);

  return {
    trigger: async (id: string, input: CreateDemonstrationInput) =>
      await trigger({ variables: { id, input } }),
    data: data?.updateDemonstration,
    loading,
    error,
  };
};

export const useDemonstration = (): DemonstrationOperations => {
  return {
    getDemonstrationById: createGetDemonstrationByIdHook(),
    addDemonstration: createAddDemonstrationHook(),
    updateDemonstration: createUpdateDemonstrationHook(),
  };
};
